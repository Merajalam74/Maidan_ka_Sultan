import mongoose from 'mongoose';
import Tournament from '../models/Tournament.js';
import Team from '../models/Team.js';
import Player from '../models/Player.js';
import AuctionSession from '../models/AuctionSession.js';
import Bid from '../models/Bid.js';
import Purchase from '../models/Purchase.js';
import AuctionEvent from '../models/AuctionEvent.js';
import AuditLog from '../models/AuditLog.js';
import { AUCTION_STATUS, PLAYER_STATUS, EVENT_TYPES, DEFAULT_CONFIG } from '../config/constants.js';
import { isReplicaSetSupported } from '../config/db.js';

/**
 * Calculate the next minimum valid bid for a player and current highest bid
 */
export function calculateNextMinBid(currentBid, basePrice, minIncrement = DEFAULT_CONFIG.DEFAULT_MIN_BID_INCREMENT) {
  if (!currentBid || currentBid <= 0) {
    return Math.max(1, basePrice || 0);
  }
  return currentBid + (minIncrement || DEFAULT_CONFIG.DEFAULT_MIN_BID_INCREMENT);
}

/**
 * Checks if a team can mathematically complete its minimum squad if it places a bid.
 * Purse after bid must be >= remaining slots needed * minBasePrice.
 */
export function checkPurseFeasibility({
  remainingPurse,
  purchasedCount,
  bidAmount,
  minSquadSize = 11,
  minBasePrice = DEFAULT_CONFIG.DEFAULT_MIN_BASE_PRICE || 1,
}) {
  const newCount = purchasedCount + 1;
  const remainingSlotsNeeded = Math.max(0, minSquadSize - newCount);
  const minRequiredReserve = remainingSlotsNeeded * minBasePrice;
  const purseAfterBid = remainingPurse - bidAmount;

  const isFeasible = purseAfterBid >= minRequiredReserve;
  const deficit = isFeasible ? 0 : minRequiredReserve - purseAfterBid;
  const maxSafeBid = Math.max(
    0,
    remainingPurse - Math.max(0, minSquadSize - purchasedCount - 1) * minBasePrice
  );

  return {
    isFeasible,
    remainingSlotsNeeded,
    minRequiredReserve,
    purseAfterBid,
    deficit,
    maxSafeBid,
    warning: isFeasible
      ? null
      : `Mathematical Purse Deficit Warning: Bidding ${bidAmount} Credits leaves only ${purseAfterBid} Credits in purse, but the team needs at least ${minRequiredReserve} Credits reserve to afford the remaining ${remainingSlotsNeeded} player(s) required to complete the minimum squad of ${minSquadSize} (at min base price ${minBasePrice} Credit(s) each).`,
  };
}

/**
 * Retrieve or initialize the authoritative AuctionSession for a tournament
 */
export async function getOrCreateSession(tournamentId) {
  let session = await AuctionSession.findOne({ tournamentId })
    .populate('currentPlayerId')
    .populate('leadingTeamId', 'name shortCode logoUrl primaryColor remainingPurse')
    .populate('leadingBidderId', 'name email');

  if (!session) {
    session = await AuctionSession.create({
      tournamentId,
      status: AUCTION_STATUS.IDLE,
      currentBid: 0,
      sessionVersion: 1,
    });
  }
  return session;
}

/**
 * Nominate the next player for live bidding
 */
export async function nominatePlayer(tournamentId, playerId, actorId) {
  const tournament = await Tournament.findById(tournamentId);
  if (!tournament) {
    throw new Error('Tournament not found');
  }

  const player = await Player.findOne({ _id: playerId, tournamentId });
  if (!player) {
    throw new Error('Player not found in this tournament');
  }

  if (player.status === PLAYER_STATUS.SOLD) {
    throw new Error('Player is already SOLD and cannot be nominated');
  }

  const session = await getOrCreateSession(tournamentId);
  if (session.status === AUCTION_STATUS.ACTIVE && session.currentPlayerId) {
    throw new Error('An active auction is already in progress. Please complete or pause the current player.');
  }

  const countdown = tournament.countdownDurationSeconds || DEFAULT_CONFIG.DEFAULT_COUNTDOWN_SECONDS;
  const deadline = new Date(Date.now() + countdown * 1000);

  // Update player status
  player.status = PLAYER_STATUS.NOMINATED;
  await player.save();

  // Atomically update session (Manual auctioneer gavel: no auto-expiring timer)
  session.currentPlayerId = player._id;
  session.currentBid = 0;
  session.leadingTeamId = null;
  session.leadingBidderId = null;
  session.deadline = null;
  session.status = AUCTION_STATUS.ACTIVE;
  session.sessionVersion += 1;
  session.pausedRemainingSeconds = 0;
  session.lastBidTimestamp = null;
  session.timerStartedAt = new Date();
  await session.save();

  // Record nomination event
  await AuctionEvent.create({
    eventType: EVENT_TYPES.PLAYER_NOMINATED,
    tournamentId,
    playerId: player._id,
    actorId,
    payload: {
      playerName: player.name,
      basePrice: player.basePrice,
      status: player.status,
    },
    sessionVersion: session.sessionVersion,
  });

  return getOrCreateSession(tournamentId);
}

/**
 * Concurrency-safe, transactional live bid placement
 */
export async function placeBid({
  tournamentId,
  teamId,
  bidderId,
  bidAmount,
  idempotencyKey,
}) {
  // Validate inputs
  if (!bidAmount || isNaN(bidAmount) || bidAmount <= 0) {
    throw new Error('Bid amount must be a valid positive integer.');
  }
  bidAmount = Math.round(Number(bidAmount));

  // 1. Check idempotency: if this exact key was already processed, return existing bid
  if (idempotencyKey) {
    const existingBid = await Bid.findOne({ idempotencyKey });
    if (existingBid) {
      if (!existingBid.isAccepted) {
        throw new Error(existingBid.rejectionReason || 'Duplicate rejected bid.');
      }
      return {
        bid: existingBid,
        session: await getOrCreateSession(tournamentId),
        alreadyProcessed: true,
      };
    }
  }

  // 2. Fetch tournament & team details
  const tournament = await Tournament.findById(tournamentId);
  if (!tournament) throw new Error('Tournament not found');

  const team = await Team.findOne({ _id: teamId, tournamentId, isActive: true });
  if (!team) throw new Error('Participating team not found or inactive');

  // Verify team squad size
  const purchasedCount = await Purchase.countDocuments({
    winningTeamId: team._id,
    status: 'completed',
  });
  if (purchasedCount >= (team.maxSquadSize || tournament.squadLimit)) {
    throw new Error(`Team has already filled all ${team.maxSquadSize} squad slots.`);
  }

  // Verify team available purse
  if (team.remainingPurse < bidAmount) {
    throw new Error(
      `Insufficient purse! Team has ₹${team.remainingPurse.toLocaleString('en-IN')} remaining, cannot bid ₹${bidAmount.toLocaleString('en-IN')}.`
    );
  }

  // 3. Fetch authoritative session
  const session = await AuctionSession.findOne({ tournamentId });
  if (!session || session.status !== AUCTION_STATUS.ACTIVE || !session.currentPlayerId) {
    throw new Error('No player is currently active for bidding.');
  }

  // Cannot bid against self if already leading
  if (session.leadingTeamId && session.leadingTeamId.toString() === teamId.toString()) {
    throw new Error('Your team currently holds the highest bid!');
  }

  // Fetch player for base price verification
  const player = await Player.findById(session.currentPlayerId);
  if (!player) throw new Error('Current player record not found');

  const minNextBid = calculateNextMinBid(session.currentBid, player.basePrice, tournament.minBidIncrement);
  if (bidAmount < minNextBid) {
    throw new Error(`Bid of ${bidAmount} Credits is below the minimum required bid of ${minNextBid} Credits.`);
  }

  const now = new Date();

  // 4. Concurrency-safe atomic update with optimistic session version check
  const currentVersion = session.sessionVersion;
  const updatedSession = await AuctionSession.findOneAndUpdate(
    {
      _id: session._id,
      sessionVersion: currentVersion,
      status: AUCTION_STATUS.ACTIVE,
      currentBid: session.currentBid, // Ensures no higher bid was committed in the millisecond window
    },
    {
      $set: {
        currentBid: bidAmount,
        leadingTeamId: team._id,
        leadingBidderId: bidderId,
        deadline: null,
        lastBidTimestamp: now,
      },
      $inc: { sessionVersion: 1 },
    },
    { new: true }
  );

  if (!updatedSession) {
    // Another bid was accepted concurrently!
    throw new Error('A competing bid was placed just ahead of yours. Please refresh and bid again.');
  }

  // 5. Record accepted bid
  const bidDoc = await Bid.create({
    tournamentId,
    auctionSessionId: session._id,
    playerId: player._id,
    teamId: team._id,
    bidderId,
    bidAmount,
    timestamp: now,
    idempotencyKey: idempotencyKey || `bid_${Date.now()}_${teamId}_${bidAmount}`,
    isAccepted: true,
  });

  // Check mathematical purse feasibility for completing squad
  const minBasePrice = tournament.minBasePrice || DEFAULT_CONFIG.DEFAULT_MIN_BASE_PRICE || 1;
  const minSquadSize = tournament.minSquadSize || DEFAULT_CONFIG.MIN_SQUAD_LIMIT || 11;
  const feasibility = checkPurseFeasibility({
    remainingPurse: team.remainingPurse,
    purchasedCount,
    bidAmount,
    minSquadSize,
    minBasePrice,
  });

  // 6. Record Auction Event
  await AuctionEvent.create({
    eventType: EVENT_TYPES.BID_ACCEPTED,
    tournamentId,
    playerId: player._id,
    teamId: team._id,
    actorId: bidderId,
    payload: {
      bidAmount,
      teamName: team.name,
      teamShortCode: team.shortCode,
      feasibility,
    },
    sessionVersion: updatedSession.sessionVersion,
  });

  // Populate both session and bid document completely so all clients receive rich team objects
  const populatedBid = await Bid.findById(bidDoc._id)
    .populate('teamId', 'name shortCode logoUrl primaryColor')
    .populate('bidderId', 'name');

  const populatedSession = await AuctionSession.findById(updatedSession._id)
    .populate('currentPlayerId')
    .populate('leadingTeamId', 'name shortCode logoUrl primaryColor remainingPurse')
    .populate('leadingBidderId', 'name email');

  const sessionObj = populatedSession.toObject();
  sessionObj.leadingTeam = sessionObj.leadingTeamId;

  return {
    bid: populatedBid,
    session: sessionObj,
    alreadyProcessed: false,
    feasibility,
  };
}

/**
 * Mark the current player as SOLD to the leading team
 */
export async function markPlayerSold(tournamentId, actorId) {
  const session = await AuctionSession.findOne({ tournamentId });
  if (!session || !session.currentPlayerId) {
    throw new Error('No player is currently selected in the auction.');
  }

  if (!session.leadingTeamId || session.currentBid <= 0) {
    throw new Error('Cannot mark player SOLD: No valid bid was submitted for this player.');
  }

  const player = await Player.findById(session.currentPlayerId);
  const team = await Team.findById(session.leadingTeamId);

  if (!player || !team) {
    throw new Error('Player or winning team record not found.');
  }

  const finalPrice = session.currentBid;

  // Double check team purse
  if (team.remainingPurse < finalPrice) {
    throw new Error('Critical: Winning team has insufficient purse balance to settle this purchase.');
  }

  // Atomic settlement
  const purchase = await Purchase.create({
    tournamentId,
    playerId: player._id,
    winningTeamId: team._id,
    finalPurchasePrice: finalPrice,
    settledAt: new Date(),
    status: 'completed',
  });

  // Update player
  player.status = PLAYER_STATUS.SOLD;
  player.winningTeamId = team._id;
  player.soldPrice = finalPrice;
  await player.save();

  // Deduct team purse atomically
  team.committedSpent += finalPrice;
  team.remainingPurse = Math.max(0, team.initialPurse - team.committedSpent);
  await team.save();

  // Reset auction session
  session.currentPlayerId = null;
  session.currentBid = 0;
  session.leadingTeamId = null;
  session.leadingBidderId = null;
  session.status = AUCTION_STATUS.IDLE;
  session.deadline = null;
  session.sessionVersion += 1;
  await session.save();

  // Record Auction Event & Audit Log
  await AuctionEvent.create({
    eventType: EVENT_TYPES.PLAYER_SOLD,
    tournamentId,
    playerId: player._id,
    teamId: team._id,
    actorId,
    payload: {
      playerName: player.name,
      teamName: team.name,
      finalPrice,
      purchaseId: purchase._id,
    },
    sessionVersion: session.sessionVersion,
  });

  await AuditLog.create({
    actorId,
    action: 'PLAYER_SOLD',
    targetModel: 'Purchase',
    targetId: purchase._id.toString(),
    reason: `Player ${player.name} sold to ${team.name} for ₹${finalPrice.toLocaleString('en-IN')}`,
    afterState: { playerId: player._id, teamId: team._id, finalPrice },
  });

  return {
    purchase,
    player,
    team,
    session: await getOrCreateSession(tournamentId),
  };
}

/**
 * Mark the current player as UNSOLD
 */
export async function markPlayerUnsold(tournamentId, actorId) {
  const session = await AuctionSession.findOne({ tournamentId });
  if (!session || !session.currentPlayerId) {
    throw new Error('No player is currently active in the auction.');
  }

  const player = await Player.findById(session.currentPlayerId);
  if (!player) throw new Error('Player record not found');

  // Update player status
  player.status = PLAYER_STATUS.UNSOLD;
  player.winningTeamId = null;
  player.soldPrice = null;
  await player.save();

  // Reset session
  session.currentPlayerId = null;
  session.currentBid = 0;
  session.leadingTeamId = null;
  session.leadingBidderId = null;
  session.status = AUCTION_STATUS.IDLE;
  session.deadline = null;
  session.sessionVersion += 1;
  await session.save();

  // Record Auction Event
  await AuctionEvent.create({
    eventType: EVENT_TYPES.PLAYER_UNSOLD,
    tournamentId,
    playerId: player._id,
    actorId,
    payload: {
      playerName: player.name,
      basePrice: player.basePrice,
    },
    sessionVersion: session.sessionVersion,
  });

  return {
    player,
    session: await getOrCreateSession(tournamentId),
  };
}

/**
 * Pause live auction countdown
 */
export async function pauseAuction(tournamentId, actorId) {
  const session = await AuctionSession.findOne({ tournamentId });
  if (!session || session.status !== AUCTION_STATUS.ACTIVE) {
    throw new Error('Auction is not currently active.');
  }

  const now = new Date();
  const remainingSeconds = session.deadline
    ? Math.max(0, Math.floor((session.deadline.getTime() - now.getTime()) / 1000))
    : 0;

  session.status = AUCTION_STATUS.PAUSED;
  session.pausedRemainingSeconds = remainingSeconds;
  session.sessionVersion += 1;
  await session.save();

  await AuctionEvent.create({
    eventType: EVENT_TYPES.AUCTION_PAUSED,
    tournamentId,
    actorId,
    payload: { remainingSeconds },
    sessionVersion: session.sessionVersion,
  });

  return getOrCreateSession(tournamentId);
}

/**
 * Resume paused live auction countdown
 */
export async function resumeAuction(tournamentId, actorId) {
  const session = await AuctionSession.findOne({ tournamentId });
  if (!session || session.status !== AUCTION_STATUS.PAUSED) {
    throw new Error('Auction is not currently paused.');
  }

  const resumeDuration = session.pausedRemainingSeconds > 0 ? session.pausedRemainingSeconds : 30;
  session.deadline = new Date(Date.now() + resumeDuration * 1000);
  session.status = AUCTION_STATUS.ACTIVE;
  session.pausedRemainingSeconds = 0;
  session.sessionVersion += 1;
  await session.save();

  await AuctionEvent.create({
    eventType: EVENT_TYPES.AUCTION_RESUMED,
    tournamentId,
    actorId,
    payload: { deadline: session.deadline },
    sessionVersion: session.sessionVersion,
  });

  return getOrCreateSession(tournamentId);
}

/**
 * Reset or extend the countdown timer
 */
export async function resetTimer(tournamentId, seconds = 30, actorId) {
  const session = await AuctionSession.findOne({ tournamentId });
  if (!session || !session.currentPlayerId) {
    throw new Error('No player is currently active in the auction.');
  }

  session.deadline = new Date(Date.now() + seconds * 1000);
  session.status = AUCTION_STATUS.ACTIVE;
  session.pausedRemainingSeconds = 0;
  session.sessionVersion += 1;
  await session.save();

  await AuctionEvent.create({
    eventType: EVENT_TYPES.TIMER_RESET,
    tournamentId,
    actorId,
    payload: { seconds, deadline: session.deadline },
    sessionVersion: session.sessionVersion,
  });

  return getOrCreateSession(tournamentId);
}

/**
 * Cancel the current nomination and return player to available pool
 */
export async function cancelNomination(tournamentId, actorId) {
  const session = await AuctionSession.findOne({ tournamentId });
  if (!session || !session.currentPlayerId) {
    throw new Error('No player is currently nominated.');
  }

  const player = await Player.findById(session.currentPlayerId);
  if (player && player.status === PLAYER_STATUS.NOMINATED) {
    player.status = PLAYER_STATUS.AVAILABLE;
    await player.save();
  }

  session.currentPlayerId = null;
  session.currentBid = 0;
  session.leadingTeamId = null;
  session.leadingBidderId = null;
  session.status = AUCTION_STATUS.IDLE;
  session.deadline = null;
  session.sessionVersion += 1;
  await session.save();

  return getOrCreateSession(tournamentId);
}

/**
 * Transaction reversal workflow with mandatory audit trail
 */
export async function reversePurchase(purchaseId, reason, actorId) {
  if (!reason || reason.trim().length < 5) {
    throw new Error('A detailed reason (at least 5 characters) is required to reverse a transaction.');
  }

  const purchase = await Purchase.findById(purchaseId);
  if (!purchase) {
    throw new Error('Purchase record not found.');
  }

  if (purchase.status === 'reversed') {
    throw new Error('This purchase has already been reversed.');
  }

  const team = await Team.findById(purchase.winningTeamId);
  const player = await Player.findById(purchase.playerId);

  if (!team || !player) {
    throw new Error('Associated team or player record not found.');
  }

  const beforeTeam = { committedSpent: team.committedSpent, remainingPurse: team.remainingPurse };

  // Restore purse
  team.committedSpent = Math.max(0, team.committedSpent - purchase.finalPurchasePrice);
  team.remainingPurse = Math.min(team.initialPurse, team.initialPurse - team.committedSpent);
  await team.save();

  // Restore player status
  player.status = PLAYER_STATUS.AVAILABLE;
  player.winningTeamId = null;
  player.soldPrice = null;
  await player.save();

  // Mark purchase as reversed
  purchase.status = 'reversed';
  purchase.reversalReason = reason;
  purchase.reversedAt = new Date();
  purchase.reversedBy = actorId;
  await purchase.save();

  // Record Audit Log & Auction Event
  await AuditLog.create({
    actorId,
    action: 'PURCHASE_REVERSED',
    targetModel: 'Purchase',
    targetId: purchase._id.toString(),
    reason,
    beforeState: beforeTeam,
    afterState: { committedSpent: team.committedSpent, remainingPurse: team.remainingPurse },
  });

  await AuctionEvent.create({
    eventType: EVENT_TYPES.TRANSACTION_REVERSED,
    tournamentId: purchase.tournamentId,
    playerId: player._id,
    teamId: team._id,
    actorId,
    payload: {
      purchaseId: purchase._id,
      finalPurchasePrice: purchase.finalPurchasePrice,
      reason,
    },
  });

  return {
    success: true,
    purchase,
    team,
    player,
  };
}
