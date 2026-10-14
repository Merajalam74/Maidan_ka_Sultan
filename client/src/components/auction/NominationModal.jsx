import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Search, X, User, ArrowRight, RotateCcw, Sparkles } from 'lucide-react';
import api from '../../services/api';
import { formatINR } from '../../utils/formatters';
import { useAuction } from '../../context/AuctionSocketContext';

export default function NominationModal({ isOpen, onClose }) {
  const { nominate, tournament } = useAuction();
  const [players, setPlayers] = useState([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [poolFilter, setPoolFilter] = useState('all'); // 'all', 'available', 'unsold'
  const [loading, setLoading] = useState(false);
  const [nominatingId, setNominatingId] = useState(null);

  useEffect(() => {
    if (!isOpen) return;

    const fetchEligiblePlayers = async () => {
      try {
        setLoading(true);
        // Query nominatable players: both fresh 'available' and previously 'unsold'
        const res = await api.get('/players', {
          params: {
            tournamentId: tournament?.id,
            status: 'nominatable',
            limit: 150,
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

  const availableCount = players.filter((p) => p.status === 'available').length;
  const unsoldCount = players.filter((p) => p.status === 'unsold').length;

  const filtered = players.filter((p) => {
    const matchesSearch =
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.externalId && p.externalId.toLowerCase().includes(search.toLowerCase())) ||
      (p.department && p.department.toLowerCase().includes(search.toLowerCase()));

    const matchesRole = roleFilter === 'all' || p.role === roleFilter;
    const matchesPool =
      poolFilter === 'all' ||
      (poolFilter === 'available' && p.status === 'available') ||
      (poolFilter === 'unsold' && p.status === 'unsold');

    return matchesSearch && matchesRole && matchesPool;
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

  const modalJSX = (
    <div className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-cpl-surface border border-cpl-border rounded-3xl max-w-2xl w-full p-6 shadow-2xl flex flex-col max-h-[88vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-cpl-border">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-display font-black text-xl text-white">Nominate Next Player</h3>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-cpl-gold/15 text-cpl-gold border border-cpl-gold/30">
                GAVEL SELECTION
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Select an available or previously unsold player to bring to the auction block.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-cpl-dark hover:bg-cpl-border text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Pool Filter Tabs (Fresh vs Re-auction) */}
        <div className="mt-3 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPoolFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              poolFilter === 'all'
                ? 'bg-cpl-gold text-black shadow-md'
                : 'bg-cpl-dark text-slate-300 hover:text-white border border-cpl-border'
            }`}
          >
            All Eligible ({players.length})
          </button>

          <button
            type="button"
            onClick={() => setPoolFilter('available')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              poolFilter === 'available'
                ? 'bg-emerald-500 text-black shadow-md'
                : 'bg-cpl-dark text-slate-300 hover:text-white border border-cpl-border'
            }`}
          >
            <Sparkles className="w-3 h-3" />
            <span>Fresh Pool ({availableCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setPoolFilter('unsold')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              poolFilter === 'unsold'
                ? 'bg-amber-500 text-black shadow-md'
                : 'bg-cpl-dark text-amber-300 hover:text-white border border-amber-500/30'
            }`}
          >
            <RotateCcw className="w-3 h-3" />
            <span>Unsold Re-Auction ({unsoldCount})</span>
          </button>
        </div>

        {/* Search & Role Filters */}
        <div className="my-3 flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, ID, or department..."
              className="w-full bg-cpl-dark border border-cpl-border rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cpl-gold"
            />
          </div>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-cpl-dark border border-cpl-border rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cpl-gold"
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
            <div className="text-center py-12 text-slate-500 text-xs">Loading nominatable player pool...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs">
              {poolFilter === 'unsold' ? 'No unsold players currently waiting for re-auction.' : 'No matching players available.'}
            </div>
          ) : (
            filtered.map((player) => {
              const isUnsold = player.status === 'unsold';

              return (
                <div
                  key={player._id}
                  className={`p-3 rounded-2xl border flex items-center justify-between gap-3 transition-colors ${
                    isUnsold
                      ? 'bg-amber-950/20 border-amber-500/40 hover:border-amber-400'
                      : 'bg-cpl-dark/80 border-cpl-border/70 hover:border-cpl-gold/40'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-xl overflow-hidden bg-cpl-surface border border-cpl-border shrink-0 shadow-sm">
                      {player.photoUrl ? (
                        <img src={player.photoUrl} alt={player.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-500">
                          <User className="w-5 h-5" />
                        </div>
                      )}
                    </div>
                    <div className="truncate">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-white text-sm truncate">{player.name}</span>
                        <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 rounded bg-cpl-surface text-slate-300 border border-cpl-border">
                          {player.role}
                        </span>
                        {isUnsold && (
                          <span className="text-[9px] uppercase font-black px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                            <RotateCcw className="w-2.5 h-2.5" />
                            <span>UNSOLD • RE-AUCTION</span>
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400 block mt-0.5">
                        {player.department || 'General'} • Base Price: <strong className="text-cpl-gold">{formatINR(player.basePrice)}</strong>
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleNominate(player._id)}
                    disabled={nominatingId === player._id}
                    className={`px-4 py-2 rounded-xl font-extrabold text-xs uppercase tracking-wider flex items-center gap-1.5 shrink-0 transition-all shadow-md disabled:opacity-50 ${
                      isUnsold
                        ? 'bg-amber-500 hover:bg-amber-400 text-black shadow-amber-500/20'
                        : 'bg-cpl-gold hover:bg-cpl-gold-dark text-black shadow-cpl-gold/20'
                    }`}
                  >
                    <span>{nominatingId === player._id ? 'Starting...' : isUnsold ? 'Re-Nominate' : 'Nominate'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>

      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalJSX, document.body) : modalJSX;
}
