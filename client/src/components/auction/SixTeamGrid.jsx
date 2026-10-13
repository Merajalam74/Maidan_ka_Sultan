import React from 'react';
import { motion } from 'framer-motion';
import { Users, DollarSign, Award, Trophy } from 'lucide-react';
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
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {teams.slice(0, 6).map((team) => {
        const isLeading = leadingTeamId && (
          (typeof leadingTeamId === 'object' ? leadingTeamId._id?.toString() : leadingTeamId.toString()) === team._id.toString()
        );

        const purchasedCount = team.purchasedCount ?? (team.squad ? team.squad.length : 0);
        const maxSlots = team.maxSquadSize || 15;
        const remainingSlots = Math.max(0, maxSlots - purchasedCount);
        const remainingPurse = team.remainingPurse ?? team.initialPurse;

        return (
          <motion.div
            key={team._id}
            animate={isLeading ? { scale: [1, 1.03, 1] } : {}}
            transition={{ duration: 1.5, repeat: isLeading ? Infinity : 0 }}
            className={`p-3.5 rounded-xl transition-all relative overflow-hidden flex flex-col justify-between border ${
              isLeading
                ? 'bg-gradient-to-b from-cpl-surface to-cpl-card border-cpl-gold shadow-gold'
                : 'glass-panel border-cpl-border hover:border-cpl-gold/30'
            }`}
          >
            {/* Top Leading Badge */}
            {isLeading && (
              <div className="absolute top-0 right-0 px-2 py-0.5 bg-cpl-gold text-black font-black text-[9px] uppercase tracking-wider rounded-bl-lg shadow-sm">
                HIGHEST BID
              </div>
            )}

            {/* Header: Logo & Short Code */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="w-8 h-8 rounded-lg overflow-hidden border border-cpl-border flex items-center justify-center bg-cpl-dark shrink-0"
                  style={{ borderColor: team.primaryColor || '#F59E0B' }}
                >
                  {team.logoUrl ? (
                    <img src={team.logoUrl} alt={team.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[10px] font-black text-white">{team.shortCode}</span>
                  )}
                </div>
                <div className="min-w-0">
                  <h4 className="font-display font-extrabold text-xs text-white truncate leading-tight">
                    {team.name}
                  </h4>
                  <span className="text-[10px] font-bold text-slate-400">{team.shortCode}</span>
                </div>
              </div>

              {/* Purse & Budget Display */}
              <div className="my-2.5 p-2 rounded-lg bg-cpl-dark/60 border border-cpl-border/50">
                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span>Purse Left</span>
                  <span className="font-extrabold text-cpl-gold text-xs">
                    {formatINRCompact(remainingPurse)}
                  </span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1.5">
                  <div
                    className="bg-cpl-gold h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.max(5, ((remainingPurse / (team.initialPurse || 10000000)) * 100))}%`,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Bottom Stats: Squad slots */}
            <div className="pt-2 border-t border-cpl-border/50 flex items-center justify-between text-[10px]">
              <span className="text-slate-400">Squad:</span>
              <span className="font-bold text-white">
                {purchasedCount} / {maxSlots}
                <span className="text-[9px] text-slate-500 font-normal ml-1">({remainingSlots} left)</span>
              </span>
            </div>

          </motion.div>
        );
      })}
    </div>
  );
}
