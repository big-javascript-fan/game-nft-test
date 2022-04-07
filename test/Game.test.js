const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");
const { expectRevert } = require("@openzeppelin/test-helpers");
const { BigNumber, Wallet, utils } = require("ethers");
let nftInstance;
let nftContract;
let gameInstance;
let gameContract;
let owner, account1, account2;
const SMART_CONTRACT_ROLE = `0x9d49f397ae9ef1a834b569acb967799a367061e305932181a44f5773da873bfd`
const DEFAULT_ADMIN_ROLE = '0x0000000000000000000000000000000000000000000000000000000000000000';

describe("PlayerNFT", () => {
  beforeEach(async () => {
    [owner, account1, account2] = await ethers.getSigners();
    nftInstance = await ethers.getContractFactory("PlayerNFT");
    nftContract = await upgrades.deployProxy(nftInstance, ["Player NFT", "PNFT"]);
    await nftContract.deployed();

    gameInstance = await ethers.getContractFactory("GameContract");
    gameContract = await upgrades.deployProxy(gameInstance, [nftContract.address]);
    await gameContract.deployed();
  });
  describe("create game", function () {
    it("can create game by common users", async () => {
      await gameContract.connect(owner).createGame();
      await gameContract.connect(account1).createGame();
      
      const lastGameId = await gameContract.lastGameId();
      expect(lastGameId).to.be.equal(BigNumber.from('2'));
    });
  });
  describe("join game", function() {
    beforeEach(async () => {
      await gameContract.connect(owner).createGame();
      await nftContract.connect(owner).mint(owner.address);
      await nftContract.connect(owner).mint(account1.address);
      await nftContract.connect(owner).mint(account2.address);

      await nftContract.connect(owner).setApprovalForAll(gameContract.address, true);
      await nftContract.connect(account1).setApprovalForAll(gameContract.address, true);
      await nftContract.connect(account2).setApprovalForAll(gameContract.address, true);
    });
    it("cannot join with own token id", async () => {
      await expectRevert(
        gameContract.connect(account1).joinGame(1, 1),
        "Msg sender must be owner of NFT token id"
      );
    });
    it("can join as first player", async () => {
      await gameContract.connect(account1).joinGame(1, 2);
      const [firstPlayer, firstTokenId, ...others] = await gameContract.gameDetailById(1);
      const ownerOf2 = await nftContract.ownerOf(2);
      expect(firstPlayer.toLowerCase()).to.be.equal(account1.address.toLowerCase());
      expect(firstTokenId).to.be.equal(BigNumber.from('2'));
      expect(ownerOf2.toLowerCase()).to.be.equal(gameContract.address.toLowerCase());
    });
    it("can join as second player", async () => {
      await gameContract.connect(account1).joinGame(1, 2);
      await gameContract.connect(account2).joinGame(1, 3);
      const [, , secondPlayer, secondTokenId, ...others] = await gameContract.gameDetailById(1);
      const ownerOf3 = await nftContract.ownerOf(3);
      expect(secondPlayer.toLowerCase()).to.be.equal(account2.address.toLowerCase());
      expect(secondTokenId).to.be.equal(BigNumber.from('3'));
      expect(ownerOf3.toLowerCase()).to.be.equal(gameContract.address.toLowerCase());
    });
    it("cannot join game which has 2 players already", async () => {
      await gameContract.connect(account1).joinGame(1, 2);
      await gameContract.connect(account2).joinGame(1, 3);
      await expectRevert(
        gameContract.connect(owner).joinGame(1, 1),
        "Game already has been filled"
      );
    });
    it("cannot finish game which is not owner", async () => {
      await gameContract.connect(account1).joinGame(1, 2);
      await gameContract.connect(account2).joinGame(1, 3);
      await expectRevert(
        gameContract.connect(account1).finishGame(1),
        "Game creator can only finish game"
      )
    });
    it("fail to finish game if game contract doesn't have smart contract role", async () => {
      await expectRevert(
        gameContract.connect(owner).finishGame(1),
        `AccessControl: account ${gameContract.address.toLowerCase()} is missing role ${SMART_CONTRACT_ROLE}`
      )
    });
    it('success on finish game', async () => {
      await gameContract.connect(account1).joinGame(1, 2);
      await gameContract.connect(account2).joinGame(1, 3);
      await nftContract.connect(owner).addSmartContractRole(gameContract.address);
			await network.provider.send(
				"evm_setNextBlockTimestamp", 
				[new Date(2022, 5, 1).getTime() / 1000]);       /// assume it's more than 1 hour later
      await gameContract.connect(owner).finishGame(1);
    })
  })
});