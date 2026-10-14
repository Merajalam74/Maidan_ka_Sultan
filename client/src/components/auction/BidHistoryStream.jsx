import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { History, TrendingUp, User, Shield } from 'lucide-react';
import { formatINR, formatDateTime } from '../../utils/formatters';
import { useAuction } from '../../context/AuctionSocketContext';

export default function BidHistoryStream({ recentBids }) {
  const { currentPlayer, teams } = useAuction();

  return (
    <div className="glass-panel rounded-2xl p-6 border border-cpl-border shadow-xl">
      <div className="flex items-center justify-between pb-4 border-b border-cpl-border/80 mb-4">
        <div>
          <h3 className="font-display font-extrabold text-sm uppercase tracking-wider text-white flex items-center gap-2">
            <History className="w-4 h-4 text-cpl-gold" />
            <span>Live Bidding Log</span>
          </h3>
          {currentPlayer ? (
            <p className="text-[11px] text-amber-300 font-semibold truncate mt-0.5">
              Active Lot: <span className="text-white">{currentPlayer.name}</span>
            </p>
          ) : (
            <p className="text-[11px] text-slate-500 mt-0.5">No active player round</p>
          )}
        </div>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-cpl-surface text-slate-400 border border-cpl-border">
          {recentBids?.length || 0} Bids
        </span>
      </div>

      {!recentBids || recentBids.length === 0 ? (
        <div className="text-center py-10 text-slate-500 text-xs">
          No bids recorded for this player yet.
        </div>
      ) : (
        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
          <AnimatePresence initial={false}>
            {recentBids.map((bid, index) => {
              // Resolve team object whether bid.teamId is a populated object or a raw ID
              let team = typeof bid.teamId === 'object' && bid.teamId !== null ? bid.teamId : null;
              if (!team || !team.name) {
                const teamIdStr = (bid.teamId?._id || bid.teamId)?.toString();
                team = (teams || []).find((t) => t._id?.toString() === teamIdStr) || {};
              }

              const isLatest = index === 0;

              return (
                <motion.div
                  key={bid._id || bid.idempotencyKey || index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className={`p-2.5 rounded-xl border flex items-center justify-between text-xs transition-colors ${
                    isLatest
                      ? 'bg-cpl-surface/90 border-cpl-gold/50 shadow-gold'
                      : 'bg-cpl-surface/40 border-cpl-border/60 hover:bg-cpl-surface/70'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className="w-7 h-7 rounded-lg bg-cpl-dark flex items-center justify-center border border-cpl-border overflow-hidden shrink-0 shadow-sm"
                      style={{ borderColor: team.primaryColor || '#F59E0B' }}
                    >
                      {team.logoUrl ? (
                        <img src={team.logoUrl} alt={team.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-[10px] font-black text-cpl-gold">{team.shortCode || 'TM'}</span>
                      )}
                    </div>
                    <div className="truncate">
                      <span className="font-bold text-white block truncate leading-tight">
                        {team.name || 'Franchise'}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {formatDateTime(bid.timestamp)}
                      </span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className={`font-display font-black text-sm block ${isLatest ? 'text-cpl-gold' : 'text-slate-200'}`}>
                      {formatINR(bid.bidAmount)}
                    </span>
                    {isLatest && (
                      <span className="text-[9px] uppercase font-bold text-emerald-400">Current High</span>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
