import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Trophy, Users, DollarSign, Award, ChevronDown, ChevronUp, User, Crown, ChevronRight, Sparkles } from 'lucide-react';
import { useAuction } from '../context/AuctionSocketContext';
import { formatINR, formatINRCompact, formatDateTime } from '../utils/formatters';
import { getTeamHistoryData } from '../utils/teamHistory';

export default function TeamsPage() {
  const { teams } = useAuction();
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [roleFilter, setRoleFilter] = useState('all');

  return (
    <div className="space-y-8">
      
      {/* Page Header */}
      <div>
        <h1 className="font-display font-black text-3xl text-white">
          THE FRANCHISES & SQUADS
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Complete roster compositions, remaining purse balances, real-time bidding, and squad completion guarantees.
        </p>
      </div>

      {/* Franchise Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {(teams || []).map((team) => {
          const squad = team.squad || [];
          const purchasedCount = team.purchasedCount ?? squad.length;
          const maxSlots = team.maxSquadSize || 15;
          const minSquad = 11;
          const minBase = 1;
          const remainingPurse = team.remainingPurse ?? team.initialPurse;
          const committedSpent = team.committedSpent ?? 0;
          const safeBid = team.maxSafeBid ?? Math.max(0, remainingPurse - Math.max(0, minSquad - (purchasedCount + 1)) * minBase);
          const isSelected = selectedTeam?._id === team._id;

          const history = getTeamHistoryData(team.name) || {};
          const description = team.description || history.description || '';
          const yearsWon = history.yearsWon || [];
          const championshipTitles = (team.championshipTitles && team.championshipTitles.length > 0) ? team.championshipTitles : (history.championshipTitles || []);
          const titleBadge = history.titleBadge || championshipTitles[0] || '';
          const captainPhotoUrl = team.captainPhotoUrl || team.captainPlayer?.photoUrl || team.ownerUserId?.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(team.captainName || team.name)}`;

          return (
            <div
              key={team._id}
              className={`glass-panel rounded-2xl border transition-all overflow-hidden flex flex-col justify-between ${
                isSelected ? 'border-cpl-gold shadow-gold' : 'border-cpl-border hover:border-cpl-gold/40'
              }`}
            >
              {/* Card Banner */}
              <div
                className="p-6 pb-4"
                style={{
                  background: `linear-gradient(135deg, ${team.primaryColor}22 0%, #0D1527 100%)`,
                }}
              >
                {/* Top Badge: Short code & Championship Trophy */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-cpl-dark/80 text-cpl-gold border border-cpl-border">
                    {team.shortCode}
                  </span>

                  {yearsWon.length > 0 ? (
                    <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-amber-600 text-black shadow-md flex items-center gap-1">
                      <Trophy className="w-3 h-3 fill-black" />
                      <span>{yearsWon.join(' & ')} Champions</span>
                    </span>
                  ) : titleBadge ? (
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-cpl-surface border border-cpl-border text-slate-300 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-cpl-gold" />
                      <span className="truncate max-w-[150px]">{titleBadge}</span>
                    </span>
                  ) : null}
                </div>

                {/* Team Identity */}
                <div className="flex items-center gap-4">
                  <Link
                    to={`/teams/${team._id}`}
                    className="w-16 h-16 rounded-2xl overflow-hidden bg-cpl-dark border-2 flex items-center justify-center p-0.5 shrink-0 hover:scale-105 transition-transform"
                    style={{ borderColor: team.primaryColor || '#F59E0B' }}
                    title={`View ${team.name} Profile`}
                  >
                    {team.logoUrl ? (
                      <img src={team.logoUrl} alt={team.name} className="w-full h-full object-cover rounded-xl" />
                    ) : (
                      <span className="font-display font-black text-lg text-white">{team.shortCode}</span>
                    )}
                  </Link>
                  <div className="min-w-0 flex-1">
                    <Link
                      to={`/teams/${team._id}`}
                      className="font-display font-black text-lg text-white hover:text-cpl-gold transition-colors block truncate"
                    >
                      {team.name}
                    </Link>
                    <p className="text-slate-400 text-xs truncate mt-0.5">
                      Owner: <strong className="text-slate-200">{team.ownerUserId?.name || 'Assigned Owner'}</strong>
                    </p>
                  </div>
                </div>

                {/* Captain Row with Matched Photo */}
                <div className="mt-4 p-2.5 rounded-xl bg-cpl-dark/70 border border-cpl-border/70 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-xl overflow-hidden bg-cpl-dark border border-cpl-gold/50 shrink-0">
                      <img
                        src={captainPhotoUrl}
                        alt=""
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(team.captainName || team.name)}`;
                        }}
                      />
                    </div>
                    <div className="truncate">
                      <span className="text-[9px] text-amber-300 font-bold uppercase tracking-wider flex items-center gap-1">
                        <Crown className="w-3 h-3 text-cpl-gold" />
                        <span>Team Captain</span>
                      </span>
                      <span className="font-bold text-white block truncate text-xs">
                        {team.captainName || 'Captain TBA'}
                      </span>
                    </div>
                  </div>

                  <Link
                    to={`/teams/${team._id}`}
                    className="text-[11px] font-bold text-cpl-gold hover:underline shrink-0 flex items-center gap-0.5"
                  >
                    <span>Profile</span>
                    <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>

                {/* Description Snippet */}
                {description && (
                  <p className="text-[11px] text-slate-300/90 line-clamp-2 mt-3 leading-relaxed">
                    {description}
                  </p>
                )}

                {/* Purse Progress Bar */}
                <div className="mt-4 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Remaining Purse</span>
                    <span className="font-display font-extrabold text-cpl-gold text-sm">
                      {formatINR(remainingPurse)}
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-cpl-gold h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.max(5, ((remainingPurse / (team.initialPurse || 100)) * 100))}%`,
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-500">
                    <span>Spent: {formatINRCompact(committedSpent)}</span>
                    <span className="text-emerald-400 font-bold">Max Safe Bid: {formatINRCompact(safeBid)}</span>
                  </div>
                </div>
              </div>

              {/* Quick Stats & Action Footer */}
              <div className="px-5 py-3 bg-cpl-surface/80 border-t border-b border-cpl-border/60 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-500 text-[10px] uppercase font-bold">Roster Size</span>
                  <div className="font-bold text-white text-xs">
                    {purchasedCount} / {maxSlots} Players
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    to={`/teams/${team._id}`}
                    className="px-3 py-1.5 rounded-lg gold-gradient-btn text-xs font-bold transition-transform hover:scale-105 flex items-center gap-1"
                  >
                    <span>Full Profile</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>

                  <button
                    onClick={() => setSelectedTeam(isSelected ? null : team)}
                    className="px-2.5 py-1.5 rounded-lg bg-cpl-dark hover:bg-cpl-border border border-cpl-border text-slate-300 hover:text-white text-xs font-semibold transition-colors flex items-center gap-1"
                    title={isSelected ? 'Hide Roster Drawer' : 'View Quick Roster'}
                  >
                    {isSelected ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Expandable Squad Drawer */}
              {isSelected && (
                <div className="p-4 bg-cpl-dark/90 space-y-3">
                  <div className="flex items-center justify-between text-xs pb-2 border-b border-cpl-border/60">
                    <span className="font-bold text-white uppercase tracking-wider text-[11px]">
                      Drafted Roster ({squad.length})
                    </span>
                  </div>

                  {squad.length === 0 ? (
                    <p className="text-xs text-slate-500 text-center py-4">
                      No players drafted by {team.name} yet.
                    </p>
                  ) : (
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                      {squad.map((item, idx) => {
                        const player = item.player || {};
                        return (
                          <Link
                            key={idx}
                            to={player._id ? `/players/${player._id}` : '#'}
                            className="p-2.5 rounded-xl bg-cpl-surface border border-cpl-border/60 hover:border-cpl-gold/50 flex items-center justify-between text-xs transition-all group"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-8 h-8 rounded-lg overflow-hidden bg-cpl-dark border border-cpl-border group-hover:border-cpl-gold/40 shrink-0 transition-colors">
                                {player.photoUrl ? (
                                  <img src={player.photoUrl} alt={player.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-slate-500">
                                    <User className="w-4 h-4" />
                                  </div>
                                )}
                              </div>
                              <div className="truncate">
                                <span className="font-bold text-white group-hover:text-cpl-gold transition-colors block truncate flex items-center gap-1">
                                  <span className="truncate">{player.name}</span>
                                  <ChevronRight className="w-3 h-3 text-slate-500 group-hover:text-cpl-gold group-hover:translate-x-0.5 transition-all shrink-0" />
                                </span>
                                <span className="text-[10px] text-slate-400">
                                  {player.role} • {player.department || 'General'}
                                </span>
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="font-display font-extrabold text-cpl-gold block text-xs">
                                {formatINR(item.price)}
                              </span>
                              <span className="text-[9px] text-slate-500">
                                {formatDateTime(item.timestamp)}
                              </span>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

            </div>
          );
        })}
      </div>

    </div>
  );
}
