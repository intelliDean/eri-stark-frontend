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

  // Initialize with default provider for read-only operations
  useEffect(() => {
    setProvider(PROVIDER);
  }, []);

  // Listen for account changes in wallet
  useEffect(() => {
    const handleAccountChange = (accounts: string[]) => {
      if (accounts.length > 0 && accounts[0] !== address) {
        // Account changed, update the address
        setAddress(accounts[0] as ContractAddress);
        toast.info(`Switched to account: ${accounts[0].slice(0, 10)}...`);
      } else if (accounts.length === 0 && address) {
        // No accounts available, disconnect
        disconnectWallet();
      }
    };

    // Listen for wallet events if available
    if (typeof window !== 'undefined' && (window as any).starknet) {
      (window as any).starknet.on('accountsChanged', handleAccountChange);
      
      return () => {
        (window as any).starknet.off('accountsChanged', handleAccountChange);
      };
    }
  }, [address]);

  const connectWallet = async (): Promise<void> => {
    try {
      const connection = await connect({
        webWalletUrl: "https://web.argent.xyz",
        argentMobileOptions: {
          dappName: "ERI Platform",
          url: window.location.hostname,
        },
      });
      
      if (connection && connection.isConnected) {
        setProvider(connection.provider);
        setAccount(connection.account);
        setAddress(connection.selectedAddress);
        toast.success(`Connected: ${connection.selectedAddress!.slice(0, 10)}...`);
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