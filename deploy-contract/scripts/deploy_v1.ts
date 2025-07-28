import { ethers } from "hardhat";
import * as dotenv from "dotenv";
import * as fs from "fs";
dotenv.config();

async function main() {
  const ContractFactory = await ethers.getContractFactory("AuctionManager");

  const nftAddress = "0x52358eE5b781c99a1f9E4C599528638E9B56469f";
  const tokenId = 0;

  const reserveValue = 100;
  const reserveHex = ethers.toBeHex(reserveValue);
  const reservePrice = ethers.zeroPadValue(reserveHex, 32);

  const now = Math.floor(Date.now() / 1000);
  const startTime = now + 10;
  const endTime = startTime + 600;

  const zUSDAddress = process.env.AUCTION_zUSD_ADDRESS!;

  const contract = await ContractFactory.deploy();
  await contract.waitForDeployment();
  const contractAddress = await contract.getAddress();
  console.log("✅ AuctionManager deployed to:", contractAddress);


  const tx = await contract.createAuction(
    nftAddress,
    tokenId,
    reservePrice,
    startTime,
    endTime,
    zUSDAddress
  );
  const receipt = await tx.wait();

  console.log("🕒 Deploy Time:", new Date(now * 1000).toISOString());
  console.log("🔜 StartTime :", startTime, new Date(startTime * 1000).toISOString());
  console.log("🔚 EndTime   :", endTime, new Date(endTime * 1000).toISOString());
  console.log("🎯 createAuction tx hash:", receipt?.hash);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
