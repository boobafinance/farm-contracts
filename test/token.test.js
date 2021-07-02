const web3 = require('web3');
const {accounts, contract} = require('@openzeppelin/test-environment');
const {BN, expectRevert, time, expectEvent, constants} = require('@openzeppelin/test-helpers');
const {expect} = require('chai');
const Token = contract.fromArtifact('AfterToken');
let _deployer, _user;
const mintAmount = '1';
const _name = 'Token';//
const _symbol = 'TOKEN';

describe('Token', function () {
    beforeEach(async function () {
        _deployer = accounts[0];
        _user = accounts[1];
        this.Token = await Token.new({from: _deployer, gas: 8000000});
    });

    describe('TEST BEP20 DEFAULTS', function () {
        it('testSymbolAndName', async function () {
            const name = await this.Token.name();
            const symbol = await this.Token.symbol();
            expect(_name).to.be.equal(name);
            expect(_symbol).to.be.equal(symbol);
        });
    });

    describe('TEST INITAL MINTED SUPPLY', function () {
        it('mintAmount=totalSupply', async function () {
            const totalSupply = await this.Token.totalSupply();
            expect(totalSupply).to.be.bignumber.equal(new BN(0));
        });
    });

    describe('TEST MINTING', function () {

        it('do not allow any user to mint', async function () {
            await expectRevert(this.Token.mint(_user, mintAmount, {from: _user}), 'Ownable: caller is not the owner');
        });

        it('deployer can mint', async function () {
            const mintMore = web3.utils.toWei(mintAmount);
            await this.Token.mint(_deployer, mintMore, {from: _deployer});

            const totalSupply = await this.Token.totalSupply();
            const newSupply = web3.utils.toWei(new BN(mintAmount));
            expect(newSupply).to.be.bignumber.equal(totalSupply);

            const minted = await this.Token.balanceOf(_deployer);
            expect(minted).to.be.bignumber.equal(mintMore);

        });

    });

    describe('TEST TRANSFER', function () {
        const amount = new BN(100);
        it('no balance to transfer', async function () {
            await expectRevert(this.Token.transfer(_user, amount, {from: _deployer}), 'BEP20: transfer amount exceeds balance');
        });

        it('allow transfer', async function () {
            await this.Token.mint(_user, amount, {from: _deployer});
            await this.Token.transfer(_deployer, amount, {from: _user});
            const balanceOf = await this.Token.balanceOf(_deployer);
            expect(amount).to.be.bignumber.equal(balanceOf);
        });
    });

});
