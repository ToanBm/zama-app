// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract SimpleNft is ERC721 {
    uint256 public nextTokenId;
    address public admin;

    constructor() ERC721("SimpleNft", "SNFT") {
        admin = msg.sender;
    }

    function mint(address to) external {
        require(msg.sender == admin, "only admin");
        _mint(to, nextTokenId);
        nextTokenId++;
    }
} 