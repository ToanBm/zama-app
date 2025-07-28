import { ethers } from "hardhat";

async function main() {
  const contract = await ethers.getContractAt(
    "AuctionManager",
    "0x5D53175E8ef94C86656013f188A9D069a163d1a3"
  );
  const info = await contract.getAuctionInfo(0);
  console.log("Auction info:", info);

  const block = await ethers.provider.getBlock("latest");
  console.log("Current block.timestamp:", block.timestamp);

  const bidders = await contract.getBidders(0);
  console.log("Bidders:", bidders);

  try {
    const tx = await contract.endAuction(0);
    await tx.wait();
    console.log("✅ endAuction called, tx:", tx.hash);
  } catch (e: any) {
    console.error("❌ Error:", e);
  }
}

main();