import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Building2, Upload, FileText, Shield, Download, AlertCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import Papa from 'papaparse';
import { typedData } from 'starknet';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { QRCodeDisplay } from '../components/QRCodeDisplay';
import { useWallet } from '../contexts/WalletContext';
import { Certificate, CertificateResult, ContractType } from '../types';
import { getContract, AUTHENTICITY_ADDRESS, stringToFelt252, felt252ToString } from '../utils/blockchain';
import { getTypedData } from '../utils/certificateData';

export const ManufacturerPage: React.FC = () => {
  const { provider, account, address, isConnected, connectWallet } = useWallet();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'register' | 'single' | 'bulk'>('register');
  
  // Registration state
  const [manufacturerName, setManufacturerName] = useState('');
  
  // Single certificate state
  const [certificate, setCertificate] = useState({
    name: '',
    unique_id: '',
    serial: '',
    metadata: ''
  });
  const [singleQRData, setSingleQRData] = useState('');
  
  // Bulk certificates state
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [certificateResults, setCertificateResults] = useState<CertificateResult[]>([]);

  const requireWalletConnection = () => {
    if (!isConnected) {
      toast.error('Please connect your wallet to continue');
      connectWallet();
      return false;
    }
    return true;
  };

  const registerManufacturer = async () => {
    if (!requireWalletConnection()) return;

    if (!manufacturerName.trim()) {
      toast.error('Please enter manufacturer name');
      return;
    }

    setLoading(true);
    try {
      const contract = await getContract(AUTHENTICITY_ADDRESS, ContractType.STATE_CHANGE, provider!, account, address);
      
      const res = await contract.manufacturer_registers(stringToFelt252(manufacturerName));
      const txHash = res?.transaction_hash;
      const txResult = await provider!.waitForTransaction(txHash);
      const events = contract.parseEvents(txResult);

      const manuAddress = events[0]["eri::events::EriEvents::ManufacturerRegistered"].manufacturer_address;
      const manuName = events[0]["eri::events::EriEvents::ManufacturerRegistered"].manufacturer_name;

      toast.success(`Manufacturer ${felt252ToString(manuName.toString())} registered successfully!`);
      setManufacturerName('');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      toast.error(`Registration failed: ${message}`);
    } finally {
      setLoading(false);
    }
  };

  const signAndVerifySingleCertificate = async () => {
    if (!requireWalletConnection()) return;

    if (!certificate.name || !certificate.unique_id || !certificate.serial) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const contract = await getContract(AUTHENTICITY_ADDRESS, ContractType.VIEW, provider!, account, address);
      
      const cert: Certificate = {
        name: certificate.name,
        id: certificate.unique_id,
        serial: certificate.serial,
        date: Math.floor(Date.now() / 1000).toString(),
        owner: address!,
        metadata: certificate.metadata
          .split(',')
          .map((item: string) => item.trim())
          .filter(Boolean),
      };

      const certTypedData = getTypedData(cert);
      const msgHash = typedData.getMessageHash(certTypedData, address!);
      
      const result = await contract.verify_signature(cert, msgHash);
      
      if (!result) {
        throw new Error('Signature verification failed!');
      }

      const qrData = JSON.stringify({
        cert,
        msgHash,
      });

      setSingleQRData(qrData);
      toast.success('Certificate verified and QR code generated!');
      
      // Reset form
      setCertificate({
        name: '',
        unique_id: '',
        serial: '',
        metadata: ''
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      toast.error(`Verification failed: ${message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      toast.error('No file selected');
      return;
    }

    if (!file.name.endsWith('.csv')) {
      toast.error('Please upload a CSV file');
      return;
    }

    if (!requireWalletConnection()) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        const parsedCertificates: Certificate[] = result.data
          .map((row: unknown, index: number) => {
            if (typeof row !== 'object' || row === null) {
              toast.warn(`Skipped row ${index + 1}: Invalid row format`);
              return null;
            }

            const { name, unique_id, serial, metadata } = row as {
              name?: unknown;
              unique_id?: unknown;
              serial?: unknown;
              metadata?: unknown;
            };

            if (
              typeof name !== 'string' || !name.trim() ||
              typeof unique_id !== 'string' || !unique_id.trim() ||
              typeof serial !== 'string' || !serial.trim() ||
              typeof metadata !== 'string' || !metadata.trim()
            ) {
              toast.warn(`Skipped row ${index + 1}: Missing or invalid data`);
              return null;
            }

            return {
              name: name.trim(),
              id: unique_id.trim(),
              serial: serial.trim(),
              date: Math.floor(Date.now() / 1000).toString(),
              owner: address!,
              metadata: metadata
                .split(',')
                .map((item: string) => item.trim())
                .filter(Boolean),
            };
          })
          .filter((cert): cert is Certificate => cert !== null);

        setCertificates(parsedCertificates);
        const skippedCount = result.data.length - parsedCertificates.length;
        toast.success(
          `Loaded ${parsedCertificates.length} valid certificates${
            skippedCount > 0 ? ` (${skippedCount} rows skipped)` : ''
          }`
        );
      },
      error: (error) => {
        toast.error(`CSV parsing error: ${error.message}`);
      },
    });
  };

  const processMultipleCertificates = async () => {
    if (!requireWalletConnection()) return;

    if (certificates.length === 0) {
      toast.error('No certificates to process');
      return;
    }

    setLoading(true);
    try {
      const contract = await getContract(AUTHENTICITY_ADDRESS, ContractType.VIEW, provider!, account, address);
      const results: CertificateResult[] = [];

      for (const certInput of certificates) {
        try {
          const certTypedData = getTypedData(certInput);
          const msgHash = typedData.getMessageHash(certTypedData, address!);
          
          const result = await contract.verify_signature(certInput, msgHash);
          
          if (!result) {
            throw new Error('Signature verification failed!');
          }

          const qrData = JSON.stringify({
            certificate: certInput,
            msgHash,
          });

          results.push({
            certificate: certInput,
            msgHash,
            qrData,
            verificationResult: result,
          });
        } catch (error: unknown) {
          results.push({
            certificate: certInput,
            msgHash: '',
            qrData: '',
            verificationResult: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      setCertificateResults(results);
      toast.success(`Processed ${results.length} certificates`);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      toast.error(`Processing failed: ${message}`);
    } finally {
      setLoading(false);
    }
  };

  const downloadAllQRCodes = () => {
    certificateResults.forEach((result, index) => {
      if (result.qrData) {
        setTimeout(() => {
          const canvas = document.querySelectorAll('canvas')[index];
          if (canvas) {
            const link = document.createElement('a');
            link.href = canvas.toDataURL('image/png');
            link.download = `certificate-qr-${result.certificate.id}.png`;
            link.click();
          }
        }, index * 100);
      }
    });
  };

  const tabs = [
    { id: 'register', label: 'Register', icon: Building2 },
    { id: 'single', label: 'Single Certificate', icon: FileText },
    { id: 'bulk', label: 'Bulk Upload', icon: Upload },
  ];

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-6xl mx-auto"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
              Manufacturer Dashboard
            </h1>
            <p className="text-xl text-gray-300">
              Register, create, and verify product certificates on the blockchain
            </p>
          </div>

          {/* Wallet Connection Warning */}
          {!isConnected && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <Card className="bg-amber-500/10 border-amber-500/30">
                <div className="flex items-center space-x-3">
                  <AlertCircle className="w-5 h-5 text-amber-400" />
                  <p className="text-amber-300">
                    Connect your wallet to access manufacturer features and create certificates.
                  </p>
                  <Button onClick={connectWallet} size="sm" variant="outline">
                    Connect Wallet
                  </Button>
                </div>
              </Card>
            </motion.div>
          )}

          {/* Tabs */}
          <div className="flex flex-wrap justify-center mb-8 gap-4">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`
                    flex items-center space-x-2 px-6 py-3 rounded-xl font-semibold transition-all duration-300 relative
                    ${activeTab === tab.id
                      ? 'text-white' 
                      : 'text-gray-400 hover:text-green-400'
                    }
                  `}
                >
                  <Icon className="w-5 h-5" />
                  <span>{tab.label}</span>
                  {activeTab === tab.id && (
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl"
                      layoutId="activeManufacturerTab"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      style={{ zIndex: -1 }}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Tab Content */}
          {activeTab === 'register' && (
            <motion.div
              key="register"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="max-w-2xl mx-auto">
                <div className="text-center mb-6">
                  <Building2 className="w-12 h-12 mx-auto mb-4 text-green-400" />
                  <h2 className="text-2xl font-bold text-white">
                    Register as Manufacturer
                  </h2>
                  <p className="text-gray-300 mt-2">
                    Register your company on the blockchain to start creating verified certificates
                  </p>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    registerManufacturer();
                  }}
                  className="space-y-6"
                >
                  <Input
                    placeholder="Enter manufacturer name"
                    value={manufacturerName}
                    onChange={(e) => setManufacturerName(e.target.value)}
                    required
                  />
                  <Button
                    type="submit"
                    loading={loading}
                    disabled={!isConnected}
                    className="w-full"
                  >
                    {!isConnected ? 'Connect Wallet to Register' : 'Register Manufacturer'}
                  </Button>
                </form>
              </Card>
            </motion.div>
          )}

          {activeTab === 'single' && (
            <motion.div
              key="single"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="grid lg:grid-cols-2 gap-8">
                <Card>
                  <div className="mb-6">
                    <FileText className="w-8 h-8 text-green-400 mb-4" />
                    <h2 className="text-2xl font-bold text-white">
                      Create Certificate
                    </h2>
                    <p className="text-gray-300 mt-2">
                      Create and verify a single product certificate
                    </p>
                  </div>

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      signAndVerifySingleCertificate();
                    }}
                    className="space-y-4"
                  >
                    <Input
                      placeholder="Product Name"
                      value={certificate.name}
                      onChange={(e) => setCertificate({ ...certificate, name: e.target.value })}
                      required
                    />
                    <Input
                      placeholder="Unique Product ID"
                      value={certificate.unique_id}
                      onChange={(e) => setCertificate({ ...certificate, unique_id: e.target.value })}
                      required
                    />
                    <Input
                      placeholder="Serial Number"
                      value={certificate.serial}
                      onChange={(e) => setCertificate({ ...certificate, serial: e.target.value })}
                      required
                    />
                    <Input
                      placeholder="Metadata (comma separated)"
                      value={certificate.metadata}
                      onChange={(e) => setCertificate({ ...certificate, metadata: e.target.value })}
                    />
                    <Button
                      type="submit"
                      loading={loading}
                      disabled={!isConnected}
                      className="w-full"
                    >
                      <Shield className="w-4 h-4 mr-2" />
                      {!isConnected ? 'Connect Wallet to Create' : 'Create & Verify Certificate'}
                    </Button>
                  </form>
                </Card>

                {singleQRData && (
                  <QRCodeDisplay
                    data={singleQRData}
                    label="Certificate QR Code"
                    itemId={certificate.unique_id}
                  />
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'bulk' && (
            <motion.div
              key="bulk"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="mb-8">
                <div className="mb-6">
                  <Upload className="w-8 h-8 text-green-400 mb-4" />
                  <h2 className="text-2xl font-bold text-white">
                    Bulk Certificate Upload
                  </h2>
                  <p className="text-gray-300 mt-2">
                    Upload a CSV file with multiple certificates to process in batch
                  </p>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    processMultipleCertificates();
                  }}
                  className="space-y-6"
                >
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Upload CSV File
                    </label>
                    <Input
                      type="file"
                      accept=".csv"
                      onChange={handleFileUpload}
                      className="cursor-pointer"
                    />
                    <p className="text-sm text-gray-400 mt-2">
                      CSV should contain columns: name, unique_id, serial, metadata
                    </p>
                  </div>

                  {certificates.length > 0 && (
                    <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
                      <p className="text-green-300 font-medium">
                        {certificates.length} certificates loaded and ready for processing
                      </p>
                    </div>
                  )}

                  <Button
                    type="submit"
                    loading={loading}
                    disabled={!isConnected || certificates.length === 0}
                    className="w-full"
                  >
                    <Shield className="w-4 h-4 mr-2" />
                    {!isConnected ? 'Connect Wallet to Process' : `Process ${certificates.length} Certificates`}
                  </Button>
                </form>
              </Card>

              {/* Results */}
              {certificateResults.length > 0 && (
                <Card>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-white">
                      Processing Results
                    </h3>
                    <Button
                      onClick={downloadAllQRCodes}
                      variant="outline"
                      size="sm"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download All QR Codes
                    </Button>
                  </div>

                  <div className="space-y-6 max-h-96 overflow-y-auto">
                    {certificateResults.map((result, index) => (
                      <div
                        key={result.certificate.id || index}
                        className="border border-green-500/20 rounded-xl p-4"
                      >
                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <h4 className="font-semibold text-white mb-2">
                              {result.certificate.name}
                            </h4>
                            <div className="space-y-1 text-sm text-gray-300">
                              <p>ID: {result.certificate.id}</p>
                              <p>Serial: {result.certificate.serial}</p>
                              <p className={`font-medium ${result.verificationResult ? 'text-green-400' : 'text-red-400'}`}>
                                Status: {result.verificationResult ? 'Verified' : 'Failed'}
                                {result.error && ` - ${result.error}`}
                              </p>
                            </div>
                          </div>
                          
                          {result.qrData && (
                            <div className="flex justify-center">
                              <QRCodeDisplay
                                data={result.qrData}
                                label={`QR Code ${index + 1}`}
                                itemId={result.certificate.id}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </motion.div>
          )}

          {loading && <LoadingSpinner />}
        </motion.div>
      </div>
    </div>
  );
};