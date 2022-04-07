// const { expect } = require("chai");
// const { ethers, upgrades } = require("hardhat");
// const { expectRevert } = require("@openzeppelin/test-helpers");
// const { BigNumber, Wallet, utils } = require("ethers");
// let nftInstance;
// let nftContract;
// let owner, account1;
// const SMART_CONTRACT_ROLE = `0x9d49f397ae9ef1a834b569acb967799a367061e305932181a44f5773da873bfd`
// const DEFAULT_ADMIN_ROLE = '0x0000000000000000000000000000000000000000000000000000000000000000';

// describe("PlayerNFT", () => {
//   beforeEach(async () => {
//     [owner, account1] = await ethers.getSigners();
//     nftInstance = await ethers.getContractFactory("PlayerNFT");
//     nftContract = await upgrades.deployProxy(nftInstance, ["Player NFT", "PNFT"]);
//     await nftContract.deployed();
//   });
//   describe("when mint", function () {
//     it("cannot mint by common users", async () => {
//       await expectRevert(
//         nftContract
//           .connect(account1)
//           .mint(account1.address),
//         `AccessControl: account ${account1.address.toLowerCase()} is missing role ${DEFAULT_ADMIN_ROLE}`
//       );
//     });
//     it("should success on minting by only owner", async () => {
//       await nftContract.connect(owner).mint(
//         account1.address
//       );
// 	    const ownerOf1 = await nftContract.ownerOf(1);
//       expect(ownerOf1.toLowerCase()).to.be.equal(
//         account1.address.toLowerCase()
//       );
//     });
//   });
//   describe("upgrade NFT", () => {
// 	  it("cannot upgrade NFT by owner", async () => {
//       await nftContract.connect(owner).mint(account1.address);
//       await expectRevert(
//         nftContract
//           .connect(owner)
//           .upgradeNFT(1),
//         `AccessControl: account ${owner.address.toLowerCase()} is missing role ${SMART_CONTRACT_ROLE}`
//       );
//     });
//   });
// });