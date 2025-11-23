const { ethers } = require("hardhat");

async function main() {
    const iface = new ethers.Interface(["function tournamentCount() view returns (uint256)"]);
    const selector = iface.getFunction("tournamentCount").selector;
    console.log("TournamentCount Selector:", selector);
}

main();
