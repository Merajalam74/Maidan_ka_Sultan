import React, { useState } from 'react';
import { Trophy, Users, DollarSign, Award, ChevronDown, ChevronUp, User } from 'lucide-react';
import { useAuction } from '../context/AuctionSocketContext';
import { formatINR, formatINRCompact, formatDateTime } from '../utils/formatters';

export default function TeamsPage() {
  const { teams } = useAuction();
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [roleFilter, setRoleFilter] = useState('all');

  return (
    <div className="space-y-8">
      
      {/* Page Header */}
      <div>
        <h1 className="font-display font-black text-3xl text-white">
          THE SIX FRANCHISES & SQUADS
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Complete roster compositions, remaining purse balances, and player acquisition histories.
        </p>
      </div>

      {/* 6 Team Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {(teams || []).map((team) => {
          const squad = team.squad || [];
          const purchasedCount = team.purchasedCount ?? squad.length;
          const maxSlots = team.maxSquadSize || 15;
          const remainingPurse = team.remainingPurse ?? team.initialPurse;
          const committedSpent = team.committedSpent ?? 0;
          const isSelected = selectedTeam?._id === team._id;

          return (
            <div
              key={team._id}
              className={`glass-panel rounded-2xl border transition-all overflow-hidden ${
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
                <div className="flex items-center gap-4">
                  <div
                    className="w-16 h-16 rounded-2xl overflow-hidden bg-cpl-dark border-2 flex items-center justify-center p-0.5 shrink-0"
                    style={{ borderColor: team.primaryColor || '#F59E0B' }}
                  >
                    {team.logoUrl ? (
                      <img src={team.logoUrl} alt={team.name} className="w-full h-full object-cover rounded-xl" />
                    ) : (
                      <span className="font-display font-black text-lg text-white">{team.shortCode}</span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-cpl-dark/80 text-cpl-gold border border-cpl-border">
                      {team.shortCode}
                    </span>
                    <h3 className="font-display font-black text-lg text-white truncate mt-1">
                      {team.name}
                    </h3>
                    <p className="text-xs text-slate-400">
                      Owner: <strong className="text-slate-200">{team.ownerUserId?.name || 'Assigned Owner'}</strong>
                    </p>
                  </div>
                </div>

                {/* Purse Progress Bar */}
                <div className="mt-5 space-y-1.5">
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
                        width: `${Math.max(5, ((remainingPurse / (team.initialPurse || 10000000)) * 100))}%`,
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-500">
                    <span>Spent: {formatINRCompact(committedSpent)}</span>
                    <span>Initial: {formatINRCompact(team.initialPurse || 10000000)}</span>
                  </div>
                </div>
              </div>

              {/* Quick Stats Bar */}
              <div className="px-6 py-3 bg-cpl-surface/80 border-t border-b border-cpl-border/60 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-500 text-[10px] uppercase font-bold">Roster Size</span>
                  <div className="font-bold text-white">
                    {purchasedCount} / {maxSlots} Players
                  </div>
                </div>
                <button
                  onClick={() => setSelectedTeam(isSelected ? null : team)}
                  className="px-3 py-1.5 rounded-lg bg-cpl-dark hover:bg-cpl-border border border-cpl-border text-cpl-gold text-xs font-bold transition-colors flex items-center gap-1"
                >
                  <span>{isSelected ? 'Hide Squad' : 'View Squad'}</span>
                  {isSelected ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
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
                          <div
                            key={idx}
                            className="p-2.5 rounded-xl bg-cpl-surface border border-cpl-border/60 flex items-center justify-between text-xs"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-8 h-8 rounded-lg overflow-hidden bg-cpl-dark border border-cpl-border shrink-0">
                                {player.photoUrl ? (
                                  <img src={player.photoUrl} alt={player.name} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-slate-500">
                                    <User className="w-4 h-4" />
                                  </div>
                                )}
                              </div>
                              <div className="truncate">
                                <span className="font-bold text-white block truncate">{player.name}</span>
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
                          </div>
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
