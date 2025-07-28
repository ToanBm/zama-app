import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { ZUSD_ABI } from "../abi/zusdAbi";
import { useFhevm } from "./useFhevm";

const ZUSD_ADDRESS = import.meta.env.VITE_AUCTION_zUSD_ADDRESS!;

export function useZUSDBalance(walletAddress: string | undefined) {
    const { instance } = useFhevm();
    const [zUSDBalance, setZUSDBalance] = useState<string>("...");

    useEffect(() => {
        async function fetchZUSDBalance() {
            if (!instance || !walletAddress) return;

            try {
                const provider = new ethers.BrowserProvider(window.ethereum);
                const signer = await provider.getSigner();
                const zusd = new ethers.Contract(ZUSD_ADDRESS, ZUSD_ABI, provider);

                const ciphertextHandle = await zusd.balanceOf(walletAddress);
                const keypair = instance.generateKeypair();
                const startTime = Math.floor(Date.now() / 1000).toString();
                const durationDays = "10";

                const eip712 = instance.createEIP712(
                    keypair.publicKey,
                    [ZUSD_ADDRESS],
                    startTime,
                    durationDays
                );

                const signature = await signer.signTypedData(
                    eip712.domain,
                    {
                        UserDecryptRequestVerification: eip712.types.UserDecryptRequestVerification,
                    },
                    eip712.message
                );

                const result = await instance.userDecrypt(
                    [{ handle: ciphertextHandle, contractAddress: ZUSD_ADDRESS }],
                    keypair.privateKey,
                    keypair.publicKey,
                    signature.replace("0x", ""),
                    [ZUSD_ADDRESS],
                    walletAddress,
                    startTime,
                    durationDays
                );

                const decryptedValue = result[ciphertextHandle];
                setZUSDBalance(decryptedValue?.toString?.() ?? "...");
            } catch (err) {
                console.error("❌ Failed to decrypt balance:", err);
                setZUSDBalance("...");
            }
        }

        fetchZUSDBalance();
    }, [instance, walletAddress]);

    return zUSDBalance;
}
