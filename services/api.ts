import { API_URL } from '../constants';
import { RunInitResponse, RunResultResponse, LeaderboardEntry } from '../types';

// Fallback words for Offline/Mock mode
const MOCK_WORDS = ["APPLE", "BEACH", "BRAIN", "BREAD", "BRUSH", "CHAIR", "DANCE", "EAGLE", "FRUIT", "GRAPE"];
const MOCK_LEADERBOARD: LeaderboardEntry[] = [
  { wallet_address: "0x123...abcd", time_ms: 45000, attempts: 4, created_at: new Date().toISOString() },
  { wallet_address: "0xabc...1234", time_ms: 32000, attempts: 3, created_at: new Date().toISOString() },
];

export const startRun = async (walletAddress: string, tournamentId?: number): Promise<RunInitResponse> => {
  try {
    const res = await fetch(`${API_URL}/runs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ walletAddress, tournamentId }),
    });
    if (!res.ok) throw new Error('Failed to start run');
    return await res.json();
  } catch (error) {
    console.warn("Backend unreachable. Starting Mock Game Session.");
    // Mock Fallback
    return {
      runId: Date.now(),
      startTime: Date.now(),
      secretWord: MOCK_WORDS[Math.floor(Math.random() * MOCK_WORDS.length)]
    };
  }
};

export const submitGuess = async (runId: number, guess: string): Promise<{ valid: boolean; message?: string }> => {
  try {
    const res = await fetch(`${API_URL}/runs/${runId}/guess`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ guess }),
    });
    if (!res.ok) throw new Error("API Error");
    return await res.json();
  } catch (error) {
    // Mock Fallback: Always valid in local mode
    return { valid: true };
  }
};

export const submitFinal = async (runId: number, success: boolean, attempts: number): Promise<RunResultResponse> => {
  try {
    const res = await fetch(`${API_URL}/runs/${runId}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success, attempts }),
    });
    if (!res.ok) throw new Error('Failed to submit result');
    return await res.json();
  } catch (error) {
    console.warn("Backend unreachable. Mocking submission success.");
    return { success: true, timeMs: 60000 };
  }
};

export const getLeaderboard = async (): Promise<LeaderboardEntry[]> => {
  try {
    const res = await fetch(`${API_URL}/leaderboard`);
    if (!res.ok) return MOCK_LEADERBOARD;
    return await res.json();
  } catch (error) {
    console.warn("Failed to fetch leaderboard. Using mock data.");
    return MOCK_LEADERBOARD;
  }
};

export const createTournament = async (entryFee: string, durationMinutes: number): Promise<{ success: boolean }> => {
  try {
    // Mock ID generation for now, backend should handle this better or contract
    const id = Math.floor(Date.now() / 1000);
    const endTime = Date.now() + (durationMinutes * 60 * 1000);

    const res = await fetch(`${API_URL}/tournaments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, entryFee, endTime }),
    });
    if (!res.ok) throw new Error('Failed to create tournament');
    return await res.json();
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const getProfile = async (walletAddress: string): Promise<any> => {
  try {
    const res = await fetch(`${API_URL}/profile/${walletAddress}`);
    if (!res.ok) throw new Error('Failed to fetch profile');
    return await res.json();
  } catch (error) {
    console.error(error);
    // Mock fallback for demo if backend fails
    return {
      stats: { gamesPlayed: 0, gamesWon: 0 },
      tournaments: []
    };
  }
};