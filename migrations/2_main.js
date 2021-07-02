// truffle migrate --f 2 --to 2 --network testnet
// truffle run verify Token MasterChefV2 --network testnet
const TOKEN = artifacts.require("Token");
const MASTER = artifacts.require("MasterChefV2");
module.exports = async function(deployer, network, accounts) {

    const devaddr = accounts[0];
    const feeAddress = accounts[1];
    const tokenPerBlock = web3.utils.toWei('1');
    const block_latest = await web3.eth.getBlock("latest");
    let startBlock;

    if( ! devaddr ){
        console.log('!devaddr')
        process.exit(1);
    }
    if( ! feeAddress ){
        console.log('!feeAddress')
        process.exit(1);
    }

    if( network == 'bsc' ){
        startBlock = 8952378;
    }
    if( network == 'testnet' ){
        startBlock = block_latest.number;
    }
    if( network == 'dev' ){
        startBlock = 1;
    }

    if( ! startBlock ){
        console.error(network, '( ! startBlock )');
        process.exit(1);
        return;
    }

    await deployer.deploy(TOKEN,"Live","LIV");
    const TOKEN_DEPLOYED = await TOKEN.deployed();

    const mint = web3.utils.toWei('110');
    await TOKEN_DEPLOYED.mint(mint);

    await deployer.deploy(MASTER, TOKEN_DEPLOYED.address,
        devaddr, feeAddress, tokenPerBlock, startBlock);
    const MASTER_DEPLOYED = await MASTER.deployed();
    // await MASTER_DEPLOYED.nft_init(nft, nftMinter1, nftMinter2);

    await TOKEN_DEPLOYED.setMinterStatus(MASTER.address, true);
    // await TOKEN_DEPLOYED.transferOwnership(MASTER.address);
};
