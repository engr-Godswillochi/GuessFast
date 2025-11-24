import express from 'express';
import cors from 'cors';
import * as db from './db';
import { getRandomWord, isValidWord } from './words';

const app = express();

// CORS Configuration - Allow production frontend
const allowedOrigins = [
  'https://guess-fast.vercel.app',
  'http://localhost:5173', // Local development
  'http://localhost:3000'  // Alternative local port
];

// Add custom origin from environment variable if provided
if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked request from origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

const PORT = process.env.PORT || 3000;

// 1. Start a Run
app.post('/api/runs', async (req, res) => {
  const { walletAddress, tournamentId } = req.body;
  if (!walletAddress) {
    return res.status(400).json({ error: 'Wallet address required' });
  }

  const secretWord = await getRandomWord();
  const startTime = Date.now();

  try {
    if (tournamentId) {
      const tournament = await db.get('SELECT end_time FROM tournaments WHERE id = ?', [tournamentId]);
      if (!tournament) return res.status(404).json({ error: 'Tournament not found' });
      if (tournament.end_time < Date.now()) return res.status(400).json({ error: 'Tournament ended' });
    }

    const info = await db.run(`
      INSERT INTO runs (wallet_address, secret_word, start_time, tournament_id) 
      VALUES (?, ?, ?, ?)
    `, [walletAddress.toLowerCase(), secretWord, startTime, tournamentId || null]);

    res.json({
      runId: info.id,
      startTime,
      secretWord
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// ... (Keep existing guess endpoint) ...

// 3. Submit Final Result
app.post('/api/runs/:id/submit', async (req, res) => {
  const { id } = req.params;
  const { success, attempts } = req.body;
  const endTime = Date.now();

  try {
    const run = await db.get('SELECT start_time, tournament_id, wallet_address FROM runs WHERE id = ?', [id]);

    if (!run) return res.status(404).json({ error: 'Run not found' });

    await db.run(`
      UPDATE runs 
      SET end_time = ?, status = ?, attempts = ?
      WHERE id = ?
    `, [endTime, success ? 'won' : 'lost', attempts, id]);

    // If part of a tournament, update participant score
    if (run.tournament_id && success) {
      const timeMs = endTime - run.start_time;
      // Simple score: 10000 - (attempts * 100) - (time in seconds)
      const score = 10000 - (attempts * 100) - Math.floor(timeMs / 1000);

      console.log(`[Score Update] Run ${id}, Tournament ${run.tournament_id}, User ${run.wallet_address}`);
      console.log(`[Score Update] New Score: ${score}, Time: ${timeMs}, Attempts: ${attempts}`);

      // Only update if score is better
      const result = await db.run(`
            UPDATE participants 
            SET score = ?, attempts = ?, time_ms = ?
            WHERE tournament_id = ? AND LOWER(wallet_address) = ? AND score < ?
        `, [score, attempts, timeMs, run.tournament_id, run.wallet_address.toLowerCase(), score]);

      console.log(`[Score Update] Rows updated: ${result.id}`); // id isn't rows affected in sqlite3 wrapper but let's check logs
    }

    res.json({ success: true, timeMs: endTime - run.start_time });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// 4. Leaderboard (Global)
app.get('/api/leaderboard', async (req, res) => {
  // ... existing implementation ...
  try {
    const rows = await db.all(`
          SELECT wallet_address, (end_time - start_time) as time_ms, attempts, datetime(start_time/1000, 'unixepoch') as created_at
          FROM runs
          WHERE status = 'won'
          ORDER BY time_ms ASC, attempts ASC
          LIMIT 50
        `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// 5. Tournament Endpoints

// List Tournaments
app.get('/api/tournaments', async (req, res) => {
  try {
    // Return all tournaments, let frontend handle display/filtering
    const rows = await db.all('SELECT * FROM tournaments WHERE is_open = 1 ORDER BY end_time DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

// Create Tournament (Called by Admin/Dev after contract creation)
app.post('/api/tournaments', async (req, res) => {
  const { id, entryFee, endTime } = req.body;
  try {
    await db.run('INSERT INTO tournaments (id, entry_fee, end_time) VALUES (?, ?, ?)', [id, entryFee, endTime]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

// Join Tournament (Called after contract deposit)
app.post('/api/tournaments/:id/join', async (req, res) => {
  const { id } = req.params;
  const { walletAddress } = req.body;
  try {
    await db.run('INSERT OR IGNORE INTO participants (tournament_id, wallet_address) VALUES (?, ?)', [id, walletAddress.toLowerCase()]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

// Get Tournament Leaderboard
app.get('/api/tournaments/:id/leaderboard', async (req, res) => {
  const { id } = req.params;
  try {
    console.log(`Fetching leaderboard for tournament ${id}`);
    // Query runs directly to show all winning attempts, not just the best one per user
    const rows = await db.all(`
      SELECT 
        wallet_address, 
        (end_time - start_time) as time_ms, 
        attempts,
        (10000 - (attempts * 100) - ((end_time - start_time) / 1000)) as score,
        datetime(start_time/1000, 'unixepoch') as created_at
      FROM runs 
      WHERE tournament_id = ? AND status = 'won' 
      ORDER BY score DESC
    `, [id]);
    console.log(`[Leaderboard] Found ${rows.length} rows for tournament ${id}`);
    if (rows.length > 0) console.log('[Leaderboard] First row:', rows[0]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

// 6. User Profile
app.get('/api/profile/:walletAddress', async (req, res) => {
  const { walletAddress } = req.params;
  const addr = walletAddress.toLowerCase();

  try {
    // 1. Stats
    const stats = await db.get(`
      SELECT 
        COUNT(*) as games_played,
        SUM(CASE WHEN status = 'won' THEN 1 ELSE 0 END) as games_won
      FROM runs
      WHERE lower(wallet_address) = ?
    `, [addr]);

    // 2. Tournament History
    // We can join participants with tournaments to get details
    const tournaments = await db.all(`
      SELECT 
        t.id, 
        t.entry_fee, 
        t.end_time, 
        p.score, 
        p.attempts,
        p.time_ms
      FROM participants p
      JOIN tournaments t ON p.tournament_id = t.id
      WHERE lower(p.wallet_address) = ?
      ORDER BY t.end_time DESC
    `, [addr]);

    res.json({
      stats: {
        gamesPlayed: stats?.games_played || 0,
        gamesWon: stats?.games_won || 0
      },
      tournaments: tournaments || []
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});