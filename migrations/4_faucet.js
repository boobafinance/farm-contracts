// truffle migrate --f 4 --to 4 --network testnet
// truffle run verify FaucetERC20 --network testnet
const FaucetERC20 = artifacts.require('FaucetERC20');
let deployer, network, accounts;
module.exports = async function (_deployer, _network, _accounts) {
    deployer = _deployer;
    network = _network;
    accounts = _accounts;
    if( _network != 'testnet' ){
        process.exit(1);

    }

    // await setup_faucet('Wrapped BNB', 'WBNB'); // 0xae13d989dac2f0debff460ac112a837c89baa7cd
    // await setup_faucet('Dai Stablecoin', 'DAI'); // 0xAd867AA2B2BB7503D82F07E5526f2BeaAb12fe7c
    // await setup_faucet('Wrapped Ethereum', 'WETH'); // 0x41bF3a64ae05E08153cb9d1aef565D258875Fe35
    // await setup_faucet('ChainLink', 'LINK'); // 0x681b75fb4199Ed6A5B90CFd3befDC8B904799efD
    // await setup_faucet('Uniswap', 'UNI'); // 0x1F7C4b2B3E550e92ccBCE2384700173eA37D5d95
    // await setup_faucet('USD Coin', 'USDC'); // 0x3D0fCF6C4678354C77d4Be59855F277c5674aA3C
    // await setup_faucet('Tether USD', 'USDT'); // 0x394cafe9e11f289757cf1b60AE10AEcC19F775e7
    // await setup_faucet('Wrapped BTC', 'WBTC'); // 0xf38D81eE752e5971f6f269af3df4E679e020668e
    // await setup_faucet('Binance USD', 'BUSD'); // 0xD95169a46d895416CDf778a128E106282f036cC8
    // await setup_faucet('BoobaM', 'BOOBAM'); // 0x3B3bdAF1Df8343C3200ACee7D776317530506B88
};

async function setup_faucet(name, symbol) {
    try {
        await deployer.deploy(FaucetERC20, name, symbol);
        const faucet = await FaucetERC20.deployed();
        console.log(network, name, symbol, faucet.address);
    } catch (e) {
        console.error(network, name, symbol);
        console.error(e.toString());
        process.exit(1);
    }
}
