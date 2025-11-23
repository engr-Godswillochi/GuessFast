const { ethers } = require("hardhat");

async function main() {
    const contractAddress = "0xE97D7118AE4Fe697af00D7F1f2db22A80305f344";
    const tournamentId = 14;

    // Get the contract
    const GuessFast = await ethers.getContractFactory("GuessFast");
    const contract = GuessFast.attach(contractAddress);

    // Read tournament details
    const tournament = await contract.tournaments(tournamentId);

    console.log("Tournament", tournamentId, "details:");
    console.log("  ID:", tournament.id.toString());
    console.log("  Entry Fee (Wei):", tournament.entryFee.toString());
    console.log("  Entry Fee (CELO):", ethers.formatEther(tournament.entryFee));
    console.log("  End Time:", new Date(Number(tournament.endTime) * 1000).toLocaleString());
    console.log("  Prize Pool:", ethers.formatEther(tournament.prizePool));
    console.log("  Is Open:", tournament.isOpen);
    console.log("  Winner:", tournament.winner);
    console.log("  Is Paid Out:", tournament.isPaidOut);
}

main().catch(console.error);
