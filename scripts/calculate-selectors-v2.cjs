const ethers = require('ethers');

const functions = [
    "payout(uint256,address,bytes)"
];

console.log("Calculating selectors...");
functions.forEach(func => {
    const selector = ethers.id(func).slice(0, 10);
    console.log(`${func} -> ${selector}`);
});
