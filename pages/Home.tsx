
import React, { useState, useEffect } from 'react';
import { startRun, createTournament, getProfile } from '../services/api';
import { connectWallet, checkBalance, approveCUSD, getContract, waitForTransactionConfirmation } from '../services/minipay';
import Leaderboard from '../components/Leaderboard';
import TournamentList from '../components/TournamentList';
import CreateTournament from '../components/CreateTournament';

interface HomeProps {
  address: string | null;
  setAddress: (addr: string | null) => void;
  onGameStart: (runId: number, word: string, tournamentId?: number) => void;
  initialTournamentId: number | null;
  onClearInitial: () => void;
  onViewProfile: () => void;
}

interface Tournament {
  id: number;
  entry_fee: string;
  end_time: number;
  is_open: number;
}

const Home: React.FC<HomeProps> = ({ address, setAddress, onGameStart, initialTournamentId, onClearInitial, onViewProfile }) => {
  // const [address, setAddress] = useState<string | null>(null); // Lifted to App
  const [isStaking, setIsStaking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Tournament State
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [tournamentLeaderboard, setTournamentLeaderboard] = useState<any[]>([]);
  const [hasJoined, setHasJoined] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Global Leaderboard State
  const [globalLeaderboard, setGlobalLeaderboard] = useState<any[]>([]);

  // Restore selected tournament if returning from game
  useEffect(() => {
    if (initialTournamentId) {
      // Fetch the tournament details to populate selectedTournament
      // We need a new endpoint or just filter from the list if we had it.
      // Since we don't have the list loaded yet, let's fetch it specifically or just fetch all and find it.
      // For simplicity, let's fetch all and find it.
      fetch('http://localhost:3000/api/tournaments')
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            const t = data.find((t: Tournament) => t.id === initialTournamentId);
            if (t) setSelectedTournament(t);
          }
          onClearInitial(); // Clear it so it doesn't keep resetting
        })
        .catch(console.error);
    }
  }, [initialTournamentId, onClearInitial]);

  const handleConnect = async () => {
    try {
      const addr = await connectWallet();
      setAddress(addr);
      setError(null);
    } catch (e: any) {
      console.error(e);
      setError(e.message || "Failed to connect wallet");
    }
  };

  // Fetch tournament details when selected
  useEffect(() => {
    if (selectedTournament && address) {
      fetch(`http://localhost:3000/api/tournaments/${selectedTournament.id}/leaderboard`)
        .then(res => res.json())
        .then(data => {
          console.log("[Home] Received tournament leaderboard:", data);
          if (Array.isArray(data)) setTournamentLeaderboard(data);
          else console.error("Invalid tournament leaderboard data", data);
        })
        .catch(console.error);
    }
  }, [selectedTournament, address]);

  // Fetch Global Leaderboard
  useEffect(() => {
    fetch('http://localhost:3000/api/leaderboard')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setGlobalLeaderboard(data);
        else console.error("Invalid global leaderboard data", data);
      })
      .catch(console.error);
  }, []);

  const handleJoin = async () => {
    if (!selectedTournament || !address) return;
    setIsStaking(true);
    setError(null);

    try {
      // 1. Call Contract joinTournament
      const fee = selectedTournament.entry_fee; // String "1000000..."
      const contract = await getContract();

      console.log("Initiating join transaction...");
      const txHash = await contract.joinTournament(selectedTournament.id, fee);

      if (!txHash) {
        throw new Error("Transaction was rejected or failed");
      }

      console.log("Transaction submitted:", txHash);
      console.log("Waiting for confirmation...");

      // Wait for transaction to be mined
      const confirmed = await waitForTransactionConfirmation(txHash);

      if (!confirmed) {
        throw new Error("Transaction failed or was not confirmed");
      }

      console.log("Transaction confirmed! Registering with backend...");

      // 2. Call Backend to register
      await fetch(`http://localhost:3000/api/tournaments/${selectedTournament.id}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress: address })
      });

      setHasJoined(true);
    } catch (e: any) {
      console.error("Join failed:", e);
      setError(e.message || "Failed to join tournament");
    } finally {
      setIsStaking(false);
    }
  };

  const handlePlay = async () => {
    if (!address || !selectedTournament) return;
    try {
      const { runId, secretWord } = await startRun(address, selectedTournament.id);
      onGameStart(runId, secretWord, selectedTournament.id);
    } catch (e) {
      console.error(e);
      setError("Failed to start game");
    }
  };

  return (
    <div className="flex flex-col items-center w-full max-w-md mx-auto p-4 space-y-6 z-10">
      <div className="text-center space-y-2">
        <h1 className="text-4xl sm:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-arcane-primary to-arcane-accent font-arcane text-glow animate-float">
          GuessFast
        </h1>
        <p className="text-slate-400 font-tech tracking-widest uppercase text-xs sm:text-sm">Tournament Edition</p>
      </div>

      {!address ? (
        <button
          onClick={handleConnect}
          className="w-full py-4 bg-arcane-primary/10 border border-arcane-primary text-arcane-primary font-bold rounded hover:bg-arcane-primary hover:text-black transition-all duration-300 font-tech tracking-widest uppercase shadow-neon"
        >
          Connect Wallet
        </button>
      ) : (
        <div className="w-full flex justify-end mb-4">
          <button
            onClick={onViewProfile}
            className="px-4 py-2 bg-arcane-primary/20 border border-arcane-primary/50 text-arcane-primary text-xs font-bold rounded hover:bg-arcane-primary/30 transition-all font-tech uppercase flex items-center gap-2"
          >
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
            {address.slice(0, 6)}...{address.slice(-4)}
          </button>
        </div>
      )}

      {address && (
        <>
          {isCreating ? (
            <CreateTournament
              onBack={() => setIsCreating(false)}
              onCreated={() => setIsCreating(false)}
            />
          ) : !selectedTournament ? (
            <div className="w-full space-y-4">
              <button
                onClick={() => setIsCreating(true)}
                className="w-full py-3 bg-white/5 border border-white/10 text-slate-300 font-bold rounded hover:bg-white/10 hover:text-white transition-all font-tech uppercase tracking-wider"
              >
                + Create Tournament
              </button>
              <TournamentList onSelect={setSelectedTournament} />

              <div className="mt-8 w-full animate-fade-in">
                <h3 className="text-lg font-arcane text-white mb-2 text-center text-glow">Global Hall of Fame</h3>
                <Leaderboard entries={globalLeaderboard} />
              </div>
            </div>
          ) : (
            <div className="w-full space-y-4 animate-fade-in">
              <button
                onClick={() => setSelectedTournament(null)}
                className="text-slate-400 hover:text-white font-tech text-sm mb-2 flex items-center gap-2"
              >
                ← Back to Tournaments
              </button>

              <div className="glass-panel p-6 rounded-xl border border-arcane-primary/30">
                <h2 className="text-2xl font-bold text-white font-arcane mb-2">Tournament #{selectedTournament.id}</h2>
                <div className="flex justify-between text-sm font-tech text-slate-300 mb-4">
                  <span>Entry: <span className="text-arcane-gold">{(parseFloat(selectedTournament.entry_fee) / 10 ** 18).toFixed(2)} CELO</span></span>
                  <span>
                    {selectedTournament.end_time < Date.now()
                      ? <span className="text-red-400">Ended</span>
                      : `Ends: ${new Date(selectedTournament.end_time).toLocaleTimeString()}`
                    }
                  </span>
                </div>

                {selectedTournament.end_time < Date.now() ? (
                  <div className="w-full py-3 bg-slate-800/50 border border-slate-700 text-slate-400 font-bold rounded text-center font-tech uppercase tracking-widest">
                    Tournament Ended
                  </div>
                ) : !hasJoined ? (
                  <button
                    onClick={handleJoin}
                    disabled={isStaking}
                    className="w-full py-3 bg-arcane-gold/10 border border-arcane-gold text-arcane-gold font-bold rounded hover:bg-arcane-gold hover:text-black transition-all duration-300 disabled:opacity-50 font-tech tracking-widest uppercase"
                  >
                    {isStaking ? 'Joining...' : 'Pay Entry Fee & Join'}
                  </button>
                ) : (
                  <button
                    onClick={handlePlay}
                    className="w-full py-3 bg-arcane-primary/10 border border-arcane-primary text-arcane-primary font-bold rounded hover:bg-arcane-primary hover:text-black transition-all duration-300 animate-pulse font-tech tracking-widest uppercase shadow-neon"
                  >
                    Play Now
                  </button>
                )}
              </div>

              <div className="mt-6">
                <h3 className="text-lg font-arcane text-white mb-2">Leaderboard</h3>
                <Leaderboard entries={tournamentLeaderboard} />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Home;