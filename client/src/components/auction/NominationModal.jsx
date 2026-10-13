import React, { useState, useEffect } from 'react';
import { Search, X, User, ArrowRight, Filter } from 'lucide-react';
import api from '../../services/api';
import { formatINR } from '../../utils/formatters';
import { useAuction } from '../../context/AuctionSocketContext';

export default function NominationModal({ isOpen, onClose }) {
  const { nominate, tournament } = useAuction();
  const [players, setPlayers] = useState([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [nominatingId, setNominatingId] = useState(null);

  useEffect(() => {
    if (!isOpen) return;

    const fetchEligiblePlayers = async () => {
      try {
        setLoading(true);
        const res = await api.get('/players', {
          params: {
            tournamentId: tournament?.id,
            status: 'available', // available or unsold
            limit: 50,
          },
        });
        if (res.data?.success) {
          setPlayers(res.data.players || []);
        }
      } catch (err) {
        console.error('Failed to load nomination pool:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchEligiblePlayers();
  }, [isOpen, tournament?.id]);

  if (!isOpen) return null;

  const filtered = players.filter((p) => {
    const matchesSearch =
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.externalId && p.externalId.toLowerCase().includes(search.toLowerCase())) ||
      (p.department && p.department.toLowerCase().includes(search.toLowerCase()));

    const matchesRole = roleFilter === 'all' || p.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleNominate = async (playerId) => {
    try {
      setNominatingId(playerId);
      await nominate(playerId);
      onClose();
    } catch (err) {
      alert(`Nomination failed: ${err.message}`);
    } finally {
      setNominatingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-cpl-surface border border-cpl-border rounded-2xl max-w-2xl w-full p-6 shadow-2xl flex flex-col max-h-[85vh]">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-cpl-border">
          <div>
            <h3 className="font-display font-black text-lg text-white">Nominate Next Player</h3>
            <p className="text-xs text-slate-400">Select an available player to bring to the live auction gavel.</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-cpl-dark hover:bg-cpl-border text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Filters */}
        <div className="my-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, ID, or department..."
              className="w-full bg-cpl-dark border border-cpl-border rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cpl-gold"
            />
          </div>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-cpl-dark border border-cpl-border rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-cpl-gold"
          >
            <option value="all">All Playing Roles</option>
            <option value="Batsman">Batsmen</option>
            <option value="Bowler">Bowlers</option>
            <option value="All-Rounder">All-Rounders</option>
            <option value="Wicket-Keeper">Wicket-Keepers</option>
          </select>
        </div>

        {/* Players List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 my-2">
          {loading ? (
            <div className="text-center py-12 text-slate-500 text-xs">Loading available players...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs">No matching players available.</div>
          ) : (
            filtered.map((player) => (
              <div
                key={player._id}
                className="p-3 rounded-xl bg-cpl-dark/80 border border-cpl-border/70 hover:border-cpl-gold/40 flex items-center justify-between gap-3 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-cpl-surface border border-cpl-border shrink-0">
                    {player.photoUrl ? (
                      <img src={player.photoUrl} alt={player.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-500">
                        <User className="w-5 h-5" />
                      </div>
                    )}
                  </div>
                  <div className="truncate">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm truncate">{player.name}</span>
                      <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 rounded bg-cpl-surface text-slate-300 border border-cpl-border">
                        {player.role}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400">
                      {player.department} • Base: <strong className="text-cpl-gold">{formatINR(player.basePrice)}</strong>
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handleNominate(player._id)}
                  disabled={nominatingId === player._id}
                  className="px-3.5 py-2 rounded-lg bg-cpl-gold hover:bg-cpl-gold-dark text-black font-extrabold text-xs uppercase tracking-wider flex items-center gap-1.5 shrink-0 transition-colors shadow-sm disabled:opacity-50"
                >
                  <span>{nominatingId === player._id ? 'Starting...' : 'Nominate'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
}
