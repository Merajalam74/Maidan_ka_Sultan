import Team from '../models/Team.js';
import User from '../models/User.js';
import Tournament from '../models/Tournament.js';
import Purchase from '../models/Purchase.js';
import TournamentMembership from '../models/TournamentMembership.js';
import { getTeamsWithDetails, assignTeamOwner, reconcileTeamPurse } from '../services/teamService.js';
import { uploadImageToCloudinary, isCloudinaryConfigured } from '../services/cloudinaryService.js';
import { ROLES } from '../config/constants.js';

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
 * Create a new team (Superadmin only) with optional team owner account & password
 */
export async function createTeam(req, res, next) {
  try {
    let {
      tournamentId,
      name,
      shortCode,
      captainName,
      logoUrl,
      primaryColor,
      secondaryColor,
      initialPurse,
      maxSquadSize,
      ownerEmail,
      ownerPassword,
      ownerName,
    } = req.body;

    if (!tournamentId) {
      const active = await Tournament.findOne().sort({ createdAt: -1 });
      if (active) tournamentId = active._id;
    }

    if (!tournamentId || !name || !shortCode) {
      return res.status(400).json({
        success: false,
        message: 'Tournament ID, team name, and short code are required.',
      });
    }

    const cleanName = name.trim();
    const cleanShortCode = shortCode.trim().toUpperCase();

    // Check uniqueness within the tournament
    const existing = await Team.findOne({
      tournamentId,
      $or: [{ name: cleanName }, { shortCode: cleanShortCode }],
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: `A team with name "${cleanName}" or code "${cleanShortCode}" already exists in this tournament.`,
      });
    }

    const team = await Team.create({
      tournamentId,
      name: cleanName,
      shortCode: cleanShortCode,
      captainName: captainName ? captainName.trim() : '',
      logoUrl: logoUrl || '',
      primaryColor: primaryColor || '#EF4444',
      secondaryColor: secondaryColor || '#991B1B',
      initialPurse: initialPurse !== undefined ? initialPurse : 100,
      remainingPurse: initialPurse !== undefined ? initialPurse : 100,
      maxSquadSize: maxSquadSize || 15,
      isActive: true,
    });

    // If owner email or password provided, create/link owner user
    if (ownerEmail) {
      const cleanEmail = ownerEmail.toLowerCase().trim();
      let ownerUser = await User.findOne({ email: cleanEmail });

      if (ownerUser) {
        if (ownerPassword) {
          ownerUser.passwordHash = await User.hashPassword(ownerPassword);
        }
        ownerUser.globalRole = ROLES.TEAM_OWNER;
        if (ownerName) ownerUser.name = ownerName.trim();
        await ownerUser.save();
      } else {
        const passwordHash = await User.hashPassword(ownerPassword || 'Owner@123456');
        ownerUser = await User.create({
          name: (ownerName && ownerName.trim()) || `${cleanName} Franchise Owner`,
          email: cleanEmail,
          passwordHash,
          globalRole: ROLES.TEAM_OWNER,
          avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(cleanName)}`,
        });
      }

      team.ownerUserId = ownerUser._id;
      await team.save();

      // Create or update TournamentMembership
      await TournamentMembership.findOneAndUpdate(
        { userId: ownerUser._id, tournamentId: team.tournamentId },
        { role: ROLES.TEAM_OWNER, teamId: team._id },
        { upsert: true, new: true }
      );
    }

    const populatedTeam = await Team.findById(team._id).populate('ownerUserId', 'name email avatar');

    return res.status(201).json({
      success: true,
      team: populatedTeam,
      message: `Team "${cleanName}" created successfully.${ownerEmail ? ' Owner credentials assigned.' : ''}`,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Update team information (Name, Captain, Logo, Colors, Purse, Owner Credentials)
 */
export async function updateTeam(req, res, next) {
  try {
    const { id } = req.params;
    const {
      name,
      shortCode,
      captainName,
      logoUrl,
      primaryColor,
      secondaryColor,
      initialPurse,
      maxSquadSize,
      isActive,
      ownerEmail,
      ownerPassword,
      ownerName,
    } = req.body;

    const team = await Team.findById(id);
    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found' });
    }

    if (name) team.name = name.trim();
    if (shortCode) team.shortCode = shortCode.trim().toUpperCase();
    if (captainName !== undefined) team.captainName = captainName.trim();
    if (logoUrl !== undefined) team.logoUrl = logoUrl;
    if (primaryColor) team.primaryColor = primaryColor;
    if (secondaryColor) team.secondaryColor = secondaryColor;
    if (maxSquadSize) team.maxSquadSize = maxSquadSize;
    if (isActive !== undefined) team.isActive = isActive;

    if (initialPurse !== undefined && initialPurse !== team.initialPurse) {
      team.initialPurse = initialPurse;
      team.remainingPurse = Math.max(0, initialPurse - team.committedSpent);
    }

    // If owner credentials provided to update/reset
    if (ownerEmail || ownerPassword) {
      let ownerUser = null;
      if (team.ownerUserId) {
        ownerUser = await User.findById(team.ownerUserId);
      }
      if (!ownerUser && ownerEmail) {
        ownerUser = await User.findOne({ email: ownerEmail.toLowerCase().trim() });
      }

      if (ownerUser) {
        if (ownerEmail) ownerUser.email = ownerEmail.toLowerCase().trim();
        if (ownerName) ownerUser.name = ownerName.trim();
        if (ownerPassword) ownerUser.passwordHash = await User.hashPassword(ownerPassword);
        ownerUser.globalRole = ROLES.TEAM_OWNER;
        await ownerUser.save();
        team.ownerUserId = ownerUser._id;
      } else if (ownerEmail) {
        const passwordHash = await User.hashPassword(ownerPassword || 'Owner@123456');
        ownerUser = await User.create({
          name: (ownerName && ownerName.trim()) || `${team.name} Franchise Owner`,
          email: ownerEmail.toLowerCase().trim(),
          passwordHash,
          globalRole: ROLES.TEAM_OWNER,
          avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(team.name)}`,
        });
        team.ownerUserId = ownerUser._id;
      }

      if (ownerUser) {
        await TournamentMembership.findOneAndUpdate(
          { userId: ownerUser._id, tournamentId: team.tournamentId },
          { role: ROLES.TEAM_OWNER, teamId: team._id },
          { upsert: true, new: true }
        );
      }
    }

    await team.save();

    const populatedTeam = await Team.findById(team._id).populate('ownerUserId', 'name email avatar');

    return res.json({
      success: true,
      team: populatedTeam,
      message: `Team "${team.name}" updated successfully.`,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Upload team logo directly to Cloudinary
 */
export async function uploadTeamLogo(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided. Please upload an image file (PNG, JPG, WEBP, SVG).',
      });
    }

    const { id } = req.params; // Optional teamId to auto-update
    const uploadResult = await uploadImageToCloudinary(req.file.buffer, req.file.mimetype, {
      folder: 'cpl_auction/team_logos',
    });

    // If a team ID was specified in URL, update the team immediately
    let updatedTeam = null;
    if (id && id !== 'new') {
      updatedTeam = await Team.findByIdAndUpdate(
        id,
        { logoUrl: uploadResult.url },
        { new: true }
      );
    }

    return res.json({
      success: true,
      url: uploadResult.url,
      publicId: uploadResult.publicId,
      isConfigured: uploadResult.isConfigured,
      team: updatedTeam,
      message: uploadResult.isConfigured
        ? 'Logo successfully uploaded to Cloudinary CDN.'
        : 'Logo uploaded (Cloudinary keys not detected in .env, saved as direct data URI for immediate preview).',
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Get Cloudinary status
 */
export async function getCloudinaryStatus(req, res) {
  return res.json({
    success: true,
    isConfigured: isCloudinaryConfigured(),
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || null,
  });
}

/**
 * Delete or deactivate team
 */
export async function deleteTeam(req, res, next) {
  try {
    const { id } = req.params;
    const team = await Team.findById(id);
    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found' });
    }

    // Check if team has already purchased players
    const purchaseCount = await Purchase.countDocuments({
      winningTeamId: team._id,
      status: 'completed',
    });

    if (purchaseCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete "${team.name}" because they have already purchased ${purchaseCount} player(s). You can mark the team inactive instead.`,
      });
    }

    // Delete membership and team
    await TournamentMembership.deleteMany({ teamId: team._id });
    await Team.findByIdAndDelete(team._id);

    return res.json({
      success: true,
      message: `Team "${team.name}" successfully deleted.`,
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
