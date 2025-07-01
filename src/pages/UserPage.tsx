import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Package, Key, Shield, Eye, Gift, RotateCcw } from 'lucide-react';
import { toast } from 'react-toastify';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { useWallet } from '../contexts/WalletContext';
import { ItemDetails, UserDetails, OwnershipDetails, ContractType } from '../types';
import { getContract, OWNERSHIP_ADDRESS, stringToFelt252, felt252ToString, hex_it } from '../utils/blockchain';

export const UserPage: React.FC = () => {
  const { provider, account, address, isConnected } = useWallet();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'register' | 'dashboard' | 'verify'>('register');
  
  // Registration state
  const [username, setUsername] = useState('');
  
  // Dashboard state
  const [userItems, setUserItems] = useState<ItemDetails[]>([]);
  const [transferItemId, setTransferItemId] = useState('');
  const [transferToAddress, setTransferToAddress] = useState('');
  const [revokeItemHash, setRevokeItemHash] = useState('');
  
  // Verification state
  const [verifyItemId, setVerifyItemId] = useState('');
  const [ownershipDetails, setOwnershipDetails] = useState<OwnershipDetails | null>(null);

  const registerUser = async () => {
    if (!isConnected) {
      toast.error('Please connect your wallet first');
      return;
    }

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
      setActiveTab('dashboard');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      toast.error(`Registration failed: ${message}`);
    } finally {
      setLoading(false);
    }
  };

  const loadUserItems = async () => {
    if (!isConnected) {
      toast.error('Please connect your wallet first');
      return;
    }

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
      toast.success(`Loaded ${items.length} items`);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      toast.error(`Failed to load items: ${message}`);
    } finally {
      setLoading(false);
    }
  };

  const generateTransferCode = async () => {
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

  const revokeTransferCode = async () => {
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

  const tabs = [
    { id: 'register', label: 'Register', icon: User },
    { id: 'dashboard', label: 'My Items', icon: Package },
    { id: 'verify', label: 'Verify', icon: Shield },
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
            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              User Dashboard
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-400">
              Register, manage your items, and verify product ownership
            </p>
          </div>

          {/* Tabs */}
          <div className="flex flex-wrap justify-center mb-8 gap-4">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`
                    flex items-center space-x-2 px-6 py-3 rounded-xl font-semibold transition-all duration-300
                    ${activeTab === tab.id
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                      : 'bg-white/10 dark:bg-slate-800/30 text-slate-600 dark:text-slate-400 hover:bg-white/20 dark:hover:bg-slate-800/50'
                    }
                  `}
                >
                  <Icon className="w-5 h-5" />
                  <span>{tab.label}</span>
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
                  <User className="w-12 h-12 mx-auto mb-4 text-blue-500" />
                  <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
                    Register as User
                  </h2>
                  <p className="text-slate-600 dark:text-slate-400 mt-2">
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
            </motion.div>
          )}

          {activeTab === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-8"
            >
              {/* Load Items */}
              <Card>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center">
                      <Package className="w-8 h-8 mr-3 text-blue-500" />
                      My Items
                    </h2>
                    <p className="text-slate-600 dark:text-slate-400 mt-2">
                      View and manage your owned products
                    </p>
                  </div>
                  <Button
                    onClick={loadUserItems}
                    loading={loading}
                    disabled={!isConnected}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Load Items
                  </Button>
                </div>

                {userItems.length > 0 && (
                  <div className="grid gap-4 max-h-96 overflow-y-auto">
                    {userItems.map((item, index) => (
                      <div
                        key={index}
                        className="border border-white/20 dark:border-slate-700/50 rounded-xl p-4"
                      >
                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <h3 className="font-semibold text-slate-800 dark:text-white">
                              {item.name}
                            </h3>
                            <div className="space-y-1 text-sm text-slate-600 dark:text-slate-400 mt-2">
                              <p>ID: {item.item_id}</p>
                              <p>Serial: {item.serial}</p>
                              <p>Manufacturer: {item.manufacturer}</p>
                            </div>
                          </div>
                          <div className="text-sm text-slate-600 dark:text-slate-400">
                            <p>Production Date: {item.date}</p>
                            <p className="truncate" title={item.metadata_hash}>
                              Metadata Hash: {item.metadata_hash}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              {/* Transfer Ownership */}
              <Card>
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center">
                    <Gift className="w-6 h-6 mr-2 text-blue-500" />
                    Transfer Ownership
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 mt-2">
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

              {/* Revoke Transfer Code */}
              <Card>
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center">
                    <RotateCcw className="w-6 h-6 mr-2 text-red-500" />
                    Revoke Transfer Code
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 mt-2">
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
                    variant="secondary"
                    className="w-full"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Revoke Code
                  </Button>
                </form>
              </Card>
            </motion.div>
          )}

          {activeTab === 'verify' && (
            <motion.div
              key="verify"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="grid lg:grid-cols-2 gap-8">
                <Card>
                  <div className="mb-6">
                    <Shield className="w-8 h-8 text-blue-500 mb-4" />
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
                      Verify Ownership
                    </h2>
                    <p className="text-slate-600 dark:text-slate-400 mt-2">
                      Enter an item ID to verify its current ownership details
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
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-4">
                      Ownership Details
                    </h3>
                    <div className="space-y-3">
                      <div className="bg-white/10 dark:bg-slate-900/30 rounded-lg p-4">
                        <label className="text-sm font-medium text-slate-600 dark:text-slate-400">
                          Item Name
                        </label>
                        <p className="text-slate-800 dark:text-white font-semibold">
                          {ownershipDetails.name}
                        </p>
                      </div>
                      <div className="bg-white/10 dark:bg-slate-900/30 rounded-lg p-4">
                        <label className="text-sm font-medium text-slate-600 dark:text-slate-400">
                          Item ID
                        </label>
                        <p className="text-slate-800 dark:text-white font-semibold">
                          {ownershipDetails.item_id}
                        </p>
                      </div>
                      <div className="bg-white/10 dark:bg-slate-900/30 rounded-lg p-4">
                        <label className="text-sm font-medium text-slate-600 dark:text-slate-400">
                          Owner Username
                        </label>
                        <p className="text-slate-800 dark:text-white font-semibold">
                          {ownershipDetails.username}
                        </p>
                      </div>
                      <div className="bg-white/10 dark:bg-slate-900/30 rounded-lg p-4">
                        <label className="text-sm font-medium text-slate-600 dark:text-slate-400">
                          Owner Address
                        </label>
                        <p className="text-slate-800 dark:text-white font-mono text-sm break-all">
                          {ownershipDetails.owner}
                        </p>
                      </div>
                    </div>
                  </Card>
                )}
              </div>
            </motion.div>
          )}

          {loading && <LoadingSpinner />}
        </motion.div>
      </div>
    </div>
  );
};