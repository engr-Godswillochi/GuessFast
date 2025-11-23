import React, { useState } from 'react';
import { CONTRACT_ADDRESS } from '../constants';
import { getConnectedAddress } from '../services/minipay';

const AdminPanel: React.FC = () => {
    const [tournamentId, setTournamentId] = useState('');
    const [winnerAddress, setWinnerAddress] = useState('');
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<string | null>(null);

    const handlePayout = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setStatus(null);

        try {
            if (!window.ethereum) throw new Error("No wallet connected");

            const from = await getConnectedAddress();
            if (!from) throw new Error("Wallet not connected");

            // Function signature: payout(uint256,address)
            // Selector: 0xbe95e01a
            const selector = "0xbe95e01a";

            // Encode uint256 tournamentId
            const idHex = parseInt(tournamentId).toString(16).padStart(64, '0');

            // Encode address winner
            const winnerHex = winnerAddress.replace('0x', '').padStart(64, '0');

            const data = selector + idHex + winnerHex;

            console.log("Triggering payout...", tournamentId, winnerAddress);

            const txHash = await window.ethereum.request({
                method: 'eth_sendTransaction',
                params: [{
                    from,
                    to: CONTRACT_ADDRESS,
                    data: data
                }],
            });

            setStatus(`Payout submitted! Tx: ${txHash}`);
        } catch (err: any) {
            console.error(err);
            setStatus(`Error: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="glass-panel p-6 rounded-xl border border-arcane-primary/30 mt-8">
            <h2 className="text-xl font-bold text-white font-arcane mb-4 text-glow">Admin: Payout Winnings</h2>
            <form onSubmit={handlePayout} className="space-y-4">
                <div>
                    <label className="text-sm text-slate-400 font-tech uppercase tracking-wider">Tournament ID</label>
                    <input
                        type="number"
                        value={tournamentId}
                        onChange={(e) => setTournamentId(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded p-2 text-white font-mono focus:border-arcane-primary focus:outline-none"
                        placeholder="1"
                        required
                    />
                </div>
                <div>
                    <label className="text-sm text-slate-400 font-tech uppercase tracking-wider">Winner Address</label>
                    <input
                        type="text"
                        value={winnerAddress}
                        onChange={(e) => setWinnerAddress(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded p-2 text-white font-mono focus:border-arcane-primary focus:outline-none"
                        placeholder="0x..."
                        required
                    />
                </div>

                {status && <div className="text-xs font-mono text-arcane-gold break-all">{status}</div>}

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2 bg-arcane-primary/20 border border-arcane-primary text-arcane-primary font-bold rounded hover:bg-arcane-primary hover:text-black transition-all duration-300 disabled:opacity-50 font-tech tracking-widest uppercase"
                >
                    {loading ? 'Processing...' : 'Trigger Payout'}
                </button>
            </form>
        </div>
    );
};

export default AdminPanel;
