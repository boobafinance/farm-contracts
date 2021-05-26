// truffle migrate --f 1 --to 1 --network testnet
const Migrations = artifacts.require("Migrations");

module.exports = function (deployer) {
  deployer.deploy(Migrations);
};
