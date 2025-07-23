import { ethers } from "hardhat";

async function main() {
  const ContractFactory = await ethers.getContractFactory("NftAuctionFheRandom");

  const nftAddress = "0x52358eE5b781c99a1f9E4C599528638E9B56469f";
  const tokenId = 0;

  // 👉 Reserve price = 100 đơn vị = 0.1 ETH (nếu 1 đơn vị = 0.001 ETH)
  const reserveValue = 100;
  const reserveHex = ethers.toBeHex(reserveValue); // convert to hex
  const reservePrice = ethers.zeroPadValue(reserveHex, 32); // pad to bytes32

  // ⏰ Thời gian bắt đầu/kết thúc (UTC)
  const today = new Date(Date.now() + 7 * 3600 * 1000); // GMT+7
  today.setUTCHours(3, 0, 0, 0); // 10:00 sáng giờ VN
  const startTime = Math.floor(today.getTime() / 1000);
  const endTime = startTime + 14 * 3600; // kết thúc sau 14 tiếng

  // 🧠 Địa chỉ oracle Sepolia chuẩn
  const oracleAddress = "0xca2f6ed71b38fc6e68257f07b27083e62fe0e8e4";

  const contract = await ContractFactory.deploy(
    nftAddress,
    tokenId,
    reservePrice,
    startTime,
    endTime,
    oracleAddress
  );

  await contract.waitForDeployment();

  console.log("✅ Deployed to:", await contract.getAddress());
  console.log("Oracle:", oracleAddress);
  console.log("StartTime:", startTime, new Date(startTime * 1000).toISOString());
  console.log("EndTime:", endTime, new Date(endTime * 1000).toISOString());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
