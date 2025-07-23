import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { AUCTION_ABI } from "../abi/auctionAbi";
import { AUCTION_ADDRESS } from "../abi/auctionAddress";

function UserPanel() {
  const [bidders, setBidders] = useState<string[]>([]);

  useEffect(() => {
    async function fetchBidders() {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const contract = new ethers.Contract(AUCTION_ADDRESS, AUCTION_ABI, provider);
        const addresses: string[] = await contract.getBidders();
        setBidders(addresses);
      } catch (error) {
        console.error("🚨 Lỗi khi lấy danh sách bidders:", error);
      }
    }

    fetchBidders();
  }, []);

  return (
    <div className="user-panel">
      <h4>Bidders</h4>
      <ul className="bidders-list">
        {bidders.length === 0 && <li>No bidders yet</li>}
        {bidders.map(addr => (
          <li key={addr}>{addr.slice(0, 6)}...{addr.slice(-4)}</li>
        ))}
      </ul>
    </div>
  );
}

export default UserPanel;
