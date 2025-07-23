import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import { AUCTION_ABI } from "../abi/auctionAbi";
import { AUCTION_ADDRESS } from "../abi/auctionAddress";
import { useBid } from "../hooks/useBid";

// Dummy data cho NFT, sẽ thay bằng props hoặc fetch từ contract sau
const nft = {
  image: "/icon/github.svg", // Thay bằng ảnh NFT thật
  name: "DreamHackers",
  networkIcon: "/icon/x.svg",
};
const mintFee = 0;
const isMintLive = true;
const symbol = "ETH";

function formatCountdown(ms: number) {
  if (ms < 0) return "Ended";
  const d = Math.floor(ms / (24 * 3600 * 1000));
  const h = Math.floor((ms % (24 * 3600 * 1000)) / (3600 * 1000));
  const m = Math.floor((ms % (3600 * 1000)) / (60 * 1000));
  const s = Math.floor((ms % (60 * 1000)) / 1000);
  return `${d}d ${h}h ${m}m ${s}s`;
}

const MainPanel: React.FC = () => {
  const [bidAmount, setBidAmount] = useState<string>("");
  const [minting, setMinting] = useState(false);
  const [signer] = useState(true); // Giả lập đã kết nối ví
  const [startTime, setStartTime] = useState<number | null>(null);
  const [endTime, setEndTime] = useState<number | null>(null);
  const [reservePrice, setReservePrice] = useState<string | null>(null);
  const { placeBidFhe } = useBid();

  useEffect(() => {
    async function fetchAuctionInfo() {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const contract = new ethers.Contract(AUCTION_ADDRESS, AUCTION_ABI, provider);
        const start = await contract.startTime();
        const end = await contract.endTime();
        const reserve = await contract.reservePrice();
        setStartTime(Number(start));
        setEndTime(Number(end));
        setReservePrice(ethers.formatEther(reserve));
      } catch (err) {
        console.error("Error fetching auction info:", err);
      }
    }
    fetchAuctionInfo();
  }, []);

  const now = Math.floor(Date.now() / 1000);
  const beforeStart = startTime && now < startTime;
  const afterEnd = endTime && now >= endTime;
  const isLive = startTime && endTime && now >= startTime && now < endTime;
  const countdown = beforeStart
    ? (startTime! - now) * 1000
    : isLive
      ? (endTime! - now) * 1000
      : 0;
  const duration = endTime && startTime ? endTime - startTime : 1;
  const percentTime = isLive
    ? Math.min(100, Math.max(0, ((now - startTime!) / duration) * 100))
    : beforeStart
      ? 0
      : 100;

  const handleIncrease = () => {
    let current = parseFloat(bidAmount);
    let base = reservePrice ? parseFloat(reservePrice) : 0;
    if (isNaN(current) || current < base) {
      current = base;
    }
    const next = Math.round((current + 0.01) * 100) / 100;
    setBidAmount(next.toFixed(2));
  };

  const handleDecrease = () => {
    let current = parseFloat(bidAmount);
    let base = reservePrice ? parseFloat(reservePrice) : 0;
    if (isNaN(current) || current <= base) {
      setBidAmount(base.toFixed(2));
      return;
    }
    let next = Math.round((current - 0.01) * 100) / 100;
    if (next < base) next = base;
    setBidAmount(next.toFixed(2));
  };

  const handleBidInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    // Chỉ cho phép tối đa 2 số thập phân
    if (/^\d*(\.\d{0,2})?$/.test(value)) {
      setBidAmount(value);
    }
  };

  const handleBid = async () => {
    if (!bidAmount || !reservePrice || parseFloat(bidAmount) < parseFloat(reservePrice)) return;
    setMinting(true);
    try {
      await placeBidFhe(Number(bidAmount));
      alert("Bid thành công!");
    } catch (err: any) {
      alert("Bid thất bại: " + (err?.reason || err?.message || err));
    }
    setMinting(false);
  };

  return (
    <div className="popup-box main-nft-panel">
      <div className="popup-left">
        <img src={nft.image} alt={nft.name} className="popup-image" />
      </div>
      <div className="popup-right">
        <div className="popup-header-card">
          <div className="popup-header-title">{nft.name}</div>
          {nft.networkIcon && (
            <div className="popup-header-icon">
              <img src={nft.networkIcon} alt="net" className="popup-network-icon" />
            </div>
          )}
        </div>

        <div className="popup-stages-card">
          {/* Block ngang: Live + Countdown */}
          <div className="popup-mint-status-row" style={{ minHeight: 56, alignItems: 'center', marginBottom: 8 }}>
            <div className="popup-mint-card live-card" style={{ minHeight: 32, display: 'flex', alignItems: 'center' }}>
              <span className="popup-status-dot" />
              <span className="popup-live-text">{isLive ? "Live" : beforeStart ? "Soon" : "Ended"}</span>
            </div>
            <div className="popup-mint-card countdown-card" style={{ flex: 1, minHeight: 32, display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <div className="countdown-label-row" style={{ minHeight: 32, display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                <span className="popup-stages-countdown-label">
                  {beforeStart ? "START IN:" : isLive ? "ENDS IN:" : "ENDED"}
                </span>
                <span className="popup-stages-countdown">
                  {beforeStart
                    ? formatCountdown(countdown)
                    : isLive
                      ? formatCountdown(countdown)
                      : "Ended"}
                </span>
              </div>
              <div className="popup-progress-bar" style={{ width: '100%', marginTop: 8 }}>
                <div
                  className="popup-progress-bar-inner"
                  style={{ width: `${percentTime}%` }}
                ></div>
              </div>
            </div>
          </div>
          <div className="popup-stages-price-line">
            Reserve Price <strong>{reservePrice ? `${reservePrice} ${symbol}` : "Loading..."}</strong>
          </div>
        </div>

        <div className="popup-price-card">
          {/* Input nhập giá bid */}
          <div className="popup-price-quantity-row">
            <div className="popup-price-label-group">
              <div className="popup-price-label">Reserve Price</div>
              <div className="popup-price-value">
                {bidAmount ? `${bidAmount} ${symbol}` : reservePrice ? `${reservePrice} ${symbol}` : "..."}
              </div>
            </div>
            <div className="popup-amount-row">
              <button onClick={handleDecrease}>-</button>
              <input
                type="number"
                min={reservePrice || "0"}
                step="0.01"
                value={bidAmount}
                onChange={handleBidInput}
                placeholder={reservePrice ? reservePrice : "Bid"}
                className="popup-bid-input"
              />
              <button onClick={handleIncrease}>+</button>
            </div>
          </div>

          <div className="popup-mint-fee-row">
            <span>Bid Fee</span>
            <span>{bidAmount && !isNaN(Number(bidAmount)) ? (Math.round(Number(bidAmount) * 0.05 * 1000) / 1000).toFixed(3) : "0.000"} {symbol}</span>
          </div>
        </div>

        <div className="popup-action">
          <button
            className="mint-button"
            onClick={handleBid}
            disabled={minting || !isMintLive || !signer || !bidAmount || (reservePrice && parseFloat(bidAmount) < parseFloat(reservePrice))}
          >
            {!signer ? "Connect Wallet" : minting ? "Bidding..." : "Place Bid"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MainPanel; 