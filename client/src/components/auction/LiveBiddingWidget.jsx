import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Gavel, ArrowUpRight, AlertCircle, ShieldAlert, CheckCircle, Zap } from 'lucide-react';
import { formatINR } from '../../utils/formatters';
import { useAuth } from '../../context/AuthContext';
import { useAuction } from '../../context/AuctionSocketContext';

export default function LiveBiddingWidget() {
  const { user, isTeamOwner, assignedTeam, isSuperAdmin } = useAuth();
  const {
    session,
    currentPlayer,
    placeBid,
    tournament,
    bidError,
    clearBidError,
    feasibilityWarning,
    isConnected,
  } = useAuction();

  const [customBidInput, setCustomBidInput] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const currentBid = session?.currentBid || 0;
  const basePrice = currentPlayer?.basePrice || 0;
  const minIncrement = tournament?.minBidIncrement || 1;

  // Next minimum valid bid calculation
  const nextMinBid = currentBid <= 0 ? Math.max(1, basePrice) : currentBid + minIncrement;

  // Determine if active team owner holds the leading bid
  const myTeamId = assignedTeam?._id || user?.assignedTeam?._id;
  const isLeading = session?.leadingTeam && myTeamId && (
    (typeof session.leadingTeam === 'object' ? session.leadingTeam._id?.toString() : session.leadingTeam.toString()) === myTeamId.toString()
  );

  // Available purse of user's team & Squad Feasibility
  const availablePurse = assignedTeam?.remainingPurse ?? 100;
  const minSquadSize = tournament?.minSquadSize || 11;
  const minBasePrice = tournament?.minBasePrice || 1;
  const myPurchasedCount = assignedTeam?.purchasedCount ?? (assignedTeam?.squad?.length || 0);
  const futureSlotsNeeded = Math.max(0, minSquadSize - (myPurchasedCount + 1));
  const futureReserveRequired = futureSlotsNeeded * minBasePrice;
  const maxSafeBid = Math.max(0, availablePurse - futureReserveRequired);

  const proposedBid = customBidInput ? Number(customBidInput.replace(/[^0-9]/g, '')) : nextMinBid;
  const willTriggerDeficit = proposedBid > maxSafeBid && availablePurse >= proposedBid;

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
      
      {/* Top Bar: Floor Status & Next Minimum Bid (Manual Gavel Control) */}
      <div className="flex items-center justify-between pb-4 border-b border-cpl-border/80">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-xl bg-cpl-surface border border-cpl-border text-cpl-gold shadow-sm">
            <Gavel className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
              </span>
              <span className="text-[10px] uppercase font-black tracking-wider text-emerald-400 block">
                BIDDING OPEN
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              Auctioneer Manual Gavel
            </p>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Next Min Bid</span>
          <span className="font-display font-black text-xl text-cpl-gold">
            {formatINR(nextMinBid)}
          </span>
        </div>
      </div>

      {/* Middle Status: Leading Team or Alert */}
      <div className="py-4 space-y-2.5">
        {isLeading ? (
          <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center gap-2.5 text-emerald-300">
            <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
            <span className="text-xs font-bold">Your franchise currently holds the highest bid!</span>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2">
            <span>Increment Step: <strong className="text-white font-bold">{formatINR(minIncrement)}</strong></span>
            {assignedTeam && (
              <div className="flex items-center gap-3">
                <span>Purse: <strong className="text-cpl-gold font-bold">{formatINR(availablePurse)}</strong></span>
                <span className="text-slate-500">|</span>
                <span>Max Safe: <strong className="text-emerald-400 font-bold">{formatINR(maxSafeBid)}</strong></span>
              </div>
            )}
          </div>
        )}

        {/* Real-time Authoritative Feasibility Warning Broadcast from Socket */}
        {feasibilityWarning && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 rounded-xl bg-red-500/15 border border-red-500/40 text-red-300 flex items-start gap-2.5"
          >
            <ShieldAlert className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div className="text-xs leading-relaxed">
              <span className="font-extrabold uppercase tracking-wide block text-[10px] text-red-400 mb-0.5">
                Mathematical Squad Deficit Warning
              </span>
              <span>{feasibilityWarning}</span>
            </div>
          </motion.div>
        )}

        {/* Pre-bid Warning for Current User's Franchise */}
        {!isLeading && willTriggerDeficit && isTeamOwner && (
          <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong>Squad Caution:</strong> Bidding {formatINR(proposedBid)} leaves only {formatINR(availablePurse - proposedBid)}, below the {formatINR(futureReserveRequired)} required to complete min squad ({minSquadSize} players at base price {formatINR(minBasePrice)}).
            </span>
          </div>
        )}
      </div>

      {/* Interactive Bidding Controls */}
      {isTeamOwner || isSuperAdmin ? (
        <div className="space-y-4">
          
          {/* Quick Bid Buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            
            {/* Next Min Bid */}
            <button
              onClick={() => handleQuickBid(nextMinBid)}
              disabled={submitting || isLeading || !currentPlayer || session?.status !== 'active' || availablePurse < nextMinBid}
              className="p-3 rounded-xl bg-gradient-to-br from-cpl-gold to-cpl-gold-dark text-black font-extrabold text-sm hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md flex flex-col items-center justify-center"
            >
              <span className="text-[10px] uppercase tracking-wider font-black opacity-80">Bid Next Min</span>
              <span>{formatINR(nextMinBid)}</span>
            </button>

            {/* Quick +1 CR */}
            <button
              onClick={() => handleQuickBid(nextMinBid + 1)}
              disabled={submitting || isLeading || !currentPlayer || session?.status !== 'active' || availablePurse < (nextMinBid + 1)}
              className="p-3 rounded-xl bg-cpl-surface border border-cpl-border text-white font-bold text-sm hover:border-cpl-gold/50 hover:bg-cpl-surface/80 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex flex-col items-center justify-center"
            >
              <span className="text-[10px] uppercase tracking-wider text-cpl-gold font-bold">+1 CR More</span>
              <span>{formatINR(nextMinBid + 1)}</span>
            </button>

            {/* Quick +2 CR */}
            <button
              onClick={() => handleQuickBid(nextMinBid + 2)}
              disabled={submitting || isLeading || !currentPlayer || session?.status !== 'active' || availablePurse < (nextMinBid + 2)}
              className="p-3 rounded-xl bg-cpl-surface border border-cpl-border text-white font-bold text-sm hover:border-cpl-gold/50 hover:bg-cpl-surface/80 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex flex-col items-center justify-center col-span-2 sm:col-span-1"
            >
              <span className="text-[10px] uppercase tracking-wider text-cpl-gold font-bold">+2 CR More</span>
              <span>{formatINR(nextMinBid + 2)}</span>
            </button>

          </div>

          {/* Custom Bid Input Form */}
          <form onSubmit={handleCustomSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-xs">CR</span>
              <input
                type="number"
                step="1"
                min={nextMinBid}
                value={customBidInput}
                onChange={(e) => setCustomBidInput(e.target.value)}
                placeholder={`Custom Bid (Min ${formatINR(nextMinBid)})`}
                disabled={submitting || isLeading || !currentPlayer || session?.status !== 'active'}
                className="w-full bg-cpl-surface border border-cpl-border rounded-xl pl-9 pr-4 py-2.5 text-sm font-semibold text-white placeholder-slate-500 focus:outline-none focus:border-cpl-gold disabled:opacity-50"
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
            You are viewing in spectator mode. Only authenticated team owners may place live bids.
          </p>
        </div>
      )}

      {/* Connection & Error Status */}
      {bidError && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-3 rounded-xl bg-red-950/80 border border-red-500/50 text-red-200 text-xs flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{bidError}</span>
          </div>
          <button
            onClick={clearBidError}
            className="text-[10px] uppercase font-bold text-red-400 hover:text-white ml-2 underline"
          >
            Dismiss
          </button>
        </motion.div>
      )}

    </div>
  );
}
