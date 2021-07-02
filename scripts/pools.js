// truffle exec scripts\pools.js --network testnet
const MasterChefV2 = artifacts.require("MasterChefV2");
const UniswapV2Pair_ABI = require('./abi/UniswapV2Pair.json');
let ctx;
module.exports = async function (deployer) {
    try {
        ctx = await MasterChefV2.at('0x53661288eFB53BE5b09bda600B7ed02e2b8317F2'); // testnet
        await setup();
        await display_pairs();
    } catch (e) {
        console.error(e);
    }
    process.exit(0);
};

async function setup() {// 0x45EeDF18492b6eEe6Ba99d578D0De16ca3bD8967
    // await add_token('LIV', 1000, '0x45EeDF18492b6eEe6Ba99d578D0De16ca3bD8967', 0, 0, 0); // 0
    // await add_lp('LIV-BUSD', 10000, '0xB5c6a27e0a186b76237d1de5c67aA29237D2Da87', 0, 0); // 1
    // await add_lp('LIV-WBNB', 2000, '0x09447cF10418109dA1456480362FC866f1bCAC64', 0, 0); // 2
    // await add_lp('BOBA-LIV', 10000, '0x1524486661c80D38A52a878001b0793A005E9eb5', 0, 0); // 3
    // await add_lp('WBNB-BUSD', 500, '0xAe69ca0f5eF8Ab585aAA69778795A1673Bed3a35', 400, 0); // 4
    // await add_lp('WBNB-BOBA', 2500, '0x70e95a08b2011fdec0b766e9d8c60928c488e5bc', 400, 0); // 4
    // await add_lp('BUSD-BOBA', 3000, '0x3157855275d21ecd7694e416c5346b9f3c447873', 0, 0); // 4
}
async function add_token(symbol, points, addr, _depositFeeBP, _mustHaveNft) {
    const token_ctx = new web3.eth.Contract(require('./abi/BEP20_ABI.json'), addr);
    const token_symbol = await token_ctx.methods.symbol().call();

    console.log(' - lpSymbol ', symbol);
    console.log(' - token1 ', addr);
    if (symbol.toUpperCase() != token_symbol.toUpperCase()) {
        console.log('SYMBOLS DIFFER FROM NAME');
        console.log('REQUESTED', symbol);
        console.log('DETECTED', token_symbol);
        process.exit(1);
    }

    console.log('ADDING ' + symbol + ' POINTS=' + points + ' FEE=' + _depositFeeBP);
    await add(points, addr, _depositFeeBP, _mustHaveNft);
    console.log('- isTokenOnly:', true);
    console.log('- lpSymbol:', symbol);
}

async function add_lp(pair_name, points, lp_addr, _depositFeeBP, _mustHaveNft) {
    const lp_ctx = new web3.eth.Contract(UniswapV2Pair_ABI, lp_addr);
    const token0_addr = await lp_ctx.methods.token0().call();
    const token1_addr = await lp_ctx.methods.token1().call();
    const token0_ctx = new web3.eth.Contract(require('./abi/BEP20_ABI.json'), token0_addr);
    const token1_ctx = new web3.eth.Contract(require('./abi/BEP20_ABI.json'), token1_addr);
    const token0_symbol = await token0_ctx.methods.symbol().call();
    const token1_symbol = await token1_ctx.methods.symbol().call();
    const detected_pair_nameA = token0_symbol + "-" + token1_symbol;
    const detected_pair_nameB = token1_symbol + "-" + token0_symbol;
    // console.log(' - ', pair_name, detected_pair_name);

    console.log(' - token0 ', token0_addr, token0_symbol);
    console.log(' - token1 ', token1_addr, token1_symbol);
    if (pair_name.toUpperCase() != detected_pair_nameA.toUpperCase() &&
        pair_name.toUpperCase() != detected_pair_nameB.toUpperCase()) {
        console.log('SYMBOLS DIFFER FROM LP NAME');
        console.log('REQUESTED LP', pair_name);
        console.log('DETECTED LP', detected_pair_nameA + ' / ' + detected_pair_nameB);
        process.exit(1);
    }

    console.log('ADDING ' + pair_name + ' POINTS=' + points + ' FEE=' + _depositFeeBP + ' NFT=' + _mustHaveNft);
    await add(points, lp_addr, _depositFeeBP, _mustHaveNft);
}
async function set_lp(pid, points, addr, fee) {
    try {
        const res = await ctx.set(pid, points, fee, true);
        const poolLength = (await ctx.poolLength()).toString();
        const pid = parseInt(poolLength) - 1;
        console.log('TX', res.tx);
        console.log(' - lpAddresses:', lp_addr);
        console.log(' - pid:', pid);
    } catch (e) {
        console.log(e.toString());
    }
}





async function add(points, lp_addr, _depositFeeBP, _mustHaveNft) {
    try {
        // add(uint256 _allocPoint, IBEP20 _lpToken, uint16 _depositFeeBP, bool _withUpdate, uint256 _mustHaveNft)
        const res = await ctx.add(points, lp_addr, _depositFeeBP, true, _mustHaveNft);
        const poolLength = (await ctx.poolLength()).toString();
        const pid = parseInt(poolLength) - 1;
        console.log(res.tx+' pid=' + pid + ' - lpAddresses=' + lp_addr+' FEE='+_depositFeeBP);
    } catch (e) {
        console.log(e.toString());
    }
}

async function display_pairs() {
    try {
        const poolLength = (await ctx.poolLength()).toString();
        const t = parseInt(poolLength);
        console.log('poolLength', poolLength);
        for (let i = 0; i < t; i++) {
            const pool = await ctx.poolInfo(i);
            const lpToken = pool.lpToken;
            const allocPoint = pool.allocPoint.toString();
            const depositFeeBP = pool.depositFeeBP.toString();
            const str = 'pid=' + i + ' POINTS=' + allocPoint + ' FEE=' + depositFeeBP + ' ' + lpToken;
            console.log(str);
        }
    } catch (e) {
        console.log(e.toString());
    }
}

async function lp_info(addr) {
    const lp_ctx = new web3.eth.Contract(require('./abi/UniswapV2Pair.json'), addr);
    const token0_addr = await lp_ctx.methods.token0().call();
    const token1_addr = await lp_ctx.methods.token1().call();
    const token0_ctx = new web3.eth.Contract(require('./abi/BEP20_ABI.json'), token0_addr);
    const token1_ctx = new web3.eth.Contract(require('./abi/BEP20_ABI.json'), token1_addr);
    const token0_symbol = await token0_ctx.methods.symbol().call();
    const token1_symbol = await token1_ctx.methods.symbol().call();
    const detected_pair_name = token0_symbol + "-" + token1_symbol;
    console.log(' - ', detected_pair_name);
    console.log(' - token0 ', token0_addr, token0_symbol);
    console.log(' - token1 ', token1_addr, token1_symbol);

}
