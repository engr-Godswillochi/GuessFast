import React, { useState } from 'react';
import { getContract, waitForTransactionConfirmation } from '../services/minipay';
import { API_URL } from '../constants';

interface CreateTournamentProps {
    onBack: () => void;
    onCreated: () => void;
}

const CreateTournament: React.FC<CreateTournamentProps> = ({ onBack, onCreated }) => {
    const [entryFee, setEntryFee] = useState('0.01');
    const [duration, setDuration] = useState('60'); // Minutes
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // 1. Create tournament on blockchain
            const contract = await getContract();
            console.log("Creating tournament on blockchain...");
            const txHash = await contract.createTournament(entryFee, parseInt(duration));

            if (!txHash) {
                throw new Error("Transaction was rejected");
            }

            console.log("Transaction submitted:", txHash);
            console.log("Waiting for confirmation...");

            const confirmed = await waitForTransactionConfirmation(txHash);

            if (!confirmed) {
                throw new Error("Transaction failed or was not confirmed");
            }

            console.log("Tournament created on blockchain!");

            // 2. Parse tournament ID from transaction receipt
            const receipt = await window.ethereum!.request({
                method: 'eth_getTransactionReceipt',
                params: [txHash]
            });

            console.log("Transaction receipt:", receipt);

            // The TournamentCreated event is emitted with the tournament ID
            // Event signature: TournamentCreated(uint256 indexed id, uint256 entryFee, uint256 endTime)
            // The first topic is the event signature, second topic is the indexed id
            const tournamentId = receipt.logs && receipt.logs[0] && receipt.logs[0].topics[1]
                ? parseInt(receipt.logs[0].topics[1], 16)
                : 1; // Fallback to 1 if we can't parse

            console.log("Tournament ID from event:", tournamentId);

            // 3. Calculate endTime (blockchain uses block.timestamp + duration in seconds)
            // We'll use our own calculation since getTournament has issues
            const endTime = Math.floor(Date.now() / 1000) + (parseInt(duration) * 60);

            // 4. Create tournament in backend
            const [whole = "0", decimal = ""] = entryFee.split(".");
            const paddedDecimal = decimal.padEnd(18, "0");
            const entryFeeWei = (whole + paddedDecimal).replace(/^0+/, "") || "0";

            await fetch(`${API_URL}/tournaments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: tournamentId,
                    entryFee: entryFeeWei,
                    endTime: endTime // Use calculated endTime
                })
            });

            onCreated();
        } catch (err: any) {
            console.error("Failed to create tournament:", err);
            setError(err.message || "Failed to create tournament");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full animate-fade-in">
            <button
                onClick={onBack}
                className="text-slate-400 hover:text-white font-tech text-sm mb-4 flex items-center gap-2"
            >
                ← Back to List
            </button>
            <div className="glass-panel p-6 rounded-xl border border-arcane-primary/30">
                <h2 className="text-2xl font-bold text-white font-arcane mb-6 text-center text-glow">Create Tournament</h2>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm text-slate-400 font-tech uppercase tracking-wider">Entry Fee (CELO)</label>
                        <input
                            type="number"
                            step="0.01"
                            value={entryFee}
                            onChange={(e) => setEntryFee(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded p-3 text-white font-mono focus:border-arcane-primary focus:outline-none transition-colors"
                            placeholder="0.01"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm text-slate-400 font-tech uppercase tracking-wider">Duration (Minutes)</label>
                        <input
                            type="number"
                            value={duration}
                            onChange={(e) => setDuration(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded p-3 text-white font-mono focus:border-arcane-primary focus:outline-none transition-colors"
                            placeholder="60"
                            required
                        />
                    </div>

                    {error && <div className="text-arcane-danger text-sm text-center font-tech">{error}</div>}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-arcane-primary/20 border border-arcane-primary text-arcane-primary font-bold rounded hover:bg-arcane-primary hover:text-black transition-all duration-300 disabled:opacity-50 font-tech tracking-widest uppercase shadow-neon"
                    >
                        {loading ? 'Creating...' : 'Create Tournament'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default CreateTournament;
