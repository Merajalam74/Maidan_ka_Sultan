import React, { useState, useEffect, useCallback } from 'react';
import { Search, Filter, User, ArrowUpDown, Shield, CheckCircle, Clock, XCircle, Edit2, Trash2 } from 'lucide-react';
import api from '../services/api';
import { formatINR } from '../utils/formatters';
import { useAuction } from '../context/AuctionSocketContext';
import { useAuth } from '../context/AuthContext';
import PlayerEditModal from '../components/admin/PlayerEditModal';

export default function PlayersPage() {
  const { tournament } = useAuction();
  const { isSuperAdmin, isAuctioneer } = useAuth();
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState('nominationOrder');
  const [sortOrder, setSortOrder] = useState('asc');
  const [editingPlayer, setEditingPlayer] = useState(null);

  const fetchPlayers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/players', {
        params: {
          tournamentId: tournament?.id,
          search,
          role: roleFilter,
          status: statusFilter,
          category: categoryFilter,
          sortBy,
          order: sortOrder,
          limit: 100,
        },
      });
      if (res.data?.success) {
        setPlayers(res.data.players || []);
      }
    } catch (err) {
      console.error('Failed to load players:', err);
    } finally {
      setLoading(false);
    }
  }, [tournament?.id, search, roleFilter, statusFilter, categoryFilter, sortBy, sortOrder]);

  useEffect(() => {
    fetchPlayers();
  }, [fetchPlayers]);

  const handleDeletePlayer = async (player) => {
    if (!window.confirm(`Are you sure you want to remove player "${player.name}" from the tournament pool? This cannot be undone.`)) {
      return;
    }
    try {
      const res = await api.delete(`/players/${player._id}`);
      if (res.data?.success) {
        fetchPlayers();
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to delete player.');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div>
        <h1 className="font-display font-black text-3xl text-white">
          REGISTERED PLAYERS DIRECTORY
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Explore the official candidate pool, base pricing, playing roles, and auction acquisition status.
        </p>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="glass-panel p-4 rounded-2xl border border-cpl-border flex flex-col md:flex-row gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, ID, or department..."
            className="w-full bg-cpl-surface border border-cpl-border rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cpl-gold"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-cpl-surface border border-cpl-border rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cpl-gold"
          >
            <option value="all">All Roles</option>
            <option value="Batsman">Batsman</option>
            <option value="Bowler">Bowler</option>
            <option value="All-Rounder">All-Rounder</option>
            <option value="Wicket-Keeper">Wicket-Keeper</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-cpl-surface border border-cpl-border rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cpl-gold"
          >
            <option value="all">All Statuses</option>
            <option value="available">Available</option>
            <option value="sold">Sold</option>
            <option value="unsold">Unsold</option>
            <option value="nominated">Nominated</option>
          </select>

          {/* Sort By */}
          <select
            value={`${sortBy}:${sortOrder}`}
            onChange={(e) => {
              const [sb, so] = e.target.value.split(':');
              setSortBy(sb);
              setSortOrder(so);
            }}
            className="bg-cpl-surface border border-cpl-border rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cpl-gold"
          >
            <option value="nominationOrder:asc">Order: Default</option>
            <option value="basePrice:desc">Base Price: High to Low</option>
            <option value="basePrice:asc">Base Price: Low to High</option>
            <option value="name:asc">Name: A to Z</option>
          </select>
        </div>
      </div>

      {/* Players Grid */}
      {loading ? (
        <div className="text-center py-20 text-slate-500 text-sm">
          Loading player records...
        </div>
      ) : players.length === 0 ? (
        <div className="text-center py-20 text-slate-500 text-sm glass-panel rounded-2xl border border-cpl-border">
          No players found matching your criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {players.map((player) => {
            const isSold = player.status === 'sold';
            const isUnsold = player.status === 'unsold';
            const isNominated = player.status === 'nominated';

            return (
              <div
                key={player._id}
                className="glass-panel glass-panel-hover rounded-2xl border border-cpl-border overflow-hidden flex flex-col justify-between"
              >
                <div>
                  {/* Photo & Status Banner */}
                  <div className="relative h-48 bg-cpl-dark overflow-hidden">
                    {player.photoUrl ? (
                      <img
                        src={player.photoUrl}
                        alt={player.name}
                        className="w-full h-full object-cover object-top hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(player.name)}`;
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-600">
                        <User className="w-16 h-16" />
                      </div>
                    )}

                    {/* Status Pill */}
                    <div className="absolute top-2.5 right-2.5">
                      {isSold ? (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500 text-black shadow-md flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          <span>SOLD</span>
                        </span>
                      ) : isNominated ? (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500 text-black shadow-md animate-pulse">
                          LIVE LOT
                        </span>
                      ) : isUnsold ? (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-600/80 text-white shadow-md">
                          UNSOLD
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-cpl-surface/90 text-slate-300 border border-cpl-border backdrop-blur-sm">
                          AVAILABLE
                        </span>
                      )}
                    </div>

                    {/* Role Pill */}
                    <div className="absolute bottom-2.5 left-2.5 px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-cpl-dark/85 text-cpl-gold border border-cpl-gold/30 backdrop-blur-sm">
                      {player.role}
                    </div>
                  </div>

                  {/* Player Info */}
                  <div className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-slate-500 font-bold">{player.externalId || 'ID-N/A'}</span>
                      {player.phoneNumber && (
                        <span className="text-[10px] font-mono text-slate-400">📱 {player.phoneNumber}</span>
                      )}
                    </div>

                    <h3 className="font-display font-extrabold text-base text-white truncate leading-tight">
                      {player.name}
                    </h3>
                    <p className="text-xs text-slate-400 truncate">{player.department} • {player.academicYear}</p>
                    
                    {/* Styles & Category */}
                    <div className="flex items-center justify-between gap-1 pt-1">
                      <p className="text-[11px] text-slate-400 truncate">
                        {player.battingStyle} • {player.bowlingStyle}
                      </p>
                      <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded bg-cpl-surface border border-cpl-border text-slate-300 shrink-0">
                        {player.category || 'Category A'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer Pricing & Admin Action Info */}
                <div className="p-4 pt-3 border-t border-cpl-border/70 bg-cpl-surface/50 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-bold block">Base Price</span>
                    <span className="font-bold text-slate-200">{formatINR(player.basePrice)}</span>
                  </div>

                  {isSold && (
                    <div className="text-right">
                      <span className="text-[10px] text-emerald-400 uppercase font-bold block">Sold Price</span>
                      <span className="font-display font-black text-cpl-gold text-sm">
                        {formatINR(player.soldPrice)}
                      </span>
                    </div>
                  )}

                  {/* Admin Actions: Edit & Delete */}
                  {(isSuperAdmin || isAuctioneer) && (
                    <div className="flex items-center gap-1.5 ml-auto pl-2 border-l border-cpl-border/80">
                      <button
                        type="button"
                        onClick={() => setEditingPlayer(player)}
                        title="Edit Player Profile"
                        className="p-1.5 rounded-lg bg-cpl-dark hover:bg-cpl-gold/20 text-slate-300 hover:text-cpl-gold border border-cpl-border transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeletePlayer(player)}
                        disabled={isSold}
                        title={isSold ? 'Cannot delete SOLD player' : 'Remove Player'}
                        className="p-1.5 rounded-lg bg-cpl-dark hover:bg-red-500/20 text-slate-400 hover:text-red-400 border border-cpl-border transition-colors disabled:opacity-30 disabled:hover:bg-cpl-dark disabled:hover:text-slate-400"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Admin Player Edit Modal */}
      <PlayerEditModal
        isOpen={Boolean(editingPlayer)}
        onClose={() => setEditingPlayer(null)}
        player={editingPlayer}
        onSaved={fetchPlayers}
      />

    </div>
  );
}
