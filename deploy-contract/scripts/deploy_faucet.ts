import { ethers } from "hardhat";
import * as dotenv from "dotenv";
dotenv.config();

async function main() {
  const FaucetFactory = await ethers.getContractFactory("Faucet");

  // Lấy địa chỉ zUSD từ biến môi trường
  const zUSDAddress = process.env.AUCTION_zUSD_ADDRESS!;

  const faucet = await FaucetFactory.deploy(zUSDAddress);
  await faucet.waitForDeployment();

  console.log("Faucet deployed to:", await faucet.getAddress());
  console.log("zUSD address:", zUSDAddress);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 