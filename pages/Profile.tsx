import React, { useEffect, useState } from 'react';
import { getProfile } from '../services/api';
import { checkBalance } from '../services/minipay';
import { getContract } from '../services/minipay';

interface ProfileProps {
    address: string;
    onBack: () => void;
    onLogout: () => void;
}

interface ProfileData {
    stats: {
        gamesPlayed: number;
        gamesWon: number;
    };
    tournaments: {
        id: number;
        entry_fee: string;
        end_time: number;
        score: number;
        attempts: number;
        time_ms: number;
    }[];
}

const Profile: React.FC<ProfileProps> = ({ address, onBack, onLogout }) => {
    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [balance, setBalance] = useState<string>('0');
    const [winnings, setWinnings] = useState<string>('0');
    const [loading, setLoading] = useState(true);
    const [claiming, setClaiming] = useState(false);

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                // 1. Fetch Profile Data
                const data = await getProfile(address);
                setProfile(data);

                // 2. Fetch Balance
                try {
                    const bal = await checkBalance(address);
                    setBalance(bal);
                } catch (e) {
                    console.warn("Failed to fetch balance", e);
                }

                // 3. Fetch Winnings
                try {
                    const contract = await getContract();
                    const win = await contract.getWinnings(address);
                    setWinnings(win);
                } catch (e) {
                    console.warn("Failed to fetch winnings", e);
                }

            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [address]);

    const handleClaimWinnings = async () => {
        setClaiming(true);
        try {
            const contract = await getContract();
            await contract.claimWinnings();

            // Refresh winnings and balance
            const win = await contract.getWinnings(address);
            setWinnings(win);
            const bal = await checkBalance(address);
            setBalance(bal);
        } catch (err: any) {
            console.error("Failed to claim winnings", err);
            alert(`Failed to claim: ${err.message}`);
        } finally {
            setClaiming(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-64 space-y-4">
                <div className="w-12 h-12 border-4 border-arcane-primary border-t-transparent rounded-full animate-spin"></div>
                <p className="text-arcane-primary font-tech animate-pulse">Loading Profile...</p>
            </div>
        );
    }

    return (
        <div className="w-full max-w-md mx-auto p-4 space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between">
                <button
                    onClick={onBack}
                    className="text-slate-400 hover:text-white font-tech text-sm flex items-center gap-2 transition-colors"
                >
                    ← Back
                </button>
                <h2 className="text-2xl font-bold text-white font-arcane text-glow">Profile</h2>
                <div className="w-10"></div> {/* Spacer for centering */}
            </div>

            {/* Wallet Card */}
            <div className="glass-panel p-6 rounded-xl border border-arcane-primary/30 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-r from-arcane-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                <div className="relative z-10 space-y-4">
                    <div>
                        <label className="text-xs text-slate-400 font-tech uppercase tracking-wider">Connected Wallet</label>
                        <p className="text-lg text-white font-mono truncate">{address}</p>
                    </div>

                    <div className="flex justify-between items-end">
                        <div>
                            <label className="text-xs text-slate-400 font-tech uppercase tracking-wider">Balance</label>
                            <p className="text-3xl font-bold text-arcane-gold text-glow">{balance} <span className="text-sm text-slate-400">CELO</span></p>
                        </div>
                        <button
                            onClick={onLogout}
                            className="px-4 py-2 bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold rounded hover:bg-red-500/20 transition-all font-tech uppercase"
                        >
                            Disconnect
                        </button>
                    </div>
                </div>
            </div>

            {/* Winnings Card */}
            {parseFloat(winnings) > 0 && (
                <div className="glass-panel p-6 rounded-xl border border-arcane-accent/30 bg-arcane-accent/5">
                    <div className="flex justify-between items-center">
                        <div>
                            <label className="text-xs text-slate-400 font-tech uppercase tracking-wider">Pending Winnings</label>
                            <p className="text-2xl font-bold text-arcane-accent text-glow">{winnings} <span className="text-sm text-slate-400">CELO</span></p>
                        </div>
                        <button
                            onClick={handleClaimWinnings}
                            disabled={claiming}
                            className="px-6 py-3 bg-arcane-accent/20 border border-arcane-accent text-arcane-accent font-bold rounded hover:bg-arcane-accent hover:text-black transition-all duration-300 disabled:opacity-50 font-tech tracking-widest uppercase shadow-neon"
                        >
                            {claiming ? 'Claiming...' : 'Claim'}
                        </button>
                    </div>
                </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-800/50 border border-slate-700 p-4 rounded-lg text-center">
                    <p className="text-3xl font-bold text-white">{profile?.stats.gamesPlayed || 0}</p>
                    <p className="text-xs text-slate-400 font-tech uppercase mt-1">Games Played</p>
                </div>
                <div className="bg-slate-800/50 border border-slate-700 p-4 rounded-lg text-center">
                    <p className="text-3xl font-bold text-arcane-accent">{profile?.stats.gamesWon || 0}</p>
                    <p className="text-xs text-slate-400 font-tech uppercase mt-1">Games Won</p>
                </div>
            </div>

            {/* Tournament History */}
            <div className="space-y-3">
                <h3 className="text-lg font-arcane text-white">Tournament History</h3>

                {!profile?.tournaments.length ? (
                    <div className="text-center py-8 text-slate-500 font-tech text-sm italic">
                        No tournaments played yet.
                    </div>
                ) : (
                    <div className="space-y-2">
                        {profile.tournaments.map((t) => (
                            <div key={t.id} className="bg-white/5 border border-white/10 p-3 rounded flex justify-between items-center">
                                <div>
                                    <p className="text-white font-bold text-sm">Tournament #{t.id}</p>
                                    <p className="text-xs text-slate-400">{new Date(t.end_time * 1000).toLocaleDateString()}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-arcane-gold font-mono text-sm">{t.score} pts</p>
                                    <p className="text-xs text-slate-500">{t.attempts} attempts</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Profile;
