# GuessFast Celo ⚡

**GuessFast Celo** is a fast-paced, high-stakes word guessing game built specifically for **Celo MiniPay**. Players stake CELO to join tournaments, race to solve 5-letter words (Wordle-style), and the fastest solver wins the entire prize pool instantly!

![GuessFast Logo](/public/logo.png)

## 🏆 Hackathon Features
*   **MiniPay Native**: Designed for a seamless mobile experience within the Opera MiniPay wallet.
*   **On-Chain Payouts**: Winners claim prizes directly from the smart contract.
*   **Signature Security**: Backend-verified signatures prevent cheating while maintaining decentralization.
*   **Instant Settlement**: No manual approvals; smart contracts handle the funds.
*   **Arcane/Neon Theme**: A premium, polished UI with animations and effects.

## 🛠 Tech Stack
*   **Frontend**: React, Vite, TailwindCSS, ethers.js
*   **Backend**: Node.js, Express, SQLite (better-sqlite3)
*   **Blockchain**: Solidity, Hardhat (Celo Sepolia Testnet)
*   **Styling**: Custom "Arcane" design system with Tailwind

## 🚀 Getting Started

### Prerequisites
*   Node.js (v18+)
*   Git
*   A Celo Wallet (MiniPay or MetaMask configured for Celo Sepolia)

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/engr-Godswillochi/GuessFast.git
    cd GuessFast
    ```

2.  **Install Dependencies**
    ```bash
    # Install root dependencies (Frontend)
    npm install

    # Install server dependencies
    cd server
    npm install
    cd ..
    ```

3.  **Environment Setup**
    Create a `.env` file in the root directory:
    ```env
    VITE_BACKEND_URL=http://localhost:3000/api
    ```
    Create a `.env` file in the `server` directory:
    ```env
    PORT=3000
    PRIVATE_KEY=your_wallet_private_key_for_signing
    ```

### Running Locally

1.  **Start the Backend**
    ```bash
    # Terminal 1
    cd server
    npx tsx src/scripts/init-db.ts # Seed database
    npm run dev
    ```

2.  **Start the Frontend**
    ```bash
    # Terminal 2
    npm run dev
    ```

3.  **Open in Browser**
    Visit `http://localhost:5173`. For the best experience, use the mobile view in DevTools or open in Opera MiniPay.

## 📜 Smart Contract
*   **Network**: Celo Sepolia Testnet
*   **Contract Address**: `0xc1453adf0d0a3c340609177b3145e0B5B786011e`
*   **Explorer**: [Celo Explorer](https://explorer.celo.org/alfajores/address/0xc1453adf0d0a3c340609177b3145e0B5B786011e)

## 🎮 How to Play
1.  **Connect**: Link your wallet.
2.  **Join**: Pay the entry fee (e.g., 0.01 CELO) to enter a tournament.
3.  **Play**: Guess the secret word in 6 tries.
    *   🟩 Green: Correct letter, correct spot.
    *   🟨 Yellow: Correct letter, wrong spot.
    *   ⬜ Gray: Wrong letter.
4.  **Win**: The player with the fastest time and fewest attempts wins!
5.  **Claim**: Click "Claim Prize" to withdraw your winnings instantly.

## 📄 License
MIT
