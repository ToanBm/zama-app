// ✅ FhevmProvider.tsx (có log kiểm tra đầy đủ)
import { useEffect, useState, type ReactNode } from 'react';
import {
  initSDK,
  createInstance,
  SepoliaConfig,
  type FhevmInstance,
  type EIP712,
} from '@zama-fhe/relayer-sdk/bundle';
import { ethers } from 'ethers';
import { FhevmContext } from '../hooks/useFhevm';
import { useWallet } from '../hooks/useWallet';

declare global {
  interface Window {
    ethereum?: any;
  }
}

export function FhevmProvider({ children }: { children: ReactNode }) {
  const { address: account } = useWallet();
  const [instance, setInstance] = useState<FhevmInstance>();
  const [eip712, setEip712] = useState<EIP712>();
  const [signature, setSignature] = useState<string>();

  useEffect(() => {
    (async () => {
      if (!account) return; // chỉ chạy khi account có
      console.log('🔧 Initializing FHEVM SDK...');

      try {
        await initSDK();
        console.log('✅ SDK initialized');

        const i = await createInstance({
          ...SepoliaConfig,
          network: window.ethereum,
        });

        console.log('✅ FHEVM SDK instance created:', i);
        console.log('🔍 instance.createEncryptedInput:', typeof i.createEncryptedInput);
        console.log('🔍 instance.generateKeypair:', typeof i.generateKeypair);

        const { publicKey } = i.generateKeypair();
        console.log('🔑 publicKey:', publicKey);

        const eip = i.createEIP712(publicKey, [], Date.now(), 365);
        console.log('📜 EIP712 object created:', eip);

        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const sig = await signer.signTypedData(
          eip.domain,
          { [eip.primaryType]: eip.types[eip.primaryType] },
          eip.message
        );
        console.log('✍️ EIP-712 signature created');

        setInstance(i);
        setEip712(eip);
        setSignature(sig);

        console.log('✅ FHEVM SDK setup complete');
      } catch (err) {
        console.error('❌ FHEVM SDK setup failed:', err);
      }
    })();
  }, [account]);

  if (!instance || !eip712 || !signature) {
    return <div>Initializing FHEVM...</div>;
  }

  return (
    <FhevmContext.Provider
      value={{
        instance,
        eip712,
        signature,
        setSignature,
        decrypt: () => Promise.resolve(undefined),
      }}
    >
      {children}
    </FhevmContext.Provider>
  );
}
