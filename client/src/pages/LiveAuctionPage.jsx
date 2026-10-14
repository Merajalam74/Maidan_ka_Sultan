import React, { useState } from 'react';
import { useAuction } from '../context/AuctionSocketContext';
import { useAuth } from '../context/AuthContext';
import CurrentPlayerCard from '../components/auction/CurrentPlayerCard';
import LiveBiddingWidget from '../components/auction/LiveBiddingWidget';
import SixTeamGrid from '../components/auction/SixTeamGrid';
import BidHistoryStream from '../components/auction/BidHistoryStream';
import AuctioneerControlBar from '../components/auction/AuctioneerControlBar';
import NominationModal from '../components/auction/NominationModal';
import { Radio, Users, Shield, RefreshCw } from 'lucide-react';

export default function LiveAuctionPage() {
  const { session, currentPlayer, teams, recentBids, loading, refreshState } = useAuction();
  const { user, isAuctioneer } = useAuth();
  const [nominationModalOpen, setNominationModalOpen] = useState(false);

  const leadingTeam =
    (typeof session?.leadingTeam === 'object' && session?.leadingTeam?.name)
      ? session.leadingTeam
      : (typeof session?.leadingTeamId === 'object' && session?.leadingTeamId?.name)
      ? session.leadingTeamId
      : (teams || []).find((t) => {
          const leadId = (session?.leadingTeamId?._id || session?.leadingTeamId || session?.leadingTeam?._id || session?.leadingTeam)?.toString();
          return leadId && t._id?.toString() === leadId;
        });

  return (
    <div className="space-y-6">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-cpl-border/80">
        <div>
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
            </span>
            <h1 className="font-display font-black text-2xl text-white tracking-wide">
              LIVE AUCTION ARENA
            </h1>
            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-cpl-gold/15 text-cpl-gold border border-cpl-gold/30">
              BROADCAST
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time televised collegiate cricket auction with synchronized gavel control.
          </p>
        </div>

        <button
          onClick={refreshState}
          className="self-start sm:self-auto px-3 py-1.5 rounded-lg bg-cpl-surface border border-cpl-border hover:border-cpl-gold text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Sync State</span>
        </button>
      </div>

      {/* Privileged Auctioneer Bar */}
      {isAuctioneer && (
        <AuctioneerControlBar onOpenNominationModal={() => setNominationModalOpen(true)} />
      )}

      {/* Nomination Modal for Auctioneer */}
      <NominationModal
        isOpen={nominationModalOpen}
        onClose={() => setNominationModalOpen(false)}
      />

      {/* Main Broadcast Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column (8 cols on desktop): Spotlight Player & 6-Team Overview */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Current Player Panel */}
          <CurrentPlayerCard
            player={currentPlayer}
            session={session}
            leadingTeam={leadingTeam}
          />

          {/* 6 Franchise Overview Grid */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display font-bold text-sm uppercase tracking-wider text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-cpl-gold" />
                <span>The {teams?.length || 6} Franchises • Purse & Squad Status</span>
              </h3>
            </div>
            <SixTeamGrid teams={teams} leadingTeamId={session?.leadingTeam} />
          </div>

        </div>

        {/* Right Column (4 cols on desktop): Live Bidding Panel & Bid Log */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Live Bidding Panel */}
          <LiveBiddingWidget />

          {/* Live Bidding Stream Log */}
          <BidHistoryStream recentBids={recentBids} />

        </div>

      </div>

    </div>
  );
}
