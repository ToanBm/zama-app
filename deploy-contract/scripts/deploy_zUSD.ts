import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  const Auction_zUSD = await ethers.getContractFactory("Auction_zUSD");
  const contract = await Auction_zUSD.deploy();
  // Không cần await contract.deployed(); với ethers v6

  console.log("Auction_zUSD deployed to:", contract.target);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 