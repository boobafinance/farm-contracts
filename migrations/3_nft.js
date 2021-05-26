const NFT = artifacts.require("NFT");
const TOKEN = artifacts.require("Token");
const NftFarm = artifacts.require("NftFarm");

module.exports = async function (deployer, network, accounts) {

    const TOKEN_DEPLOYED = await TOKEN.deployed();
    let token = '0x0';
    const totalSupplyDistributed = '36';
    const tokenPerBurn = web3.utils.toWei('10');
    const baseURI = 'ipfs://';
    let ipfsHash = '0x0';
    let startBlock = 0; //block_latest.number;
    const allowMultipleClaims = true;
    const rarity = "Common";
    const maxMintPerNft = '66';
    const priceMultiplier = '0';

    let nft;
    if (network == 'testnet') {
        // startBlock = 4360007;
        token = '0x0';
        nft = await NFT.at('0x0');
        ipfsHash = '0x0';
    }
    if (network == 'mainnet') {
        // startBlock = 4360007;
        token = '0x0';
        nft = await NFT.at('0x0');
    }
    if (network == 'dev') {
        startBlock = 0;
        await deployer.deploy(NFT, baseURI);
        nft = await NFT.deployed();
        // nft = await NFT.at('0x0');
    }

    const balanceOfDev = await nft.balanceOf( accounts[0] );
    // console.log('balanceOfDev', balanceOfDev.toString() );

    const endBlockNumber = 0; //startBlock + (28800 * 30);
    const min_interval = 0;
    const max_interval = 5;

    await deployer.deploy(NftFarm,
        nft.address, token,
        totalSupplyDistributed, tokenPerBurn,
        baseURI, ipfsHash, endBlockNumber,
        allowMultipleClaims, rarity, maxMintPerNft, priceMultiplier,
        min_interval, max_interval);

    const farm = await NftFarm.deployed();
    await nft.manageMinters(farm.address, true);

    const getMinted = await farm.getMinted(accounts[0]);
    // console.log('getMinted', getMinted);

};
