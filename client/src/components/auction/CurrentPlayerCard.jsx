import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Sparkles, User, Award, ExternalLink } from 'lucide-react';
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
          <Link
            to={`/players/${player._id}`}
            target="_blank"
            rel="noopener noreferrer"
            title="Open Dedicated Player Profile in New Tab"
            className="relative group w-52 h-52 sm:w-60 sm:h-60 rounded-2xl overflow-hidden border-2 border-cpl-gold/40 hover:border-cpl-gold shadow-stadium bg-cpl-surface block cursor-pointer transition-all"
          >
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
            
            {/* View Profile Hover Banner */}
            <div className="absolute inset-0 bg-cpl-dark/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
              <span className="px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-cpl-dark/90 text-cpl-gold border border-cpl-gold/50 backdrop-blur-md flex items-center gap-1.5">
                <span>View Profile</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </span>
            </div>

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
          </Link>

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

            {/* Player Name & Contact */}
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <Link
                to={`/players/${player._id}`}
                target="_blank"
                rel="noopener noreferrer"
                title="Open Dedicated Player Profile in New Tab"
                className="font-display font-extrabold text-2xl sm:text-3xl lg:text-4xl text-white hover:text-cpl-gold transition-colors tracking-wide flex items-center gap-2 group"
              >
                <span>{player.name}</span>
                <ExternalLink className="w-5 h-5 text-slate-500 group-hover:text-cpl-gold transition-colors" />
              </Link>
              {player.phoneNumber && (
                <span className="text-xs font-mono font-medium text-slate-400 bg-cpl-surface/80 px-2.5 py-1 rounded-md border border-cpl-border">
                  📱 {player.phoneNumber}
                </span>
              )}
            </div>

            {/* Academic & Profile Details */}
            <div className="mt-4 flex flex-wrap gap-2 text-xs">
              <div className="px-3 py-1.5 rounded-lg bg-cpl-surface/80 border border-cpl-border text-slate-300">
                <span className="text-slate-500 font-bold block text-[10px] uppercase">Category</span>
                <span className="font-semibold text-white">{player.category || 'Category A'}</span>
              </div>
              <div className="px-3 py-1.5 rounded-lg bg-cpl-surface/80 border border-cpl-border text-slate-300">
                <span className="text-slate-500 font-bold block text-[10px] uppercase">Branch / Dept</span>
                <span className="font-semibold text-white">{player.department || 'General'}</span>
              </div>
              <div className="px-3 py-1.5 rounded-lg bg-cpl-surface/80 border border-cpl-border text-slate-300">
                <span className="text-slate-500 font-bold block text-[10px] uppercase">Academic Year</span>
                <span className="font-semibold text-white">{player.academicYear || 'N/A'}</span>
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
                  {(session?.currentBid > 0 && (leadingTeam || session?.leadingTeam || session?.leadingTeamId)) && (
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
                {session?.currentBid > 0 && (leadingTeam || session?.leadingTeam || session?.leadingTeamId) ? (
                  (() => {
                    const activeTeam = leadingTeam || session?.leadingTeam || session?.leadingTeamId;
                    return (
                      <div className="mt-2 flex items-center gap-2 pt-2 border-t border-cpl-border/60">
                        {activeTeam.logoUrl ? (
                          <img
                            src={activeTeam.logoUrl}
                            alt={activeTeam.name}
                            className="w-5 h-5 rounded-full object-cover shrink-0"
                          />
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-cpl-gold/20 text-cpl-gold text-[9px] font-black flex items-center justify-center shrink-0">
                            {activeTeam.shortCode || 'TM'}
                          </div>
                        )}
                        <span className="text-xs font-bold text-cpl-gold truncate">{activeTeam.name}</span>
                        {activeTeam.shortCode && (
                          <span className="text-[10px] text-slate-400 font-semibold">({activeTeam.shortCode})</span>
                        )}
                      </div>
                    );
                  })()
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
