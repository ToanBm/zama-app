// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import { FHE, euint32, externalEuint32 } from "@fhevm/solidity/lib/FHE.sol";
import { SepoliaConfig } from "./fhevm-config/ZamaConfig.sol";
import "./Auction_zUSD.sol";

contract AuctionManager is SepoliaConfig {
    address public decryptionOracle;

    struct Bid {
        externalEuint32 encryptedBid;
        bytes proof;
        uint256 timestamp;
        bool claimed;
    }

    struct Auction {
        IERC721 nft;
        uint256 tokenId;
        address owner;
        uint256 startTime;
        uint256 endTime;
        uint32 reservePrice;
        bool ended;
        address winner;
        Auction_zUSD zUSD;

        address[] bidders;
        mapping(address => Bid) bids;
        mapping(address => uint32) decryptedBids;

        uint256 decryptionRequestId;
        bool decryptionHandled;
    }

    uint256 public auctionCounter;
    mapping(uint256 => Auction) public auctions;
    mapping(uint256 => uint256) public requestIdToAuctionId;

    event BidPlaced(uint256 indexed auctionId, address indexed bidder, uint256 timestamp);
    event AuctionEnded(uint256 indexed auctionId, address winner);
    event NftClaimed(uint256 indexed auctionId, address winner);
    event DecryptionRequested(uint256 indexed auctionId, uint256 requestId);
    event DebugEncryptedBid(uint256 indexed auctionId, bytes32 ciphertext, bool isInitialized);
    event DebugCallbackStep(string step, uint256 indexed auctionId);
    event DebugAddress(string label, address val);
    event DebugUint(string label, uint256 val);

    constructor() {
        address oracle = 0xa02Cda4Ca3a71D7C46997716F4283aa851C28812;
        FHE.setDecryptionOracle(oracle);
        decryptionOracle = oracle;
    }

    function createAuction(
        address nft,
        uint256 tokenId,
        uint32 reservePrice,
        uint256 startTime,
        uint256 endTime,
        address zUSD
    ) external returns (uint256 auctionId) {
        require(startTime < endTime, "Invalid auction time");

        auctionId = auctionCounter++;
        Auction storage a = auctions[auctionId];
        a.nft = IERC721(nft);
        a.tokenId = tokenId;
        a.owner = msg.sender;
        a.startTime = startTime;
        a.endTime = endTime;
        a.reservePrice = reservePrice;
        a.zUSD = Auction_zUSD(zUSD);
    }

    function placeBid(uint256 auctionId, externalEuint32 encryptedBid, bytes calldata proof) external {
        Auction storage a = auctions[auctionId];
        require(block.timestamp >= a.startTime, "Auction not started");
        require(block.timestamp < a.endTime, "Auction ended");
        require(a.bids[msg.sender].timestamp == 0, "Already bid");

        euint32 verified = FHE.fromExternal(encryptedBid, proof);
        FHE.allowThis(verified);
        
        bytes32 ct = FHE.toBytes32(verified);

        a.bids[msg.sender] = Bid(encryptedBid, proof, block.timestamp, false);
        a.bidders.push(msg.sender);

        emit BidPlaced(auctionId, msg.sender, block.timestamp);
    }

    function endAuction(uint256 auctionId) external {
        Auction storage a = auctions[auctionId];
        require(block.timestamp >= a.endTime, "Auction not ended yet");
        require(!a.ended, "Already ended");
        require(msg.sender == a.owner, "Only owner can end");
        require(a.bidders.length > 0, "No bidders");

        emit DebugAddress("msg.sender", msg.sender);
        emit DebugAddress("auction.owner", a.owner);
        emit DebugUint("block.timestamp", block.timestamp);
        emit DebugUint("a.endTime", a.endTime);
        emit DebugUint("bidders.length", a.bidders.length);

        bytes32[] memory cts = new bytes32[](a.bidders.length);
        for (uint i = 0; i < a.bidders.length; i++) {
            emit DebugAddress("checking_bidder", a.bidders[i]);

            Bid storage bid = a.bids[a.bidders[i]];
            emit DebugCallbackStep("before_fromExternal", auctionId);
            emit DebugUint("proof.length", bid.proof.length);
            euint32 verified = FHE.fromExternal(bid.encryptedBid, bid.proof);
            bytes32 ct = FHE.toBytes32(verified);
            cts[i] = ct;

            emit DebugCallbackStep("after_fromExternal", auctionId);
            emit DebugEncryptedBid(auctionId, ct, true);
        }

        a.decryptionRequestId = FHE.requestDecryption(cts, this.receiveDecryptedBids.selector);
        a.decryptionHandled = false;
        requestIdToAuctionId[a.decryptionRequestId] = auctionId;
        emit DecryptionRequested(auctionId, a.decryptionRequestId);
    }

    function receiveDecryptedBids(
        uint256 requestId,
        uint32[] calldata values,
        bytes[] calldata signatures
    ) external {
        require(msg.sender == decryptionOracle, "Only oracle can call");

        uint256 auctionId = requestIdToAuctionId[requestId];
        Auction storage a = auctions[auctionId];

        emit DebugCallbackStep("callback_entered", auctionId);
        FHE.checkSignatures(requestId, signatures);

        require(!a.ended, "Already ended");
        require(requestId == a.decryptionRequestId, "Invalid requestId");
        require(!a.decryptionHandled, "Already handled");
        a.decryptionHandled = true;

        uint32 highest = 0;
        uint winnerIndex = 0;
        bool foundWinner = false;
        for (uint i = 0; i < values.length; i++) {
            a.decryptedBids[a.bidders[i]] = values[i];
            if (values[i] >= a.reservePrice && values[i] > highest) {
                highest = values[i];
                winnerIndex = i;
                foundWinner = true;
            }
        }

        require(foundWinner, "No valid bid meets reserve price");
        a.winner = a.bidders[winnerIndex];
        a.ended = true;
        emit AuctionEnded(auctionId, a.winner);

        a.zUSD.transferFrom(a.winner, a.owner, FHE.asEuint64(highest));
    }

    function getAuctionInfo(uint256 auctionId) external view returns (
        address nft,
        uint256 tokenId,
        address owner,
        uint256 startTime,
        uint256 endTime,
        uint32 reservePrice,
        bool ended,
        address winner,
        address zUSD,
        uint256 biddersCount
    ) {
        Auction storage a = auctions[auctionId];
        nft = address(a.nft);
        tokenId = a.tokenId;
        owner = a.owner;
        startTime = a.startTime;
        endTime = a.endTime;
        reservePrice = a.reservePrice;
        ended = a.ended;
        winner = a.winner;
        zUSD = address(a.zUSD);
        biddersCount = a.bidders.length;
    }

    function claimNft(uint256 auctionId) external {
        Auction storage a = auctions[auctionId];
        require(a.ended, "Auction not ended");
        require(msg.sender == a.winner, "Not winner");
        require(!a.bids[msg.sender].claimed, "Already claimed");

        a.bids[msg.sender].claimed = true;
        a.nft.transferFrom(a.owner, msg.sender, a.tokenId);
        emit NftClaimed(auctionId, msg.sender);
    }

    function getBidProof(uint256 auctionId, address bidder) external view returns (bytes memory) {
    return auctions[auctionId].bids[bidder].proof;
    }

}
