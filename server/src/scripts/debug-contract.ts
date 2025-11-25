import { ethers } from 'ethers';
import * as db from '../db';

const main = async () => {
    // 1. Check Word Count
    try {
        const count = await db.get('SELECT COUNT(*) as c FROM words');
        console.log(`Word count in DB: ${count.c}`);

        const randoms = await db.all('SELECT word FROM words ORDER BY RANDOM() LIMIT 5');
        console.log('Random words sample:', randoms.map(r => r.word));
    } catch (e) {
        console.error("DB Error:", e);
    }

    // 2. Check Selector
    const sig = "tournaments(uint256)";
    const selector = ethers.id(sig).slice(0, 10);
    console.log(`Selector for ${sig}: ${selector}`);

    const expected = "0xd3a2d240";
    console.log(`Matches expected (${expected})? ${selector === expected}`);
};

main();
