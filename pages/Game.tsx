import React, { useState, useEffect, useCallback } from 'react';
import TileRow from '../components/TileRow';
import Keyboard from '../components/Keyboard';
import { MAX_GUESSES, WORD_LENGTH } from '../constants';
import { TileStatus } from '../types';
import { submitFinal } from '../services/api';

interface GameProps {
  runId: number;
  targetWord: string;
  onEnd: () => void;
  tournamentId?: number | null;
}

const Game: React.FC<GameProps> = ({ runId, targetWord, onEnd, tournamentId }) => {
  const [guesses, setGuesses] = useState<string[]>([]);
  const [currentGuess, setCurrentGuess] = useState('');
  const [isShake, setIsShake] = useState(false);
  const [gameOverState, setGameOverState] = useState<'win' | 'lose' | null>(null);

  // Tracking used letter statuses for keyboard
  const [usedLetters, setUsedLetters] = useState<Record<string, TileStatus>>({});

  // Timer
  const [startTime] = useState<number>(Date.now());

  // Update keyboard colors
  const updateKeyboard = (guess: string) => {
    const newUsed = { ...usedLetters };
    const targetUpper = targetWord.toUpperCase();
    const guessUpper = guess.toUpperCase();

    guessUpper.split('').forEach((char, i) => {
      const currentStatus = newUsed[char];
      let newStatus = TileStatus.ABSENT;

      if (targetUpper[i] === char) {
        newStatus = TileStatus.CORRECT;
      } else if (targetUpper.includes(char)) {
        newStatus = TileStatus.PRESENT;
      }

      // Only upgrade status (Empty -> Gray -> Yellow -> Green)
      if (currentStatus === TileStatus.CORRECT) return;
      if (currentStatus === TileStatus.PRESENT && newStatus !== TileStatus.CORRECT) return;

      newUsed[char] = newStatus;
    });
    setUsedLetters(newUsed);
  };

  const handleSubmitGuess = async () => {
    if (currentGuess.length !== WORD_LENGTH) {
      setIsShake(true);
      setTimeout(() => setIsShake(false), 500);
      return;
    }

    // Add guess
    const newGuesses = [...guesses, currentGuess];
    setGuesses(newGuesses);
    updateKeyboard(currentGuess);
    setCurrentGuess('');

    // Check Win
    if (currentGuess.toUpperCase() === targetWord.toUpperCase()) {
      setGameOverState('win');
      await submitFinal(runId, true, newGuesses.length);
    } else if (newGuesses.length >= MAX_GUESSES) {
      setGameOverState('lose');
      await submitFinal(runId, false, newGuesses.length);
    }
  };

  // Keyboard handler
  const handleChar = useCallback((char: string) => {
    if (gameOverState) return;
    if (currentGuess.length < WORD_LENGTH) {
      setCurrentGuess(prev => prev + char);
    }
  }, [currentGuess, gameOverState]);

  const handleDelete = useCallback(() => {
    if (gameOverState) return;
    setCurrentGuess(prev => prev.slice(0, -1));
  }, [gameOverState]);

  // Physical keyboard listener
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter') handleSubmitGuess();
      else if (e.key === 'Backspace') handleDelete();
      else if (/^[a-zA-Z]$/.test(e.key)) handleChar(e.key.toUpperCase());
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [currentGuess, guesses, gameOverState]); // Dependencies important for closures

  return (
    <div className="flex flex-col h-[100dvh] w-full z-10 overflow-hidden bg-arcane-bg">
      {/* Header */}
      <div className="flex justify-between items-center px-4 py-2 shrink-0 bg-black/20 backdrop-blur-md border-b border-white/5">
        <button onClick={onEnd} className="text-xs sm:text-sm text-slate-400 hover:text-white font-tech uppercase tracking-wider hover:text-glow transition-all">Quit</button>
        <div className="font-bold text-arcane-primary font-arcane text-lg sm:text-xl text-glow">RUN #{runId}</div>
        <div className="w-8"></div>
      </div>

      {/* Grid */}
      <div className="flex-grow flex flex-col items-center justify-center w-full max-w-lg mx-auto px-2 sm:px-4">
        <div className="w-full flex flex-col gap-1.5 sm:gap-2">
          {/* Past Guesses */}
          {guesses.map((g, i) => (
            <TileRow key={i} guess={g} targetWord={targetWord} />
          ))}

          {/* Current Row */}
          {guesses.length < MAX_GUESSES && !gameOverState && (
            <TileRow guess={currentGuess} isCurrent isError={isShake} />
          )}

          {/* Empty Rows */}
          {Array.from({ length: MAX_GUESSES - guesses.length - (gameOverState ? 0 : 1) }).map((_, i) => (
            <TileRow key={`empty-${i}`} guess="" />
          ))}
        </div>
      </div>

      {/* Result Overlay */}
      {gameOverState && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 animate-pop">
          <div className="glass-panel p-6 sm:p-8 rounded-xl text-center border border-arcane-primary/50 shadow-neon max-w-xs w-full mx-4">
            <h2 className={`text-3xl sm:text-5xl font-bold mb-4 font-arcane text-glow ${gameOverState === 'win' ? 'text-arcane-primary' : 'text-arcane-danger'}`}>
              {gameOverState === 'win' ? 'VICTORY' : 'DEFEAT'}
            </h2>
            <p className="text-xl mb-6 font-tech text-slate-300">Word was: <span className="font-mono font-bold text-white ml-2">{targetWord}</span></p>
            <button onClick={onEnd} className="w-full py-3 bg-arcane-primary/20 border border-arcane-primary text-arcane-primary font-bold rounded font-tech uppercase tracking-widest hover:bg-arcane-primary hover:text-black transition-all shadow-neon">
              Return to Home
            </button>
          </div>
        </div>
      )}

      {/* Keyboard */}
      <Keyboard
        onChar={handleChar}
        onDelete={handleDelete}
        onEnter={handleSubmitGuess}
        usedLetters={usedLetters}
      />
    </div>
  );
};

export default Game;