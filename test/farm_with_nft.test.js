const web3 = require('web3');
const {accounts, contract} = require('@openzeppelin/test-environment');
const {BN, expectRevert, time, expectEvent, constants} = require('@openzeppelin/test-helpers');
const {expect} = require('chai');
const Token = contract.fromArtifact('Token');
const MockBEP20 = contract.fromArtifact('MockBEP20');
const NFT = contract.fromArtifact('NFT');
const NftFarm = contract.fromArtifact('NftFarm');
const MasterChefV2 = contract.fromArtifact('MasterChefV2');
let _deployer, _user;
const ipfsHash1 = 'QmWB5xPBcFRn8qR4uu1VHt1k9vUrxvbezYv3jDC7WD29ie';
const ipfsHash2 = 'QmX9UuF41nfhnESX3DnVHhC4XwuYAcLEReGyN4CtE8P7Bg';
const baseURI = 'ipfs://';
const totalSupplyDistributed = '36';
const tokenPerBurn = web3.utils.toWei('1');
const endBlockNumber = 0;
const min_interval = 0;
const max_interval = 5;
const allowMultipleClaims = true;
const rarity = "Common";
const maxMintPerNft = '10';
const priceMultiplier = '0';

describe('MasterChefV2', function () {
    beforeEach(async function () {
        this.timeout(10000);
        _deployer = accounts[0];
        _user = accounts[1];
        const deposit = web3.utils.toWei('100');
        try{
            this.nft = await NFT.new(baseURI, {from: _deployer});
        }catch(e){
            console.error(e);
        }

        this.token = await Token.new({from: _deployer});
        this.LP = await MockBEP20.new("LP Token","LP", deposit, {from: _user});

        await this.token.setMinterStatus(_deployer, true, {from: _deployer});
        await this.token.mint(_user, deposit, {from: _deployer});
        //

        this.NftFarm1 = await NftFarm.new(
            this.nft.address, this.token.address,
            totalSupplyDistributed, tokenPerBurn,
            baseURI, ipfsHash1, endBlockNumber,
            allowMultipleClaims, rarity, maxMintPerNft, priceMultiplier,
            min_interval, max_interval, {from: _deployer});

        this.NftFarm2 = await NftFarm.new(
            this.nft.address, this.token.address,
            totalSupplyDistributed, tokenPerBurn,
            baseURI, ipfsHash2, endBlockNumber,
            allowMultipleClaims, rarity, maxMintPerNft, priceMultiplier,
            min_interval, max_interval, {from: _deployer});


        await this.NftFarm1.adminSetTotalSupply(9999, {from: _deployer});
        await this.NftFarm2.adminSetTotalSupply(9999, {from: _deployer});

        await this.nft.manageMinters(this.NftFarm1.address, true, {from: _deployer});
        await this.nft.manageMinters(this.NftFarm2.address, true, {from: _deployer});

        const _devaddr = accounts[0];
        const _feeAddress = accounts[2];
        const _tokenPerBlock = web3.utils.toWei('1');

        const _startBlock = 1;
        this.pool = await MasterChefV2.new(
            this.token.address, _devaddr, _feeAddress, _tokenPerBlock, _startBlock,
            {from: _deployer});

        await this.token.transferOwnership(this.pool.address, {from: _deployer});

        this.pool.nft_init(this.nft.address, this.NftFarm1.address, this.NftFarm2.address, {from: _deployer});

    });

    describe('TEST SECURITY', function () {

        it('setMinterStatus', async function () {
            await expectRevert(this.pool.setMinterStatus(_deployer, true, {from: _user}), 'caller is not the owner');
            await this.pool.setMinterStatus(_deployer, true, {from: _deployer});
        });

    });

    describe('TEST POOL', function () {
        const deposit = web3.utils.toWei('100');

        it('farm without nft', async function () {
            this.timeout(30000);
            // add(uint256 _allocPoint, IBEP20 _lpToken, uint16 _depositFeeBP, bool _withUpdate, uint8 _mustHaveNft)
            const pid = '0';
            const allocPoint = '1';
            const lpToken = this.LP.address;
            const depositFeeBP = '0';
            const withUpdate = true;
            const mustHaveNft = '0';
            await this.pool.add(allocPoint, lpToken, depositFeeBP, withUpdate, mustHaveNft, {from: _deployer});
            await this.LP.approve(this.pool.address, deposit, {from: _user});
            await this.pool.deposit(pid, deposit, {from: _user});
            const poolInfo = await this.pool.userInfo(pid, _user);
            const depositedAmount = poolInfo.amount.toString();
            // any amount
            expect(depositedAmount).to.be.equal(deposit.toString());

            time.advanceBlock();

            const pendingReward = await this.pool.pendingReward( pid, _user, {from: _user} );
            const reward = pendingReward.toString();
            expect(pendingReward).to.be.bignumber.equal( web3.utils.toWei('1') );

        });


        it('FARM / WITH NFT / MUST HAVE BASIC', async function () {
            this.timeout(30000);
            // add(uint256 _allocPoint, IBEP20 _lpToken, uint16 _depositFeeBP, bool _withUpdate, uint8 _mustHaveNft)
            const pid = '0';
            const allocPoint = '1';
            const lpToken = this.LP.address;
            const depositFeeBP = '0';
            const withUpdate = true;
            const mustHaveNft = '1';

            await this.pool.add(allocPoint, lpToken, depositFeeBP, withUpdate, mustHaveNft, {from: _deployer});
            await this.LP.approve(this.pool.address, deposit, {from: _user});
            await this.token.approve(this.NftFarm1.address, deposit, {from: _user});
            await this.token.approve(this.NftFarm2.address, deposit, {from: _user});

            await expectRevert(this.pool.deposit(pid, deposit, {from: _user}), 'Must have NFT to deposit');

            await this.NftFarm1.mintNFT(2, {from: _user});
            await this.NftFarm2.mintNFT(2, {from: _user});

            await this.pool.deposit(pid, deposit, {from: _user});
            const poolInfo = await this.pool.userInfo(pid, _user);
            const depositedAmount = poolInfo.amount.toString();
            // any amount
            expect(depositedAmount).to.be.equal(deposit.toString());

            time.advanceBlock();

            const pendingReward = await this.pool.pendingReward( pid, _user, {from: _user} );
            const reward = pendingReward.toString();
            expect(pendingReward).to.be.bignumber.equal( web3.utils.toWei('1') );

        });


        it('FARM / WITH NFT / MUST HAVE RARE', async function () {
            this.timeout(30000);
            // add(uint256 _allocPoint, IBEP20 _lpToken, uint16 _depositFeeBP, bool _withUpdate, uint8 _mustHaveNft)
            const pid = '0';
            const allocPoint = '1';
            const lpToken = this.LP.address;
            const depositFeeBP = '0';
            const withUpdate = true;
            const mustHaveNft = '2';
            const nftId = '3';

            await this.pool.add(allocPoint, lpToken, depositFeeBP, withUpdate, mustHaveNft, {from: _deployer});
            await this.LP.approve(this.pool.address, deposit, {from: _user});
            await this.token.approve(this.NftFarm1.address, deposit, {from: _user});
            await this.token.approve(this.NftFarm2.address, deposit, {from: _user});

            await expectRevert(this.pool.deposit(pid, deposit, {from: _user}), 'Must have NFT to deposit');

            await this.NftFarm1.mintNFT(nftId, {from: _user});
            await this.NftFarm2.mintNFT(nftId, {from: _user});

            await this.pool.deposit(pid, deposit, {from: _user});
            const poolInfo = await this.pool.userInfo(pid, _user);
            const depositedAmount = poolInfo.amount.toString();
            // any amount
            expect(depositedAmount).to.be.equal(deposit.toString());

            time.advanceBlock();

            const pendingReward = await this.pool.pendingReward( pid, _user, {from: _user} );
            const reward = pendingReward.toString();
            expect(pendingReward).to.be.bignumber.equal( web3.utils.toWei('1') );

        });


        it('FARM / WITH NFT / MUST HAVE EPIC', async function () {
            this.timeout(30000);
            // add(uint256 _allocPoint, IBEP20 _lpToken, uint16 _depositFeeBP, bool _withUpdate, uint8 _mustHaveNft)
            const pid = '0';
            const allocPoint = '1';
            const lpToken = this.LP.address;
            const depositFeeBP = '0';
            const withUpdate = true;
            const mustHaveNft = '3';
            const nftId = '1';

            await this.pool.add(allocPoint, lpToken, depositFeeBP, withUpdate, mustHaveNft, {from: _deployer});
            await this.LP.approve(this.pool.address, deposit, {from: _user});
            await this.token.approve(this.NftFarm1.address, deposit, {from: _user});
            await this.token.approve(this.NftFarm2.address, deposit, {from: _user});

            await expectRevert(this.pool.deposit(pid, deposit, {from: _user}), 'Must have NFT to deposit');

            await this.NftFarm1.mintNFT(nftId, {from: _user});
            await this.NftFarm2.mintNFT(nftId, {from: _user});

            await this.pool.deposit(pid, deposit, {from: _user});
            const poolInfo = await this.pool.userInfo(pid, _user);
            const depositedAmount = poolInfo.amount.toString();
            // any amount
            expect(depositedAmount).to.be.equal(deposit.toString());

            time.advanceBlock();

            const pendingReward = await this.pool.pendingReward( pid, _user, {from: _user} );
            const reward = pendingReward.toString();
            expect(pendingReward).to.be.bignumber.equal( web3.utils.toWei('1') );

        });


        it('FARM / WITH NFT / MUST HAVE LEGENDARY', async function () {
            this.timeout(30000);
            // add(uint256 _allocPoint, IBEP20 _lpToken, uint16 _depositFeeBP, bool _withUpdate, uint8 _mustHaveNft)
            const pid = '0';
            const allocPoint = '1';
            const lpToken = this.LP.address;
            const depositFeeBP = '0';
            const withUpdate = true;
            const mustHaveNft = '4';
            const nftId = '3';

            await this.pool.add(allocPoint, lpToken, depositFeeBP, withUpdate, mustHaveNft, {from: _deployer});
            await this.LP.approve(this.pool.address, deposit, {from: _user});
            await this.token.approve(this.NftFarm1.address, deposit, {from: _user});
            await this.token.approve(this.NftFarm2.address, deposit, {from: _user});

            await expectRevert(this.pool.deposit(pid, deposit, {from: _user}), 'Must have NFT to deposit');

            await this.NftFarm1.mintNFT(nftId, {from: _user});
            await this.NftFarm2.mintNFT(nftId, {from: _user});

            await this.pool.deposit(pid, deposit, {from: _user});
            const poolInfo = await this.pool.userInfo(pid, _user);
            const depositedAmount = poolInfo.amount.toString();
            // any amount
            expect(depositedAmount).to.be.equal(deposit.toString());

            time.advanceBlock();

            const pendingReward = await this.pool.pendingReward( pid, _user, {from: _user} );
            const reward = pendingReward.toString();
            expect(pendingReward).to.be.bignumber.equal( web3.utils.toWei('1') );

        });
    });

});
