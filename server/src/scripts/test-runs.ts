// Native fetch is available in Node 18+
const API_URL = 'http://localhost:10000/api';
const WALLET = '0x1234567890123456789012345678901234567890';

const main = async () => {
    console.log("Testing POST /api/runs randomness...");
    const words = [];

    for (let i = 0; i < 5; i++) {
        try {
            const res = await fetch(`${API_URL}/runs`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ walletAddress: WALLET })
            });

            if (!res.ok) {
                console.error(`Request ${i} failed:`, res.status, await res.text());
                continue;
            }

            const data = await res.json();
            console.log(`Run ${i}: Word = ${data.secretWord}`);
            words.push(data.secretWord);
        } catch (e) {
            console.error(`Request ${i} error:`, e);
        }
    }

    const unique = new Set(words);
    console.log(`Unique words: ${unique.size} / ${words.length}`);
};

main();
