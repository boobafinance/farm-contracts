const web3 = require('web3');
const ethers = require('ethers');
function encodeParameters(types, values) {
    const abi = new ethers.utils.AbiCoder();
    return abi.encode(types, values);
}

function get_interval(hours) {
    return parseInt((new Date().getTime() + (60 * 60 * hours * 1000)) / 1000);
}
function updateEmissionRate(eta, TokensPerBlock ) {
    const value = 0;
    const signature = 'updateEmissionRate(uint256)';
    const data = encodeParameters(['uint256'], [TokensPerBlock]);
    console.log('value', value);
    console.log('signature', signature);
    console.log('data', data);
    console.log('eta', eta);
}

let TokensPerBlock = web3.utils.toWei('0');
const master = '0x19823254C1E577cc466EAd010A03e4496A2C77d4';
const timelock = '0x839850f001FFA74B21BDC36B5f79521eA561574A';
const eta = get_interval(25);
updateEmissionRate(eta, TokensPerBlock);
process.exit(0);

