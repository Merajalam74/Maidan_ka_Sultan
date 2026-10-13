import Team from '../models/Team.js';
import Tournament from '../models/Tournament.js';
import { getTeamsWithDetails, assignTeamOwner, reconcileTeamPurse } from '../services/teamService.js';

/**
 * Get all teams with live purse and squad calculations
 */
export async function getTeams(req, res, next) {
  try {
    let tournamentId = req.query.tournamentId;
    if (!tournamentId) {
      const active = await Tournament.findOne().sort({ createdAt: -1 });
      if (active) tournamentId = active._id;
    }

    if (!tournamentId) {
      return res.json({ success: true, teams: [] });
    }

    const teams = await getTeamsWithDetails(tournamentId);
    return res.json({
      success: true,
      teams,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Get single team by ID with complete squad
 */
export async function getTeamById(req, res, next) {
  try {
    const { id } = req.params;
    const team = await Team.findById(id).populate('ownerUserId', 'name email avatar');
    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found' });
    }

    const allTeams = await getTeamsWithDetails(team.tournamentId);
    const detailedTeam = allTeams.find((t) => t._id.toString() === id);

    return res.json({
      success: true,
      team: detailedTeam || team,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Create a new team
 */
export async function createTeam(req, res, next) {
  try {
    const { tournamentId, name, shortCode, logoUrl, primaryColor, secondaryColor, initialPurse, maxSquadSize } = req.body;

    if (!tournamentId || !name || !shortCode) {
      return res.status(400).json({
        success: false,
        message: 'Tournament ID, team name, and short code are required.',
      });
    }

    const team = await Team.create({
      tournamentId,
      name: name.trim(),
      shortCode: shortCode.trim().toUpperCase(),
      logoUrl: logoUrl || '',
      primaryColor: primaryColor || '#3B82F6',
      secondaryColor: secondaryColor || '#1E40AF',
      initialPurse: initialPurse || 10000000,
      remainingPurse: initialPurse || 10000000,
      maxSquadSize: maxSquadSize || 15,
    });

    return res.status(201).json({
      success: true,
      team,
      message: 'Team created successfully.',
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Update team information
 */
export async function updateTeam(req, res, next) {
  try {
    const { id } = req.params;
    const { name, shortCode, logoUrl, primaryColor, secondaryColor, initialPurse, maxSquadSize, isActive } = req.body;

    const team = await Team.findById(id);
    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found' });
    }

    if (name) team.name = name.trim();
    if (shortCode) team.shortCode = shortCode.trim().toUpperCase();
    if (logoUrl !== undefined) team.logoUrl = logoUrl;
    if (primaryColor) team.primaryColor = primaryColor;
    if (secondaryColor) team.secondaryColor = secondaryColor;
    if (maxSquadSize) team.maxSquadSize = maxSquadSize;
    if (isActive !== undefined) team.isActive = isActive;

    if (initialPurse !== undefined && initialPurse !== team.initialPurse) {
      team.initialPurse = initialPurse;
      team.remainingPurse = Math.max(0, initialPurse - team.committedSpent);
    }

    await team.save();

    return res.json({
      success: true,
      team,
      message: 'Team updated successfully.',
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Assign a user as team owner
 */
export async function assignOwner(req, res, next) {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID is required.' });
    }

    const team = await assignTeamOwner(id, userId);
    return res.json({
      success: true,
      team,
      message: 'Team owner assigned successfully.',
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Reconcile team purse
 */
export async function reconcilePurse(req, res, next) {
  try {
    const { id } = req.params;
    const team = await reconcileTeamPurse(id);
    return res.json({
      success: true,
      team,
      message: 'Team purse reconciled successfully.',
    });
  } catch (err) {
    next(err);
  }
}
