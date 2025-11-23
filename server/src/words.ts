import * as db from './db';

export const getRandomWord = async (): Promise<string> => {
  const row = await db.get('SELECT word FROM words ORDER BY RANDOM() LIMIT 1') as { word: string };
  if (!row) return 'ERROR';
  return row.word;
};

export const isValidWord = async (word: string): Promise<boolean> => {
  const row = await db.get('SELECT 1 FROM words WHERE word = ?', [word.toUpperCase()]);
  return !!row;
};