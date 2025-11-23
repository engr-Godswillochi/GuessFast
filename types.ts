export enum TileStatus {
  EMPTY = 'empty',
  FILLED = 'filled',
  CORRECT = 'correct', // Green
  PRESENT = 'present', // Yellow
  ABSENT = 'absent',   // Gray
}

export interface RunInitResponse {
  runId: number;
  startTime: number;
  secretWord?: string; // Optional from server, required for client-side valid
}

export interface RunResultResponse {
  success: boolean;
  correctWord?: string; // Only sent on failure or success
  timeMs?: number;
}

export interface LeaderboardEntry {
  wallet_address: string;
  time_ms: number;
  attempts: number;
  created_at: string;
}

export interface GameState {
  guesses: string[];
  currentGuess: string;
  gameStatus: 'playing' | 'won' | 'lost';
  runId: number | null;
  startTime: number | null;
}