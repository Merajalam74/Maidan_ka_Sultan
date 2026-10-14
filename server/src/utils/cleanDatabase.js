import dotenv from 'dotenv';
import User from '../models/User.js';
import Tournament from '../models/Tournament.js';
import Team from '../models/Team.js';
import Player from '../models/Player.js';
import TournamentMembership from '../models/TournamentMembership.js';
import AuctionSession from '../models/AuctionSession.js';
import Bid from '../models/Bid.js';
import Purchase from '../models/Purchase.js';
import AuctionEvent from '../models/AuctionEvent.js';
import AuditLog from '../models/AuditLog.js';
import { ROLES, AUCTION_STATUS } from '../config/constants.js';
import { connectDB, disconnectDB } from '../config/db.js';

dotenv.config();

/**
 * Prepares the platform for production / official tournament by wiping
 * all mock players, test bids, and test transactions, while preserving
 * the 5 authentic franchises, official administrative roles, and clean purses.
 */
export async function cleanDatabaseForProduction(options = {}) {
  console.log('====================================================');
  console.log('🧹 MAIDAN KE SULTAN — PRODUCTION DATABASE CLEANSER');
  console.log('====================================================');

  // 1. Wipe all test/demo players and auction telemetry
  console.log('1. Clearing mock players, bids, events, and purchase logs...');
  await Promise.all([
    Player.deleteMany({}),
    Bid.deleteMany({}),
    Purchase.deleteMany({}),
    AuctionEvent.deleteMany({}),
    AuditLog.deleteMany({}),
  ]);
  console.log('   ✓ Removed all mock players');
  console.log('   ✓ Removed all historical bid logs');
  console.log('   ✓ Removed all purchase transactions & audit entries');

  // 2. Setup or reset the official Tournament
  const tournamentName = process.env.TOURNAMENT_NAME || 'Maidan ke Sultan - Season 5';
  let tournament = await Tournament.findOne({ name: tournamentName });
  if (!tournament) {
    tournament = await Tournament.create({
      name: tournamentName,
      status: AUCTION_STATUS.IDLE,
      currency: 'CREDITS',
      currencySymbol: 'CR',
      defaultPurse: 100, // 100 Credits per team
      minBidIncrement: 1,  // 1 Credit minimum bid increment
      minBasePrice: 1,     // 1 Credit minimum player base price
      squadLimit: 15,
      minSquadSize: 11,
      countdownDurationSeconds: 30,
      antiSnipingSeconds: 10,
      antiSnipingExtensionSeconds: 15,
      rulesDescription: 'Maidan ke Sultan Season 5 Live Player Auction. 100 Credits allocated per franchise. 5 Franchises: Jeb Katre, Maqsad XI, Khalnayak XI, Phurtile Sher, Dhurandar XI.',
      scheduledStartTime: new Date(),
    });
    console.log(`2. Created fresh Tournament: "${tournament.name}" (100 Credits per team)`);
  } else {
    tournament.status = AUCTION_STATUS.IDLE;
    tournament.currency = 'CREDITS';
    tournament.currencySymbol = 'CR';
    tournament.defaultPurse = 100;
    tournament.minBidIncrement = 1;
    tournament.minBasePrice = 1;
    await tournament.save();
    console.log(`2. Reset existing Tournament: "${tournament.name}" to IDLE status (100 Credits)`);
  }

  // 3. Setup Official Administrator & Auctioneer accounts
  const adminPassword = process.env.ADMIN_DEFAULT_PASSWORD || 'Admin@123456';
  const auctioneerPassword = process.env.AUCTIONEER_DEFAULT_PASSWORD || 'Auctioneer@123456';
  const ownerPassword = process.env.OWNER_DEFAULT_PASSWORD || 'Owner@123456';

  const adminHash = await User.hashPassword(adminPassword);
  const auctioneerHash = await User.hashPassword(auctioneerPassword);
  const ownerHash = await User.hashPassword(ownerPassword);

  const adminUser = await User.findOneAndUpdate(
    { email: 'admin@mks.edu' },
    {
      name: 'Tournament Director',
      email: 'admin@mks.edu',
      passwordHash: adminHash,
      globalRole: ROLES.SUPERADMIN,
      status: 'active',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=250',
    },
    { upsert: true, new: true }
  );

  const auctioneerUser = await User.findOneAndUpdate(
    { email: 'auctioneer@mks.edu' },
    {
      name: 'Charu Sharma (Official Auctioneer)',
      email: 'auctioneer@mks.edu',
      passwordHash: auctioneerHash,
      globalRole: ROLES.AUCTIONEER,
      status: 'active',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=250',
    },
    { upsert: true, new: true }
  );

  console.log('3. Verified Admin & Auctioneer credentials:');
  console.log('   - Admin:      admin@mks.edu');
  console.log('   - Auctioneer: auctioneer@mks.edu');

  // 4. Reset Exactly 5 Official Franchises with Full ₹1 Crore Purse
  const teamTemplates = [
    {
      name: 'Jeb Katre',
      shortCode: 'JBK',
      captainName: 'Aarav Sharma',
      primaryColor: '#EF4444',
      secondaryColor: '#991B1B',
      initialPurse: 100,
      ownerEmail: 'jebkatre@mks.edu',
      ownerName: 'Jeb Katre Franchise Owner',
    },
    {
      name: 'Maqsad XI',
      shortCode: 'MQX',
      captainName: 'Faizan Sheikh',
      primaryColor: '#10B981',
      secondaryColor: '#064E3B',
      initialPurse: 100,
      ownerEmail: 'maqsad@mks.edu',
      ownerName: 'Maqsad XI Franchise Owner',
    },
    {
      name: 'Khalnayak XI',
      shortCode: 'KLX',
      captainName: 'Kabir Patel',
      primaryColor: '#8B5CF6',
      secondaryColor: '#5B21B6',
      initialPurse: 100,
      ownerEmail: 'khalnayak@mks.edu',
      ownerName: 'Khalnayak XI Franchise Owner',
    },
    {
      name: 'Phurtile Sher',
      shortCode: 'PHS',
      captainName: 'Rohan Mehra',
      primaryColor: '#F97316',
      secondaryColor: '#C2410C',
      initialPurse: 100,
      ownerEmail: 'phurtile@mks.edu',
      ownerName: 'Phurtile Sher Franchise Owner',
    },
    {
      name: 'Dhurandar XI',
      shortCode: 'DHX',
      captainName: 'Devansh Verma',
      primaryColor: '#06B6D4',
      secondaryColor: '#0E7490',
      initialPurse: 100,
      ownerEmail: 'dhurandar@mks.edu',
      ownerName: 'Dhurandar XI Franchise Owner',
    },
  ];

  console.log('4. Initializing the 5 Franchises with pristine 100 Credits purses...');
  for (const t of teamTemplates) {
    const ownerUser = await User.findOneAndUpdate(
      { email: t.ownerEmail },
      {
        name: t.ownerName,
        email: t.ownerEmail,
        passwordHash: ownerHash,
        globalRole: ROLES.TEAM_OWNER,
        status: 'active',
        avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(t.name)}`,
      },
      { upsert: true, new: true }
    );

    const team = await Team.findOneAndUpdate(
      { tournamentId: tournament._id, name: t.name },
      {
        tournamentId: tournament._id,
        name: t.name,
        shortCode: t.shortCode,
        captainName: t.captainName || '',
        primaryColor: t.primaryColor,
        secondaryColor: t.secondaryColor,
        initialPurse: t.initialPurse,
        remainingPurse: t.initialPurse,
        committedSpent: 0,
        maxSquadSize: 15,
        isActive: true,
        ownerUserId: ownerUser._id,
      },
      { upsert: true, new: true }
    );

    await TournamentMembership.findOneAndUpdate(
      { userId: ownerUser._id, tournamentId: tournament._id },
      {
        role: ROLES.TEAM_OWNER,
        teamId: team._id,
      },
      { upsert: true }
    );

    console.log(`   ✓ ${t.name} (${t.shortCode}) — Purse: 100 Credits | Owner: ${t.ownerEmail}`);
  }

  // 5. Reset authoritative AuctionSession
  await AuctionSession.findOneAndUpdate(
    { tournamentId: tournament._id },
    {
      tournamentId: tournament._id,
      currentPlayerId: null,
      status: AUCTION_STATUS.IDLE,
      currentBid: 0,
      leadingTeamId: null,
      leadingBidderId: null,
      deadline: null,
      sessionVersion: 1,
    },
    { upsert: true }
  );
  console.log('5. Reset Auction Session to IDLE (No players nominated, ready for live auction).');

  console.log('====================================================');
  console.log('✨ DATABASE CLEANSE COMPLETE!');
  console.log('📊 Active Players in Pool: 0 (Ready for real CSV/Sheets import)');
  console.log('🏏 Participating Franchises: 5 (All purses restored to 100 Credits)');
  console.log('====================================================');
}

// Standalone execution
if (process.argv[1]?.endsWith('cleanDatabase.js')) {
  (async () => {
    try {
      await connectDB();
      await cleanDatabaseForProduction();
      console.log('[CleanDB] Standalone execution finished successfully.');
      process.exit(0);
    } catch (err) {
      console.error('[CleanDB] Error cleansing database:', err);
      process.exit(1);
    }
  })();
}
