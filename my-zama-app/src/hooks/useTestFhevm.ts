import { useFhevm } from './useFhevm';
import { useWallet } from './useWallet';

const CONTRACT_ADDRESS = '0xd4c85d749b9f69a1e03d78297e8d914a624838ea';

export const useTestFhevm = () => {
  const { instance } = useFhevm();
  const { address: userAddress } = useWallet();

  const testEncrypt = async () => {
    if (!instance || !userAddress) {
      throw new Error('FHEVM or user address not ready');
    }
    try {
      const ciphertext = await instance.createEncryptedInput(CONTRACT_ADDRESS, userAddress);
      console.log('DEBUG ciphertext:', ciphertext);
      return ciphertext;
    } catch (err) {
      console.error('‼️ SDK.createEncryptedInput error:', err);
      throw err;
    }
  };

  return { testEncrypt };
}; 