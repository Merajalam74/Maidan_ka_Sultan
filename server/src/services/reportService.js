import Player from '../models/Player.js';
import Team from '../models/Team.js';
import Purchase from '../models/Purchase.js';
import Bid from '../models/Bid.js';
import { formatINR } from '../utils/currency.js';

/**
 * Aggregates high-level tournament statistics
 */
export async function getTournamentSummary(tournamentId) {
  const [totalPlayers, soldPlayers, unsoldPlayers, availablePlayers] = await Promise.all([
    Player.countDocuments({ tournamentId }),
    Player.countDocuments({ tournamentId, status: 'sold' }),
    Player.countDocuments({ tournamentId, status: 'unsold' }),
    Player.countDocuments({ tournamentId, status: 'available' }),
  ]);

  const teams = await Team.find({ tournamentId, isActive: true });
  const completedPurchases = await Purchase.find({ tournamentId, status: 'completed' })
    .populate('playerId', 'name role department category')
    .populate('winningTeamId', 'name shortCode logoUrl primaryColor')
    .sort({ finalPurchasePrice: -1 });

  const totalExpenditure = completedPurchases.reduce((acc, p) => acc + p.finalPurchasePrice, 0);
  const highestPurchase = completedPurchases.length > 0 ? completedPurchases[0] : null;
  const averagePrice = soldPlayers > 0 ? Math.round(totalExpenditure / soldPlayers) : 0;

  return {
    totalPlayers,
    soldPlayers,
    unsoldPlayers,
    availablePlayers,
    totalTeams: teams.length,
    totalExpenditure,
    totalExpenditureFormatted: formatINR(totalExpenditure),
    averagePrice,
    averagePriceFormatted: formatINR(averagePrice),
    highestPurchase: highestPurchase
      ? {
          player: highestPurchase.playerId,
          team: highestPurchase.winningTeamId,
          price: highestPurchase.finalPurchasePrice,
          priceFormatted: formatINR(highestPurchase.finalPurchasePrice),
        }
      : null,
  };
}

/**
 * Returns chronological bid history for audit and analysis
 */
export async function getBidHistory(tournamentId, limit = 100) {
  return Bid.find({ tournamentId, isAccepted: true })
    .sort({ timestamp: -1 })
    .limit(limit)
    .populate('playerId', 'name role photoUrl')
    .populate('teamId', 'name shortCode logoUrl primaryColor')
    .populate('bidderId', 'name email');
}

/**
 * Returns all purchases with full player and team details
 */
export async function getPurchaseHistory(tournamentId) {
  return Purchase.find({ tournamentId })
    .sort({ settledAt: -1 })
    .populate('playerId', 'name role photoUrl department academicYear basePrice category')
    .populate('winningTeamId', 'name shortCode logoUrl primaryColor')
    .populate('reversedBy', 'name email');
}

/**
 * Generates CSV string for export
 */
export async function exportAuctionResultsCsv(tournamentId) {
  const purchases = await Purchase.find({ tournamentId, status: 'completed' })
    .populate('playerId')
    .populate('winningTeamId')
    .sort({ finalPurchasePrice: -1 });

  const header = ['Player ID', 'Player Name', 'Role', 'Department', 'Academic Year', 'Base Price (INR)', 'Final Price (INR)', 'Winning Team', 'Sold At'];
  const rows = purchases.map((p) => {
    const pl = p.playerId || {};
    const tm = p.winningTeamId || {};
    return [
      `"${pl.externalId || ''}"`,
      `"${pl.name || 'Unknown'}"`,
      `"${pl.role || ''}"`,
      `"${pl.department || ''}"`,
      `"${pl.academicYear || ''}"`,
      pl.basePrice || 0,
      p.finalPurchasePrice || 0,
      `"${tm.name || ''}"`,
      `"${p.settledAt ? new Date(p.settledAt).toISOString() : ''}"`,
    ].join(',');
  });

  return [header.join(','), ...rows].join('\n');
}
