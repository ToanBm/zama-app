import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import { AUCTION_ABI_V1 } from "../abi/auctionAbi_v1";
import { useBid } from "../hooks/useBid";

const AUCTION_ADDRESS = import.meta.env.VITE_AUCTION_V1_ADDRESS!;
console.log("AUCTION_ADDRESS:", AUCTION_ADDRESS);

const nft = {
  image: "/icon/github.svg",
  name: "DreamHackers",
  networkIcon: "/icon/x.svg",
};
const mintFee = 0;
const isMintLive = true;
const symbol = "zUSD";

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
  const [signer] = useState(true);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [endTime, setEndTime] = useState<number | null>(null);
  const [reservePrice, setReservePrice] = useState<string | null>(null);
  const { placeBidFhe } = useBid();

  const auctionId = 0;

  useEffect(() => {
    async function fetchAuctionInfo() {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const contract = new ethers.Contract(AUCTION_ADDRESS, AUCTION_ABI_V1, provider);
        const auction = await contract.auctions(auctionId);
        const start = auction.startTime;
        const end = auction.endTime;
        let reserve = auction.reservePrice;
        let reserveNumber = "";
        if (typeof reserve === "bigint" || typeof reserve === "number") {
          reserveNumber = reserve.toString();
        } else if (typeof reserve === "string") {
          reserveNumber = BigInt(reserve).toString();
        } else {
          reserveNumber = "0";
        }
        setReservePrice(reserveNumber);
        setStartTime(Number(start));
        setEndTime(Number(end));
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
    let current = parseInt(bidAmount, 10);
    let base = reservePrice ? parseInt(reservePrice, 10) : 0;
    if (isNaN(current) || current < base) {
      current = base;
    }
    const next = current + 1;
    setBidAmount(next.toString());
  };

  const handleDecrease = () => {
    let current = parseInt(bidAmount, 10);
    let base = reservePrice ? parseInt(reservePrice, 10) : 0;
    if (isNaN(current) || current <= base) {
      setBidAmount(base.toString());
      return;
    }
    let next = current - 1;
    if (next < base) next = base;
    setBidAmount(next.toString());
  };

  const handleBidInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    if (/^\d*$/.test(value)) {
      setBidAmount(value);
    }
  };

  const handleBid = async () => {
    if (!bidAmount || !reservePrice || parseInt(bidAmount) < parseInt(reservePrice)) return;
    setMinting(true);
    try {
      await placeBidFhe(auctionId, Number(bidAmount));
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
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
        <div className="mainpanel-info">
          <div className="popup-header-title">{nft.name}</div>
          <div className="popup-header-meta">
            <img src="/icon/monad.png" alt="Network" />
            <img src="/icon/monad.png" alt="Contract" />
            <div className="social-icons">
              <a href="https://github.com/ToanBm" target="_blank" rel="noreferrer" className="social-button">
                <img src="/icon/github.svg" alt="GitHub" />
              </a>
              <a href="https://x.com/buiminhtoan1985" target="_blank" rel="noreferrer" className="social-button">
                <img src="/icon/x.svg" alt="X" />
              </a>
              <a href="https://discord.com/users/toanbm" target="_blank" rel="noreferrer" className="social-button">
                <img src="/icon/discord.svg" alt="Discord" />
              </a>
              <a href="https://t.me/" target="_blank" rel="noreferrer" className="social-button">
                <img src="/icon/telegram.svg" alt="Telegram" />
              </a>
            </div>
          </div>
          <div className="popup-header-desc">
            Bộ sưu tập NFT độc quyền của DreamHackers.
          </div>
        </div>
        <div className="popup-right">
          <div className="auction-status-card">
            <div className="popup-mint-status-row">
              <div className="popup-mint-card live-card">
                <span className="popup-status-dot" />
                <span className="popup-live-text">{isLive ? "Live" : beforeStart ? "Soon" : "Ended"}</span>
              </div>
              <div className="popup-mint-card countdown-card">
                <div className="countdown-label-row">
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
                <div className="popup-progress-bar">
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
                  step="1"
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
              <span>{bidAmount && !isNaN(Number(bidAmount)) ? (Math.ceil(Number(bidAmount) * 0.05)).toString() : "0"} {symbol}</span>
            </div>
          </div>
          <div className="popup-action">
            <button
              className="mint-button"
              onClick={handleBid}
              disabled={
                minting ||
                !isMintLive ||
                !signer ||
                !bidAmount ||
                (reservePrice !== null && bidAmount !== "" && parseInt(bidAmount) < parseInt(reservePrice))
              }
            >
              {!signer ? "Connect Wallet" : minting ? "Bidding..." : "Place Bid"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainPanel;
