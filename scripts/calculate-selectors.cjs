const ethers = require('ethers');

const functions = [
    "winnings(address)",
    "payout(uint256,address)",
    "claimWinnings()",
    "owner()"
];

console.log("Calculating selectors...");
functions.forEach(func => {
    const selector = ethers.id(func).slice(0, 10);
    console.log(`${func} -> ${selector}`);
});
