// truffle exec scripts\pools.js --network testnet
'use strict';
global.artifacts = artifacts;
global.web3 = web3;
const MasterChefV2 = artifacts.require("MasterChefV2");
const Token = artifacts.require("Token");
let ctx, token, busd, wbnb, dai, usdt, boba;
module.exports = async function (callback) {
    main().then(() => callback()).catch(err => callback(err))
};
async function main() {
    console.log('from', web3.eth.defaultAccount )
    const networkId = await web3.eth.net.getId();
    let factory;
    if( networkId == 97 ){
        const addr = '0x41939fe2547f3140b90e056fb42af81d423435ad';
        global.factory = new web3.eth.Contract(require('./abi/SmartyFactory.json'), addr);
        busd = '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56';
        wbnb = '0xae13d989dac2f0debff460ac112a837c89baa7cd';
        dai = '0x1af3f329e8be154074d8769d1ffa4ee058b1dbc3';
        usdt = '0x55d398326f99059ff775485246999027b3197955';
        boba = '0x53661288eFB53BE5b09bda600B7ed02e2b8317F2';
    }
    ctx = await MasterChefV2.deployed();
    const TOKEN =  await Token.deployed();
    token = TOKEN.address;
    // console.log('ctx', ctx.address);
    await createPair(token, busd, ctx);
    process.exit(0);
}
async function createPair(a, b, mc) {
    let pair = await global.factory.methods.getPair(a, b).call();
    if( pair == '0x0000000000000000000000000000000000000000' ){
        return;
        await global.factory.methods.createPair(a, b).call();
        pair = await global.factory.methods.getPair(a, b).send({from: web3.eth.defaultAccount});
        // const res = await ctx.add(points, lp_addr, fee, true, mustHaveNft);
        console.log('CREATED NEW PAIR', pair);
    }else{
        console.log('PAIR FOUND', pair);
    }


}

async function add_token(symbol, points, addr, fee) {
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

    console.log('ADDING ' + symbol + ' POINTS=' + points + ' FEE=' + fee);
    await add(points, addr, fee);
    console.log('- isTokenOnly:', true);
    console.log('- lpSymbol:', symbol);
}

async function add_lp(pair_name, points, lp_addr, fee, mustHaveNft) {
    const lp_ctx = new web3.eth.Contract(require('./abi/UniswapV2Pair.json'), lp_addr);
    const token0_addr = await lp_ctx.methods.token0().call();
    const token1_addr = await lp_ctx.methods.token1().call();
    const token0_ctx = new web3.eth.Contract(require('./abi/BEP20_ABI.json'), token0_addr);
    const token1_ctx = new web3.eth.Contract(require('./abi/BEP20_ABI.json'), token1_addr);
    const token0_symbol = await token0_ctx.methods.symbol().call();
    const token1_symbol = await token1_ctx.methods.symbol().call();
    const detected_pair_name = token0_symbol + "-" + token1_symbol;
    // console.log(' - ', pair_name, detected_pair_name);

    console.log(' - token0 ', token0_addr, token0_symbol);
    console.log(' - token1 ', token1_addr, token1_symbol);
    if (pair_name.toUpperCase() != detected_pair_name.toUpperCase()) {
        console.log('SYMBOLS DIFFER FROM LP NAME');
        console.log('REQUESTED LP', pair_name);
        console.log('DETECTED LP', detected_pair_name);
        process.exit(1);
    }

    console.log('ADDING ' + pair_name + ' POINTS=' + points + ' FEE=' + fee);
    await add(points, lp_addr, fee, mustHaveNft);
}

async function add(points, lp_addr, fee, mustHaveNft) {
    try {
        const res = await ctx.add(points, lp_addr, fee, true, mustHaveNft);
        const poolLength = (await ctx.poolLength()).toString();
        const pid = parseInt(poolLength) - 1;
        console.log('TX', res.tx);
        console.log(' - lpAddresses:', lp_addr);
        console.log(' - pid:', pid);
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
