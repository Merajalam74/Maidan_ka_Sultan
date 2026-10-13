import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Timer, ArrowUpRight, AlertCircle, ShieldAlert, CheckCircle, Zap } from 'lucide-react';
import { formatINR, formatSeconds } from '../../utils/formatters';
import { useAuth } from '../../context/AuthContext';
import { useAuction } from '../../context/AuctionSocketContext';

export default function LiveBiddingWidget() {
  const { user, isTeamOwner, assignedTeam, isSuperAdmin } = useAuth();
  const {
    session,
    currentPlayer,
    remainingSeconds,
    placeBid,
    tournament,
    bidError,
    clearBidError,
    isConnected,
  } = useAuction();

  const [customBidInput, setCustomBidInput] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const currentBid = session?.currentBid || 0;
  const basePrice = currentPlayer?.basePrice || 0;
  const minIncrement = tournament?.minBidIncrement || 50000;

  // Next minimum valid bid calculation
  const nextMinBid = currentBid <= 0 ? Math.max(1, basePrice) : currentBid + minIncrement;

  // Determine if active team owner holds the leading bid
  const myTeamId = assignedTeam?._id || user?.assignedTeam?._id;
  const isLeading = session?.leadingTeam && myTeamId && (
    (typeof session.leadingTeam === 'object' ? session.leadingTeam._id?.toString() : session.leadingTeam.toString()) === myTeamId.toString()
  );

  // Available purse of user's team
  const availablePurse = assignedTeam?.remainingPurse ?? 10000000;

  // Countdown urgency
  const isUrgentTimer = remainingSeconds <= 5 && remainingSeconds > 0;
  const isTimerExpired = remainingSeconds <= 0 && session?.status === 'active';

  const handleQuickBid = async (amount) => {
    if (submitting || !currentPlayer) return;
    try {
      setSubmitting(true);
      clearBidError();
      await placeBid(amount);
      setCustomBidInput('');
    } catch (err) {
      // Handled via context & error toast
    } finally {
      setSubmitting(false);
    }
  };

  const handleCustomSubmit = (e) => {
    e.preventDefault();
    const val = Number(customBidInput.replace(/[^0-9]/g, ''));
    if (!val || val < nextMinBid) return;
    handleQuickBid(val);
  };

  return (
    <div className="glass-panel rounded-2xl p-6 border border-cpl-border shadow-2xl relative">
      
      {/* Top Bar: Live Timer & Connection Status */}
      <div className="flex items-center justify-between pb-5 border-b border-cpl-border/80">
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-xl ${isUrgentTimer ? 'bg-red-500/20 text-red-400 animate-pulse' : 'bg-cpl-surface text-cpl-gold'}`}>
            <Timer className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Countdown</span>
            <div className={`font-mono text-2xl font-black ${isUrgentTimer ? 'text-red-400 animate-pulse-fast' : 'text-white'}`}>
              {session?.status === 'paused' ? 'PAUSED' : formatSeconds(remainingSeconds)}
            </div>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Next Minimum Bid</span>
          <span className="font-display font-extrabold text-xl text-cpl-gold">
            {formatINR(nextMinBid)}
          </span>
        </div>
      </div>

      {/* Middle Status: Leading Team or Alert */}
      <div className="py-4">
        {isLeading ? (
          <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center gap-2.5 text-emerald-300">
            <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
            <span className="text-xs font-bold">Your team is currently holding the highest bid!</span>
          </div>
        ) : isTimerExpired ? (
          <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center gap-2.5 text-amber-300">
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
            <span className="text-xs font-bold">Timer expired! Awaiting auctioneer confirmation.</span>
          </div>
        ) : (
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Increment Step: <strong className="text-white font-bold">{formatINR(minIncrement)}</strong></span>
            {assignedTeam && (
              <span>Your Purse: <strong className="text-cpl-gold font-bold">{formatINR(availablePurse)}</strong></span>
            )}
          </div>
        )}
      </div>

      {/* Interactive Bidding Controls */}
      {isTeamOwner || isSuperAdmin ? (
        <div className="space-y-4">
          
          {/* Quick Bid Buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            
            {/* Next Min Bid (+₹50k or Base) */}
            <button
              onClick={() => handleQuickBid(nextMinBid)}
              disabled={submitting || isLeading || !currentPlayer || session?.status !== 'active' || availablePurse < nextMinBid}
              className="p-3 rounded-xl bg-gradient-to-br from-cpl-gold to-cpl-gold-dark text-black font-extrabold text-sm hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md flex flex-col items-center justify-center"
            >
              <span className="text-[10px] uppercase tracking-wider font-black opacity-80">Bid Next Min</span>
              <span>{formatINR(nextMinBid)}</span>
            </button>

            {/* Quick +₹1,00,000 */}
            <button
              onClick={() => handleQuickBid(nextMinBid + 50000)}
              disabled={submitting || isLeading || !currentPlayer || session?.status !== 'active' || availablePurse < (nextMinBid + 50000)}
              className="p-3 rounded-xl bg-cpl-surface border border-cpl-border text-white font-bold text-sm hover:border-cpl-gold/50 hover:bg-cpl-surface/80 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex flex-col items-center justify-center"
            >
              <span className="text-[10px] uppercase tracking-wider text-cpl-gold font-bold">+₹50,000 More</span>
              <span>{formatINR(nextMinBid + 50000)}</span>
            </button>

            {/* Quick +₹2,00,000 */}
            <button
              onClick={() => handleQuickBid(nextMinBid + 100000)}
              disabled={submitting || isLeading || !currentPlayer || session?.status !== 'active' || availablePurse < (nextMinBid + 100000)}
              className="p-3 rounded-xl bg-cpl-surface border border-cpl-border text-white font-bold text-sm hover:border-cpl-gold/50 hover:bg-cpl-surface/80 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex flex-col items-center justify-center col-span-2 sm:col-span-1"
            >
              <span className="text-[10px] uppercase tracking-wider text-cpl-gold font-bold">+₹1,00,000 More</span>
              <span>{formatINR(nextMinBid + 100000)}</span>
            </button>

          </div>

          {/* Custom Bid Input Form */}
          <form onSubmit={handleCustomSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-sm">₹</span>
              <input
                type="number"
                step="1000"
                min={nextMinBid}
                value={customBidInput}
                onChange={(e) => setCustomBidInput(e.target.value)}
                placeholder={`Custom Bid (Min ${formatINR(nextMinBid)})`}
                disabled={submitting || isLeading || !currentPlayer || session?.status !== 'active'}
                className="w-full bg-cpl-surface border border-cpl-border rounded-xl pl-8 pr-4 py-2.5 text-sm font-semibold text-white placeholder-slate-500 focus:outline-none focus:border-cpl-gold disabled:opacity-50"
              />
            </div>
            <button
              type="submit"
              disabled={submitting || isLeading || !currentPlayer || !customBidInput || Number(customBidInput) < nextMinBid || availablePurse < Number(customBidInput)}
              className="px-5 py-2.5 rounded-xl bg-cpl-surface border border-cpl-gold text-cpl-gold font-extrabold text-xs uppercase tracking-wider hover:bg-cpl-gold hover:text-black disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Submit Bid
            </button>
          </form>

        </div>
      ) : (
        <div className="p-4 rounded-xl bg-cpl-surface/80 border border-cpl-border text-center">
          <p className="text-xs text-slate-400">
            {user ? (
              <span>You are viewing in spectator mode. Only authenticated team owners may place live bids.</span>
            ) : (
              <span>
                Spectating Public Live Scoreboard.{' '}
                <a href="/login" className="text-cpl-gold font-bold underline ml-1">
                  Sign in as Team Owner
                </a>{' '}
                to participate.
              </span>
            )}
          </p>
        </div>
      )}

    </div>
  );
}
