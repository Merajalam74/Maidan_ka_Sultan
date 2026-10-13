import Tournament from '../models/Tournament.js';
import Team from '../models/Team.js';
import { getOrCreateSession } from '../services/auctionService.js';

/**
 * Get active tournament or tournament by ID
 */
export async function getTournament(req, res, next) {
  try {
    let tournament;
    if (req.params.id) {
      tournament = await Tournament.findById(req.params.id);
    } else {
      tournament = await Tournament.findOne().sort({ createdAt: -1 });
    }

    if (!tournament) {
      // Create default tournament if none exists
      tournament = await Tournament.create({
        name: 'Campus Premier League 2026',
        status: 'live',
      });
    }

    const session = await getOrCreateSession(tournament._id);
    const teams = await Team.find({ tournamentId: tournament._id, isActive: true })
      .populate('ownerUserId', 'name email')
      .sort({ name: 1 });

    return res.json({
      success: true,
      tournament,
      session,
      teams,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Update tournament settings (purse, countdown, bid increment, rules)
 */
export async function updateTournament(req, res, next) {
  try {
    const { id } = req.params;
    const updates = req.body;

    const tournament = await Tournament.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: 'Tournament not found',
      });
    }

    return res.json({
      success: true,
      tournament,
      message: 'Tournament settings updated successfully.',
    });
  } catch (err) {
    next(err);
  }
}
