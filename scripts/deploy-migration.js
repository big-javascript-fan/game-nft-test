const { ethers } = require("hardhat");

async function main() {
    const [owner] = await ethers.getSigners();

	// only rinkeby for testing111
	const oldCBCContract = "0x183c8EcB4d974f8351512bd7B8bB3AC76f42Ed56";

	const newCBCInstance = await ethers.getContractFactory("CBCNetwork");
	const newCBCContract = await upgrades.deployProxy(newCBCInstance, []);
	await newCBCContract.deployed();

	console.log('new cbc contract address', newCBCContract.address);

    const migrationInstance = await ethers.getContractFactory("CBCMigration");
    const migrationContract = await migrationInstance.deploy(
		newCBCContract.address,
		oldCBCContract,
		owner.address,
		owner.address,
		owner.address
	);
    await migrationContract.deployed();

	console.log('migration contract deployed', migrationContract.address);

	await newCBCContract.connect(owner).approve(migrationContract.address, ethers.utils.parseEther("1000000000000000000000000000000"));
	console.log('approve of new cbc for migration contract finished');
}

main();