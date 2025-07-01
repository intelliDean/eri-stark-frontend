import { AccountInterface, Contract, ContractAddress, ProviderInterface, RpcProvider } from "starknet";
import { ContractType } from "../types";

export const OWNERSHIP_ADDRESS: ContractAddress = import.meta.env.VITE_OWNERSHIP_ADDRESS || "0x123";
export const AUTHENTICITY_ADDRESS: ContractAddress = import.meta.env.VITE_AUTHENTICITY_ADDRESS || "0x456";

export const PROVIDER = new RpcProvider({
  nodeUrl: import.meta.env.VITE_SEPOLIA_URL || "https://starknet-sepolia.public.blastapi.io"
});

export const getContract = async (
  contractAddress: ContractAddress,
  contractType: ContractType,
  provider: ProviderInterface,
  account?: AccountInterface | null,
  address?: ContractAddress | null
): Promise<Contract> => {
  try {
    const { abi } = await provider.getClassAt(contractAddress);
    if (!abi) {
      throw new Error("No ABI found for the contract.");
    }

    if (contractType === ContractType.VIEW) {
      return new Contract(abi, contractAddress, provider);
    } else if (contractType === ContractType.STATE_CHANGE) {
      if (!address || !account) {
        throw new Error("Account not initialized");
      }
      return new Contract(abi, contractAddress, account);
    }

    throw new Error("Invalid contract type");
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to initialize contract at ${contractAddress}: ${error.message}`);
    } else {
      throw new Error(`Failed to initialize contract at ${contractAddress}: Unknown error`);
    }
  }
};

export const felt252ToString = (felt: string): string => {
  try {
    const hex = felt.toString(16);
    let result = '';
    for (let i = 0; i < hex.length; i += 2) {
      const byte = parseInt(hex.substr(i, 2), 16);
      if (byte !== 0) {
        result += String.fromCharCode(byte);
      }
    }
    return result;
  } catch {
    return felt.toString();
  }
};

export const stringToFelt252 = (str: string): string => {
  return Array.from(str)
    .map(char => char.charCodeAt(0).toString(16).padStart(2, '0'))
    .join('');
};

export const hex_it = (value: string): string => {
  if (value.startsWith('0x')) return value;
  return `0x${value}`;
};