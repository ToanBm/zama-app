// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import "@fhevm/solidity/lib/FHE.sol";
import { SepoliaConfig } from "./fhevm-config/ZamaConfig.sol";

/**
 * @title Auction zUSD Token
 * @notice A minimal confidential ERC20-style token for auction use.
 */
contract Auction_zUSD is SepoliaConfig {
    address public owner;
    string public constant name = "Auction zUSD";
    string public constant symbol = "zUSD";
    uint8 public constant decimals = 6;
    uint64 public constant MAX_SUPPLY = 1_000_000 * 10**6;

    uint64 private _totalSupply;
    mapping(address => euint64) private _balances;
    mapping(address => mapping(address => euint64)) private _allowances;

    event Transfer(address indexed from, address indexed to, uint256 placeholder);
    event Approval(address indexed owner, address indexed spender, uint256 placeholder);

    modifier senderAllowed(euint64 amount) {
        require(FHE.isSenderAllowed(amount), "Sender not allowed to use this encrypted amount");
        _;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    constructor() {
        owner = msg.sender;
        // Không mint toàn bộ cho owner khi deploy nữa
    }

    function totalSupply() external view returns (uint64) {
        return _totalSupply;
    }

    function balanceOf(address account) external view returns (euint64) {
        return _balances[account];
    }

    function allowance(address tokenOwner, address spender) external view returns (euint64) {
        return _allowances[tokenOwner][spender];
    }

    function approve(address spender, euint64 amount) external senderAllowed(amount) returns (bool) {
        address sender = msg.sender;
        _allowances[sender][spender] = amount;
        FHE.allow(amount, sender);
        FHE.allow(amount, spender);
        FHE.allowThis(amount);
        emit Approval(sender, spender, type(uint256).max);
        return true;
    }

    function transfer(address to, euint64 amount) external senderAllowed(amount) returns (bool) {
        _transfer(msg.sender, to, amount);
        return true;
    }

    function transferFrom(address from, address to, euint64 amount) external senderAllowed(amount) returns (bool) {
        euint64 currentAllowance = _allowances[from][msg.sender];
        ebool allowed = FHE.le(amount, currentAllowance);
        euint64 newAllowance = FHE.select(allowed, FHE.sub(currentAllowance, amount), currentAllowance);
        _allowances[from][msg.sender] = newAllowance;
        FHE.allowThis(newAllowance);
        FHE.allow(newAllowance, from);
        FHE.allow(newAllowance, msg.sender);
        _transfer(from, to, amount);
        return true;
    }

    function mint(address to, uint64 amount) external onlyOwner {
        require(_totalSupply + amount <= MAX_SUPPLY, "Exceeds max supply");
        euint64 newBalance = FHE.add(_balances[to], amount);
        _balances[to] = newBalance;
        _totalSupply += amount;
        FHE.allowThis(newBalance);
        FHE.allow(newBalance, to);
        emit Transfer(address(0), to, type(uint256).max);
    }

    function _transfer(address from, address to, euint64 amount) internal {
        require(from != address(0) && to != address(0), "Zero address");
        ebool canTransfer = FHE.le(amount, _balances[from]);
        euint64 txAmount = FHE.select(canTransfer, amount, FHE.asEuint64(0));

        euint64 newFrom = FHE.sub(_balances[from], txAmount);
        _balances[from] = newFrom;
        FHE.allowThis(newFrom);
        FHE.allow(newFrom, from);

        euint64 newTo = FHE.add(_balances[to], txAmount);
        _balances[to] = newTo;
        FHE.allowThis(newTo);
        FHE.allow(newTo, to);

        emit Transfer(from, to, type(uint256).max);
    }

    address public faucet;

    modifier onlyFaucet() {
        require(msg.sender == faucet, "Only faucet can call");
        _;
    }

    function setFaucet(address _faucet) external onlyOwner {
        faucet = _faucet;
    }

    function faucetMint(address to, uint64 amount) external onlyFaucet {
        require(_totalSupply + amount <= MAX_SUPPLY, "Exceeds max supply");

        euint64 eamount = FHE.asEuint64(amount);

        euint64 newBalance = FHE.add(_balances[to], eamount);
        _balances[to] = newBalance;
        _totalSupply += amount;

        FHE.allowThis(newBalance);
        FHE.allow(newBalance, to);

        emit Transfer(address(this), to, type(uint256).max);
    }
} 