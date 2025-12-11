const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    // Get network info
    const network = await ethers.provider.getNetwork();
    console.log("\n🌐 Network Information:");
    console.log(`   Name: ${network.name}`);
    console.log(`   Chain ID: ${network.chainId}`);

    // Safety check - ensure we're on mainnet
    if (network.chainId !== 42220n) {
        console.error("\n❌ ERROR: Not connected to Celo Mainnet!");
        console.error(`   Expected Chain ID: 42220`);
        console.error(`   Current Chain ID: ${network.chainId}`);
        console.error("\n   Please run with: npx hardhat run scripts/deploy-mainnet.cjs --network celoMainnet");
        process.exit(1);
    }

    console.log("\n✅ Confirmed: Connected to Celo Mainnet");

    // Get deployer info
    const [deployer] = await ethers.getSigners();
    const balance = await ethers.provider.getBalance(deployer.address);

    console.log("\n👤 Deployer Information:");
    console.log(`   Address: ${deployer.address}`);
    console.log(`   Balance: ${ethers.formatEther(balance)} CELO`);

    // Check if deployer has enough balance
    if (balance < ethers.parseEther("0.1")) {
        console.warn("\n⚠️  WARNING: Low balance! You may not have enough CELO for deployment.");
        console.warn("   Recommended: At least 0.1 CELO for gas fees");
    }

    console.log("\n🚀 Deploying GuessFast contract to Celo Mainnet...");
    console.log("   This will cost real CELO. Please wait...\n");

    const GuessFast = await ethers.getContractFactory("GuessFast");
    const guessFast = await GuessFast.deploy();

    console.log("⏳ Waiting for deployment transaction to be mined...");
    await guessFast.waitForDeployment();

    const address = await guessFast.getAddress();

    console.log("\n🎉 SUCCESS! Contract deployed!");
    console.log(`   Contract Address: ${address}`);
    console.log(`   Explorer: https://explorer.celo.org/mainnet/address/${address}`);

    // Save deployment info
    const deploymentInfo = {
        network: "Celo Mainnet",
        chainId: Number(network.chainId),
        contractAddress: address,
        deployer: deployer.address,
        deployedAt: new Date().toISOString(),
        explorerUrl: `https://explorer.celo.org/mainnet/address/${address}`
    };

    const deploymentPath = path.join(__dirname, "..", "deployment-mainnet.json");
    fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));

    console.log(`\n📝 Deployment info saved to: deployment-mainnet.json`);

    console.log("\n📋 Next Steps:");
    console.log("   1. Update constants.ts with the new contract address:");
    console.log(`      CONTRACT_ADDRESS = "${address}"`);
    console.log("\n   2. Update your backend .env with:");
    console.log(`      CONTRACT_ADDRESS=${address}`);
    console.log("\n   3. Redeploy your frontend on Vercel");
    console.log("\n   4. Restart your backend on Render");
    console.log("\n   5. Verify the contract (optional but recommended):");
    console.log(`      npx hardhat verify --network celoMainnet ${address}`);
}

main().catch((error) => {
    console.error("\n❌ Deployment failed!");
    console.error(error);
    process.exitCode = 1;
});
