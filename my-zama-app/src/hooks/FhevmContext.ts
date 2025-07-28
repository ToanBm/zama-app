import { createContext, useContext } from 'react';
// Đã xóa import type { FhevmInstance, EIP712 } from '@zama-fhe/relayer-sdk/web';

export type FhevmContextType = {
  instance: any;
  eip712: any;
  signature: string;
  setSignature: (sig: string) => void;
  decrypt: (
    handle: string,
    requestSignature: (eip712: any) => Promise<string>
  ) => Promise<bigint | undefined>;
};

export const FhevmContext = createContext<FhevmContextType | undefined>(undefined);

export function useFhevm() {
  const ctx = useContext(FhevmContext);
  if (!ctx) throw new Error('❌ useFhevm must be used inside <FhevmProvider>');
  return ctx;
}
