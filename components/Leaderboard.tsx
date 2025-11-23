import React from 'react';
import { LeaderboardEntry } from '../types';

const Leaderboard: React.FC<{ entries: LeaderboardEntry[] }> = ({ entries = [] }) => {
  const safeEntries = Array.isArray(entries) ? entries : [];
  return (
    <div className="w-full">
      <h3 className="text-xl font-bold mb-4 text-center">Leaderboard</h3>
      <div className="bg-celo-surface rounded-lg overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-celo-dark text-slate-400">
            <tr>
              <th className="p-3">#</th>
              <th className="p-3">Player</th>
              <th className="p-3 text-right">Time</th>
              <th className="p-3 text-right">Moves</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {safeEntries.length === 0 ? (
              <tr><td colSpan={4} className="p-4 text-center text-slate-500">No records yet</td></tr>
            ) : (
              safeEntries.map((entry, idx) => (
                <tr key={idx}>
                  <td className="p-3 text-slate-400">{idx + 1}</td>
                  <td className="p-3 font-mono text-white">{entry.wallet_address.slice(0, 6)}</td>
                  <td className="p-3 text-right font-bold text-celo-primary">{(entry.time_ms / 1000).toFixed(2)}s</td>
                  <td className="p-3 text-right">{entry.attempts}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Leaderboard;