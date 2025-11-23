import React, { useState } from 'react';
import { getContract, waitForTransactionConfirmation } from '../services/minipay';
import { API_URL } from '../constants';

interface CreateTournamentProps {
    onBack: () => void;
    onCreated: () => void;
}

const CreateTournament: React.FC<CreateTournamentProps> = ({ onBack, onCreated }) => {
    const [entryFee, setEntryFee] = useState('10');
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

            console.log("Tournament created on blockchain! Getting tournament ID...");

            // 2. Get the tournament ID from blockchain
            const tournamentId = await contract.getTournamentCount();
            console.log("Tournament ID from blockchain:", tournamentId);

            // 3. Create tournament in backend with correct ID and entry fee in Wei
            // Use string manipulation to avoid floating point precision issues
            const [whole = "0", decimal = ""] = entryFee.split(".");
            const paddedDecimal = decimal.padEnd(18, "0");
            const entryFeeWei = (whole + paddedDecimal).replace(/^0+/, "") || "0";
            const endTime = Date.now() + (parseInt(duration) * 60 * 1000);
            await fetch(`${API_URL}/tournaments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: tournamentId,
                    entryFee: entryFeeWei,
                    endTime
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
                            value={entryFee}
                            onChange={(e) => setEntryFee(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded p-3 text-white font-mono focus:border-arcane-primary focus:outline-none transition-colors"
                            placeholder="10"
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
