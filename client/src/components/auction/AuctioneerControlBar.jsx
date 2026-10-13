import React, { useState } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  XCircle,
  SkipForward,
  UserPlus,
  Shield,
  AlertTriangle,
  X,
} from 'lucide-react';
import { useAuction } from '../../context/AuctionSocketContext';
import { useAuth } from '../../context/AuthContext';
import { formatINR } from '../../utils/formatters';

export default function AuctioneerControlBar({ onOpenNominationModal }) {
  const { isAuctioneer } = useAuth();
  const {
    session,
    currentPlayer,
    markSold,
    markUnsold,
    pause,
    resume,
    resetTimer,
    cancelNomination,
  } = useAuction();

  const [confirmModal, setConfirmModal] = useState(null);
  const [busy, setBusy] = useState(false);

  if (!isAuctioneer) return null;

  const isPaused = session?.status === 'paused';
  const isActive = session?.status === 'active';
  const hasLeadingBid = session?.currentBid > 0 && !!session?.leadingTeam;

  const handleAction = async (actionFn, title) => {
    try {
      setBusy(true);
      await actionFn();
      setConfirmModal(null);
    } catch (err) {
      alert(`Action failed: ${err.message}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="bg-gradient-to-r from-amber-950/80 via-cpl-surface to-amber-950/80 border border-cpl-gold/40 p-4 rounded-2xl shadow-gold mb-6 backdrop-blur-xl">
      <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
        
        {/* Left Badge: Official Auctioneer Console */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-cpl-gold text-black flex items-center justify-center font-black shadow-md">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display font-black text-sm uppercase tracking-wider text-white">
                AUCTIONEER CONSOLE
              </span>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-cpl-gold/20 text-cpl-gold border border-cpl-gold/40">
                PRIVILEGED
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {currentPlayer ? `Managing active lot: ${currentPlayer.name}` : 'Ready to nominate next player'}
            </p>
          </div>
        </div>

        {/* Center / Right Control Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-2 w-full lg:w-auto">
          
          {/* Nominate / Next Player */}
          <button
            onClick={onOpenNominationModal}
            disabled={busy || (isActive && !!currentPlayer)}
            className="px-3.5 py-2 rounded-xl bg-cpl-surface border border-cpl-gold/50 text-cpl-gold hover:bg-cpl-gold hover:text-black font-bold text-xs uppercase tracking-wider transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 shadow-sm"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Nominate Player</span>
          </button>

          {/* Pause / Resume Timer */}
          {isActive ? (
            <button
              onClick={() => handleAction(pause, 'Pause')}
              disabled={busy || !currentPlayer}
              className="px-3.5 py-2 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 hover:bg-amber-500/30 font-bold text-xs uppercase tracking-wider transition-colors disabled:opacity-40 flex items-center gap-1.5"
            >
              <Pause className="w-3.5 h-3.5" />
              <span>Pause</span>
            </button>
          ) : isPaused ? (
            <button
              onClick={() => handleAction(resume, 'Resume')}
              disabled={busy}
              className="px-3.5 py-2 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30 font-bold text-xs uppercase tracking-wider transition-colors disabled:opacity-40 flex items-center gap-1.5"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Resume</span>
            </button>
          ) : null}

          {/* Reset Timer (+30s) */}
          <button
            onClick={() => handleAction(() => resetTimer(30), 'Reset Timer')}
            disabled={busy || !currentPlayer}
            className="px-3.5 py-2 rounded-xl bg-cpl-surface border border-cpl-border text-slate-300 hover:text-white font-bold text-xs uppercase tracking-wider transition-colors disabled:opacity-40 flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset 30s</span>
          </button>

          {/* Mark SOLD (with confirmation modal if big purchase) */}
          <button
            onClick={() => {
              if (!hasLeadingBid) {
                alert('Cannot mark SOLD without any bids placed!');
                return;
              }
              setConfirmModal({
                type: 'sold',
                title: 'Confirm Player Sale',
                message: `Sell ${currentPlayer.name} to ${session.leadingTeam?.name || 'leading team'} for ${formatINR(session.currentBid)}? This transaction atomically deducts the team purse and updates rosters.`,
                action: markSold,
              });
            }}
            disabled={busy || !currentPlayer || !hasLeadingBid}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-black font-black text-xs uppercase tracking-wider transition-colors shadow-md disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Hammer SOLD</span>
          </button>

          {/* Mark UNSOLD */}
          <button
            onClick={() => {
              setConfirmModal({
                type: 'unsold',
                title: 'Confirm UNSOLD',
                message: `Mark ${currentPlayer?.name} as UNSOLD? No funds will be deducted, and the player will remain available for future re-nomination.`,
                action: markUnsold,
              });
            }}
            disabled={busy || !currentPlayer}
            className="px-3.5 py-2 rounded-xl bg-red-600/20 border border-red-500/40 text-red-300 hover:bg-red-600 hover:text-white font-bold text-xs uppercase tracking-wider transition-colors disabled:opacity-40 flex items-center gap-1.5"
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>Pass UNSOLD</span>
          </button>

          {/* Cancel Nomination */}
          <button
            onClick={() => {
              setConfirmModal({
                type: 'cancel',
                title: 'Cancel Active Nomination',
                message: `Cancel nomination of ${currentPlayer?.name}? The player will be returned to the available pool without any bids recorded.`,
                action: cancelNomination,
              });
            }}
            disabled={busy || !currentPlayer}
            className="px-3 py-2 rounded-xl bg-cpl-surface hover:bg-cpl-border text-slate-400 hover:text-white font-bold text-xs transition-colors disabled:opacity-40"
            title="Cancel current nomination"
          >
            <X className="w-3.5 h-3.5" />
          </button>

        </div>

      </div>

      {/* Confirmation Modal */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-cpl-surface border border-cpl-gold/50 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-xl bg-amber-500/20 text-cpl-gold">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="font-display font-extrabold text-lg text-white">
                {confirmModal.title}
              </h3>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed mb-6">
              {confirmModal.message}
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setConfirmModal(null)}
                className="px-4 py-2 rounded-xl bg-cpl-surface border border-cpl-border text-slate-300 hover:text-white font-bold text-xs uppercase"
              >
                Cancel
              </button>
              <button
                onClick={() => handleAction(confirmModal.action, confirmModal.type)}
                disabled={busy}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-cpl-gold to-cpl-gold-dark text-black font-extrabold text-xs uppercase tracking-wider shadow-md hover:brightness-110"
              >
                {busy ? 'Processing...' : 'Confirm Action'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
