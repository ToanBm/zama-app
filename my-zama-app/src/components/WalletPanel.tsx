// components/WalletPanel.js
import { useEffect, useState } from "react";
import {
    connectWallet,
    getExistingWallet,
    disconnectWallet,
    switchNetwork,
} from "../utils/connectWallet";
import { CHAINS } from "../utils/chains";
import CustomNetworkSelector from "./CustomNetworkSelector";
import { ethers } from "ethers";
import { FAUCET_ABI } from "../abi/faucetAbi";
import { useZUSDBalance } from "../hooks/useZUSDBalance";

let lastFetchTime = 0;

function WalletPanel({ onWalletConnected }) {
    const [signer, setSigner] = useState(null);
    const [walletAddress, setWalletAddress] = useState("");
    const [selectedChain, setSelectedChain] = useState("SEPOLIA");
    const [balance, setBalance] = useState(null);
    const zUSDBalance = useZUSDBalance(walletAddress);

    useEffect(() => {
        if (typeof window !== "undefined") {
            const saved = localStorage.getItem("selectedChain");
            if (saved && saved === "SEPOLIA") setSelectedChain(saved);
        }
    }, []);

    useEffect(() => {
        if (typeof window === "undefined") return;

        let retries = 0;
        const maxRetries = 10;
        let listenersAttached = false;

        const waitForEthereum = () => {
            const eth = window.okxwallet || window.ethereum;
            if (eth && eth.request && !listenersAttached) {
                reconnect();
                setupListeners(eth);
                listenersAttached = true;
            } else if (retries < maxRetries) {
                retries++;
                setTimeout(waitForEthereum, 300);
            }
        };

        const setupListeners = (eth) => {
            eth.on("accountsChanged", (accounts) => {
                if (accounts.length === 0) disconnect();
                else connect();
            });

            eth.on("chainChanged", async (_chainId) => {
                console.log("🔁 Chain changed:", _chainId);
                await reconnect();
            });
        };

        waitForEthereum();
    }, []);

    async function reconnect() {
        const wallet = await getExistingWallet();
        if (wallet?.signer) {
            setSigner(wallet.signer);
            const address = await wallet.signer.getAddress();
            setWalletAddress(address);
            onWalletConnected?.(wallet);

            const provider = wallet.signer.provider;
            await loadBalance(provider, address);
        }
    }

    async function connect() {
        const wallet = await connectWallet();
        if (wallet) {
            setSigner(wallet.signer);
            const address = await wallet.signer.getAddress();
            setWalletAddress(address);
            onWalletConnected?.(wallet);

            const provider = wallet.signer.provider;
            await loadBalance(provider, address);
        }
    }

    function disconnect() {
        disconnectWallet();
        setSigner(null);
        setWalletAddress("");
    }

    async function handleSwitchNetwork(chainKey) {
        if (chainKey === "DISCONNECT") {
            disconnect();
            return;
        }
        if (chainKey !== "SEPOLIA") return;
        const chainInfo = CHAINS[chainKey];
        await switchNetwork(chainInfo);
        localStorage.setItem("selectedChain", chainKey);
        setSelectedChain(chainKey);
    }

    function getNativeTokenSymbol() {
        return CHAINS[selectedChain]?.nativeCurrency?.symbol || "ETH";
    }

    async function loadBalance(provider, address) {
        if (!provider || !address) {
            console.warn("⚠️ Missing provider or address in loadBalance");
            return;
        }

        const now = Date.now();
        if (now - lastFetchTime < 1000) return;
        lastFetchTime = now;

        try {
            const raw = await provider.getBalance(address);
            const formatted = parseFloat(ethers.formatEther(raw)).toFixed(2);
            setBalance(formatted);
        } catch (err) {
            console.error("❌ Failed to fetch balance:", err);
        }
    }

    const FAUCET_ABI = [
      "function claim() external"
    ];
    const FAUCET_ADDRESS = import.meta.env.VITE_FAUCET_ADDRESS!;

    async function handleFaucet() {
        if (!signer || !walletAddress) {
            alert("Please connect your wallet first.");
            return;
        }
        try {
            const contract = new ethers.Contract(FAUCET_ADDRESS, FAUCET_ABI, signer);
            const tx = await contract.claim();
            await tx.wait();
            alert("✅ 0.01 ETH và zUSD đã được gửi vào ví của bạn!");
            await loadBalance(signer.provider, walletAddress);
        } catch (err) {
            console.error("Faucet error:", err);
            alert("❌ Faucet failed: " + (err?.reason || err?.message || err));
        }
    }

    function handleFaucetZUSD() {
        // Nếu faucet trả cả ETH và zUSD, chỉ cần gọi handleFaucet
        handleFaucet();
    }

    return (
        <div className="network-panel">
            <div className="network-row">
                {!signer ? (
                    <button className="wallet-button" onClick={connect}>
                        Connect Wallet
                    </button>
                ) : (
                    <div className="wallet-button">
                        {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                    </div>
                )}

                <CustomNetworkSelector
                    selectedChain={selectedChain}
                    onSwitch={handleSwitchNetwork}
                />
            </div>

            {/* Balance Section */}
            <div className="balance-row">
                <button className="balance-btn" disabled>
                    <img src="/icon/megaeth.png" alt="ETH" className="token-logo" />
                    {balance ?? "—"} ETH
                    <span>-</span>
                    <img src="/icon/monad.png" alt="zUSD" className="token-logo" />
                    {zUSDBalance} zUSD
                </button>
            </div>
            {/* Faucet Button gộp */}
            <div className="balance-faucet-row">
                <button className="faucet-button" onClick={() => { handleFaucet(); handleFaucetZUSD(); }}>
                    Faucet
                </button>
            </div>
        </div>
    );
}

export default WalletPanel;