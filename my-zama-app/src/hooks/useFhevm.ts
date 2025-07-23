import { useContext, createContext } from 'react';
import { type FhevmInstance, type EIP712 } from '@zama-fhe/relayer-sdk/bundle';

export type FhevmContextType = {
  instance: FhevmInstance;
  eip712: EIP712;
  signature: string;
  setSignature: (signature: string) => void;
  decrypt: (
    handle: string,
    requestSignature: (eip712: any) => Promise<string>,
  ) => Promise<bigint | undefined>;
};

export const FhevmContext = createContext<FhevmContextType | undefined>(undefined);

export function useFhevm() {
  const ctx = useContext(FhevmContext);
  if (!ctx) throw new Error('❌ useFhevm must be used inside FhevmProvider');
  return ctx;
}
