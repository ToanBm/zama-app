// ✅ FhevmProvider.tsx (đã fix không load SDK do thiếu ví)
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
  const { address: account, connect } = useWallet();
  const [instance, setInstance] = useState<FhevmInstance>();
  const [eip712, setEip712] = useState<EIP712>();
  const [signature, setSignature] = useState<string>();

  useEffect(() => {
    (async () => {
      if (!window.ethereum) {
        console.warn('⚠️ No Ethereum provider found.');
        return;
      }

      if (!account) {
        console.log('🕐 No wallet connected. Attempting to connect...');
        await connect(); // <- Tự động connect ví
        return; // Chờ lần sau effect chạy lại
      }

      console.log('🔧 Initializing FHEVM SDK for:', account);

      try {
        await initSDK();
        console.log('✅ SDK initialized');

        const i = await createInstance({
          ...SepoliaConfig,
          network: window.ethereum,
        });

        console.log('✅ FHEVM instance:', i);
        const { publicKey } = i.generateKeypair();
        console.log('🔑 publicKey:', publicKey);

        const eip = i.createEIP712(publicKey, [], Date.now(), 365);
        console.log('📜 EIP712 object created');

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
        console.log('✅ FHEVM setup complete');
      } catch (err) {
        console.error('❌ Failed to initialize FHEVM:', err);
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
        decrypt: () => Promise.resolve(undefined), // Bạn có thể cập nhật sau nếu cần decrypt riêng
      }}
    >
      {children}
    </FhevmContext.Provider>
  );
}
