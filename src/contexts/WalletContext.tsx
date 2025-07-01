import React, { createContext, useContext, useEffect, useState } from 'react';
import { AccountInterface, ContractAddress, ProviderInterface } from 'starknet';
import { connect, disconnect } from 'starknetkit';
import { toast } from 'react-toastify';
import { PROVIDER } from '../utils/blockchain';

interface WalletContextType {
  provider: ProviderInterface | null;
  account: AccountInterface | null;
  address: ContractAddress | null;
  isConnected: boolean;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [provider, setProvider] = useState<ProviderInterface | null>(null);
  const [account, setAccount] = useState<AccountInterface | null>(null);
  const [address, setAddress] = useState<ContractAddress | null>(null);

  const isConnected = !!address;

  useEffect(() => {
    // Auto-connect wallet on load
    connectWallet();
  }, []);

  const connectWallet = async (): Promise<void> => {
    try {
      const { wallet } = await connect({
        provider: PROVIDER
      });
      
      if (wallet && wallet.isConnected) {
        setProvider(wallet.provider);
        setAccount(wallet.account);
        setAddress(wallet.selectedAddress);
        toast.success(`Connected: ${wallet.selectedAddress!.slice(0, 10)}...`);
      } else {
        toast.error("Failed to connect wallet");
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      toast.error(`Error: ${message}`);
    }
  };

  const disconnectWallet = async (): Promise<void> => {
    try {
      await disconnect();
      setProvider(PROVIDER);
      setAccount(null);
      setAddress(null);
      toast.success("Wallet disconnected");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      toast.error(`Error: ${message}`);
    }
  };

  return (
    <WalletContext.Provider value={{
      provider,
      account,
      address,
      isConnected,
      connectWallet,
      disconnectWallet
    }}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};