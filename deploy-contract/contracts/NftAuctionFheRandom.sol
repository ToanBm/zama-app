// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {FHE, euint32, externalEuint32, ebool} from "@fhevm/solidity/lib/FHE.sol";

interface IDecryptionOracle {
    function requestDecryption(bytes32[] calldata ciphertexts, bytes4 callbackSelector) external;
}

contract NftAuctionFheRandom {
    IERC721 public nft;
    uint256 public tokenId;
    address public owner;
    uint256 public startTime;
    uint256 public endTime;
    euint32 public reservePrice;
    bool public ended;
    address public winner;
    address public oracle;

    struct Bid {
        externalEuint32 encryptedBid;
        bytes proof;
        uint256 timestamp;
        bool claimed;
    }

    mapping(address => Bid) public bids;
    address[] public bidders;
    mapping(address => uint32) public decryptedBids;

    event BidPlaced(address indexed bidder, uint256 timestamp);
    event AuctionEnded(address winner);
    event NftClaimed(address winner);
    event DecryptionRequested();
    event DebugHex(bytes32 ciphertext, bytes proof);
    event DebugEncryptedBid(bytes32 ciphertext, bool isInitialized);

    constructor(
        address _nft,
        uint256 _tokenId,
        euint32 _reservePrice,
        uint256 _startTime,
        uint256 _endTime,
        address _oracle
    ) {
        nft = IERC721(_nft);
        tokenId = _tokenId;
        owner = msg.sender;
        reservePrice = _reservePrice;
        startTime = _startTime;
        endTime = _endTime;
        oracle = _oracle;
    }

    function placeBid(externalEuint32 encryptedBid, bytes calldata proof) external {
        require(block.timestamp >= startTime, "Auction not started");
        require(block.timestamp < endTime, "Auction ended");
        require(bids[msg.sender].timestamp == 0, "Already bid");

        emit DebugHex(FHE.toBytes32(encryptedBid), proof);

        euint32 verifiedBid = FHE.fromExternal(encryptedBid, proof);
        FHE.allow(verifiedBid, address(this));

        bids[msg.sender] = Bid(encryptedBid, proof, block.timestamp, false);
        bidders.push(msg.sender);
        emit BidPlaced(msg.sender, block.timestamp);
    }

    function endAuction() external {
        require(block.timestamp >= endTime, "Auction not ended yet");
        require(!ended, "Already ended");
        require(msg.sender == owner, "Only owner can end");
        require(bidders.length > 0, "No bidders");

        bytes32[] memory ciphertexts = new bytes32[](bidders.length);
        for (uint i = 0; i < bidders.length; i++) {
            Bid memory bid = bids[bidders[i]];
            euint32 verifiedBid = FHE.fromExternal(bid.encryptedBid, bid.proof);
            require(FHE.isInitialized(verifiedBid), "Invalid ciphertext in endAuction");
            FHE.allow(verifiedBid, address(this));
            ciphertexts[i] = FHE.toBytes32(verifiedBid);
            emit DebugEncryptedBid(ciphertexts[i], FHE.isInitialized(verifiedBid));
        }

        IDecryptionOracle(oracle).requestDecryption(ciphertexts, this.receiveDecryptedBids.selector);
        emit DecryptionRequested();
    }

    function receiveDecryptedBids(
        uint256, 
        uint32[] calldata values,
        bytes[] calldata
    ) external {
        require(!ended, "Already ended");
        require(msg.sender == oracle, "Only oracle can call");

        uint32 highest = 0;
        uint winnerIndex = 0;
        for (uint i = 0; i < values.length; i++) {
            decryptedBids[bidders[i]] = values[i];
            if (values[i] > highest) {
                highest = values[i];
                winnerIndex = i;
            }
        }

        winner = bidders[winnerIndex];
        ended = true;
        emit AuctionEnded(winner);
    }

    function claimNft() external {
        require(ended, "Auction not ended");
        require(msg.sender == winner, "Not winner");
        require(!bids[msg.sender].claimed, "Already claimed");

        bids[msg.sender].claimed = true;
        nft.transferFrom(owner, msg.sender, tokenId);
        emit NftClaimed(msg.sender);
    }

    function getBidders() external view returns (address[] memory) {
        return bidders;
    }
}
