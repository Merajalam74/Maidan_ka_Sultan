import TournamentMembership from '../models/TournamentMembership.js';
import Team from '../models/Team.js';
import { ROLES } from '../config/constants.js';

/**
 * Ensures user has active tournament membership and attaches assigned team if team_owner
 */
export async function verifyTournamentMembership(req, res, next) {
  try {
    const tournamentId = req.params.tournamentId || req.body.tournamentId || req.query.tournamentId;

    if (!tournamentId) {
      return res.status(400).json({
        success: false,
        message: 'Tournament ID is required.',
      });
    }

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
    }

    // Superadmin has universal tournament membership
    if (req.user.globalRole === ROLES.SUPERADMIN) {
      req.tournamentMembership = {
        userId: req.user._id,
        tournamentId,
        role: ROLES.SUPERADMIN,
      };
      return next();
    }

    // Check membership in TournamentMembership collection
    let membership = await TournamentMembership.findOne({
      userId: req.user._id,
      tournamentId,
    });

    // Fallback: check if the user is assigned as team owner in the Team model
    if (!membership && req.user.globalRole === ROLES.TEAM_OWNER) {
      const ownedTeam = await Team.findOne({
        tournamentId,
        ownerUserId: req.user._id,
      });

      if (ownedTeam) {
        membership = await TournamentMembership.create({
          userId: req.user._id,
          tournamentId,
          role: ROLES.TEAM_OWNER,
          teamId: ownedTeam._id,
        });
      }
    }

    if (!membership) {
      return res.status(403).json({
        success: false,
        message: 'You are not registered as a participant in this tournament.',
      });
    }

    req.tournamentMembership = membership;
    if (membership.teamId) {
      req.teamId = membership.teamId;
    }

    next();
  } catch (err) {
    next(err);
  }
}
