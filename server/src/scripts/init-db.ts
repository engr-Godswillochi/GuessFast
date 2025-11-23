import * as db from '../db';

const WORDS = [
  "APPLE", "BEACH", "BRAIN", "BREAD", "BRUSH", "CHAIR", "CHEST", "CHORD", "CLICK", "CLOCK",
  "CLOUD", "DANCE", "DIARY", "DRINK", "DRIVE", "EARTH", "FEAST", "FIELD", "FRUIT", "GLASS",
  "GRAPE", "GREEN", "GHOST", "HEART", "HOUSE", "IMAGE", "LIGHT", "LEMON", "MELON", "MODEL",
  "MONEY", "MONTH", "MOTOR", "MUSIC", "NIGHT", "OCEAN", "PARTY", "PHONE", "PHOTO", "PIANO",
  "PIZZA", "PLANE", "PLANT", "PLATE", "POWER", "RADIO", "RIVER", "ROBOT", "ROUND", "SCALE",
  "SCENE", "SHIRT", "SHOES", "SIGHT", "SKIRT", "SMALL", "SMILE", "SNAKE", "SPACE", "SPOON",
  "STAIN", "START", "STICK", "STORM", "STORY", "SWEET", "TABLE", "TASTE", "TIGER", "TOAST",
  "TOOTH", "TOWEL", "TRACK", "TRADE", "TRAIN", "TRUCK", "UNCLE", "VIDEO", "VISIT", "VOICE",
  "WATER", "WATCH", "WHEEL", "WHITE", "WOMAN", "WORLD", "WRITE", "YOUTH", "ZEBRA", "CRANE"
];

console.log("Seeding database...");

const seed = async () => {
  try {
    // Wait for table creation (handled in db.ts serialization, but good to be safe)
    // In sqlite3, serialize ensures sequential execution, so we can just run inserts.

    for (const word of WORDS) {
      await db.run('INSERT OR IGNORE INTO words (word) VALUES (?)', [word]);
    }
    console.log(`Seeded ${WORDS.length} words.`);
  } catch (err) {
    console.error("Error seeding database:", err);
  }
};

seed();