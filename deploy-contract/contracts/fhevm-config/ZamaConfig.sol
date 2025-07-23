// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import {FHE} from "@fhevm/solidity/lib/FHE.sol";
import {FHEVMConfigStruct} from "@fhevm/solidity/lib/Impl.sol";

/**
 * @title   ZamaConfig.
 * @notice  This library returns the FHEVM config for different networks
 *          with the contract addresses for (1) ACL, (2) FHEVMExecutor, (3) KMSVerifier, (4) InputVerifier
 *          which are deployed & maintained by Zama. It also returns the address of the decryption oracle.
 */
library ZamaConfig {
    function getSepoliaConfig() internal pure returns (FHEVMConfigStruct memory) {
        return
            FHEVMConfigStruct({
                ACLAddress: 0x687820221192C5B662b25367F70076A37bc79b6c,
                FHEVMExecutorAddress: 0x848B0066793BcC60346Da1F49049357399B8D595,
                KMSVerifierAddress: 0x1364cBBf2cDF5032C47d8226a6f6FBD2AFCDacAC,
                InputVerifierAddress: 0xbc91f3daD1A5F19F8390c400196e58073B6a0BC4
            });
    }

    function getSepoliaOracleAddress() internal pure returns (address) {
        return 0xa02Cda4Ca3a71D7C46997716F4283aa851C28812;
    }

    function getEthereumConfig() internal pure returns (FHEVMConfigStruct memory) {
        return
            FHEVMConfigStruct({
                ACLAddress: address(0),
                FHEVMExecutorAddress: address(0),
                KMSVerifierAddress: address(0),
                InputVerifierAddress: address(0)
            });
    }

    function getEthereumOracleAddress() internal pure returns (address) {
        return address(0);
    }
}

contract SepoliaConfig {
    constructor() {
        FHE.setCoprocessor(ZamaConfig.getSepoliaConfig());
        FHE.setDecryptionOracle(ZamaConfig.getSepoliaOracleAddress());
    }
}

contract EthereumConfig {
    constructor() {
        FHE.setCoprocessor(ZamaConfig.getEthereumConfig());
        FHE.setDecryptionOracle(ZamaConfig.getEthereumOracleAddress());
    }
}
