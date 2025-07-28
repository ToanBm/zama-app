// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./Auction_zUSD.sol";
import { FHE } from "@fhevm/solidity/lib/FHE.sol";

contract Faucet {
    Auction_zUSD public zUSD;
    address public owner;
    mapping(address => bool) public claimed;

    event FaucetClaimed(address indexed user, uint256 ethAmount, uint256 zUSDAmount);

    constructor(address _zUSD) {
        zUSD = Auction_zUSD(_zUSD);
        owner = msg.sender;
    }

    function claim() external {
        require(!claimed[msg.sender], "Already claimed");
        claimed[msg.sender] = true;

        // Gửi 0.01 ETH
        uint256 ethAmount = 0.01 ether;
        require(address(this).balance >= ethAmount, "Faucet: Not enough ETH");
        payable(msg.sender).transfer(ethAmount);

        // Random số lượng zUSD (200-400)
        uint64 zUSDAmount = 200 + uint64(uint256(keccak256(abi.encodePacked(block.timestamp, msg.sender, block.prevrandao))) % 201);
        zUSD.faucetMint(msg.sender, zUSDAmount);

        emit FaucetClaimed(msg.sender, ethAmount, zUSDAmount);
    }

    // Nạp ETH vào faucet
    receive() external payable {}
}