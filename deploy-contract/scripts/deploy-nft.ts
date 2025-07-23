import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  const NftFactory = await ethers.getContractFactory("SimpleNft");
  const nft = await NftFactory.deploy();
  await nft.waitForDeployment();
  const nftAddress = await nft.getAddress();
  console.log("✅ SimpleNft deployed to:", nftAddress);

  // Mint 1 NFT cho admin
  const tx = await nft.mint(deployer.address);
  await tx.wait();
  console.log(`✅ Minted NFT #0 to ${deployer.address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 