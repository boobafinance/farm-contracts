const web3 = require('web3');
const {accounts, contract} = require('@openzeppelin/test-environment');
const {BN, expectRevert, time, expectEvent, constants} = require('@openzeppelin/test-helpers');
const {expect} = require('chai');
const Token = contract.fromArtifact('Token');
const MasterChefV2 = contract.fromArtifact('MasterChefV2');
let _deployer, _user;

describe('MasterChefV2', function () {
    beforeEach(async function () {
        _deployer = accounts[0];
        _user = accounts[1];
        this.token = await Token.new({from: _deployer});
        const deposit = web3.utils.toWei('667');
        this.token.mint(_user, deposit, {from: _deployer});

        const _devaddr = accounts[0];
        const _feeAddress = accounts[2];
        const _tokenPerBlock = web3.utils.toWei('1');

        const _startBlock = 1;
        this.pool = await MasterChefV2.new(
            this.token.address, _devaddr, _feeAddress, _tokenPerBlock, _startBlock,
            {from: _deployer});
        await this.token.transferOwnership(this.pool.address, {from: _deployer});
    });

    describe('updateEmissionRate test', function(){
        it('anon can not update', async function(){
            const rate = web3.utils.toWei('1');
            await expectRevert(this.pool.updateEmissionRate(rate, {from: _user}),
                "Ownable: caller is not the owner");
        });
        it('revert on new>_old', async function(){
            const rate = web3.utils.toWei('1.5');
            await expectRevert(this.pool.updateEmissionRate(rate, {from: _deployer}),
                "emision must be new<current");
        });
        it('dev can update & update on new<_old', async function(){
            const rate = web3.utils.toWei('0.5');
            await this.pool.updateEmissionRate(rate, {from: _deployer});
            const new_reate = await this.pool.tokenPerBlock({from: _deployer});
            expect(rate).to.be.equal(new_reate.toString());
        });
    });

    describe('TEST POOL MANAGEMENT', function () {
        it('anon should NOT add pool', async function () {
            await expectRevert(this.pool.add(1, this.token.address, 0, 10, true, {from: _user}),
                "Ownable: caller is not the owner");
        });
        it('should fail on invalid fee', async function () {
            await expectRevert(this.pool.add(1, this.token.address, 10001, 10, true, {from: _deployer}),
                "add: invalid deposit fee basis points");
        });
        it('deployer should add pool', async function () {

            const pid = 0;

            // add pool
            let add_allocPoint = '100';
            let add_depositFeeBP = '1000'; // 10%
            let add_depositMax = '10'; // 10 TOKENX MAX
            await this.pool.add(add_allocPoint, this.token.address, add_depositFeeBP, add_depositMax, true, {from: _deployer});
            let poolInfo = await this.pool.poolInfo(0);
            const lpToken = poolInfo.lpToken;
            let allocPoint = poolInfo.allocPoint.toString();
            let accTokenPerShare = poolInfo.accTokenPerShare.toString();
            let depositFeeBP = poolInfo.depositFeeBP.toString();
            let depositMax = poolInfo.depositMax.toString();
            expect(lpToken).to.be.equal(this.token.address);
            expect(add_depositFeeBP).to.be.equal(depositFeeBP);
            expect(depositMax).to.be.equal(add_depositMax);

            // change pool
            add_allocPoint = '10';
            add_depositFeeBP = '0'; // 0%
            add_depositMax = '0'; // 0 TOKENX MAX
            await this.pool.set(pid, add_allocPoint, add_depositFeeBP, add_depositMax, true, {from: _deployer});
            poolInfo = await this.pool.poolInfo(pid);
            allocPoint = poolInfo.allocPoint.toString();
            accTokenPerShare = poolInfo.accTokenPerShare.toString();
            depositFeeBP = poolInfo.depositFeeBP.toString();
            depositMax = poolInfo.depositMax.toString();
            expect(add_depositFeeBP).to.be.equal(depositFeeBP);
            expect(depositMax).to.be.equal(add_depositMax);
        });
    });

    describe('TEST POOL DEPOSIT', function () {

        it('should deposit without max cap', async function () {
            const pid = 0;
            const allocPoint = '0';
            const depositFeeBP = '0'; // 0%
            const depositMax = '0';
            const depositAboveMax = web3.utils.toWei('667');
            await this.pool.add(allocPoint, this.token.address, depositFeeBP, depositMax, true, {from: _deployer});
            await this.token.approve(this.pool.address, depositAboveMax, {from: _user});
            await this.pool.deposit(pid, depositAboveMax, {from: _user});
            poolInfo = await this.pool.userInfo(pid, _user);
            const depositedAmount = poolInfo.amount.toString();
            // any amount
            expect(depositedAmount).to.be.equal(depositAboveMax.toString());

            const balanceOf = await this.token.balanceOf(_user, {from: _user});
            const expected_balance = new BN(web3.utils.toWei('0')).toString();
            expect(balanceOf.toString()).to.be.equal( expected_balance );

        });

        it('should cap deposit above max cap', async function () {
            const pid = 0;
            const allocPoint = '10';
            const depositFeeBP = '0'; // 0%
            const depositMax = web3.utils.toWei('666');
            const depositAboveMax = web3.utils.toWei('667');
            await this.pool.add(allocPoint, this.token.address, depositFeeBP, depositMax, true, {from: _deployer});
            await this.token.approve(this.pool.address, depositMax, {from: _user});
            await this.pool.deposit(pid, depositAboveMax, {from: _user});
            poolInfo = await this.pool.userInfo(pid, _user);
            const depositedAmount = poolInfo.amount.toString();
            // deposited musted limited to max cap
            expect(depositedAmount).to.be.equal(depositMax);

            const balanceOf = await this.token.balanceOf(_user, {from: _user});
            const expected_balance = new BN(web3.utils.toWei('1')).toString();
            expect(balanceOf.toString()).to.be.equal( expected_balance );

        });
        it('should allow deposit bellow max cap', async function () {
            const pid = 0;
            const allocPoint = '10';
            const depositFeeBP = '0'; // 0%
            const depositMax = web3.utils.toWei('666');
            const deposited = web3.utils.toWei('66');
            await this.pool.add(allocPoint, this.token.address, depositFeeBP, depositMax, true, {from: _deployer});
            await this.token.approve(this.pool.address, depositMax, {from: _user});
            await this.pool.deposit(pid, deposited, {from: _user});
            poolInfo = await this.pool.userInfo(pid, _user);
            const depositedAmount = poolInfo.amount.toString();
            // deposited musted limited to max cap
            expect(depositedAmount).to.be.equal(deposited);

            const balanceOf = await this.token.balanceOf(_user, {from: _user});
            const expected_balance = new BN(web3.utils.toWei('601')).toString();
            expect(balanceOf.toString()).to.be.equal( expected_balance );

        });

        it('should allow 2 deposit below max cap', async function () {
            const pid = 0;
            const allocPoint = '10';
            const depositFeeBP = '0'; // 0%
            const depositMax = web3.utils.toWei('666');
            const deposited = web3.utils.toWei('333');
            await this.pool.add(allocPoint, this.token.address, depositFeeBP, depositMax, true, {from: _deployer});
            await this.token.approve(this.pool.address, depositMax, {from: _user});

            await this.pool.deposit(pid, deposited, {from: _user});
            poolInfo = await this.pool.userInfo(pid, _user);
            const depositedAmount1 = poolInfo.amount.toString();
            expect(depositedAmount1).to.be.equal(deposited); //

            await this.pool.deposit(pid, deposited, {from: _user});
            poolInfo = await this.pool.userInfo(pid, _user);
            const depositedAmount2 = poolInfo.amount.toString();
            expect(depositedAmount2).to.be.equal(depositMax);

            // we got reward 1 token from 1 block reward
            const balanceOf = await this.token.balanceOf(_user, {from: _user});
            const expected_balance = new BN('1999999999999000000').toString();
            expect(balanceOf.toString()).to.be.equal( expected_balance );

        });


        it('should allow 2 deposit above max cap and trucate', async function () {
            const pid = 0;
            const allocPoint = '0';
            const depositFeeBP = '0'; // 0%
            const depositMax = web3.utils.toWei('666');
            const deposited1 = web3.utils.toWei('333');
            const deposited2 = web3.utils.toWei('334');
            await this.pool.add(allocPoint, this.token.address, depositFeeBP, depositMax, true, {from: _deployer});
            await this.token.approve(this.pool.address, depositMax, {from: _user});

            await this.pool.deposit(pid, deposited1, {from: _user});
            poolInfo = await this.pool.userInfo(pid, _user);
            const depositedAmount1 = poolInfo.amount.toString();
            expect(depositedAmount1).to.be.equal(deposited1); //

            await this.pool.deposit(pid, deposited2, {from: _user});
            poolInfo = await this.pool.userInfo(pid, _user);
            const depositedAmount2 = poolInfo.amount.toString();
            expect(depositedAmount2).to.be.equal(depositMax);

            await this.pool.deposit(pid, deposited2, {from: _user});
            poolInfo = await this.pool.userInfo(pid, _user);
            const depositedAmount3 = poolInfo.amount.toString();
            expect(depositedAmount3).to.be.equal(depositMax);

            // we got reward 1 token from 1 block reward
            const balanceOf = await this.token.balanceOf(_user, {from: _user});
            const expected_balance = new BN(web3.utils.toWei('1')).toString();
            expect(balanceOf.toString()).to.be.equal( expected_balance );

        });

    });

});
