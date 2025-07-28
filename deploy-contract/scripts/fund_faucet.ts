import { ethers } from "hardhat";
import * as dotenv from "dotenv";
dotenv.config();

async function main() {
  const [deployer] = await ethers.getSigners();

  // Địa chỉ contract
  const faucetAddress = process.env.FAUCET_ADDRESS!;
  const zUSDAddress = process.env.AUCTION_zUSD_ADDRESS!;

  // Nạp ETH vào faucet
  const ethAmount = ethers.parseEther("0.1"); // 0.1 ETH
  const ethTx = await deployer.sendTransaction({
    to: faucetAddress,
    value: ethAmount,
  });
  await ethTx.wait();
  console.log(`Đã gửi ${ethers.formatEther(ethAmount)} ETH vào faucet:`, faucetAddress);

  // Mint zUSD vào faucet (chỉ owner mới gọi được)
  const zUSD = await ethers.getContractAt("Auction_zUSD", zUSDAddress);
  const zUSDAmount = 1000; // 1,000 zUSD (số nguyên)
  const mintTx = await zUSD.mint(faucetAddress, zUSDAmount);
  await mintTx.wait();
  console.log(`Đã mint ${zUSDAmount} zUSD vào faucet:`, faucetAddress);

  // Test claim faucet cho user đầu tiên
  const faucetAbi = ["function claim() external"];
  const faucet = new ethers.Contract(faucetAddress, faucetAbi, deployer);
  const claimTx = await faucet.claim();
  await claimTx.wait();
  console.log(`User ${deployer.address} đã claim faucet thành công!`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 