import React, { useEffect, useState } from 'react';
import { API_URL } from '../constants';

interface Tournament {
    id: number;
    entry_fee: string;
    end_time: number;
    is_open: number;
}

interface TournamentListProps {
    onSelect: (tournament: Tournament) => void;
}

const TournamentList: React.FC<TournamentListProps> = ({ onSelect }) => {
    const [tournaments, setTournaments] = useState<Tournament[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`${API_URL}/tournaments`)
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setTournaments(data);
                } else {
                    console.error("Invalid tournaments data", data);
                    setTournaments([]);
                }
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, []);

    if (loading) return <div className="text-center text-arcane-primary animate-pulse">Loading Tournaments...</div>;

    return (
        <div className="w-full space-y-4">
            <h2 className="text-2xl font-arcane text-white text-center mb-4 text-glow">Active Tournaments</h2>
            {tournaments.length === 0 ? (
                <div className="text-center text-slate-500 font-tech">No active tournaments.</div>
            ) : (
                tournaments.map(t => {
                    const isExpired = t.end_time < Math.floor(Date.now() / 1000);
                    const timeRemaining = Math.max(0, Math.floor((t.end_time - Math.floor(Date.now() / 1000)) / 60));
                    return (
                        <div
                            key={t.id}
                            onClick={() => onSelect(t)}
                            className={`glass-panel p-4 rounded-lg border ${isExpired ? 'border-slate-700 opacity-70' : 'border-white/10 hover:border-arcane-primary/50'} cursor-pointer transition-all hover:shadow-neon group relative overflow-hidden`}
                        >
                            {isExpired && <div className="absolute top-0 right-0 bg-slate-700 text-xs px-2 py-1 rounded-bl text-slate-300 font-tech">ENDED</div>}
                            <div className="flex justify-between items-center">
                                <div>
                                    <div className={`text-lg font-bold font-arcane transition-colors ${isExpired ? 'text-slate-400' : 'text-white group-hover:text-arcane-primary'}`}>
                                        Tournament #{t.id}
                                    </div>
                                    <div className="text-xs text-slate-400 font-tech">
                                        {isExpired ? `Ended: ${new Date(t.end_time * 1000).toLocaleDateString()}` : `Ends in: ${timeRemaining} mins`}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className={`text-xl font-bold font-tech ${isExpired ? 'text-slate-500' : 'text-arcane-gold'}`}>
                                        {(parseFloat(t.entry_fee) / 10 ** 18).toFixed(2)} CELO
                                    </div>
                                    <div className="text-[10px] text-slate-500 uppercase tracking-wider">Entry Fee</div>
                                </div>
                            </div>
                        </div>
                    );
                })
            )}
        </div>
    );
};

export default TournamentList;
