import React from 'react';
import { motion } from 'framer-motion';
import { Users, DollarSign, Award, Trophy, Crown } from 'lucide-react';
import { formatINRCompact } from '../../utils/formatters';

export default function SixTeamGrid({ teams, leadingTeamId }) {
  if (!teams || teams.length === 0) {
    return (
      <div className="text-center p-6 text-slate-500 text-xs">
        No teams registered in tournament.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 2xl:grid-cols-5 gap-3.5">
      {teams.map((team) => {
        const isLeading = leadingTeamId && (
          (typeof leadingTeamId === 'object' ? leadingTeamId._id?.toString() : leadingTeamId.toString()) === team._id.toString()
        );

        const purchasedCount = team.purchasedCount ?? (team.squad ? team.squad.length : 0);
        const maxSlots = team.maxSquadSize || 15;
        const remainingSlots = Math.max(0, maxSlots - purchasedCount);
        const remainingPurse = team.remainingPurse ?? team.initialPurse;

        // Mathematical squad feasibility calculation (tournament credits)
        const minSquad = 11;
        const minBase = team.minBasePrice || 1;
        const remainingNeededForMin = Math.max(0, minSquad - purchasedCount);
        const minReserveRequired = team.minReserveNeeded ?? (remainingNeededForMin * minBase);
        const safeBid = team.maxSafeBid ?? Math.max(0, remainingPurse - Math.max(0, minSquad - (purchasedCount + 1)) * minBase);
        const deficit = team.deficit ?? (remainingPurse < minReserveRequired ? minReserveRequired - remainingPurse : 0);
        const hasDeficit = deficit > 0;

        return (
          <motion.div
            key={team._id}
            animate={isLeading ? { scale: [1, 1.02, 1] } : {}}
            transition={{ duration: 1.5, repeat: isLeading ? Infinity : 0 }}
            className={`p-4 rounded-2xl transition-all relative overflow-hidden flex flex-col justify-between border ${
              isLeading
                ? 'bg-gradient-to-b from-cpl-surface to-cpl-card border-cpl-gold shadow-gold'
                : 'glass-panel border-cpl-border hover:border-cpl-gold/30'
            }`}
          >
            {/* Top Leading Badge */}
            {isLeading && (
              <div className="absolute top-0 right-0 px-2.5 py-0.5 bg-cpl-gold text-black font-black text-[9px] uppercase tracking-wider rounded-bl-lg shadow-sm">
                HIGHEST BID
              </div>
            )}

            {/* Header: Logo & Team Name */}
            <div>
              <div className="flex items-center gap-2.5 mb-2.5">
                <div
                  className="w-9 h-9 rounded-xl overflow-hidden border border-cpl-border flex items-center justify-center bg-cpl-dark shrink-0 shadow-sm"
                  style={{ borderColor: team.primaryColor || '#F59E0B' }}
                >
                  {team.logoUrl ? (
                    <img src={team.logoUrl} alt={team.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xs font-black text-white">{team.shortCode}</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h4
                    className="font-display font-extrabold text-sm text-white truncate leading-snug"
                    title={team.name}
                  >
                    {team.name}
                  </h4>
                  <span className="text-[11px] font-bold text-slate-400">{team.shortCode}</span>
                </div>
              </div>

              {team.captainName && (
                <div className="flex items-center gap-1.5 text-[10px] text-amber-300 font-bold px-2 py-0.5 rounded-lg bg-amber-500/10 border border-amber-500/20 mb-2.5 truncate">
                  <Crown className="w-3 h-3 text-cpl-gold shrink-0" />
                  <span className="truncate" title={`Captain: ${team.captainName}`}>C: {team.captainName}</span>
                </div>
              )}

              {/* Purse & Budget Display */}
              <div className="my-2 p-2.5 rounded-xl bg-cpl-dark/60 border border-cpl-border/50">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-medium">Purse Left</span>
                  <span className="font-extrabold text-cpl-gold text-sm">
                    {formatINRCompact(remainingPurse)}
                  </span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-2">
                  <div
                    className="bg-cpl-gold h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.max(5, Math.min(100, ((remainingPurse / (team.initialPurse || 100)) * 100)))}%`,
                    }}
                  />
                </div>
                {/* Max Safe Bid indicator */}
                <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2 pt-1.5 border-t border-slate-800/80">
                  <span>Max Safe Bid:</span>
                  <span className="font-bold text-emerald-400">
                    {formatINRCompact(safeBid)}
                  </span>
                </div>
              </div>

              {/* Mathematical Deficit Warning Badge */}
              {hasDeficit && (
                <div className="mb-2.5 p-2 rounded-lg bg-red-500/15 border border-red-500/30 text-[10px] text-red-300 font-semibold flex items-center gap-1.5">
                  <span className="shrink-0">⚠️ Deficit:</span>
                  <span className="truncate">-{formatINRCompact(deficit)} for min squad</span>
                </div>
              )}
            </div>

            {/* Bottom Stats: Squad slots */}
            <div className="pt-2.5 border-t border-cpl-border/50 flex items-center justify-between text-[11px]">
              <span className="text-slate-400 font-medium">Squad:</span>
              <span className="font-bold text-white">
                {purchasedCount} / {maxSlots}
                <span className="text-[10px] text-slate-500 font-normal ml-1.5">({remainingSlots} left)</span>
              </span>
            </div>

          </motion.div>
        );
      })}
    </div>
  );
}
