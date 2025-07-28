import { useState, useEffect } from 'react';
import { ethers } from 'ethers';

export function useWallet() {
  const [address, setAddress] = useState<string | undefined>(undefined);

  // Theo dõi địa chỉ ví đã kết nối
  useEffect(() => {
    const checkConnection = async () => {
      if (!window.ethereum) return;
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send('eth_accounts', []);
      if (accounts.length > 0) {
        console.log('👛 Detected wallet:', accounts[0]);
        setAddress(accounts[0]);
      }
    };

    checkConnection();

    // Theo dõi sự kiện thay đổi tài khoản (MetaMask)
    if (window.ethereum?.on) {
      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        console.log('🔄 Account changed:', accounts[0]);
        setAddress(accounts[0]);
      });
    }

    return () => {
      if (window.ethereum?.removeListener) {
        window.ethereum.removeListener('accountsChanged', () => { });
      }
    };
  }, []);

  // Hàm kết nối ví khi người dùng nhấn nút
  async function connect() {
    if (!window.ethereum) return;
    const provider = new ethers.BrowserProvider(window.ethereum);
    const accounts = await provider.send('eth_requestAccounts', []);
    if (accounts.length > 0) {
      console.log('✅ Wallet connected:', accounts[0]);
      setAddress(accounts[0]);
    }
  }

  return { address, connect };
}
