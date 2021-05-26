// truffle exec scripts\pools.js --network testnet
const MasterChefV2 = artifacts.require("MasterChefV2");
let ctx;
module.exports = async function (deployer) {
    const mustHaveNft = '0';
    ctx = await MasterChefV2.at('0x0');
    // await add_lp("BUSD-TOKEN", 1000, '0x0', 0, mustHaveNft); // 0
    // await add_lp("WBNB-TOKEN", 1000, '0x0', 0, mustHaveNft); // 1
    // await add_lp("WBNB-BUSD", 1000, '0x0', 4, mustHaveNft); // 4

    await display_pairs();
    process.exit(0);
};

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
