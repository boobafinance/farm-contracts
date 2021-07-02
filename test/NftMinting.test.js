const web3 = require('web3');
const {accounts, contract} = require('@openzeppelin/test-environment');
const {BN, expectRevert, time, expectEvent, constants} = require('@openzeppelin/test-helpers');
const {expect} = require('chai');
const Token = contract.fromArtifact('Token');
const NFT = contract.fromArtifact('NFT');
const NftFarm = contract.fromArtifact('NftFarm');
let _deployer, _user;
const mintAmount = '1';
const _name = 'TOKEN';//
const _symbol = 'TOKEN';
const baseURI = 'ipfs://';
const ipfsHash = '0x0';

const supply = web3.utils.toWei('6666');
const totalSupplyDistributed = '6666';
const price = '66';
const tokenPerBurn = web3.utils.toWei(price);
const startBlock = 0;
const endBlockNumber = 0;
const allowMultipleClaims = true;
const rarity = "Common";

const maxMintPerNft = '666';
const priceMultiplier = '0';

const min_interval = 0;
const max_interval = 3;

describe('NftMinting', function () {
    beforeEach(async function () {
        _deployer = accounts[0];
        _user = accounts[1];

        this.Token = await Token.new({from: _deployer});
        await this.Token.mint(_deployer, supply, {from: _deployer});
        this.NFT = await NFT.new(baseURI, {from: _deployer});


        this.NftFarm = await NftFarm.new(
            this.NFT.address,
            this.Token.address,
            totalSupplyDistributed,
            tokenPerBurn,
            baseURI,
            ipfsHash,
            endBlockNumber,
            allowMultipleClaims,
            rarity,
            maxMintPerNft,
            priceMultiplier,
            min_interval, max_interval,
            {from: _deployer});

        await this.NFT.manageMinters(this.NftFarm.address, true, {from: _deployer});

    });

        describe('mintNFT', function () {

            it('MUST HAVE TOKEN', async function () {
                const nftId = 0;
                await expectRevert(this.NftFarm.mintNFT(nftId, {from: _user}), 'transfer amount exceeds balance');
            });
            it('MUST MINT WITH BALANCE', async function () {
                const balance = await this.Token.balanceOf(_deployer);
                expect(balance).to.be.bignumber.equal(supply);
                await this.Token.approve(this.NftFarm.address, supply, {from: _deployer});

                const nftId = 0;
                await this.NftFarm.mintNFT(0, {from: _deployer});
                const ownersOf = await this.NftFarm.getOwnersOf(nftId, {from: _deployer});
                expect(ownersOf[0]).to.be.equal(_deployer);

                const getClaimedAmount = await this.NftFarm.getClaimedAmount(nftId, {from: _deployer});
                expect(getClaimedAmount.toString()).to.be.equal('1');

                const getMinted = await this.NftFarm.getMinted(_deployer, {from: _deployer});

                // nftId 0 at index 0
                expect(getMinted[0][0].toString()).to.be.equal('0');

                // nftId 0 amount minted at index 1
                expect(getMinted[1][0].toString()).to.be.equal('1');

                // nftId 0 last owner at index 2
                expect(getMinted[2][0].toString()).to.be.equal(_deployer);

            });
        });

        describe('mintNFT', function () {
            it('MUST HAVE TOKEN', async function () {
                await expectRevert(this.NftFarm.mintNFT(0, {from: _user}), 'transfer amount exceeds balance');
            });
            it('MUST MINT 1 NFT WITH BALANCE', async function () {
                const balance = await this.Token.balanceOf(_deployer);
                expect(balance).to.be.bignumber.equal(supply);
                await this.Token.approve(this.NftFarm.address, supply, {from: _deployer});

                const nftId = 0;
                await this.NftFarm.mintNFT(0, {from: _deployer});
                const ownersOf = await this.NftFarm.getOwnersOf(nftId, {from: _deployer});
                expect(ownersOf[0]).to.be.equal(_deployer);

                const getClaimedAmount = await this.NftFarm.getClaimedAmount(nftId, {from: _deployer});
                expect(getClaimedAmount.toString()).to.be.equal('1');

                const getMinted = await this.NftFarm.getMinted(_deployer, {from: _deployer});

                // nftId 0 at index 0
                expect(getMinted[0][0].toString()).to.be.equal('0');

                // nftId 0 amount minted at index 1
                expect(getMinted[1][0].toString()).to.be.equal('1');

                // nftId 0 last owner at index 2
                expect(getMinted[2][0].toString()).to.be.equal(_deployer);

            });

            it('Get NFT metadata', async function () {
                const balance = await this.Token.balanceOf(_deployer);
                expect(balance).to.be.bignumber.equal(supply);
                await this.Token.approve(this.NftFarm.address, supply, {from: _deployer});

                const nftId = 0;
                await this.NftFarm.mintNFT(nftId, {from: _deployer});
                await this.NftFarm.mintNFT(nftId, {from: _deployer});
                const tokenId = await this.NFT.getNftId(nftId, {from: _deployer});
                const getNftName = await this.NFT.getNftName(tokenId, {from: _deployer});
                const getNftNameOfTokenId = await this.NFT.getNftNameOfTokenId(tokenId, {from: _deployer});
                expect(getNftName).to.be.equal("Common");
                expect(getNftNameOfTokenId).to.be.equal("Common");

                const balanceOf = await this.NFT.balanceOf(_deployer, {from: _deployer});
                const ownerOf = await this.NFT.ownerOf(tokenId, {from: _deployer});
                expect(balanceOf.toString()).to.be.equal("2");
                expect(ownerOf).to.be.equal(_deployer);

                const tokenURI = await this.NFT.tokenURI(tokenId, {from: _deployer});
                expect(tokenURI).to.be.equal(baseURI + ipfsHash + '/0.json');

            });

            it('TEST NFT URI', async function () {
                const balance = await this.Token.balanceOf(_deployer);
                expect(balance).to.be.bignumber.equal(supply);
                await this.Token.approve(this.NftFarm.address, supply, {from: _deployer});

                await this.NftFarm.mintNFT(0, {from: _deployer});
                await this.NftFarm.mintNFT(1, {from: _deployer});
                await this.NftFarm.mintNFT(2, {from: _deployer});

                const tokenId0 = await this.NFT.getNftId(0, {from: _deployer});
                const tokenURI0 = await this.NFT.tokenURI(tokenId0, {from: _deployer});
                expect(tokenURI0).to.be.equal(baseURI + ipfsHash + '/0.json');

                const tokenId1 = await this.NFT.getNftId(1, {from: _deployer});
                const tokenURI1 = await this.NFT.tokenURI(tokenId1, {from: _deployer});
                expect(tokenURI1).to.be.equal(baseURI + ipfsHash + '/1.json');

                const tokenId2 = await this.NFT.getNftId(2, {from: _deployer});
                const tokenURI2 = await this.NFT.tokenURI(tokenId2, {from: _deployer});
                expect(tokenURI2).to.be.equal(baseURI + ipfsHash + '/2.json');

            });

            it('TEST DEFAULT PRICE', async function () {
                const nftId = 0;
                const getPrice = await this.NftFarm.getPrice(nftId, 1, {from: _user});
                expect(getPrice).to.be.bignumber.equal(tokenPerBurn);
            });
            it('TEST PRICE BY NFT', async function () {
                const nftId = 0;
                const newPrice = web3.utils.toWei('1000');
                await this.NftFarm.adminSetPriceByNftId(nftId, newPrice, {from: _deployer});
                const getPrice = await this.NftFarm.getPrice(nftId, 1, {from: _user});
                expect(getPrice).to.be.bignumber.equal(newPrice);
            });

            it('TEST PRICE MULTIPLIER', async function () {
                const nftId = 0;
                const multiplier = '2000000';
                await this.NftFarm.adminSetMultiplier(multiplier, {from: _deployer});

                await this.Token.approve(this.NftFarm.address, supply, {from: _deployer});
                await this.NftFarm.mintNFT(nftId, {from: _deployer});
                const getPrice1 = await this.NftFarm.getPrice(nftId, 1, {from: _user});
                const total = web3.utils.toWei('132');
                expect(getPrice1).to.be.bignumber.equal(total);
            });


        });


        describe('NFT MINTING LIMITS', function () {
            it('TEST allowMultipleClaims', async function () {
                const nftId = 0;

                await this.NftFarm.adminSetAllowMultipleClaims(true, {from: _deployer});

                await this.Token.approve(this.NftFarm.address, supply, {from: _deployer});

                await this.NftFarm.mintNFT(nftId, {from: _deployer});
                await this.NftFarm.mintNFT(nftId, {from: _deployer});

                await this.NftFarm.adminSetAllowMultipleClaims(false, {from: _deployer});

                await expectRevert(this.NftFarm.mintNFT(nftId, {from: _deployer}), "Has claimed");
            });
            it('TEST maxMintPerNft=3', async function () {
                const nftId = 0;


                await this.NftFarm.adminSetMaxMintPerNft('3', {from: _deployer});

                await this.Token.approve(this.NftFarm.address, supply, {from: _deployer});

                await this.NftFarm.mintNFT(nftId, {from: _deployer});
                await this.NftFarm.mintNFT(nftId, {from: _deployer});
                await this.NftFarm.mintNFT(nftId, {from: _deployer});
                const getClaimedAmount = await this.NftFarm.getClaimedAmount(nftId, {from: _deployer});
                expect(getClaimedAmount.toString()).to.be.bignumber.equal('3');

                await expectRevert(this.NftFarm.mintNFT(nftId, {from: _deployer}), "Max minting reached");
            });
            it('TEST mint_by_nftId[_nftId]=3', async function () {
                const nftId = 0;

                await this.NftFarm.adminSetMaxMintByNftId(nftId, 3, {from: _deployer});

                await this.Token.approve(this.NftFarm.address, supply, {from: _deployer});

                await this.NftFarm.mintNFT(nftId, {from: _deployer});
                await this.NftFarm.mintNFT(nftId, {from: _deployer});
                await this.NftFarm.mintNFT(nftId, {from: _deployer});
                const getClaimedAmount = await this.NftFarm.getClaimedAmount(nftId, {from: _deployer});
                expect(getClaimedAmount.toString()).to.be.bignumber.equal('3');

                await expectRevert(this.NftFarm.mintNFT(nftId, {from: _deployer}), "Max minting by NFT reached");
            });
            it('TEST totalSupplyDistributed=3', async function () {
                const nftId = 0;

                await this.NftFarm.adminSetTotalSupply(3, {from: _deployer});

                await this.Token.approve(this.NftFarm.address, supply, {from: _deployer});

                await this.NftFarm.mintNFT(0, {from: _deployer});
                await this.NftFarm.mintNFT(1, {from: _deployer});
                await this.NftFarm.mintNFT(2, {from: _deployer});

                await expectRevert(this.NftFarm.mintNFT(3, {from: _deployer}), "Nothing left");

                const total = await this.NftFarm.currentDistributedSupply({from: _deployer});
                expect(total.toString()).to.be.bignumber.equal('3');

            });
        });


        describe('ADMIN SECURITY TESTS', function () {
            it('adminSetInterval', async function () {
                await expectRevert(this.NftFarm.adminSetInterval(0, 0, {from: _user}), 'Ownable: caller is not the owner');
                await this.NftFarm.adminSetInterval(0, 0, {from: _deployer});
            });
            it('adminSetPriceByNftId', async function () {
                await expectRevert(this.NftFarm.adminSetPriceByNftId(0, 1, {from: _user}), 'Managers: not a manager');
                await this.NftFarm.adminSetPriceByNftId(0, 1, {from: _deployer});
            });
            it('adminSetInterval', async function () {
                await expectRevert(this.NftFarm.adminSetMintingInterval(0, 1, {from: _user}), 'Ownable: caller is not the owner');
                await this.NftFarm.adminSetMintingInterval(0, 6, {from: _deployer});
            });
            it('adminSetMaxMintByNftId', async function () {
                await expectRevert(this.NftFarm.adminSetMaxMintByNftId(0, '1', {from: _user}), 'Managers: not a manager');
                await this.NftFarm.adminSetMaxMintByNftId(0, '1', {from: _deployer});
            });
            it('adminSetMaxMintPerNft', async function () {
                await expectRevert(this.NftFarm.adminSetMaxMintPerNft(1, {from: _user}), 'Ownable: caller is not the owner');
                await this.NftFarm.adminSetMaxMintPerNft(1, {from: _deployer});
            });
            it('adminSetMultiplier', async function () {
                await expectRevert(this.NftFarm.adminSetMultiplier(1, {from: _user}), 'Ownable: caller is not the owner');
                await this.NftFarm.adminSetMultiplier(1, {from: _deployer});
            });
            it('adminSetMintingManager', async function () {
                await expectRevert(this.NftFarm.adminSetMintingManager(_user, true, {from: _user}), 'Ownable: caller is not the owner');
                await this.NftFarm.adminSetMintingManager(_user, true, {from: _deployer});
            });
            it('adminSetAllowMultipleClaims', async function () {
                await expectRevert(this.NftFarm.adminSetAllowMultipleClaims(true, {from: _user}), 'Ownable: caller is not the owner');
                await this.NftFarm.adminSetAllowMultipleClaims(true, {from: _deployer});
            });
            it('adminChangeToken', async function () {
                await expectRevert(this.NftFarm.adminChangeToken(this.Token.address, {from: _user}), 'Ownable: caller is not the owner');
                await this.NftFarm.adminChangeToken(this.Token.address, {from: _deployer});
            });
            it('adminSetTotalSupply', async function () {
                await expectRevert(this.NftFarm.adminSetTotalSupply(totalSupplyDistributed, {from: _user}), 'Ownable: caller is not the owner');
                await this.NftFarm.adminSetTotalSupply(totalSupplyDistributed, {from: _deployer});
            });
            it('adminSetTokenPerBurn', async function () {
                const tokenPerBurn = web3.utils.toWei('6');
                await expectRevert(this.NftFarm.adminSetTokenPerBurn(tokenPerBurn, {from: _user}), 'Ownable: caller is not the owner');
                await this.NftFarm.adminSetTokenPerBurn(tokenPerBurn, {from: _deployer});
            });
            it('adminSetBaseURI', async function () {
                const baseURI = 'ipfs://';
                await expectRevert(this.NftFarm.adminSetBaseURI(baseURI, {from: _user}), 'Ownable: caller is not the owner');
                const owner = await this.NftFarm.owner();
                await this.NftFarm.adminSetBaseURI(baseURI, {from: _deployer});
            });
            it('adminSetPriceMultiplierByNftId', async function () {
                await expectRevert(this.NftFarm.adminSetPriceMultiplierByNftId(0, new BN('1.1'), {from: _user}), 'Managers: not a manager');
                await this.NftFarm.adminSetPriceMultiplierByNftId(0, new BN('1.1'), {from: _deployer});
            });
        });


        describe('NFT MINTING INFO AND COUNTS', function () {
            it('TEST getMinted INFO', async function () {
                await this.NftFarm.adminSetMaxMintPerNft(3, {from: _deployer});

                await this.Token.approve(this.NftFarm.address, supply, {from: _deployer});

                await this.NftFarm.mintNFT(0, {from: _deployer});
                await this.NftFarm.mintNFT(0, {from: _deployer});
                await this.NftFarm.mintNFT(0, {from: _deployer});
                const getClaimedAmount = await this.NftFarm.getClaimedAmount(0, {from: _deployer});
                expect(getClaimedAmount.toString()).to.be.bignumber.equal('3');
                await expectRevert(this.NftFarm.mintNFT(0, {from: _deployer}), "Max minting reached");

                const getMinted = await this.NftFarm.getMinted(_deployer, {from: _deployer});

                const minted = getMinted[0];
                const mintedAmounts = getMinted[1];
                const lastOwner = getMinted[2];
                const maxMintByNft = getMinted[3];
                const prices = getMinted[4];
                const myMints = getMinted[5];

                expect(minted[0]).to.be.bignumber.equal('0');
                expect(mintedAmounts[0]).to.be.bignumber.equal('3');
                expect(lastOwner[0]).to.be.equal(_deployer);
                expect(maxMintByNft[0]).to.be.bignumber.equal('3');
                expect(prices[0]).to.be.bignumber.equal(web3.utils.toWei(price));
                expect(myMints[0]).to.be.bignumber.equal('3');

                const tokenPerBurn10 = web3.utils.toWei('132');
                await this.Token.mint(_user, supply, {from: _deployer});
                await this.Token.approve(this.NftFarm.address, supply, {from: _user});

                await this.NftFarm.mintNFT(1, {from: _user});
                await this.NftFarm.mintNFT(1, {from: _user});


                const getMinted_user = await this.NftFarm.getMinted(_user, {from: _user});

                const minted_user = getMinted_user[0];
                const mintedAmounts_user = getMinted_user[1];
                const lastOwner_user = getMinted_user[2];
                const maxMintByNft_user = getMinted_user[3];
                const prices_user = getMinted_user[4];
                const myMints_user = getMinted_user[5];

                expect(minted_user[1]).to.be.bignumber.equal('1');
                expect(mintedAmounts_user[1]).to.be.bignumber.equal('2');
                expect(lastOwner_user[1]).to.be.equal(_user);
                expect(maxMintByNft_user[1]).to.be.bignumber.equal('3');
                expect(prices_user[1]).to.be.bignumber.equal(web3.utils.toWei(price));
                expect(myMints_user[1]).to.be.bignumber.equal('2');
            });
        });
        describe('NFT MINTING INTERVAL', function () {
            it('TEST MINTING LIMITS', async function () {
                await this.NftFarm.adminSetMaxMintPerNft(3, {from: _deployer});
                await this.NftFarm.adminSetMintingInterval(0, 2, {from: _deployer});

                await this.Token.approve(this.NftFarm.address, supply, {from: _deployer});

                await this.NftFarm.mintNFT(0, {from: _deployer});
                await this.NftFarm.mintNFT(1, {from: _deployer});
                await this.NftFarm.mintNFT(2, {from: _deployer});
                await expectRevert(this.NftFarm.mintNFT(3, {from: _deployer}), "Out of minting interval");

            });
        });

    describe('NFT MINTING BONDING CURVE', function () {

        it('1x price does not change on mint', async function () {

            await this.NftFarm.adminSetMaxMintPerNft(3, {from: _deployer});

            const priceNft0 = web3.utils.toWei('1');
            await this.NftFarm.adminSetPriceMultiplierByNftId(0, 0, {from: _deployer});
            await this.NftFarm.adminSetPriceByNftId(0, priceNft0, {from: _deployer});

            await this.Token.approve(this.NftFarm.address, supply, {from: _deployer});

            const price0Wei = (await this.NftFarm.getPrice(0, 1, {from: _deployer})).toString();

            expect(price0Wei).to.be.bignumber.equal(price0Wei);

            // 1x price does not change
            await this.NftFarm.mintNFT(0, {from: _deployer});
            const price0WeiAfterMint0 = (await this.NftFarm.getPrice(0, 1, {from: _deployer})).toString();
            expect(price0WeiAfterMint0).to.be.bignumber.equal(price0Wei);

            await this.NftFarm.mintNFT(0, {from: _deployer});
            const price0WeiAfterMint1 = (await this.NftFarm.getPrice(0, 2, {from: _deployer})).toString();
            expect(price0WeiAfterMint1).to.be.bignumber.equal(price0Wei);

            await this.NftFarm.mintNFT(0, {from: _deployer});
            const price0WeiAfterMint2 = (await this.NftFarm.getPrice(0, 3, {from: _deployer})).toString();
            expect(price0WeiAfterMint2).to.be.bignumber.equal(price0Wei);
        });

        it('2x price change on mint of 1 index', async function () {

            await this.Token.approve(this.NftFarm.address, supply, {from: _deployer});
            await this.NftFarm.adminSetMaxMintPerNft(3, {from: _deployer});


            const priceNft0 = web3.utils.toWei('350');
            await this.NftFarm.adminSetTokenPerBurn(priceNft0, {from: _deployer});

            const MULTIPLIER = '1016282';
            await this.NftFarm.adminSetPriceMultiplierByNftId(0, MULTIPLIER, {from: _deployer});
            await this.NftFarm.adminSetPriceByNftId(0, priceNft0, {from: _deployer});

            expect('350.00').to.be.bignumber.equal(parseFloat(web3.utils.fromWei((await this.NftFarm.getPrice(0, 0, {from: _deployer})).toString())).toFixed(2));
            expect('355.70').to.be.bignumber.equal(parseFloat(web3.utils.fromWei((await this.NftFarm.getPrice(0, 1, {from: _deployer})).toString())).toFixed(2));
            expect('361.49').to.be.bignumber.equal(parseFloat(web3.utils.fromWei((await this.NftFarm.getPrice(0, 2, {from: _deployer})).toString())).toFixed(2));
            expect('367.38').to.be.bignumber.equal(parseFloat(web3.utils.fromWei((await this.NftFarm.getPrice(0, 3, {from: _deployer})).toString())).toFixed(2));


            expect(await this.NftFarm.getPrice(1, 1, {from: _deployer})).to.be.bignumber.equal(priceNft0);

            // 3st mint: 2x price does not change
            await this.NftFarm.mintNFT(1, {from: _deployer});
            expect(await this.NftFarm.getPrice(1, 2, {from: _deployer})).to.be.bignumber.equal(priceNft0);

            // 1x price does not change
            await this.NftFarm.mintNFT(1, {from: _deployer});
            await this.NftFarm.mintNFT(1, {from: _deployer});
            await expectRevert(this.NftFarm.mintNFT(1, {from: _deployer}),"Max minting reached");
            expect(await this.NftFarm.getPrice(1, 4, {from: _deployer})).to.be.bignumber.equal(priceNft0);


        });

    });

});
