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

export const joinTournament = async (id: number, entryFee: string) => {
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
};

export const createTournament = async (entryFee: string, durationMinutes: number) => {
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
};

export const getTournamentCount = async (): Promise<number> => {
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
};

export const getTournament = async (tournamentId: number): Promise<any> => {
  if (window.ethereum) {
    try {
      // Function signature: tournaments(uint256)
      // Selector: 0x7503e1b7 (calculated via ethers.id("tournaments(uint256)").slice(0, 10))
      const selector = "0x7503e1b7";
      const idHex = tournamentId.toString(16).padStart(64, '0');
      const data = selector + idHex;

      let result;
      try {
        result = await window.ethereum.request({
          method: 'eth_call',
          params: [{ to: CONTRACT_ADDRESS, data }, 'latest']
        });
      } catch (callError: any) {
        // If the call reverts (tournament doesn't exist), return null instead of throwing
        if (callError.message && callError.message.includes('execution reverted')) {
          console.log(`Tournament ${tournamentId} does not exist on-chain`);
          return null;
        }
        throw callError; // Re-throw other errors
      }

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
};

export const getOwner = async (): Promise<string> => {
  if (window.ethereum) {
    try {
      const selector = "0x8da5cb5b"; // owner()
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
};

// Payout tournament to winner (called by winner after tournament ends)
export const payoutTournament = async (tournamentId: number, winnerAddress: string, signature: string): Promise<string | null> => {
  if (window.ethereum) {
    try {
      // Function signature: payout(uint256,address,bytes)
      // Selector: 0xc5daeac6
      const selector = "0xc5daeac6";

      // 1. ID (32 bytes)
      const idHex = tournamentId.toString(16).padStart(64, '0');

      // 2. Address (32 bytes)
      const addressHex = winnerAddress.toLowerCase().replace('0x', '').padStart(64, '0');

      // 3. Offset to signature (32 bytes)
      // 3 static args * 32 bytes = 96 bytes (0x60)
      // Wait, args are: id, winner, signature_offset. So offset is 0x60.
      const offsetHex = (96).toString(16).padStart(64, '0');

      // 4. Signature Length (32 bytes)
      // Signature is 65 bytes (0x41)
      const sigBytes = signature.replace('0x', '');
      const sigLength = sigBytes.length / 2;
      const lengthHex = sigLength.toString(16).padStart(64, '0');

      // 5. Signature Data (padded to 32 bytes)
      const paddedSig = sigBytes.padEnd(Math.ceil(sigBytes.length / 64) * 64, '0');

      const data = selector + idHex + addressHex + offsetHex + lengthHex + paddedSig;

      console.log("Payout Data:", data);

      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      const txHash = await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [{
          from: accounts[0],
          to: CONTRACT_ADDRESS,
          data,
          gas: '0x493e0' // 300,000 gas (increased for sig verification)
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
};

// Claim accumulated winnings
export const claimWinnings = async (): Promise<string | null> => {
  if (window.ethereum) {
    try {
      // Function signature: claimWinnings()
      // Selector: 0xb401faf1
      const data = "0xb401faf1";

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
};

// Get claimable winnings for an address
export const getWinnings = async (address: string): Promise<string> => {
  if (window.ethereum) {
    try {
      // Function signature: winnings(address)
      // Selector: 0xea3a1499
      const selector = "0xea3a1499";
      const addressHex = address.toLowerCase().replace('0x', '').padStart(64, '0');
      const data = selector + addressHex;

      const result = await window.ethereum.request({
        method: 'eth_call',
        params: [{ to: CONTRACT_ADDRESS, data }, 'latest']
      });

      if (!result || result === '0x' || result === '0x0000000000000000000000000000000000000000000000000000000000000000') return '0';

      // Result is uint256 in wei
      const winningsWei = BigInt(result);
      return winningsWei.toString();
    } catch (e: any) {
      // Silently return 0 if there's an error (likely no winnings)
      return '0';
    }
  }
  return '0';
};

// Helper to get contract instance (Deprecated, use direct functions)
export const getContract = async (): Promise<any> => {
  return {
    joinTournament,
    createTournament,
    getTournamentCount,
    getTournament,
    getOwner,
    payoutTournament,
    claimWinnings,
    getWinnings
  };
};
