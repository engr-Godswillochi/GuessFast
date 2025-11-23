const { ethers } = require("hardhat");

async function main() {
    console.log("Deploying GuessFast contract...");

    const GuessFast = await ethers.getContractFactory("GuessFast");
    const guessFast = await GuessFast.deploy();

    await guessFast.waitForDeployment();

    const address = await guessFast.getAddress();
    console.log(`GuessFast deployed to: ${address}`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
