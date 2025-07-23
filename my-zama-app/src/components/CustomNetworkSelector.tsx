import React, { useState, useRef, useEffect } from "react";
import { CHAINS } from "../utils/chains";

interface Props {
  selectedChain: string;
  onSwitch: (chain: string) => void;
}

const ICONS: Record<string, string> = {
  SEPOLIA: "/icon/monad.png",
};

const CustomNetworkSelector: React.FC<Props> = ({ selectedChain, onSwitch }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const switchToSepolia = async () => {
    if (window.ethereum) {
      const sepolia = CHAINS.SEPOLIA;
      const chainIdHex = "0x" + sepolia.chainId.toString(16);
      try {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: chainIdHex }],
        });
      } catch (switchError: any) {
        if (switchError.code === 4902) {
          try {
            await window.ethereum.request({
              method: "wallet_addEthereumChain",
              params: [
                {
                  chainId: chainIdHex,
                  chainName: sepolia.name,
                  rpcUrls: sepolia.rpcUrls,
                  nativeCurrency: sepolia.nativeCurrency,
                  blockExplorerUrls: sepolia.blockExplorerUrls,
                },
              ],
            });
          } catch (addError) {
            // Handle add chain error if needed
          }
        }
      }
    }
  };

  const handleSelect = async (chain: string) => {
    if (chain === "SEPOLIA") {
      await switchToSepolia();
    }
    onSwitch(chain);
    setOpen(false);
  };

  const chainKey = Object.keys(CHAINS).includes(selectedChain) ? selectedChain as keyof typeof CHAINS : undefined;

  return (
    <div className="custom-dropdown" ref={ref}>
      <div className="selected" onClick={() => setOpen(!open)}>
        <img
          src={ICONS[selectedChain]}
          alt={selectedChain}
          className="selected-network-icon"
        />
        {/* Bỏ tên mạng ở đây, chỉ giữ lại icon và mũi tên */}
        <span className="dropdown-arrow">▾</span>
      </div>
      {open && (
        <div className="dropdown-list">
          {(Object.keys(CHAINS) as (keyof typeof CHAINS)[]).map((key) => (
            <div key={key} className="dropdown-item" onClick={() => handleSelect(key)}>
              <img src={ICONS[key]} alt={key} />
              <span>{CHAINS[key].name}</span>
            </div>
          ))}
          <div className="dropdown-item disconnect" onClick={() => handleSelect("DISCONNECT")}>Disconnect Wallet</div>
        </div>
      )}
    </div>
  );
};

export default CustomNetworkSelector; 