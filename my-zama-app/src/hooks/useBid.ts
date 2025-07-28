import { useFhevm } from './useFhevm';
import { useWallet } from './useWallet';
import { ethers } from 'ethers';
import { AUCTION_ABI_V1 } from '../abi/auctionAbi_v1';

export const useBid = () => {
  const { instance } = useFhevm();
  const { address: account } = useWallet();

  // Constants
  const RESERVE_PRICE = 100;
  const BID_STEP = 1;
  const BID_FEE_PERCENT = 0.05;

  const placeBidFhe = async (auctionId: number, value: number, lastBid?: number) => {
    if (!instance || !account) {
      throw new Error('FHEVM not ready');
    }

    const intValue = Math.floor(value);
    if (intValue !== value) throw new Error('Bid must be an integer');

    if (intValue < RESERVE_PRICE) throw new Error(`Bid must be ≥ ${RESERVE_PRICE} zUSD`);

    if (typeof lastBid === 'number' && Math.abs(intValue - lastBid) !== BID_STEP) {
      throw new Error(`Bid must increase/decrease by exactly ${BID_STEP}`);
    }

    const fee = Math.ceil(intValue * BID_FEE_PERCENT);
    const totalBid = intValue + fee;

    if (totalBid <= 0 || totalBid >= 2 ** 32) {
      throw new Error("Total bid out of uint32 range");
    }

    const contractAddr = import.meta.env.VITE_AUCTION_V1_ADDRESS!;
    try {
      const ciphertext = await instance.createEncryptedInput(contractAddr, account);
      ciphertext.add32(totalBid);
      const { handles, inputProof } = await ciphertext.encrypt();

      console.log('📦 Encrypted handle:', handles[0]);
      console.log('📜 Input proof:', inputProof);

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(contractAddr, AUCTION_ABI_V1, signer);

      const tx = await contract.placeBid(
        auctionId,
        ethers.hexlify(handles[0]),
        ethers.hexlify(inputProof)
      );
      await tx.wait();

      return tx.hash;
    } catch (err) {
      console.error('‼️ placeBidFhe error:', err);
      throw err;
    }
  };

  return {
    placeBidFhe,
  };
};
