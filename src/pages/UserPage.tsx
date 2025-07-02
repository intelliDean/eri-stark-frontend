import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Package, Key, Shield, Eye, Gift, RotateCcw, AlertCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { useWallet } from '../contexts/WalletContext';
import { ItemDetails, OwnershipDetails, ContractType } from '../types';
import { getContract, OWNERSHIP_ADDRESS, stringToFelt252, felt252ToString, hex_it } from '../utils/blockchain';

interface UserPageProps {
  activeFeature: string;
}

export const UserPage: React.FC<UserPageProps> = ({ activeFeature }) => {
  const { provider, account, address, isConnected, connectWallet } = useWallet();
  const [loading, setLoading] = useState(false);
  
  // Registration state
  const [username, setUsername] = useState('');
  
  // Dashboard state
  const [userItems, setUserItems] = useState<ItemDetails[]>([]);
  const [transferItemId, setTransferItemId] = useState('');
  const [transferToAddress, setTransferToAddress] = useState('');
  const [revokeItemHash, setRevokeItemHash] = useState('');
  const [claimCode, setClaimCode] = useState('');
  
  // Verification state
  const [verifyItemId, setVerifyItemId] = useState('');
  const [ownershipDetails, setOwnershipDetails] = useState<OwnershipDetails | null>(null);

  // Auto-load user items when dashboard is accessed and wallet is connected
  useEffect(() => {
    if ((activeFeature === 'my-items' || activeFeature === '') && isConnected && userItems.length === 0) {
      loadUserItems();
    }
  }, [activeFeature, isConnected]);

  const requireWalletConnection = () => {
    if (!isConnected) {
      toast.error('Please connect your wallet to continue');
      connectWallet();
      return false;
    }
    return true;
  };

  const registerUser = async () => {
    if (!requireWalletConnection()) return;

    if (!username.trim()) {
      toast.error('Please enter a username');
      return;
    }

    setLoading(true);
    try {
      const contract = await getContract(OWNERSHIP_ADDRESS, ContractType.STATE_CHANGE, provider!, account, address);
      
      const res = await contract.user_registers(stringToFelt252(username.toLowerCase().trim()));
      const txHash = res?.transaction_hash;
      const txResult = await provider!.waitForTransaction(txHash);
      const events = contract.parseEvents(txResult);

      const userAddress = events[0]["eri::events::EriEvents::UserRegistered"].user_address;
      const userName = events[0]["eri::events::EriEvents::UserRegistered"].username;

      toast.success(`User ${felt252ToString(userName.toString())} registered successfully!`);
      setUsername('');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      toast.error(`Registration failed: ${message}`);
    } finally {
      setLoading(false);
    }
  };

  const loadUserItems = async () => {
    if (!requireWalletConnection()) return;

    setLoading(true);
    try {
      const contract = await getContract(OWNERSHIP_ADDRESS, ContractType.STATE_CHANGE, provider!, account, address);
      
      const result: any[] = await contract.get_all_my_items(address);
      
      const items = result.map((item) => ({
        item_id: felt252ToString(item.item_id),
        name: felt252ToString(item.name),
        owner: hex_it(item.owner),
        serial: felt252ToString(item.serial),
        manufacturer: felt252ToString(item.manufacturer),
        date: new Date(Number(item.date) * 1000).toLocaleString(),
        metadata_hash: hex_it(item.metadata_hash),
      }));

      setUserItems(items);
      if (items.length > 0) {
        toast.success(`Loaded ${items.length} items`);
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      toast.error(`Failed to load items: ${message}`);
    } finally {
      setLoading(false);
    }
  };

  const generateTransferCode = async () => {
    if (!requireWalletConnection()) return;

    if (!transferItemId || !transferToAddress) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const contract = await getContract(OWNERSHIP_ADDRESS, ContractType.STATE_CHANGE, provider!, account, address);
      
      const res = await contract.generate_change_of_ownership_code(
        stringToFelt252(transferItemId),
        transferToAddress
      );

      const txHash = res?.transaction_hash;
      const txResult = await provider!.waitForTransaction(txHash);
      const events = contract.parseEvents(txResult);

      const ownershipCode = events[0]["eri::events::EriEvents::OwnershipCode"].ownership_code;
      const temp = events[0]["eri::events::EriEvents::OwnershipCode"].temp_owner;

      toast.success(`Transfer code generated: ${hex_it(ownershipCode)}`);
      setTransferItemId('');
      setTransferToAddress('');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      toast.error(`Failed to generate transfer code: ${message}`);
    } finally {
      setLoading(false);
    }
  };

  const claimOwnershipWithCode = async () => {
    if (!requireWalletConnection()) return;

    if (!claimCode) {
      toast.error('Please enter claim code');
      return;
    }

    setLoading(true);
    try {
      const contract = await getContract(OWNERSHIP_ADDRESS, ContractType.STATE_CHANGE, provider!, account, address);
      
      const feltItemHash = claimCode.startsWith('0x') ? claimCode : '0x' + claimCode;
      
      const res = await contract.new_owner_claim_ownership(feltItemHash);
      const txHash = res?.transaction_hash;
      const txResult = await provider!.waitForTransaction(txHash);
      const events = contract.parseEvents(txResult);

      const newOwner = events[0]["eri::events::EriEvents::OwnershipClaimed"].new_owner;
      const oldOwner = events[0]["eri::events::EriEvents::OwnershipClaimed"].old_owner;

      toast.success(`Ownership claimed successfully from ${hex_it(oldOwner.toString())}`);
      setClaimCode('');
      // Refresh items list
      loadUserItems();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      toast.error(`Failed to claim ownership: ${message}`);
    } finally {
      setLoading(false);
    }
  };

  const revokeTransferCode = async () => {
    if (!requireWalletConnection()) return;

    if (!revokeItemHash) {
      toast.error('Please enter item hash');
      return;
    }

    setLoading(true);
    try {
      const contract = await getContract(OWNERSHIP_ADDRESS, ContractType.STATE_CHANGE, provider!, account, address);
      
      const feltItemHash = revokeItemHash.startsWith('0x') ? revokeItemHash : '0x' + revokeItemHash;
      
      const res = await contract.owner_revoke_code(feltItemHash);
      const txHash = res?.transaction_hash;
      const txResult = await provider!.waitForTransaction(txHash);

      toast.success('Transfer code revoked successfully');
      setRevokeItemHash('');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      toast.error(`Failed to revoke code: ${message}`);
    } finally {
      setLoading(false);
    }
  };

  const verifyOwnership = async () => {
    if (!verifyItemId) {
      toast.error('Please enter item ID');
      return;
    }

    setLoading(true);
    try {
      const contract = await getContract(OWNERSHIP_ADDRESS, ContractType.VIEW, provider!, account, address);
      
      const result = await contract.verify_ownership(stringToFelt252(verifyItemId));
      
      const details: OwnershipDetails = {
        name: felt252ToString(result.name),
        item_id: felt252ToString(result.item_id),
        username: felt252ToString(result.username),
        owner: hex_it(result.owner)
      };

      setOwnershipDetails(details);
      toast.success('Ownership details retrieved');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      toast.error(`Verification failed: ${message}`);
    } finally {
      setLoading(false);
    }
  };

  const renderContent = () => {
    switch (activeFeature) {
      case 'register-user':
        return (
          <Card className="max-w-2xl mx-auto">
            <div className="text-center mb-6">
              <User className="w-12 h-12 mx-auto mb-4 text-green-400" />
              <h2 className="text-2xl font-bold text-white">
                Register as User
              </h2>
              <p className="text-gray-300 mt-2">
                Create your user account to manage and verify product ownership
              </p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                registerUser();
              }}
              className="space-y-6"
            >
              <Input
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
              <Button
                type="submit"
                loading={loading}
                disabled={!isConnected}
                className="w-full"
              >
                {!isConnected ? 'Connect Wallet to Register' : 'Register User'}
              </Button>
            </form>
          </Card>
        );

      case 'claim-ownership':
        return (
          <Card className="max-w-2xl mx-auto">
            <div className="mb-6">
              <h3 className="text-xl font-bold text-white flex items-center">
                <Package className="w-6 h-6 mr-2 text-green-400" />
                Claim Ownership
              </h3>
              <p className="text-gray-300 mt-2">
                Use a transfer code to claim ownership of an item
              </p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                claimOwnershipWithCode();
              }}
              className="space-y-4"
            >
              <Input
                placeholder="Enter transfer code (item hash)"
                value={claimCode}
                onChange={(e) => setClaimCode(e.target.value)}
                required
              />
              <Button
                type="submit"
                loading={loading}
                disabled={!isConnected}
                className="w-full"
              >
                <Package className="w-4 h-4 mr-2" />
                Claim Ownership
              </Button>
            </form>
          </Card>
        );

      case 'transfer-ownership':
        return (
          <Card className="max-w-2xl mx-auto">
            <div className="mb-6">
              <h3 className="text-xl font-bold text-white flex items-center">
                <Gift className="w-6 h-6 mr-2 text-green-400" />
                Transfer Ownership
              </h3>
              <p className="text-gray-300 mt-2">
                Generate a transfer code to gift your item to another user
              </p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                generateTransferCode();
              }}
              className="space-y-4"
            >
              <Input
                placeholder="Item ID to transfer"
                value={transferItemId}
                onChange={(e) => setTransferItemId(e.target.value)}
                required
              />
              <Input
                placeholder="Recipient wallet address"
                value={transferToAddress}
                onChange={(e) => setTransferToAddress(e.target.value)}
                required
              />
              <Button
                type="submit"
                loading={loading}
                disabled={!isConnected}
                className="w-full"
              >
                <Key className="w-4 h-4 mr-2" />
                Generate Transfer Code
              </Button>
            </form>
          </Card>
        );

      case 'revoke-code':
        return (
          <Card className="max-w-2xl mx-auto">
            <div className="mb-6">
              <h3 className="text-xl font-bold text-white flex items-center">
                <RotateCcw className="w-6 h-6 mr-2 text-red-400" />
                Revoke Transfer Code
              </h3>
              <p className="text-gray-300 mt-2">
                Cancel a previously generated transfer code
              </p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                revokeTransferCode();
              }}
              className="space-y-4"
            >
              <Input
                placeholder="Item hash of transfer to revoke"
                value={revokeItemHash}
                onChange={(e) => setRevokeItemHash(e.target.value)}
                required
              />
              <Button
                type="submit"
                loading={loading}
                disabled={!isConnected}
                variant="danger"
                className="w-full"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Revoke Code
              </Button>
            </form>
          </Card>
        );

      case 'verify-ownership':
        return (
          <div className="grid lg:grid-cols-2 gap-8">
            <Card>
              <div className="mb-6">
                <Shield className="w-8 h-8 text-green-400 mb-4" />
                <h2 className="text-2xl font-bold text-white">
                  Verify Ownership
                </h2>
                <p className="text-gray-300 mt-2">
                  Enter an item ID to verify its current ownership details (no wallet required)
                </p>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  verifyOwnership();
                }}
                className="space-y-4"
              >
                <Input
                  placeholder="Enter item ID to verify"
                  value={verifyItemId}
                  onChange={(e) => setVerifyItemId(e.target.value)}
                  required
                />
                <Button
                  type="submit"
                  loading={loading}
                  className="w-full"
                >
                  <Shield className="w-4 h-4 mr-2" />
                  Verify Ownership
                </Button>
              </form>
            </Card>

            {ownershipDetails && (
              <Card>
                <h3 className="text-xl font-bold text-white mb-4">
                  Ownership Details
                </h3>
                <div className="space-y-3">
                  <div className="bg-gray-800/50 rounded-lg p-4">
                    <label className="text-sm font-medium text-gray-400">
                      Item Name
                    </label>
                    <p className="text-white font-semibold">
                      {ownershipDetails.name}
                    </p>
                  </div>
                  <div className="bg-gray-800/50 rounded-lg p-4">
                    <label className="text-sm font-medium text-gray-400">
                      Item ID
                    </label>
                    <p className="text-white font-semibold">
                      {ownershipDetails.item_id}
                    </p>
                  </div>
                  <div className="bg-gray-800/50 rounded-lg p-4">
                    <label className="text-sm font-medium text-gray-400">
                      Owner Username
                    </label>
                    <p className="text-white font-semibold">
                      {ownershipDetails.username}
                    </p>
                  </div>
                  <div className="bg-gray-800/50 rounded-lg p-4">
                    <label className="text-sm font-medium text-gray-400">
                      Owner Address
                    </label>
                    <p className="text-white font-mono text-sm break-all">
                      {ownershipDetails.owner}
                    </p>
                  </div>
                </div>
              </Card>
            )}
          </div>
        );

      case 'my-items':
      default:
        return (
          <Card>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white flex items-center">
                  <Package className="w-8 h-8 mr-3 text-green-400" />
                  My Items ({userItems.length})
                </h2>
                <p className="text-gray-300 mt-2">
                  Your owned products are automatically loaded
                </p>
              </div>
              <Button
                onClick={loadUserItems}
                loading={loading}
                disabled={!isConnected}
                variant="outline"
              >
                <Eye className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>

            {!isConnected && (
              <div className="mb-6">
                <Card className="bg-amber-500/10 border-amber-500/30">
                  <div className="flex items-center space-x-3">
                    <AlertCircle className="w-5 h-5 text-amber-400" />
                    <p className="text-amber-300">
                      Connect your wallet to view and manage your items
                    </p>
                    <Button onClick={connectWallet} size="sm" variant="outline">
                      Connect Wallet
                    </Button>
                  </div>
                </Card>
              </div>
            )}

            {userItems.length > 0 ? (
              <div className="grid gap-4 max-h-96 overflow-y-auto">
                {userItems.map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="border border-green-500/20 rounded-xl p-4 hover:border-green-500/40 transition-colors"
                  >
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <h3 className="font-semibold text-white text-lg">
                          {item.name}
                        </h3>
                        <div className="space-y-1 text-sm text-gray-300 mt-2">
                          <p><span className="text-green-400">ID:</span> {item.item_id}</p>
                          <p><span className="text-green-400">Serial:</span> {item.serial}</p>
                          <p><span className="text-green-400">Manufacturer:</span> {item.manufacturer}</p>
                        </div>
                      </div>
                      <div className="text-sm text-gray-300">
                        <p><span className="text-green-400">Production Date:</span> {item.date}</p>
                        <p className="truncate" title={item.metadata_hash}>
                          <span className="text-green-400">Metadata Hash:</span> {item.metadata_hash}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Package className="w-16 h-16 mx-auto text-gray-600 mb-4" />
                <p className="text-gray-400">No items found. Connect your wallet to load your items.</p>
              </div>
            )}
          </Card>
        );
    }
  };

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-6xl mx-auto"
        >
          {renderContent()}
          {loading && <LoadingSpinner />}
        </motion.div>
      </div>
    </div>
  );
};