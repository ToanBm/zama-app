import { useState, useEffect } from 'react';
import { ethers } from 'ethers';

export function useWallet() {
  const [address, setAddress] = useState<string>();

  useEffect(() => {
    const checkConnection = async () => {
      if (!window.ethereum) return;
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send('eth_accounts', []);
      if (accounts.length > 0) {
        setAddress(accounts[0]);
      }
    };

    checkConnection();
  }, []);

  async function connect() {
    if (!window.ethereum) return;
    const provider = new ethers.BrowserProvider(window.ethereum);
    const accounts = await provider.send('eth_requestAccounts', []);
    if (accounts.length > 0) {
      setAddress(accounts[0]);
    }
  }

  return { address, connect };
}
