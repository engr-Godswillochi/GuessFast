// Backend API URL - uses environment variable in production
export const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000/api';

// Celo Alfajores Testnet cUSD Address
export const CUSD_ADDRESS = '0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1';

// The "Host" address that collects stakes
export const HOST_ADDRESS = '0xE627De60e620269Af48412e462F587621430949A'; // Example address

export const STAKE_AMOUNT = '0.1'; // 0.1 cUSD

// The deployed contract address - uses environment variable in production
export const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || "0x8616899122D86d07162F58086f0B4421c7374025";

export const ERC20_ABI = [
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)"
];

export const GUESSFAST_ABI = [
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "name": "player", "type": "address" },
      { "indexed": false, "name": "amount", "type": "uint256" }
    ],
    "name": "Deposit",
    "type": "event"
  },
  {
    "inputs": [{ "name": "amount", "type": "uint256" }],
    "name": "deposit",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

export const WORD_LENGTH = 5;
export const MAX_GUESSES = 6;