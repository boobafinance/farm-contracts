const TIMELOCK = artifacts.require("Timelock");
const ethers = require('ethers');

function encodeParameters(types, values) {
    const abi = new ethers.utils.AbiCoder();
    return abi.encode(types, values);
}

function get_interval(hours) {
    return parseInt((new Date().getTime() + (60 * 60 * hours * 1000)) / 1000);
}
async function updateEmissionRate(cli, target, eta, run, TokensPerBlock ) {
    let tx;
    const value = 0; // timelock
    const signature = 'updateEmissionRate(uint256)';
    const data = encodeParameters(['uint256'], [TokensPerBlock]);
    console.log('target', target);
    console.log('value', value);
    console.log('signature', signature);
    console.log('data', data);
    console.log('eta', eta); //
    if( run )
        tx = await cli.executeTransaction(target, value, signature, data, eta);
    else
        tx = await cli.queueTransaction(target, value, signature, data, eta);
    console.log('tx', tx.tx);
}
module.exports = async function (deployer) {
    let TokensPerBlock = web3.utils.toWei('0');
    const master = '0x19823254C1E577cc466EAd010A03e4496A2C77d4';
    const timelock = '0x839850f001FFA74B21BDC36B5f79521eA561574A';
    return console.log( get_interval(25) );
    try {
        const cli = await TIMELOCK.at(timelock);
        const run = false;
        const _pid = 0, _point = 0, _fee = 0;
        await updateEmissionRate(cli, master, 1616098500, run, _pid, _point, _fee);
    } catch (e) {
        console.log("[ERROR]", e.toString());
    }
    process.exit(0);
};
