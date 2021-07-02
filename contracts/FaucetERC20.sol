// THIS IS A MOCK/FAUCET TOKEN FOR TESTING
// mint IS PUBLIC, you can mint 1 tokens

// SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract FaucetERC20 is ERC20, Ownable {
    uint256 public constant onlyChain = 97;
    constructor(
        string memory name,
        string memory symbol
    ) public ERC20(name, symbol) {
        mint();
    }

    function mint() public {
        uint256 chainId = getChainId();
        // security: prevent other deploy using this contract wrongly.
        require(chainId == onlyChain, "INVALID CHAIN");
        _mint(msg.sender, 1 ether);
    }

    function mint(uint256 value) public onlyOwner {
        _mint(msg.sender, value);
    }

    function getChainId() internal pure returns (uint) {
        uint256 chainId;
        assembly {chainId := chainid()}
        return chainId;
    }
}
