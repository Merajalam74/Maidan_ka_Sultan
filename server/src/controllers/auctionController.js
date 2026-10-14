import Tournament from '../models/Tournament.js';
import Team from '../models/Team.js';
import Player from '../models/Player.js';
import Bid from '../models/Bid.js';
import AuctionSession from '../models/AuctionSession.js';
import {
  getOrCreateSession,
  nominatePlayer,
  placeBid as placeBidService,
  markPlayerSold,
  markPlayerUnsold,
  pauseAuction,
  resumeAuction,
  resetTimer,
  cancelNomination,
  reversePurchase,
} from '../services/auctionService.js';
import { getTeamsWithDetails } from '../services/teamService.js';
import { broadcastAuctionState, broadcastBidAccepted, broadcastPlayerSold, broadcastPlayerUnsold } from '../sockets/socketHandler.js';

/**
 * Get Authoritative Live Auction Room State (Publicly accessible)
 */
export async function getAuctionState(req, res, next) {
  try {
    let tournamentId = req.query.tournamentId;
    let tournament;

    if (tournamentId) {
      tournament = await Tournament.findById(tournamentId);
    } else {
      tournament = await Tournament.findOne().sort({ createdAt: -1 });
      if (tournament) tournamentId = tournament._id;
    }

    if (!tournament) {
      return res.status(404).json({ success: false, message: 'Tournament not found' });
    }

    const session = await getOrCreateSession(tournament._id);
    const teams = await getTeamsWithDetails(tournament._id);

    // Fetch recent 15 bids for current player or tournament
    const recentBids = await Bid.find({
      tournamentId: tournament._id,
      ...(session.currentPlayerId && { playerId: session.currentPlayerId._id || session.currentPlayerId }),
      isAccepted: true,
    })
      .sort({ timestamp: -1 })
      .limit(15)
      .populate('teamId', 'name shortCode logoUrl primaryColor')
      .populate('bidderId', 'name');

    // Calculate remaining seconds server-side
    let remainingSeconds = 0;
    const now = Date.now();
    if (session.status === 'active' && session.deadline) {
      remainingSeconds = Math.max(0, Math.floor((new Date(session.deadline).getTime() - now) / 1000));
    } else if (session.status === 'paused') {
      remainingSeconds = session.pausedRemainingSeconds || 0;
    }

    return res.json({
      success: true,
      serverTime: new Date(),
      tournament: {
        id: tournament._id,
        name: tournament.name,
        status: tournament.status,
        currency: tournament.currency,
        currencySymbol: tournament.currencySymbol,
        defaultPurse: tournament.defaultPurse,
        minBidIncrement: tournament.minBidIncrement,
        countdownDurationSeconds: tournament.countdownDurationSeconds,
        squadLimit: tournament.squadLimit,
      },
      session: {
        id: session._id,
        status: session.status,
        currentBid: session.currentBid,
        leadingTeam: session.leadingTeamId,
        leadingBidder: session.leadingBidderId,
        deadline: session.deadline,
        remainingSeconds,
        sessionVersion: session.sessionVersion,
      },
      currentPlayer: session.currentPlayerId,
      teams,
      recentBids,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Nominate the next player (Auctioneer / SuperAdmin)
 */
export async function nominate(req, res, next) {
  try {
    const { tournamentId, playerId } = req.body;
    if (!tournamentId || !playerId) {
      return res.status(400).json({
        success: false,
        message: 'Tournament ID and Player ID are required.',
        code: 'VALIDATION_ERROR',
      });
    }

    const session = await nominatePlayer(tournamentId, playerId, req.user._id);
    broadcastAuctionState(tournamentId);

    return res.json({
      success: true,
      message: 'Player successfully nominated.',
      session,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Submit a bid on the active player (Team Owner or Admin)
 */
export async function submitBid(req, res, next) {
  try {
    const { tournamentId, teamId, bidAmount, idempotencyKey } = req.body;

    if (!tournamentId || !teamId || bidAmount === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Tournament ID, Team ID, and Bid Amount are required.',
        code: 'VALIDATION_ERROR',
      });
    }

    const parsedBid = Number(bidAmount);
    if (!Number.isFinite(parsedBid) || !Number.isInteger(parsedBid) || parsedBid <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Bid amount must be a valid positive integer.',
        code: 'INVALID_BID_AMOUNT',
      });
    }

    // Authorization check: If not superadmin, user must be the assigned owner of this team
    if (req.user.globalRole !== 'superadmin') {
      const team = await Team.findById(teamId);
      if (!team || !team.ownerUserId || team.ownerUserId.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden: You are only authorized to submit bids for your assigned team.',
          code: 'FORBIDDEN',
        });
      }
    }

    const result = await placeBidService({
      tournamentId,
      teamId,
      bidderId: req.user._id,
      bidAmount: Number(bidAmount),
      idempotencyKey: idempotencyKey || `bid_${Date.now()}_${teamId}_${bidAmount}`,
    });

    broadcastBidAccepted(tournamentId, result);

    return res.json({
      success: true,
      message: 'Bid accepted successfully.',
      bid: result.bid,
      session: result.session,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Mark player SOLD (Auctioneer / SuperAdmin)
 */
export async function markSold(req, res, next) {
  try {
    const { tournamentId } = req.body;
    const result = await markPlayerSold(tournamentId, req.user._id);

    broadcastPlayerSold(tournamentId, result);

    return res.json({
      success: true,
      message: `Player sold to ${result.team.name} for ₹${result.purchase.finalPurchasePrice.toLocaleString('en-IN')}.`,
      result,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Mark player UNSOLD (Auctioneer / SuperAdmin)
 */
export async function markUnsold(req, res, next) {
  try {
    const { tournamentId } = req.body;
    const result = await markPlayerUnsold(tournamentId, req.user._id);

    broadcastPlayerUnsold(tournamentId, result);

    return res.json({
      success: true,
      message: `Player marked UNSOLD.`,
      result,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Pause live auction countdown (Auctioneer / SuperAdmin)
 */
export async function pause(req, res, next) {
  try {
    const { tournamentId } = req.body;
    const session = await pauseAuction(tournamentId, req.user._id);
    broadcastAuctionState(tournamentId);

    return res.json({ success: true, message: 'Auction paused.', session });
  } catch (err) {
    next(err);
  }
}

/**
 * Resume live auction countdown (Auctioneer / SuperAdmin)
 */
export async function resume(req, res, next) {
  try {
    const { tournamentId } = req.body;
    const session = await resumeAuction(tournamentId, req.user._id);
    broadcastAuctionState(tournamentId);

    return res.json({ success: true, message: 'Auction resumed.', session });
  } catch (err) {
    next(err);
  }
}

/**
 * Reset countdown timer (Auctioneer / SuperAdmin)
 */
export async function resetCountdown(req, res, next) {
  try {
    const { tournamentId, seconds = 30 } = req.body;
    const session = await resetTimer(tournamentId, Number(seconds), req.user._id);
    broadcastAuctionState(tournamentId);

    return res.json({ success: true, message: `Countdown reset to ${seconds} seconds.`, session });
  } catch (err) {
    next(err);
  }
}

/**
 * Cancel nomination (Auctioneer / SuperAdmin)
 */
export async function cancelNom(req, res, next) {
  try {
    const { tournamentId } = req.body;
    const session = await cancelNomination(tournamentId, req.user._id);
    broadcastAuctionState(tournamentId);

    return res.json({ success: true, message: 'Nomination cancelled. Player returned to available pool.', session });
  } catch (err) {
    next(err);
  }
}

/**
 * Reverse a completed sale transaction (SuperAdmin only)
 */
export async function reverseSale(req, res, next) {
  try {
    const { purchaseId, reason } = req.body;
    if (!purchaseId || !reason) {
      return res.status(400).json({ success: false, message: 'Purchase ID and mandatory reversal reason are required.' });
    }

    const result = await reversePurchase(purchaseId, reason, req.user._id);
    broadcastAuctionState(result.purchase.tournamentId);

    return res.json({
      success: true,
      message: 'Transaction successfully reversed with audit trail.',
      result,
    });
  } catch (err) {
    next(err);
  }
}
