import React from 'react';
import { TileStatus } from '../types';

interface KeyboardProps {
  onChar: (char: string) => void;
  onEnter: () => void;
  onDelete: () => void;
  usedLetters: Record<string, TileStatus>; // Map of 'A' -> 'correct', etc.
}

const ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', '⌫']
];

const Keyboard: React.FC<KeyboardProps> = ({ onChar, onEnter, onDelete, usedLetters }) => {
  return (
    <div className="w-full px-1 pb-2 sm:pb-4">
      {ROWS.map((row, rIndex) => (
        <div key={rIndex} className="flex justify-center gap-1 mb-1.5 w-full">
          {row.map((key) => {
            const status = usedLetters[key];
            let bgClass = 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10';
            let shadowClass = '';

            if (status === TileStatus.CORRECT) {
              bgClass = 'bg-arcane-primary/20 border-arcane-primary text-arcane-primary';
              shadowClass = 'shadow-neon';
            }
            else if (status === TileStatus.PRESENT) {
              bgClass = 'bg-arcane-gold/20 border-arcane-gold text-arcane-gold';
              shadowClass = 'shadow-[0_0_10px_rgba(255,215,0,0.3)]';
            }
            else if (status === TileStatus.ABSENT) {
              bgClass = 'bg-black/40 border-transparent text-slate-600 opacity-50';
            }

            const isSpecial = key.length > 1;

            return (
              <button
                key={key}
                onClick={() => {
                  if (key === 'ENTER') onEnter();
                  else if (key === '⌫') onDelete();
                  else onChar(key);
                }}
                className={`${isSpecial ? 'px-2 sm:px-4 text-[10px] sm:text-xs flex-[1.5]' : 'flex-1 text-lg sm:text-xl'} h-14 sm:h-16 rounded-lg font-bold border backdrop-blur-sm ${bgClass} ${shadowClass} active:scale-95 transition-all duration-150 font-tech`}
              >
                {key === '⌫' ? 'DEL' : key}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
};

export default Keyboard;