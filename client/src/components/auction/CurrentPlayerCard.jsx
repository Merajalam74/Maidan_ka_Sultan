import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Sparkles, User, Award, Activity } from 'lucide-react';
import { formatINR } from '../../utils/formatters';

export default function CurrentPlayerCard({ player, session, leadingTeam }) {
  if (!player) {
    return (
      <div className="glass-panel rounded-2xl p-8 text-center flex flex-col items-center justify-center min-h-[460px] border border-cpl-border">
        <div className="w-20 h-20 rounded-full bg-cpl-surface border border-cpl-border flex items-center justify-center mb-4 text-slate-500">
          <User className="w-10 h-10" />
        </div>
        <h3 className="font-display font-bold text-xl text-white">No Player Nominated</h3>
        <p className="text-sm text-slate-400 mt-2 max-w-sm">
          The auctioneer will nominate the next player shortly. Stand by for the next live bidding round.
        </p>
      </div>
    );
  }

  const roleColors = {
    'Batsman': 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    'Bowler': 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    'All-Rounder': 'bg-amber-500/15 text-cpl-gold border-amber-500/30',
    'Wicket-Keeper': 'bg-purple-500/15 text-purple-400 border-purple-500/30',
  };

  const roleBadge = roleColors[player.role] || 'bg-slate-500/15 text-slate-300 border-slate-500/30';

  return (
    <div className="glass-panel rounded-2xl overflow-hidden border border-cpl-border shadow-2xl relative">
      {/* Background Ambience Gradient */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-cpl-gold/5 rounded-full blur-3xl pointer-events-none" />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 sm:p-8">
        
        {/* Left: Player Photo & Identity */}
        <div className="lg:col-span-5 flex flex-col items-center text-center">
          <div className="relative group w-52 h-52 sm:w-60 sm:h-60 rounded-2xl overflow-hidden border-2 border-cpl-gold/40 shadow-stadium bg-cpl-surface">
            {player.photoUrl ? (
              <img
                src={player.photoUrl}
                alt={player.name}
                className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(player.name)}`;
                }}
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 text-slate-400">
                <User className="w-20 h-20 text-slate-600 mb-2" />
                <span className="text-xs uppercase font-bold tracking-wider">No Photo Available</span>
              </div>
            )}
            
            {/* Category Ribbon */}
            <div className="absolute top-3 left-3 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-cpl-dark/85 backdrop-blur-md text-cpl-gold border border-cpl-gold/30">
              {player.category || 'Category A'}
            </div>

            {/* External ID */}
            {player.externalId && (
              <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-md text-[10px] font-mono font-bold bg-cpl-dark/80 text-slate-300 border border-cpl-border">
                {player.externalId}
              </div>
            )}
          </div>

          {/* Academic Dept & Year */}
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-cpl-surface border border-cpl-border text-slate-300">
              {player.department || 'General'}
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-cpl-surface border border-cpl-border text-slate-400">
              {player.academicYear || 'N/A'}
            </span>
          </div>
        </div>

        {/* Right: Player Profile, Base Price, and Current Bid Spotlight */}
        <div className="lg:col-span-7 flex flex-col justify-between">
          <div>
            {/* Role & Styles */}
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <span className={`px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider border ${roleBadge}`}>
                {player.role}
              </span>
              {player.battingStyle && (
                <span className="text-xs text-slate-400 font-medium">
                  {player.battingStyle}
                </span>
              )}
              {player.bowlingStyle && (
                <span className="text-xs text-slate-500 font-medium">
                  • {player.bowlingStyle}
                </span>
              )}
            </div>

            {/* Player Name */}
            <h2 className="font-display font-extrabold text-2xl sm:text-3xl lg:text-4xl text-white tracking-wide">
              {player.name}
            </h2>

            {/* Performance Stats Pills */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-5">
              <div className="p-2.5 rounded-xl bg-cpl-surface/80 border border-cpl-border/80 text-center">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Matches</span>
                <span className="text-base font-extrabold text-white">{player.stats?.matches || 0}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-cpl-surface/80 border border-cpl-border/80 text-center">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Runs</span>
                <span className="text-base font-extrabold text-white">{player.stats?.runs || 0}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-cpl-surface/80 border border-cpl-border/80 text-center">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Wickets</span>
                <span className="text-base font-extrabold text-white">{player.stats?.wickets || 0}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-cpl-surface/80 border border-cpl-border/80 text-center">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Strike Rate</span>
                <span className="text-base font-extrabold text-white">{player.stats?.strikeRate || 0}</span>
              </div>
            </div>
          </div>

          {/* Pricing Showcase: Base Price & Current High Bid */}
          <div className="mt-6 pt-6 border-t border-cpl-border/80">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Base Price */}
              <div className="p-4 rounded-xl bg-cpl-surface/60 border border-cpl-border">
                <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">Base Price</span>
                <div className="text-xl font-bold text-slate-200 mt-1">
                  {formatINR(player.basePrice)}
                </div>
              </div>

              {/* Current High Bid with animated change */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-cpl-surface to-cpl-card border border-cpl-gold/40 shadow-gold relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase font-bold text-cpl-gold tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    Current Bid
                  </span>
                  {leadingTeam && (
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      Leading
                    </span>
                  )}
                </div>

                <motion.div
                  key={session?.currentBid}
                  initial={{ scale: 1.15, color: '#FBBF24' }}
                  animate={{ scale: 1, color: '#FFFFFF' }}
                  transition={{ duration: 0.3 }}
                  className="text-2xl sm:text-3xl font-black font-display tracking-tight mt-1"
                >
                  {session?.currentBid > 0 ? formatINR(session.currentBid) : formatINR(player.basePrice)}
                </motion.div>

                {/* Leading Team Display */}
                {leadingTeam ? (
                  <div className="mt-2 flex items-center gap-2 pt-2 border-t border-cpl-border/60">
                    {leadingTeam.logoUrl && (
                      <img
                        src={leadingTeam.logoUrl}
                        alt={leadingTeam.name}
                        className="w-5 h-5 rounded-full object-cover"
                      />
                    )}
                    <span className="text-xs font-bold text-cpl-gold truncate">{leadingTeam.name}</span>
                  </div>
                ) : (
                  <div className="mt-2 text-[11px] text-slate-500 pt-2 border-t border-cpl-border/60">
                    Awaiting opening bid (min: {formatINR(player.basePrice)})
                  </div>
                )}
              </div>

            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
