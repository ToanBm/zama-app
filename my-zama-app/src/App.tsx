import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import { AUCTION_ABI_V1 } from "./abi/auctionAbi_v1";
import './App.css';
import WalletPanel from "./components/WalletPanel";
import UserPanel from "./components/UserPanel";
import FooterPanel from "./components/FooterPanel";
import MainPanel from "./components/MainPanel";
import { FhevmProvider } from "./providers/FhevmProvider";

const provider = new ethers.JsonRpcProvider("https://rpc.sepolia.org");

const AUCTION_ADDRESS = import.meta.env.VITE_AUCTION_V1_ADDRESS!;

function App() {
  const [winner, setWinner] = useState<string>("");

  useEffect(() => {
    const fetchWinner = async () => {
      try {
        const contract = new ethers.Contract(AUCTION_ADDRESS, AUCTION_ABI_V1, provider);
        const winnerAddress = await contract.winner();
        console.log("Winner from contract:", winnerAddress);
        setWinner(winnerAddress);
      } catch (err) {
        setWinner("Không thể lấy thông tin winner");
      }
    };
    fetchWinner();
  }, []);

  return (
    <FhevmProvider>
      <div className="container">
        <div className="main-panel">
          <MainPanel />
        </div>
        <div className="sidebar">
          <WalletPanel onWalletConnected={() => {}} />
          <UserPanel />
          <FooterPanel />
        </div>
      </div>
    </FhevmProvider>
  );
}

export default App;