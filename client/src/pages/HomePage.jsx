import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Trophy,
  Radio,
  Users,
  DollarSign,
  Award,
  ChevronRight,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Sparkles,
  Crown,
} from 'lucide-react';
import api from '../services/api';
import { formatINR, formatINRCompact } from '../utils/formatters';
import { useAuction } from '../context/AuctionSocketContext';

export default function HomePage() {
  const { tournament, session, teams } = useAuction();
  const [summary, setSummary] = useState(null);
  const [recentPurchases, setRecentPurchases] = useState([]);

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        const [sumRes, purchRes] = await Promise.all([
          api.get('/reports/summary'),
          api.get('/reports/purchases'),
        ]);
        if (sumRes.data?.success) setSummary(sumRes.data.summary);
        if (purchRes.data?.success) setRecentPurchases(purchRes.data.purchases?.slice(0, 6) || []);
      } catch (err) {
        console.warn('Home data error:', err.message);
      }
    };
    fetchHomeData();
  }, []);

  const isLive = session?.status === 'active';
  const isPaused = session?.status === 'paused';
  const isCompleted = tournament?.status === 'completed';

  return (
    <div className="space-y-16">
      
      {/* Hero Section: Premium Stadium Banner */}
      <section className="relative rounded-3xl overflow-hidden glass-panel border border-cpl-border p-8 sm:p-12 lg:p-16 text-center shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-b from-cpl-gold/10 via-transparent to-cpl-dark/80 pointer-events-none" />

        <div className="relative z-10 max-w-3xl mx-auto space-y-6">
          
          {/* Status Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cpl-surface border border-cpl-gold/40 text-xs font-bold uppercase tracking-widest shadow-md">
            <span className="relative flex h-2.5 w-2.5">
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  isLive ? 'bg-emerald-400' : isPaused ? 'bg-amber-400' : 'bg-blue-400'
                }`}
              />
              <span
                className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                  isLive ? 'bg-emerald-500' : isPaused ? 'bg-amber-500' : 'bg-blue-500'
                }`}
              />
            </span>
            <span className="text-white">
              {isLive
                ? 'AUCTION IN PROGRESS — LIVE'
                : isPaused
                ? 'AUCTION TEMPORARILY PAUSED'
                : isCompleted
                ? 'TOURNAMENT AUCTION CONCLUDED'
                : 'UPCOMING TOURNAMENT AUCTION'}
            </span>
          </div>

          <h1 className="font-display font-black text-4xl sm:text-6xl lg:text-7xl tracking-tight text-white leading-none">
            {tournament?.name ? tournament.name.split('-')[0].trim() : 'MAIDAN KE SULTAN'}
            <span className="block gold-gradient-text mt-2 font-extrabold text-3xl sm:text-5xl lg:text-6xl">
              SEASON 5 LIVE AUCTION
            </span>
          </h1>

          <p className="text-slate-300 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
            The ultimate cricket battleground. Five fierce franchises compete in real-time
            bidding to construct their championship squads with real-time bidding and strict purse management.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <Link
              to="/live"
              className="gold-gradient-btn px-8 py-4 rounded-xl text-sm font-black uppercase tracking-wider shadow-gold-lg flex items-center gap-2 group transform hover:scale-105"
            >
              <Radio className="w-5 h-5 text-black animate-pulse" />
              <span>Enter Live Auction Arena</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              to="/teams"
              className="px-6 py-4 rounded-xl bg-cpl-surface border border-cpl-border hover:border-cpl-gold text-slate-200 hover:text-white font-bold text-sm tracking-wider uppercase transition-colors"
            >
              View 5 Franchises
            </Link>
          </div>

        </div>
      </section>

      {/* Tournament Stat Metrics */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-panel p-6 rounded-2xl border border-cpl-border text-center">
          <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">Registered Players</span>
          <div className="text-3xl font-display font-black text-white mt-1">
            {summary?.totalPlayers ?? 15}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Official Tournament Pool</span>
        </div>

        <div className="glass-panel p-6 rounded-2xl border border-cpl-border text-center">
          <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">Players Sold</span>
          <div className="text-3xl font-display font-black text-emerald-400 mt-1">
            {summary?.soldPlayers ?? 0}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            {summary?.availablePlayers ?? 15} Available
          </span>
        </div>

        <div className="glass-panel p-6 rounded-2xl border border-cpl-border text-center">
          <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">Participating Teams</span>
          <div className="text-3xl font-display font-black text-cpl-gold mt-1">
            {teams?.length || 5}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">100 Credits Purse Each</span>
        </div>

        <div className="glass-panel p-6 rounded-2xl border border-cpl-border text-center">
          <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">Total Auction Spend</span>
          <div className="text-3xl font-display font-black text-white mt-1">
            {formatINRCompact(summary?.totalExpenditure || 0)}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Committed Across Teams</span>
        </div>
      </section>

      {/* Five Teams Showcase */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display font-black text-2xl text-white">The 5 Franchises</h2>
            <p className="text-xs text-slate-400">Official teams participating in Maidan ke Sultan (Season 5)</p>
          </div>
          <Link to="/teams" className="text-cpl-gold hover:underline text-xs font-bold uppercase tracking-wider flex items-center gap-1">
            <span>All Rosters</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {(teams || []).map((team) => (
            <div
              key={team._id}
              className="glass-panel glass-panel-hover p-6 rounded-2xl border border-cpl-border relative overflow-hidden"
            >
              <div className="flex items-center gap-4">
                <div
                  className="w-14 h-14 rounded-2xl overflow-hidden bg-cpl-dark border-2 p-0.5 shrink-0"
                  style={{ borderColor: team.primaryColor || '#F59E0B' }}
                >
                  {team.logoUrl ? (
                    <img src={team.logoUrl} alt={team.name} className="w-full h-full object-cover rounded-xl" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-black text-cpl-gold">
                      {team.shortCode}
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <h3 className="font-display font-extrabold text-base text-white truncate">
                    {team.name}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Owner: {team.ownerUserId?.name || 'Assigned Owner'}
                  </p>
                  {team.captainName && (
                    <p className="text-[11px] text-amber-300 font-bold flex items-center gap-1 mt-0.5">
                      <Crown className="w-3 h-3 text-cpl-gold shrink-0" />
                      <span>Captain: {team.captainName}</span>
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-5 pt-4 border-t border-cpl-border/70 text-xs">
                <div>
                  <span className="text-slate-500 text-[10px] uppercase font-bold">Remaining Purse</span>
                  <div className="font-display font-black text-cpl-gold text-sm mt-0.5">
                    {formatINR(team.remainingPurse)}
                  </div>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] uppercase font-bold">Players Drafted</span>
                  <div className="font-bold text-white text-sm mt-0.5">
                    {team.purchasedCount || (team.squad ? team.squad.length : 0)} / {team.maxSquadSize || 15}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Recently Sold Players */}
      {recentPurchases.length > 0 && (
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display font-black text-2xl text-white">Recent Auction Signings</h2>
              <p className="text-xs text-slate-400">Latest players sold under the official auction gavel</p>
            </div>
            <Link to="/history" className="text-cpl-gold hover:underline text-xs font-bold uppercase tracking-wider flex items-center gap-1">
              <span>Full History</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentPurchases.map((purchase) => {
              const player = purchase.playerId || {};
              const team = purchase.winningTeamId || {};
              return (
                <div
                  key={purchase._id}
                  className="glass-panel p-4 rounded-xl border border-cpl-border flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-xl overflow-hidden bg-cpl-dark border border-cpl-border shrink-0">
                      {player.photoUrl ? (
                        <img src={player.photoUrl} alt={player.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-500 font-bold text-xs">
                          {player.name?.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div className="truncate">
                      <h4 className="font-bold text-sm text-white truncate">{player.name}</h4>
                      <span className="text-xs text-emerald-400 font-semibold block truncate">
                        Sold to {team.name}
                      </span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="font-display font-black text-sm text-cpl-gold block">
                      {formatINR(purchase.finalPurchasePrice)}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Base: {formatINR(player.basePrice)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Tournament Rules & Information */}
      <section className="glass-panel p-8 rounded-3xl border border-cpl-border">
        <h3 className="font-display font-black text-xl text-white mb-4 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-cpl-gold" />
          <span>Tournament Bidding Rules & Regulations</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-slate-300 leading-relaxed">
          <div className="space-y-2">
            <h4 className="font-bold text-white text-sm">1. Purse & Squad Limits</h4>
            <p>
              Each participating franchise starts with an authoritative purse of 100 Credits.
              Teams may draft up to 15 players with a minimum squad requirement of 11.
            </p>
          </div>
          <div className="space-y-2">
            <h4 className="font-bold text-white text-sm">2. Authoritative Bidding</h4>
            <p>
              Opening bids must match or exceed the player's credit base price. Subsequent bids increase by configured
              credit increments (1 Credit minimum). Teams cannot bid more than their available remaining purse.
            </p>
          </div>
          <div className="space-y-2">
            <h4 className="font-bold text-white text-sm">3. Gavel Settlement</h4>
            <p>
              The auctioneer governs the live lot. When the countdown expires, the player is confirmed SOLD or
              UNSOLD. All settlements are atomic and audited with real-time purse reconciliation.
            </p>
          </div>
        </div>
      </section>

    </div>
  );
}
