import { useFhevm } from './useFhevm';
import { useWallet } from './useWallet';

const CONTRACT_ADDRESS = import.meta.env.VITE_AUCTION_V1_ADDRESS!;

export const useTestFhevm = () => {
  const { instance } = useFhevm();
  const { address: userAddress } = useWallet();

  const testEncrypt = async () => {
    if (!instance || !userAddress) {
      throw new Error('FHEVM or user address not ready');
    }

    try {
      const ciphertext = await instance.createEncryptedInput(CONTRACT_ADDRESS, userAddress);

      // Test encrypt một giá trị 123 (có thể thay đổi)
      ciphertext.add32(123);

      const { handles, inputProof } = await ciphertext.encrypt();

      console.log('🔐 handle:', handles[0]);
      console.log('📜 proof:', inputProof);
      console.log('📦 ciphertext (full):', ciphertext);

      return {
        handle: handles[0],
        proof: inputProof,
        ciphertext,
      };
    } catch (err) {
      console.error('‼️ SDK.createEncryptedInput error:', err);
      throw err;
    }
  };

  return { testEncrypt };
};
