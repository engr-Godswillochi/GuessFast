import * as db from '../db';

console.log("Cleaning up old tournaments...");

const cleanup = async () => {
    try {
        // Delete all tournaments (they will be recreated when users create new ones)
        await db.run('DELETE FROM tournaments');
        console.log("Deleted all tournaments from database");

        // Delete all participants
        await db.run('DELETE FROM participants');
        console.log("Deleted all participants");

        // Optionally, you can also delete all runs if you want a fresh start
        // await db.run('DELETE FROM runs');
        // console.log("Deleted all runs");

        console.log("Database cleanup complete!");
        process.exit(0);
    } catch (err) {
        console.error("Error cleaning database:", err);
        process.exit(1);
    }
};

cleanup();
