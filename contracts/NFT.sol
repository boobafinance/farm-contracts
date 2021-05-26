/*

https://t.me/boobafinancebr

*/

// SPDX-License-Identifier: UNLICENSED

import "@openzeppelin/contracts/math/SafeMath.sol";
import "./libs/IBEP20.sol";
import "./libs/SafeBEP20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

pragma solidity ^0.6.12;

contract NFT is ERC721, Ownable {
    mapping(address => bool) public minters;
    using Counters for Counters.Counter;
    mapping(uint8 => uint256) public nftCount;
    mapping(uint8 => uint256) public nftBurnCount;
    Counters.Counter private _tokenIds;
    mapping(uint256 => uint8) private nftIds;
    mapping(uint8 => string) private nftNames;
    constructor(string memory _baseURI) public ERC721("BobaNFT", "BNFT") {
        minters[ msg.sender ] = true;
        _setBaseURI(_baseURI);
    }
    function getNftId(uint256 _tokenId) external view returns (uint8) {
        return nftIds[_tokenId];
    }
    function getNftName(uint8 _nftId) external view returns (string memory){
        return nftNames[_nftId];
    }
    function getNftNameOfTokenId(uint256 _tokenId) external view returns (string memory){
        uint8 nftId = nftIds[_tokenId];
        return nftNames[nftId];
    }
    function mint(address _to, string calldata _tokenURI, uint8 _nftId) external onlyMinters returns (uint256) {
        uint256 newId = _tokenIds.current();
        _tokenIds.increment();
        nftIds[newId] = _nftId;
        nftCount[_nftId] = nftCount[_nftId].add(1);
        _mint(_to, newId);
        _setTokenURI(newId, _tokenURI); // _tokenURIs[tokenId] = _tokenURI;
        return newId;
    }
    function burn(uint256 _tokenId) external onlyMinters {
        uint8 nftIdBurnt = nftIds[_tokenId];
        nftCount[nftIdBurnt] = nftCount[nftIdBurnt].sub(1);
        nftBurnCount[nftIdBurnt] = nftBurnCount[nftIdBurnt].add(1);
        _burn(_tokenId);
    }
    function setNftName(uint8 _nftId, string calldata _name) external onlyMinters {
        nftNames[_nftId] = _name;
    }
    function changeBaseURI(string memory _baseURI) external onlyMinters {
        _setBaseURI(_baseURI);
    }
    function manageMinters( address _minter, bool _status) external onlyOwner {
        require( _minter != address(0x0) , "0x0 minter");
        minters[ _minter ] = _status;
    }

    // allow multiple contracts to mint nft's
    modifier onlyMinters() {
        require(minters[_msgSender()], "caller is not the minter");
        _;
    }

}
