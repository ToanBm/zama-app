// ✅ useBid.ts
import { useFhevm } from './useFhevm';
import { useWallet } from './useWallet';
import { ethers } from 'ethers';
import { AUCTION_ABI } from '../abi/auctionAbi';
import { AUCTION_ADDRESS } from '../abi/auctionAddress';

export const useBid = () => {
  const { instance } = useFhevm();
  const { address: account } = useWallet();

  const placeBidFhe = async (value: number) => {
    if (!instance || !account) {
      throw new Error('FHEVM not ready');
    }

    try {
      const scaledValue = Math.round(value * 1000); // 0.001 ETH = 1 đơn vị

      // ⚠️ Nên ép giá trị về Uint32 để tránh sai kiểu
      if (scaledValue <= 0 || scaledValue >= 2 ** 32) {
        throw new Error("Invalid scaled value: out of uint32 range");
      }

      const ciphertext = await instance.createEncryptedInput(AUCTION_ADDRESS, account);
      ciphertext.add32(scaledValue); // encrypt giá trị

      const { handles, inputProof } = await ciphertext.encrypt();

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(AUCTION_ADDRESS, AUCTION_ABI, signer);

      const tx = await contract.placeBid(
        ethers.hexlify(handles[0]),
        ethers.hexlify(inputProof)
      );
      await tx.wait();

      return tx.hash;
    } catch (err) {
      console.error("‼️ placeBidFhe error:", err);
      throw err;
    }
  };

  return {
    placeBidFhe,
  };
};
