import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { QrCode, Package, Shield, Eye, AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { useWallet } from '../contexts/WalletContext';
import { Certificate, ContractType } from '../types';
import { getContract, OWNERSHIP_ADDRESS, AUTHENTICITY_ADDRESS, stringToFelt252, felt252ToString, hex_it } from '../utils/blockchain';

export const QRScanPage: React.FC = () => {
  const { provider, account, address, isConnected, connectWallet } = useWallet();
  const [loading, setLoading] = useState(false);
  const [qrData, setQrData] = useState('');
  const [parsedData, setParsedData] = useState<any>(null);
  const [selectedAction, setSelectedAction] = useState<'claim' | 'verify-ownership' | 'verify-authenticity' | null>(null);
  const [verificationResult, setVerificationResult] = useState<any>(null);

  // Parse QR data on component mount if URL contains data
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const dataParam = urlParams.get('data');
    if (dataParam) {
      try {
        const decoded = decodeURIComponent(dataParam);
        setQrData(decoded);
        handleParseQRData(decoded);
      } catch (error) {
        toast.error('Invalid QR data in URL');
      }
    }
  }, []);

  const handleParseQRData = (data?: string) => {
    const dataToUse = data || qrData;
    if (!dataToUse.trim()) {
      toast.error('Please enter QR data');
      return;
    }

    try {
      const parsed = JSON.parse(dataToUse);
      setParsedData(parsed);
      toast.success('QR data parsed successfully');
    } catch (error) {
      toast.error('Invalid QR data format');
    }
  };

  const handleClaimOwnership = async () => {
    if (!isConnected) {
      toast.error('Please connect your wallet to claim ownership');
      connectWallet();
      return;
    }

    if (!parsedData?.cert) {
      toast.error('No certificate data found');
      return;
    }

    setLoading(true);
    try {
      const contract = await getContract(AUTHENTICITY_ADDRESS, ContractType.STATE_CHANGE, provider!, account, address);
      
      const cert: Certificate = parsedData.cert;
      const msgHash = parsedData.msgHash;

      const res = await contract.user_claim_ownership(cert, msgHash);
      const txHash = res?.transaction_hash;
      const txResult = await provider!.waitForTransaction(txHash);
      const events = contract.parseEvents(txResult);

      toast.success(`Ownership claimed successfully for ${cert.name}`);
      setVerificationResult({
        type: 'claim',
        success: true,
        message: 'Ownership claimed successfully',
        data: cert
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      toast.error(`Failed to claim ownership: ${message}`);
      setVerificationResult({
        type: 'claim',
        success: false,
        message: `Failed to claim ownership: ${message}`
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOwnership = async () => {
    if (!parsedData?.cert) {
      toast.error('No certificate data found');
      return;
    }

    setLoading(true);
    try {
      const contract = await getContract(OWNERSHIP_ADDRESS, ContractType.VIEW, provider!, account, address);
      
      const result = await contract.verify_ownership(stringToFelt252(parsedData.cert.id));
      
      const ownershipDetails = {
        name: felt252ToString(result.name),
        item_id: felt252ToString(result.item_id),
        username: felt252ToString(result.username),
        owner: hex_it(result.owner)
      };

      setVerificationResult({
        type: 'ownership',
        success: true,
        message: 'Ownership verified successfully',
        data: ownershipDetails
      });
      toast.success('Ownership verified successfully');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      toast.error(`Ownership verification failed: ${message}`);
      setVerificationResult({
        type: 'ownership',
        success: false,
        message: `Ownership verification failed: ${message}`
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAuthenticity = async () => {
    if (!parsedData?.cert || !parsedData?.msgHash) {
      toast.error('No certificate or signature data found');
      return;
    }

    setLoading(true);
    try {
      const contract = await getContract(AUTHENTICITY_ADDRESS, ContractType.VIEW, provider!, account, address);
      
      const result = await contract.verify_signature(parsedData.cert, parsedData.msgHash);
      
      setVerificationResult({
        type: 'authenticity',
        success: result,
        message: result ? 'Product is authentic' : 'Product authenticity could not be verified',
        data: parsedData.cert
      });
      
      if (result) {
        toast.success('Product authenticity verified');
      } else {
        toast.error('Product authenticity verification failed');
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      toast.error(`Authenticity verification failed: ${message}`);
      setVerificationResult({
        type: 'authenticity',
        success: false,
        message: `Authenticity verification failed: ${message}`
      });
    } finally {
      setLoading(false);
    }
  };

  const actions = [
    {
      id: 'claim',
      title: 'Claim Ownership',
      description: 'Claim ownership of this product using the certificate data',
      icon: Package,
      requiresWallet: true,
      action: handleClaimOwnership
    },
    {
      id: 'verify-ownership',
      title: 'Verify Ownership',
      description: 'Check who currently owns this product',
      icon: Shield,
      requiresWallet: false,
      action: handleVerifyOwnership
    },
    {
      id: 'verify-authenticity',
      title: 'Verify Authenticity',
      description: 'Verify that this product is authentic using blockchain signatures',
      icon: Eye,
      requiresWallet: false,
      action: handleVerifyAuthenticity
    }
  ];

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
              QR Code Scanner
            </h1>
            <p className="text-xl text-gray-300">
              Scan or paste QR code data to verify products and manage ownership
            </p>
          </div>

          {/* QR Data Input */}
          <Card className="mb-8">
            <div className="mb-6">
              <QrCode className="w-8 h-8 text-green-400 mb-4" />
              <h2 className="text-2xl font-bold text-white">
                Enter QR Code Data
              </h2>
              <p className="text-gray-300 mt-2">
                Paste the QR code data or scan a QR code to get started
              </p>
            </div>

            <div className="space-y-4">
              <Input
                placeholder="Paste QR code data here..."
                value={qrData}
                onChange={(e) => setQrData(e.target.value)}
              />
              <Button
                onClick={() => handleParseQRData()}
                className="w-full"
                disabled={!qrData.trim()}
              >
                Parse QR Data
              </Button>
            </div>

            {parsedData && (
              <div className="mt-6 p-4 bg-green-500/10 border border-green-500/30 rounded-xl">
                <div className="flex items-center space-x-2 mb-3">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <span className="text-green-300 font-medium">QR Data Parsed Successfully</span>
                </div>
                <div className="text-sm text-gray-300">
                  <p><strong>Product:</strong> {parsedData.cert?.name || 'Unknown'}</p>
                  <p><strong>ID:</strong> {parsedData.cert?.id || 'Unknown'}</p>
                  <p><strong>Serial:</strong> {parsedData.cert?.serial || 'Unknown'}</p>
                </div>
              </div>
            )}
          </Card>

          {/* Action Selection */}
          {parsedData && (
            <Card className="mb-8">
              <h3 className="text-xl font-bold text-white mb-6">
                Choose an Action
              </h3>
              
              <div className="grid md:grid-cols-3 gap-4">
                {actions.map((action) => {
                  const Icon = action.icon;
                  const isSelected = selectedAction === action.id;
                  
                  return (
                    <button
                      key={action.id}
                      onClick={() => setSelectedAction(action.id as any)}
                      className={`
                        p-4 rounded-xl border-2 transition-all duration-300 text-left
                        ${isSelected 
                          ? 'border-green-500 bg-green-500/10' 
                          : 'border-green-500/20 hover:border-green-500/40 hover:bg-green-500/5'
                        }
                      `}
                    >
                      <Icon className={`w-6 h-6 mb-3 ${isSelected ? 'text-green-400' : 'text-gray-400'}`} />
                      <h4 className="font-semibold text-white mb-2">{action.title}</h4>
                      <p className="text-sm text-gray-300">{action.description}</p>
                      {action.requiresWallet && !isConnected && (
                        <div className="flex items-center mt-2 text-xs text-amber-400">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          Requires wallet connection
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {selectedAction && (
                <div className="mt-6">
                  <Button
                    onClick={() => {
                      const action = actions.find(a => a.id === selectedAction);
                      if (action) {
                        if (action.requiresWallet && !isConnected) {
                          connectWallet();
                        } else {
                          action.action();
                        }
                      }
                    }}
                    loading={loading}
                    className="w-full"
                  >
                    {(() => {
                      const action = actions.find(a => a.id === selectedAction);
                      if (action?.requiresWallet && !isConnected) {
                        return 'Connect Wallet to Continue';
                      }
                      return action?.title || 'Execute Action';
                    })()}
                  </Button>
                </div>
              )}
            </Card>
          )}

          {/* Verification Results */}
          {verificationResult && (
            <Card>
              <div className="flex items-center space-x-3 mb-4">
                {verificationResult.success ? (
                  <CheckCircle className="w-6 h-6 text-green-400" />
                ) : (
                  <AlertCircle className="w-6 h-6 text-red-400" />
                )}
                <h3 className="text-xl font-bold text-white">
                  Verification Results
                </h3>
              </div>

              <div className={`p-4 rounded-xl border ${
                verificationResult.success 
                  ? 'border-green-500/30 bg-green-500/10' 
                  : 'border-red-500/30 bg-red-500/10'
              }`}>
                <p className={`font-medium mb-3 ${
                  verificationResult.success ? 'text-green-300' : 'text-red-300'
                }`}>
                  {verificationResult.message}
                </p>

                {verificationResult.data && (
                  <div className="space-y-2 text-sm text-gray-300">
                    {verificationResult.type === 'ownership' && (
                      <>
                        <p><strong>Item Name:</strong> {verificationResult.data.name}</p>
                        <p><strong>Item ID:</strong> {verificationResult.data.item_id}</p>
                        <p><strong>Owner Username:</strong> {verificationResult.data.username}</p>
                        <p><strong>Owner Address:</strong> {verificationResult.data.owner}</p>
                      </>
                    )}
                    
                    {(verificationResult.type === 'authenticity' || verificationResult.type === 'claim') && (
                      <>
                        <p><strong>Product Name:</strong> {verificationResult.data.name}</p>
                        <p><strong>Product ID:</strong> {verificationResult.data.id}</p>
                        <p><strong>Serial Number:</strong> {verificationResult.data.serial}</p>
                        <p><strong>Manufacturing Date:</strong> {new Date(parseInt(verificationResult.data.date) * 1000).toLocaleDateString()}</p>
                      </>
                    )}
                  </div>
                )}
              </div>
            </Card>
          )}

          {loading && <LoadingSpinner />}
        </motion.div>
      </div>
    </div>
  );
};