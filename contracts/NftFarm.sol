/*

https://t.me/boobafinancebr

*/

// SPDX-License-Identifier: UNLICENSED
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "./NFT.sol";
import "./libs/IBEP20.sol";
import "./libs/SafeBEP20.sol";

pragma solidity ^0.6.12;

contract NftFarm is Ownable {
    using SafeMath for uint8;
    using SafeMath for uint256;

    using SafeBEP20 for IBEP20;

    NFT public nft;
    IBEP20 public token;

    uint8[] public minted;
    mapping(uint8 => uint256) public hasClaimed;
    mapping(uint8 => address[] ) public ownersOf;
    mapping(uint8 => address ) public lastOwners;

    uint256 public startBlockNumber;
    uint256 public endBlockNumber;
    uint256 public countBurnt;
    uint256 public tokenPerBurn;
    uint256 public currentDistributedSupply; // test ok
    uint256 public totalSupplyDistributed; // test ok
    string public baseURI;
    string public ipfsHash;
    string public rarity;
    mapping(uint8 => string) public nftIdURIs; // test ok
    uint8 public numberOfNftIds;

    // on marketplace bootstrap and not changeable anymore.
    bool public allowMultipleClaims; // test ok

    // price management
    mapping(uint8 => uint256) public price_by_nftId; // test ok
    mapping(uint8 => uint256) public multiplier_by_nftId; //

    // for multipe minting
    uint256 public priceMultiplier; // test ok

    // minting and management

    // can manage price and limits
    mapping(address => bool) public mintingManager;
    mapping(uint8 => uint256) public mint_by_nftId; // test ok

    // set the max minting per nft
    uint256 public maxMintPerNft; // test ok

    address BRUN;

    uint8 public min_index;
    uint8 public max_index;

    event NftMint(address indexed to, uint256 indexed tokenId, uint8 indexed nftId, uint256 amount, uint256 price);
    event NftBurn(address indexed from, uint256 indexed tokenId);

    constructor(
        NFT _nft,
        IBEP20 _token,
        uint256 _totalSupplyDistributed,
        uint256 _tokenPerBurn,
        string memory _baseURI,
        string memory _ipfsHash,
        uint256 _endBlockNumber,
        bool _allowMultipleClaims,
        string memory _rarity,
        uint256 _maxMintPerNft,
        uint256 _priceMultiplier,
        uint8 _min_index,
        uint8 _max_index
    ) public {
        BRUN = address(0x000000000000000000000000000000000000dEaD);
        nft = _nft;
        token = _token;
        totalSupplyDistributed = _totalSupplyDistributed;
        tokenPerBurn = _tokenPerBurn;
        baseURI = _baseURI;
        ipfsHash = _ipfsHash;
        endBlockNumber = _endBlockNumber;
        allowMultipleClaims = _allowMultipleClaims;
        rarity = _rarity;
        maxMintPerNft = _maxMintPerNft;
        mintingManager[msg.sender] = true;
        priceMultiplier = _priceMultiplier;

        min_index = _min_index;
        max_index = _max_index;

        require(tokenPerBurn > 0, "price must be greater than 0");
        require(totalSupplyDistributed >0, "must be greater than 0");
        require(min_index < max_index && max_index > 0, "invalid min max");

    }

    function getOwnersOf( uint8 _nftId ) external view returns (address[] memory){
        return ownersOf[_nftId];
    }
    function getClaimedAmount( uint8 _nftId ) external view returns (uint256){
        return hasClaimed[_nftId];
    }

    function getMinted( address _user ) external view returns
    (uint8[] memory, uint256[] memory, address[] memory, uint256[] memory, uint256[] memory, uint256[] memory){
        uint256 total = minted.length;
        uint256[] memory mintedAmounts = new uint256[](total);
        address[] memory lastOwner = new address[](total);
        uint256[] memory myMints = new uint256[](total);

        for (uint256 index = 0; index < total; ++index) {
            uint8 nftId = minted[index];
            lastOwner[index] = lastOwners[nftId];
            mintedAmounts[index] = hasClaimed[nftId];
            myMints[index] = getMintsOf(_user, nftId);
        }

        uint256[] memory maxMintByNft = new uint256[](max_index);
        uint256[] memory prices = new uint256[](max_index);
        for (uint8 index = 0; index < max_index; ++index) {
            maxMintByNft[index] = getMaxMint(index);
            prices[index] = getPrice(index, index);
        }
        return (minted, mintedAmounts, lastOwner, maxMintByNft, prices, myMints);
    }
    function getMintsOf( address user, uint8 _nftId ) public view returns (uint256) {
        address[] storage _ownersOf = ownersOf[_nftId];
        uint256 total = _ownersOf.length;
        uint256 mints = 0;
        for (uint256 index = 0; index < total; ++index) {
            if( _ownersOf[index] == user ){
                mints = mints.add(1);
            }
        }
        return mints;
    }
    function getMaxMint( uint8 _nftId ) public view returns (uint256) {
        if( mint_by_nftId[_nftId] == 0 ){
            return maxMintPerNft;
        }
        return mint_by_nftId[_nftId];
    }
    function mintNFT(uint8 _nftId) external {

        require( _nftId >= min_index && _nftId <= max_index, "Out of minting interval");

        require(allowMultipleClaims == true || hasClaimed[_nftId] == 0, "Has claimed");

        require(startBlockNumber == 0 || block.number > startBlockNumber, "Too early");
        require(endBlockNumber == 0 || block.number < endBlockNumber, "Too late");

        // here we control collections
        require(totalSupplyDistributed == 0 || currentDistributedSupply < totalSupplyDistributed, "Nothing left");
        currentDistributedSupply = currentDistributedSupply.add(1);

        uint256 price = getPrice(_nftId, hasClaimed[_nftId] );

        if( hasClaimed[_nftId] == 0 ){
            minted.push(_nftId);
            nft.setNftName(_nftId, rarity);
        }

        hasClaimed[_nftId] = hasClaimed[_nftId].add(1);
        lastOwners[_nftId] = msg.sender;

        if( mint_by_nftId[_nftId] == 0 ){
            require( maxMintPerNft==0 || hasClaimed[_nftId] <= maxMintPerNft, "Max minting reached");
        }else{
            require( hasClaimed[_nftId] <= mint_by_nftId[_nftId],
                "Max minting by NFT reached");
        }

        address[] storage _ownersOf = ownersOf[_nftId];
        _ownersOf.push( msg.sender );

        string memory tokenURI = string(abi.encodePacked(ipfsHash, "/", itod(_nftId), ".json"));
        nftIdURIs[_nftId] = tokenURI;
        uint256 tokenId = nft.mint(address(msg.sender), tokenURI, _nftId);

        // send TOKEN to DEAD address, effectively burning it.
        token.safeTransferFrom(address(msg.sender), BRUN, price);
        emit NftMint(msg.sender, tokenId, _nftId, hasClaimed[_nftId], price );
    }

    function adminSetInterval(uint256 _start, uint256 _end) external onlyOwner {
        startBlockNumber = _start;
        endBlockNumber = _end;
    }

    function adminWithdrawToken(uint256 _amount) external onlyOwner {
        // only after the marketplace is closed
        require(endBlockNumber == 0 || block.number > endBlockNumber, "Marketplace is open.");
        // comes from bunny: allow token withdraw? need to discus with team.
        token.safeTransfer(address(msg.sender), _amount);
    }

    function adminChangeToken(address _token) external onlyOwner {
        require(_token != address(0x0), "invalid address");
        token = IBEP20(_token);
    }

    function adminSetTotalSupply(uint256 _totalSupplyDistributed) external onlyOwner {
        require(totalSupplyDistributed >= currentDistributedSupply, "must be more than minted");
        totalSupplyDistributed = _totalSupplyDistributed;
    }

    function adminSetTokenPerBurn(uint256 _tokenPerBurn) external onlyOwner {
        tokenPerBurn = _tokenPerBurn;
    }

    function adminSetBaseURI(string memory _baseURI) external onlyOwner {
        baseURI = _baseURI;
        nft.changeBaseURI(_baseURI);
    }

    function itod(uint256 x) private pure returns (string memory) {
        if (x > 0) {
            string memory str;
            while (x > 0) {
                str = string(abi.encodePacked(uint8(x % 10 + 48), str));
                x /= 10;
            }
            return str;
        }
        return "0";
    }


    function getPrice( uint8 _nftId, uint256 _amount ) public view returns (uint256){

        // default: return the global price
        uint256 price = tokenPerBurn;

        // check if we have a price for this nft
        if( price_by_nftId[_nftId] > 0 ){
            price = price_by_nftId[_nftId];
        }
        if( _amount == 0 ){
            return price;
        }
        if( multiplier_by_nftId[_nftId] > 0 ){
            // price curve by m-dot :)
            for( uint256 i = 0; i < _amount ; ++i ){
                price = price.mul( multiplier_by_nftId[_nftId] ).div(1000000);
            }
            return price;
        }else if( priceMultiplier > 0 ){
            return price.mul(priceMultiplier).div(1000000);
        }
        return price;
    }

    // set the price mul for a specific nft
    function adminSetPriceMultiplierByNftId(uint8 _nftId, uint256 _mul) external mintingManagers {
        multiplier_by_nftId[_nftId] = _mul;
    }

    // set the price for a specific nft
    function adminSetPriceByNftId(uint8 _nftId, uint256 _price) external mintingManagers {
        price_by_nftId[_nftId] = _price;
    }

    // set the max minting for a specific nft
    function adminSetMaxMintByNftId(uint8 _nftId, uint256 _maxAllowed) external mintingManagers {
        mint_by_nftId[_nftId] = _maxAllowed;
    }

    // manage nft emission
    function adminSetMintingManager(address _manager, bool _status) external onlyOwner {
        mintingManager[_manager] = _status;
    }

    // manage the price multiplier by mint
    function adminSetMultiplier(uint256 _priceMultiplier) external onlyOwner {
        priceMultiplier = _priceMultiplier;
    }

    // manage the price multiplier by mint
    function adminSetAllowMultipleClaims(bool _status) external onlyOwner {
        allowMultipleClaims = _status;
    }

    // manage the price multiplier by mint
    function adminSetMaxMintPerNft(uint256 _maxMintPerNft) external onlyOwner {
        maxMintPerNft = _maxMintPerNft;
    }

    // manage the minting interval to avoid front-run exploiters
    function adminSetMintingInterval(uint8 _min_index, uint8 _max_index) external onlyOwner {
        require(_max_index <= totalSupplyDistributed, "max must be max <= total allowed");
        require(_min_index < _max_index, "wrong min");
        min_index = _min_index;
        max_index = _max_index;
    }

    modifier mintingManagers(){
        require(mintingManager[_msgSender()] == true, "Managers: not a manager");
        _;
    }
}
