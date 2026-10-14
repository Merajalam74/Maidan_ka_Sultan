import Tournament from '../models/Tournament.js';
import {
  getTournamentSummary,
  getBidHistory,
  getPurchaseHistory,
  exportAuctionResultsCsv,
} from '../services/reportService.js';

/**
 * Get tournament summary statistics
 */
export async function getSummary(req, res, next) {
  try {
    let tournamentId = req.query.tournamentId;
    if (!tournamentId) {
      const active = await Tournament.findOne().sort({ createdAt: -1 });
      if (active) tournamentId = active._id;
    }

    if (!tournamentId) {
      return res.status(404).json({ success: false, message: 'Tournament not found', code: 'NOT_FOUND' });
    }

    const summary = await getTournamentSummary(tournamentId);
    return res.json({ success: true, summary });
  } catch (err) {
    next(err);
  }
}

/**
 * Get chronological bid history
 */
export async function getBids(req, res, next) {
  try {
    let tournamentId = req.query.tournamentId;
    if (!tournamentId) {
      const active = await Tournament.findOne().sort({ createdAt: -1 });
      if (active) tournamentId = active._id;
    }

    const parsedLimit = parseInt(req.query.limit, 10);
    const limit = isNaN(parsedLimit) || parsedLimit < 1 ? 100 : Math.min(parsedLimit, 500);
    const bids = await getBidHistory(tournamentId, limit);
    return res.json({ success: true, count: bids.length, bids });
  } catch (err) {
    next(err);
  }
}

/**
 * Get purchase history
 */
export async function getPurchases(req, res, next) {
  try {
    let tournamentId = req.query.tournamentId;
    if (!tournamentId) {
      const active = await Tournament.findOne().sort({ createdAt: -1 });
      if (active) tournamentId = active._id;
    }

    const purchases = await getPurchaseHistory(tournamentId);
    return res.json({ success: true, count: purchases.length, purchases });
  } catch (err) {
    next(err);
  }
}

/**
 * Export results to CSV
 */
export async function exportCsv(req, res, next) {
  try {
    let tournamentId = req.query.tournamentId;
    if (!tournamentId) {
      const active = await Tournament.findOne().sort({ createdAt: -1 });
      if (active) tournamentId = active._id;
    }

    const csvData = await exportAuctionResultsCsv(tournamentId);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="cpl_auction_results.csv"');
    return res.send(csvData);
  } catch (err) {
    next(err);
  }
}
