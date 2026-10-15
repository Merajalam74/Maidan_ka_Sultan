import Team from '../models/Team.js';
import Purchase from '../models/Purchase.js';
import User from '../models/User.js';
import Player from '../models/Player.js';
import TournamentMembership from '../models/TournamentMembership.js';
import { getTeamHistoryData } from '../config/teamHistory.js';
import { ROLES } from '../config/constants.js';

/**
 * Fetch all teams for a tournament with full squad, purse details, and matched captain data
 */
export async function getTeamsWithDetails(tournamentId) {
  const [teams, players] = await Promise.all([
    Team.find({ tournamentId, isActive: true })
      .populate('ownerUserId', 'name email avatar')
      .lean(),
    Player.find({ tournamentId })
      .select('name photoUrl role department academicYear phoneNumber externalId stats')
      .lean(),
  ]);

  const teamIds = teams.map((t) => t._id);

  // Map players by normalized name for fast captain photo and profile resolution
  const playerMapByName = new Map();
  players.forEach((p) => {
    if (p.name) {
      playerMapByName.set(p.name.trim().toLowerCase(), p);
    }
  });

  // Fetch all completed purchases for these teams
  const purchases = await Purchase.find({
    tournamentId,
    winningTeamId: { $in: teamIds },
    status: 'completed',
  })
    .populate('playerId', 'name role photoUrl department academicYear basePrice soldPrice')
    .lean();

  const purchaseMap = new Map();
  purchases.forEach((p) => {
    const key = p.winningTeamId.toString();
    if (!purchaseMap.has(key)) purchaseMap.set(key, []);
    purchaseMap.get(key).push(p);
  });

  return teams.map((team) => {
    const squad = purchaseMap.get(team._id.toString()) || [];
    const spent = squad.reduce((sum, p) => sum + p.finalPurchasePrice, 0);
    const remaining = Math.max(0, team.initialPurse - spent);
    const minSquad = 11;
    const minBasePrice = 1;
    const slotsNeededAfterCurrent = Math.max(0, minSquad - squad.length - 1);
    const minReserveNeeded = slotsNeededAfterCurrent * minBasePrice;
    const maxSafeBid = Math.max(0, remaining - minReserveNeeded);

    // Resolve captain photo and player record
    const captainKey = team.captainName ? team.captainName.trim().toLowerCase() : '';
    const captainPlayer = captainKey ? playerMapByName.get(captainKey) : null;
    const captainPhotoUrl =
      captainPlayer?.photoUrl ||
      team.ownerUserId?.avatar ||
      `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(team.captainName || team.name)}`;

    // Tournament history, achievements & lore (authoritative from teamHistory config)
    const historyData = getTeamHistoryData(team.name) || {};
    const description = historyData.description || team.description || '';
    const achievements = (historyData.achievements && historyData.achievements.length > 0)
      ? historyData.achievements
      : (team.achievements || []);
    const championshipTitles = (historyData.championshipTitles !== undefined)
      ? historyData.championshipTitles
      : (team.championshipTitles || []);

    return {
      ...team,
      description,
      achievements,
      championshipTitles,
      titleBadge: historyData.titleBadge || (championshipTitles[0] || ''),
      trophyCount: historyData.trophyCount ?? championshipTitles.length,
      yearsWon: historyData.yearsWon || [],
      motto: historyData.motto || '',
      captainPlayer: captainPlayer || null,
      captainPhotoUrl,
      squad: squad.map((s) => ({
        purchaseId: s._id,
        player: s.playerId,
        price: s.finalPurchasePrice,
        timestamp: s.settledAt,
      })),
      purchasedCount: squad.length,
      remainingSlots: Math.max(0, (team.maxSquadSize || 15) - squad.length),
      committedSpent: spent,
      remainingPurse: remaining,
      minReserveNeeded,
      maxSafeBid,
    };
  });
}

/**
 * Assign an authenticated user as the owner of a team
 */
export async function assignTeamOwner(teamId, userId, tournamentId) {
  const team = await Team.findById(teamId);
  if (!team) throw new Error('Team not found');

  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');

  // Verify user isn't already assigned to another team in this tournament
  const existingOtherTeam = await Team.findOne({
    tournamentId: team.tournamentId,
    ownerUserId: user._id,
    _id: { $ne: team._id },
  });

  if (existingOtherTeam) {
    throw new Error(`User is already assigned to team "${existingOtherTeam.name}". Each owner can manage only one team.`);
  }

  // Update team
  team.ownerUserId = user._id;
  await team.save();

  // Ensure user has global role TEAM_OWNER if currently VIEWER
  if (user.globalRole === ROLES.VIEWER) {
    user.globalRole = ROLES.TEAM_OWNER;
    await user.save();
  }

  // Upsert TournamentMembership
  await TournamentMembership.findOneAndUpdate(
    { userId: user._id, tournamentId: team.tournamentId },
    {
      role: ROLES.TEAM_OWNER,
      teamId: team._id,
    },
    { upsert: true, new: true }
  );

  return team;
}

/**
 * Reconciles team purse against authoritative completed purchases
 */
export async function reconcileTeamPurse(teamId) {
  const team = await Team.findById(teamId);
  if (!team) throw new Error('Team not found');

  const purchases = await Purchase.find({
    winningTeamId: team._id,
    status: 'completed',
  });

  const totalSpent = purchases.reduce((sum, p) => sum + p.finalPurchasePrice, 0);
  team.committedSpent = totalSpent;
  team.remainingPurse = Math.max(0, team.initialPurse - totalSpent);
  await team.save();

  return team;
}
