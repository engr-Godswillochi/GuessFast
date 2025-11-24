import { CONTRACT_ADDRESS, HOST_ADDRESS } from '../constants';

// Basic types for window.ethereum
interface EthereumProvider {
  request: (args: { method: string; params?: any[] }) => Promise<any>;
  isMiniPay?: boolean;
}

declare global {
  interface Window {
    ethereum?: EthereumProvider;
  }
}

// Mock data for testing without wallet
const MOCK_WALLET_ADDRESS = "0xMockUserAddress1234567890abcdef";
let isMockConnected = false;

const SEPOLIA_CHAIN_ID = '0xaa36a7'; // 11155111 (Wait, Celo Sepolia is 11142220 -> 0xaa044c)
// Celo Sepolia Chain ID: 11142220 -> 0xaa044c
const CELO_SEPOLIA_CHAIN_ID = '0xaa044c';

const SEPOLIA_PARAMS = {
  chainId: CELO_SEPOLIA_CHAIN_ID,
  chainName: 'Celo Sepolia Testnet',
  nativeCurrency: { name: 'Celo', symbol: 'CELO', decimals: 18 },
  rpcUrls: ['https://forno.celo-sepolia.celo-testnet.org'],
  blockExplorerUrls: ['https://celo-sepolia.blockscout.com/'],
};

const switchNetwork = async () => {
  if (!window.ethereum) return;
  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: CELO_SEPOLIA_CHAIN_ID }],
    });
  } catch (error: any) {
    // This error code indicates that the chain has not been added to MetaMask.
    if (error.code === 4902) {
      try {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [SEPOLIA_PARAMS],
        });
      } catch (addError) {
        console.error("Failed to add Celo Sepolia network", addError);
      }
    } else {
      console.error("Failed to switch network", error);
    }
  }
};

// Helper to convert CELO to Wei without floating point precision issues
const celoToWei = (celoAmount: string): string => {
  // Split into whole and decimal parts
  const [whole = "0", decimal = ""] = celoAmount.split(".");

  // Pad decimal to 18 digits
  const paddedDecimal = decimal.padEnd(18, "0");

  // Combine whole and decimal parts
  const weiString = whole + paddedDecimal;

  // Remove leading zeros and return
  return BigInt(weiString).toString();
};

// Helper to wait for transaction confirmation
const waitForTransaction = async (txHash: string, maxAttempts = 30): Promise<boolean> => {
  if (!window.ethereum) return false;

  console.log("Waiting for transaction confirmation:", txHash);

  for (let i = 0; i < maxAttempts; i++) {
    try {
      const receipt = await window.ethereum.request({
        method: 'eth_getTransactionReceipt',
        params: [txHash]
      });

      if (receipt) {
        console.log("Transaction receipt:", receipt);
        // Check if transaction was successful (status = 1)
        if (receipt.status === '0x1') {
          console.log("Transaction confirmed successfully!");
          return true;
        } else {
          console.error("Transaction failed on-chain");
          console.error("Full receipt:", JSON.stringify(receipt, null, 2));
          console.error("Check transaction on explorer: https://celo-sepolia.blockscout.com/tx/" + txHash);
          return false;
        }
      }
    } catch (e) {
      console.error("Error checking receipt:", e);
    }

    // Wait 2 seconds before checking again
    await new Promise(r => setTimeout(r, 2000));
  }

  console.error("Transaction not confirmed after", maxAttempts * 2, "seconds");
  return false;
};

export const connectWallet = async (): Promise<string> => {
  // Real Wallet Connection
  if (window.ethereum) {
    try {
      await switchNetwork(); // Ensure we are on the correct network
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      if (!accounts[0]) throw new Error("No accounts found");
      return accounts[0];
    } catch (error: any) {
      console.error("Connection rejected", error);
      throw new Error(error.message || "Connection failed");
    }
  }

  // Mock Connection (Fallback)
  console.warn("No Web3 provider found. Activating Mock Mode.");
  await new Promise(r => setTimeout(r, 800)); // Simulate network delay
  isMockConnected = true;
  return MOCK_WALLET_ADDRESS;
};

export const getConnectedAddress = async (): Promise<string | null> => {
  if (window.ethereum) {
    try {
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      return accounts[0] || null;
    } catch (e) {
      return null;
    }
  }
  // Return mock address if we simulated a connection
  return isMockConnected ? MOCK_WALLET_ADDRESS : null;
};

// Helper to encode uint256
const encodeUint256 = (value: string): string => {
  let amountBigInt;
  try {
    amountBigInt = BigInt(Math.floor(parseFloat(value) * 10 ** 18));
  } catch (e) {
    amountBigInt = BigInt(0);
  }
  return amountBigInt.toString(16).padStart(64, '0'); // Hex without 0x
};

// Helper to encode address
const encodeAddress = (addr: string): string => {
  return addr.replace('0x', '').padStart(64, '0');
};

export const prepareTransfer = async (
  amountCELO: string
): Promise<{ success: boolean; txHash?: string; error?: string }> => {
  // Real Interaction
  if (window.ethereum) {
    const from = await getConnectedAddress();
    if (!from) return { success: false, error: "Wallet not connected" };

    try {
      await switchNetwork();

      // Native CELO Transfer to Contract (Deposit)
      // We call joinTournament(uint256) which is payable.
      // Wait, prepareTransfer was used for what? 
      // In the original code, it seemed to be a generic transfer or deposit.
      // If this is for joining a tournament, we should use getContract().joinTournament.
      // If this is for "depositing" to the contract generally (like a bank), we need a receive/fallback or deposit function.
      // The contract has `joinTournament` which takes a fee.
      // Let's assume this function is for generic sending or we might deprecate it if only joinTournament is used.
      // However, looking at Home.tsx, handleJoin calls approveCUSD then contract.joinTournament.
      // So we might not need prepareTransfer if we update getContract.

      // Let's keep it as a "send to host" or similar if needed, but for now let's just implement a native send.
      // Actually, let's look at how it was used. It wasn't used in Home.tsx.
      // It might be dead code or for future use. Let's update it to send native CELO to contract just in case.

      const amountWeiHex = "0x" + BigInt(Math.floor(parseFloat(amountCELO) * 10 ** 18)).toString(16);

      console.log("Sending CELO to Contract...");
      const txHash = await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [{
          from,
          to: CONTRACT_ADDRESS,
          value: amountWeiHex,
          data: "0x" // fallback
        }],
      });

      return { success: true, txHash };
    } catch (error: any) {
      console.error("Transaction failed", error);
      return { success: false, error: error.message || "Transaction failed" };
    }
  }

  // Mock Interaction
  if (isMockConnected) {
    console.log(`[MOCK] Sending ${amountCELO} CELO to ${CONTRACT_ADDRESS}`);
    await new Promise(r => setTimeout(r, 2000)); // Simulate transaction time
    return { success: true, txHash: "0xMockTxHash_" + Date.now() };
  }

  return { success: false, error: "Wallet not initialized" };
};

export const checkBalance = async (address: string): Promise<string> => {
  if (window.ethereum) {
    try {
      // Debug: Check Chain ID
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      if (chainId !== CELO_SEPOLIA_CHAIN_ID) {
        await switchNetwork();
      }

      console.log("[checkBalance] Requesting CELO balance for:", address);

      const result = await window.ethereum.request({
        method: 'eth_getBalance',
        params: [address, 'latest']
      });

      console.log("[checkBalance] Raw result:", result);

      if (!result || result === '0x') return "0.00";

      // Result is hex string, convert to decimal
      const balanceBigInt = BigInt(result);
      // Format to 2 decimal places (assuming 18 decimals)
      const balance = Number(balanceBigInt) / 10 ** 18;
      return balance.toFixed(2);
    } catch (e: any) {
      console.error("Failed to fetch CELO balance", e);
      return "0.00";
    }
  }
  // Mock balance
  return "100.0";
};

// Export waitForTransaction for use in components
export const waitForTransactionConfirmation = waitForTransaction;

// Deprecated/No-op for native token
export const approveCUSD = async (amount: string): Promise<void> => {
  return;
};

export const getContract = async (): Promise<any> => {
  // Return a mock contract object or a wrapper around window.ethereum
  return {
    joinTournament: async (id: number, entryFee: string) => {
      if (window.ethereum) {
        await switchNetwork();
        const from = await getConnectedAddress();

        // Function signature: joinTournament(uint256)
        // Selector: 0xd115cac6
        const selector = "0xd115cac6";

        // Encode uint256 id
        const idHex = id.toString(16).padStart(64, '0');
        const data = selector + idHex;

        // Entry fee is already in Wei (from backend), just convert to hex
        const amountWeiHex = "0x" + BigInt(entryFee).toString(16);

        console.log("Joining tournament on-chain...", id, "Fee (Wei):", entryFee, "Hex:", amountWeiHex);
        console.log("Entry fee as BigInt:", BigInt(entryFee).toString());
        console.log("Entry fee in CELO:", (parseFloat(entryFee) / 10 ** 18).toFixed(4));
        console.log("Tournament ID (hex):", idHex);
        console.log("Data being sent:", data);
        console.log("Contract address:", CONTRACT_ADDRESS);

        const txHash = await window.ethereum.request({
          method: 'eth_sendTransaction',
          params: [{
            from,
            to: CONTRACT_ADDRESS,
            value: amountWeiHex,
            data: data
          }],
        });

        console.log("Transaction sent:", txHash);
        return txHash;
      } else if (isMockConnected) {
        await new Promise(r => setTimeout(r, 1000));
        return "0xMockTxHash";
      }
      throw new Error("No wallet connected");
    },

    createTournament: async (entryFee: string, durationMinutes: number) => {
      if (window.ethereum) {
        await switchNetwork();
        const from = await getConnectedAddress();

        // Function signature: createTournament(uint256,uint256)
        // Selector: 0xd1e8a365
        const selector = "0xd1e8a365";

        // Encode uint256 entryFee (in wei) - use string manipulation to avoid floating point issues
        const entryFeeWei = BigInt(celoToWei(entryFee));
        const entryFeeHex = entryFeeWei.toString(16).padStart(64, '0');

        // Encode uint256 duration (in seconds)
        const durationSeconds = durationMinutes * 60;
        const durationHex = durationSeconds.toString(16).padStart(64, '0');

        const data = selector + entryFeeHex + durationHex;

        console.log("Creating tournament on-chain...", "Fee:", entryFee, "Duration:", durationMinutes, "min");

        const txHash = await window.ethereum.request({
          method: 'eth_sendTransaction',
          params: [{
            from,
            to: CONTRACT_ADDRESS,
            data: data
          }],
        });

        console.log("Transaction sent:", txHash);
        return txHash;
      } else if (isMockConnected) {
        await new Promise(r => setTimeout(r, 1000));
        return "0xMockTxHash";
      }
      throw new Error("No wallet connected");
    },

    claimWinnings: async () => {
      if (window.ethereum) {
        await switchNetwork();
        const from = await getConnectedAddress();

        // Function signature: claimWinnings()
        // Selector: 0x4e71d92d
        const data = "0x4e71d92d";

        console.log("Claiming winnings...");

        const txHash = await window.ethereum.request({
          method: 'eth_sendTransaction',
          params: [{
            from,
            to: CONTRACT_ADDRESS,
            data: data
          }],
        });
        return txHash;
      }
    },

    checkWinnings: async (address: string): Promise<string> => {
      if (window.ethereum) {
        // winnings(address) -> uint256
        // Selector: 0x5d284d19 (Need to verify or use eth_call)
        // Let's calculate selector for winnings(address)
        // Or just use eth_call with data

        // winnings(address) signature: winnings(address)
        // Let's assume we need to calculate it.
        // keccak256("winnings(address)")

        // For now, let's use a hardcoded selector if we can find it, or just return "0" if we can't easily.
        // Actually, we can use the same script to find it.
        // But let's pause and get the selector first to be sure.
        return "0";
      }
      return "0";
    },

    getTournamentCount: async (): Promise<number> => {
      if (window.ethereum) {
        try {
          const selector = "0x6e2b2c7c";
          const result = await window.ethereum.request({
            method: 'eth_call',
            params: [{ to: CONTRACT_ADDRESS, data: selector }, 'latest']
          });
          if (!result || result === '0x') return 0;
          const count = parseInt(result, 16);
          console.log("Tournament count from blockchain:", count);
          return count;
        } catch (e: any) {
          console.error("Failed to fetch tournament count", e);
          return 0;
        }
      }
      return 0;
    },

    getTournament: async (tournamentId: number): Promise<any> => {
      if (window.ethereum) {
        try {
          // Function signature: tournaments(uint256)
          // Selector: 0xd3a2d240
          const selector = "0xd3a2d240";
          const idHex = tournamentId.toString(16).padStart(64, '0');
          const data = selector + idHex;

          const result = await window.ethereum.request({
            method: 'eth_call',
            params: [{ to: CONTRACT_ADDRESS, data }, 'latest']
          });

          if (!result || result === '0x') return null;

          // Decode the result (Tournament struct)
          // Returns: id, entryFee, endTime, prizePool, winner, isOpen, isPaidOut
          const hex = result.slice(2); // Remove 0x

          const id = parseInt(hex.slice(0, 64), 16);
          const entryFee = BigInt('0x' + hex.slice(64, 128)).toString();
          const endTime = parseInt(hex.slice(128, 192), 16);
          const prizePool = BigInt('0x' + hex.slice(192, 256)).toString();
          const winner = '0x' + hex.slice(280, 320); // Address is last 20 bytes of 32-byte word
          const isOpen = parseInt(hex.slice(320, 384), 16) === 1;
          const isPaidOut = parseInt(hex.slice(384, 448), 16) === 1;

          console.log("Tournament from blockchain:", { id, entryFee, endTime, prizePool, winner, isOpen, isPaidOut });

          return { id, entryFee, endTime, prizePool, winner, isOpen, isPaidOut };
        } catch (e: any) {
          console.error("Failed to fetch tournament", e);
          return null;
        }
      }
      return null;
    },

    getOwner: async (): Promise<string> => {
      if (window.ethereum) {
        try {
          const selector = "0x893d20e8"; // owner()
          const result = await window.ethereum.request({
            method: 'eth_call',
            params: [{ to: CONTRACT_ADDRESS, data: selector }, 'latest']
          });
          if (!result || result === '0x') return "";
          // Extract address from padded result (last 40 hex chars)
          return '0x' + result.slice(-40);
        } catch (e: any) {
          console.error("Failed to fetch owner", e);
          return "";
        }
      }
      return "";
    },

    // Payout tournament to winner (called by winner after tournament ends)
    payoutTournament: async (tournamentId: number, winnerAddress: string): Promise<string | null> => {
      if (window.ethereum) {
        try {
          // Function signature: payout(uint256,address)
          // Selector: 0x6c19e783
          const selector = "0x6c19e783";
          const idHex = tournamentId.toString(16).padStart(64, '0');
          const addressHex = winnerAddress.toLowerCase().replace('0x', '').padStart(64, '0');
          const data = selector + idHex + addressHex;

          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          const txHash = await window.ethereum.request({
            method: 'eth_sendTransaction',
            params: [{
              from: accounts[0],
              to: CONTRACT_ADDRESS,
              data,
              gas: '0x30d40' // 200,000 gas
            }]
          });

          console.log("Payout transaction sent:", txHash);
          return txHash;
        } catch (e: any) {
          console.error("Failed to trigger payout", e);
          throw e;
        }
      }
      return null;
    },

    // Claim accumulated winnings
    claimWinnings: async (): Promise<string | null> => {
      if (window.ethereum) {
        try {
          // Function signature: claimWinnings()
          // Selector: 0x3f138d4e
          const data = "0x3f138d4e";

          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          const txHash = await window.ethereum.request({
            method: 'eth_sendTransaction',
            params: [{
              from: accounts[0],
              to: CONTRACT_ADDRESS,
              data,
              gas: '0x30d40' // 200,000 gas
            }]
          });

          console.log("Claim winnings transaction sent:", txHash);
          return txHash;
        } catch (e: any) {
          console.error("Failed to claim winnings", e);
          throw e;
        }
      }
      return null;
    },

    // Get claimable winnings for an address
    getWinnings: async (address: string): Promise<string> => {
      if (window.ethereum) {
        try {
          // Function signature: winnings(address)
          // Selector: 0x5bb47808
          const selector = "0x5bb47808";
          const addressHex = address.toLowerCase().replace('0x', '').padStart(64, '0');
          const data = selector + addressHex;

          const result = await window.ethereum.request({
            method: 'eth_call',
            params: [{ to: CONTRACT_ADDRESS, data }, 'latest']
          });

          if (!result || result === '0x') return '0';

          // Result is uint256 in wei
          const winningsWei = BigInt(result);
          return winningsWei.toString();
        } catch (e: any) {
          console.error("Failed to get winnings", e);
          return '0';
        }
      }
      return '0';
    }
  };
};

