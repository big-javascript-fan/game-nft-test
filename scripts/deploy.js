const { ethers } = require("hardhat");

async function main() {
	const instance = await ethers.getContractFactory("CBCNetwork");
	const contract = await upgrades.deployProxy(instance, []);
	await contract.deployed();
	console.log("token contract deployed to:", contract.address);
}

main();