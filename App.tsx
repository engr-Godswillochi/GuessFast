import React, { useState } from 'react';
import Home from './pages/Home';
import Game from './pages/Game';
import Profile from './pages/Profile';

// Simple View Router state
type View = 'HOME' | 'GAME' | 'PROFILE';

const App: React.FC = () => {
  const [view, setView] = useState<View>('HOME');
  const [currentRunId, setCurrentRunId] = useState<number | null>(null);
  const [targetWord, setTargetWord] = useState<string>("");
  const [tournamentId, setTournamentId] = useState<number | null>(null);
  const [address, setAddress] = useState<string | null>(null);

  // Persist wallet connection
  React.useEffect(() => {
    const checkConnection = async () => {
      if (window.ethereum) {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts && accounts.length > 0) {
            setAddress(accounts[0]);
          }
        } catch (err) {
          console.error("Failed to check wallet connection", err);
        }
      }
    };
    checkConnection();
  }, []);

  const [returnTournamentId, setReturnTournamentId] = useState<number | null>(null);

  const startGame = (runId: number, word: string, tId?: number) => {
    setCurrentRunId(runId);
    setTargetWord(word);
    setTournamentId(tId || null);
    setView('GAME');
  };

  const endGame = () => {
    // If we were in a tournament, remember it so Home can reopen it
    if (tournamentId) {
      setReturnTournamentId(tournamentId);
    }
    setCurrentRunId(null);
    setTargetWord("");
    setTournamentId(null);
    setView('HOME');
  };

  return (
    <div className="w-full max-w-2xl mx-auto min-h-[100dvh] bg-arcane-bg text-white flex flex-col font-tech overflow-hidden relative">
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_50%_50%,rgba(0,243,255,0.05),transparent_50%)]"></div>
      {view === 'HOME' && (
        <Home
          address={address}
          setAddress={setAddress}
          onGameStart={startGame}
          initialTournamentId={returnTournamentId}
          onClearInitial={() => setReturnTournamentId(null)}
          onViewProfile={() => setView('PROFILE')}
        />
      )}
      {view === 'GAME' && currentRunId !== null && (
        <Game
          runId={currentRunId}
          targetWord={targetWord}
          onEnd={endGame}
          tournamentId={tournamentId}
        />
      )}
      {view === 'PROFILE' && address && (
        <Profile
          address={address}
          onBack={() => setView('HOME')}
          onLogout={() => {
            setAddress(null);
            setView('HOME');
          }}
        />
      )}
    </div>
  );
};

export default App;