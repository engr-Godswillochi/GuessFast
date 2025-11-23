import React from 'react';
import { TileStatus } from '../types';
import { WORD_LENGTH } from '../constants';

interface TileRowProps {
  guess: string;
  targetWord?: string; // Only needed for completed rows to calculate colors
  isCurrent?: boolean;
  isError?: boolean;
}

const TileRow: React.FC<TileRowProps> = ({ guess, targetWord, isCurrent, isError }) => {
  const tiles = [];
  const guessUpper = guess.toUpperCase();

  // If we have a target word, we are a submitted row. Calculate colors.
  // If not, we are current or empty.
  let statuses: TileStatus[] = Array(WORD_LENGTH).fill(TileStatus.EMPTY);

  if (targetWord && !isCurrent) {
    const targetUpper = targetWord.toUpperCase();
    const targetCounts: Record<string, number> = {};

    // 1. Count target frequencies
    for (const char of targetUpper) {
      targetCounts[char] = (targetCounts[char] || 0) + 1;
    }

    // 2. First pass: GREEN (Correct Position)
    const tempStatuses = Array(WORD_LENGTH).fill(TileStatus.ABSENT);

    for (let i = 0; i < WORD_LENGTH; i++) {
      if (guessUpper[i] === targetUpper[i]) {
        tempStatuses[i] = TileStatus.CORRECT;
        targetCounts[guessUpper[i]]--;
      }
    }

    // 3. Second pass: YELLOW (Wrong Position)
    for (let i = 0; i < WORD_LENGTH; i++) {
      if (tempStatuses[i] !== TileStatus.CORRECT) { // Don't overwrite green
        const char = guessUpper[i];
        if (targetCounts[char] > 0) {
          tempStatuses[i] = TileStatus.PRESENT;
          targetCounts[char]--;
        }
      }
    }
    statuses = tempStatuses;
  } else if (guess.length > 0) {
    // Just filling in
    statuses = guessUpper.split('').map(() => TileStatus.FILLED);
    // Pad remaining
    while (statuses.length < WORD_LENGTH) statuses.push(TileStatus.EMPTY);
  }

  // Render
  return (
    <div className={`flex gap-1.5 sm:gap-2 justify-center w-full ${isError ? 'animate-shake' : ''}`}>
      {Array.from({ length: WORD_LENGTH }).map((_, i) => {
        const char = guessUpper[i] || '';
        const status = statuses[i];

        let bgClass = 'bg-black/40 border-white/10';
        let borderClass = 'border-2';
        let textClass = 'text-white';
        let shadowClass = '';

        if (status === TileStatus.FILLED) {
          bgClass = 'bg-black/60 border-arcane-primary/50';
          borderClass = 'border-2 animate-pop';
          textClass = 'text-arcane-primary text-glow';
          shadowClass = 'shadow-[0_0_10px_rgba(0,243,255,0.2)]';
        } else if (status === TileStatus.CORRECT) {
          bgClass = 'bg-arcane-primary/20 border-arcane-primary';
          borderClass = 'border-2';
          textClass = 'text-arcane-primary text-glow';
          shadowClass = 'shadow-neon';
        } else if (status === TileStatus.PRESENT) {
          bgClass = 'bg-arcane-gold/20 border-arcane-gold';
          borderClass = 'border-2';
          textClass = 'text-arcane-gold text-glow';
          shadowClass = 'shadow-[0_0_10px_rgba(255,215,0,0.3)]';
        } else if (status === TileStatus.ABSENT) {
          bgClass = 'bg-slate-800/50 border-slate-700';
          borderClass = 'border-2';
          textClass = 'text-slate-500';
        }

        return (
          <div
            key={i}
            className={`flex-1 aspect-square max-w-[4rem] flex items-center justify-center text-2xl sm:text-4xl font-bold uppercase rounded-lg font-tech ${bgClass} ${borderClass} ${textClass} ${shadowClass} transition-all duration-300 backdrop-blur-sm`}
          >
            {char}
          </div>
        );
      })}
    </div>
  );
};

export default TileRow;