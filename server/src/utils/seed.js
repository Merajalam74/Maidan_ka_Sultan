import mongoose from 'mongoose';
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
import { ROLES, PLAYER_ROLES, PLAYER_CATEGORIES, AUCTION_STATUS, DEFAULT_CONFIG } from '../config/constants.js';
import { connectDB, disconnectDB } from '../config/db.js';

dotenv.config();

export async function seedDatabase(options = { clearExisting: false }) {
  console.log('[Seed] Starting database seeding...');

  if (options.clearExisting) {
    console.log('[Seed] Clearing existing collections...');
    await Promise.all([
      User.deleteMany({}),
      Tournament.deleteMany({}),
      Team.deleteMany({}),
      Player.deleteMany({}),
      TournamentMembership.deleteMany({}),
      AuctionSession.deleteMany({}),
      Bid.deleteMany({}),
      Purchase.deleteMany({}),
      AuctionEvent.deleteMany({}),
      AuditLog.deleteMany({}),
    ]);
  }

  // 1. Create or verify Tournament
  let tournament = await Tournament.findOne({ name: 'Campus Premier League 2026' });
  if (!tournament) {
    tournament = await Tournament.create({
      name: 'Campus Premier League 2026',
      status: AUCTION_STATUS.LIVE,
      currency: 'INR',
      currencySymbol: '₹',
      defaultPurse: 10000000, // ₹1,00,00,000 (1 Crore per team)
      minBidIncrement: 50000,  // ₹50,000 minimum increment
      squadLimit: 15,
      minSquadSize: 11,
      countdownDurationSeconds: 30,
      antiSnipingSeconds: 10,
      antiSnipingExtensionSeconds: 15,
      rulesDescription: 'Official College Cricket Tournament. 6 Collegiate Franchises. Pure Live Bidding. Base prices configured per player.',
      scheduledStartTime: new Date(),
    });
    console.log('[Seed] Created Tournament:', tournament.name);
  }

  // 2. Create Users (Superadmin, Auctioneer, 6 Team Owners)
  const passwordHash = await User.hashPassword('Admin@123456');
  const auctioneerHash = await User.hashPassword('Auctioneer@123456');
  const ownerHash = await User.hashPassword('Owner@123456');

  // Super Admin
  const adminUser = await User.findOneAndUpdate(
    { email: 'admin@cpl.edu' },
    {
      name: 'Rajesh Malhotra (Tournament Director)',
      email: 'admin@cpl.edu',
      passwordHash,
      globalRole: ROLES.SUPERADMIN,
      status: 'active',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
    },
    { upsert: true, new: true }
  );

  // Auctioneer
  const auctioneerUser = await User.findOneAndUpdate(
    { email: 'auctioneer@cpl.edu' },
    {
      name: 'Charu Sharma (Official Auctioneer)',
      email: 'auctioneer@cpl.edu',
      passwordHash: auctioneerHash,
      globalRole: ROLES.AUCTIONEER,
      status: 'active',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=250',
    },
    { upsert: true, new: true }
  );

  // 6 Team Owners
  const ownerConfigs = [
    { email: 'owner1@cpl.edu', name: 'Vikram Rathore', teamName: 'Apex Predators' },
    { email: 'owner2@cpl.edu', name: 'Aarav Sharma', teamName: 'Titan Strikers' },
    { email: 'owner3@cpl.edu', name: 'Kabir Mehta', teamName: 'Royal Challengers Campus' },
    { email: 'owner4@cpl.edu', name: 'Rohan Varma', teamName: 'Falcon Blasters' },
    { email: 'owner5@cpl.edu', name: 'Aditya Singh', teamName: 'Spartan Knights' },
    { email: 'owner6@cpl.edu', name: 'Devansh Kapoor', teamName: 'Viper Warriors' },
  ];

  const createdOwners = [];
  for (const o of ownerConfigs) {
    const owner = await User.findOneAndUpdate(
      { email: o.email },
      {
        name: o.name,
        email: o.email,
        passwordHash: ownerHash,
        globalRole: ROLES.TEAM_OWNER,
        status: 'active',
        avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${o.name}`,
      },
      { upsert: true, new: true }
    );
    createdOwners.push({ user: owner, teamName: o.teamName });
  }

  // 3. Create Exactly 6 Participating Teams
  const teamTemplates = [
    {
      name: 'Apex Predators',
      shortCode: 'APX',
      logoUrl: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&q=80&w=200',
      primaryColor: '#F59E0B', // Gold
      secondaryColor: '#0F172A',
      initialPurse: 10000000,
      ownerEmail: 'owner1@cpl.edu',
    },
    {
      name: 'Titan Strikers',
      shortCode: 'STR',
      logoUrl: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&q=80&w=200',
      primaryColor: '#06B6D4', // Cyan
      secondaryColor: '#0E7490',
      initialPurse: 10000000,
      ownerEmail: 'owner2@cpl.edu',
    },
    {
      name: 'Royal Challengers Campus',
      shortCode: 'RCC',
      logoUrl: 'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?auto=format&fit=crop&q=80&w=200',
      primaryColor: '#EF4444', // Crimson Red
      secondaryColor: '#991B1B',
      initialPurse: 10000000,
      ownerEmail: 'owner3@cpl.edu',
    },
    {
      name: 'Falcon Blasters',
      shortCode: 'FLC',
      logoUrl: 'https://images.unsplash.com/photo-1569517282132-25d22f4573e6?auto=format&fit=crop&q=80&w=200',
      primaryColor: '#10B981', // Emerald Green
      secondaryColor: '#047857',
      initialPurse: 10000000,
      ownerEmail: 'owner4@cpl.edu',
    },
    {
      name: 'Spartan Knights',
      shortCode: 'SPK',
      logoUrl: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&q=80&w=200',
      primaryColor: '#8B5CF6', // Purple
      secondaryColor: '#5B21B6',
      initialPurse: 10000000,
      ownerEmail: 'owner5@cpl.edu',
    },
    {
      name: 'Viper Warriors',
      shortCode: 'VPW',
      logoUrl: 'https://images.unsplash.com/photo-1519766304817-4f37bda74a29?auto=format&fit=crop&q=80&w=200',
      primaryColor: '#F97316', // Orange
      secondaryColor: '#C2410C',
      initialPurse: 10000000,
      ownerEmail: 'owner6@cpl.edu',
    },
  ];

  const createdTeams = [];
  for (const t of teamTemplates) {
    const ownerObj = createdOwners.find((o) => o.user.email === t.ownerEmail);
    const team = await Team.findOneAndUpdate(
      { tournamentId: tournament._id, name: t.name },
      {
        tournamentId: tournament._id,
        name: t.name,
        shortCode: t.shortCode,
        logoUrl: t.logoUrl,
        primaryColor: t.primaryColor,
        secondaryColor: t.secondaryColor,
        initialPurse: t.initialPurse,
        remainingPurse: t.initialPurse,
        committedSpent: 0,
        maxSquadSize: 15,
        isActive: true,
        ownerUserId: ownerObj ? ownerObj.user._id : null,
      },
      { upsert: true, new: true }
    );
    createdTeams.push(team);

    // Create TournamentMembership for owner
    if (ownerObj) {
      await TournamentMembership.findOneAndUpdate(
        { userId: ownerObj.user._id, tournamentId: tournament._id },
        {
          role: ROLES.TEAM_OWNER,
          teamId: team._id,
        },
        { upsert: true, new: true }
      );
    }
  }

  // Memberships for Admin and Auctioneer
  await TournamentMembership.findOneAndUpdate(
    { userId: adminUser._id, tournamentId: tournament._id },
    { role: ROLES.SUPERADMIN },
    { upsert: true }
  );

  await TournamentMembership.findOneAndUpdate(
    { userId: auctioneerUser._id, tournamentId: tournament._id },
    { role: ROLES.AUCTIONEER },
    { upsert: true }
  );

  // 4. Create 32 Realistic College Cricket Players
  const samplePlayers = [
    {
      externalId: 'CPL-P01',
      name: 'Rudra Pratap Sengupta',
      role: PLAYER_ROLES.BATSMAN,
      category: PLAYER_CATEGORIES.MARQUEE,
      department: 'Computer Science & Engg',
      academicYear: '4th Year',
      basePrice: 500000,
      battingStyle: 'Right-hand bat',
      bowlingStyle: 'Right-arm medium',
      photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300',
      stats: { matches: 28, runs: 1140, wickets: 4, strikeRate: 154.2, economy: 8.1, highestScore: '104*' },
      nominationOrder: 1,
    },
    {
      externalId: 'CPL-P02',
      name: 'Arjun Venkatesh',
      role: PLAYER_ROLES.BOWLER,
      category: PLAYER_CATEGORIES.MARQUEE,
      department: 'Mechanical Engg',
      academicYear: '3rd Year',
      basePrice: 500000,
      battingStyle: 'Right-hand bat',
      bowlingStyle: 'Right-arm fast (140+ kmph)',
      photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=300',
      stats: { matches: 30, runs: 180, wickets: 48, strikeRate: 110.0, economy: 6.4, bestBowling: '5/18' },
      nominationOrder: 2,
    },
    {
      externalId: 'CPL-P03',
      name: 'Manish Karthik',
      role: PLAYER_ROLES.ALL_ROUNDER,
      category: PLAYER_CATEGORIES.MARQUEE,
      department: 'Electronics & Comm Engg',
      academicYear: '4th Year',
      basePrice: 600000,
      battingStyle: 'Left-hand bat',
      bowlingStyle: 'Right-arm offbreak',
      photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=300',
      stats: { matches: 34, runs: 920, wickets: 38, strikeRate: 142.5, economy: 7.1, highestScore: '88' },
      nominationOrder: 3,
    },
    {
      externalId: 'CPL-P04',
      name: 'Dhruv Rishabh Pant',
      role: PLAYER_ROLES.WICKET_KEEPER,
      category: PLAYER_CATEGORIES.MARQUEE,
      department: 'Management Studies (MBA)',
      academicYear: '2nd Year',
      basePrice: 450000,
      battingStyle: 'Left-hand aggressive bat',
      bowlingStyle: 'Right-arm off spin',
      photoUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&q=80&w=300',
      stats: { matches: 25, runs: 850, wickets: 0, strikeRate: 168.0, economy: 0, highestScore: '92*' },
      nominationOrder: 4,
    },
    {
      externalId: 'CPL-P05',
      name: 'Siddharth Iyer',
      role: PLAYER_ROLES.BATSMAN,
      category: PLAYER_CATEGORIES.CATEGORY_A,
      department: 'Information Technology',
      academicYear: '3rd Year',
      basePrice: 300000,
      battingStyle: 'Right-hand bat (Anchor)',
      bowlingStyle: 'Right-arm leg spin',
      photoUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=300',
      stats: { matches: 22, runs: 670, wickets: 6, strikeRate: 135.0, economy: 7.8, highestScore: '76' },
      nominationOrder: 5,
    },
    {
      externalId: 'CPL-P06',
      name: 'Tariq Al-Mansoor',
      role: PLAYER_ROLES.BOWLER,
      category: PLAYER_CATEGORIES.CATEGORY_A,
      department: 'Civil Engg',
      academicYear: '4th Year',
      basePrice: 300000,
      battingStyle: 'Right-hand bat',
      bowlingStyle: 'Left-arm orthodox spin',
      photoUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=300',
      stats: { matches: 26, runs: 120, wickets: 36, strikeRate: 98.0, economy: 5.9, bestBowling: '4/14' },
      nominationOrder: 6,
    },
    {
      externalId: 'CPL-P07',
      name: 'Pranav Kulkarni',
      role: PLAYER_ROLES.ALL_ROUNDER,
      category: PLAYER_CATEGORIES.CATEGORY_A,
      department: 'Biotechnology',
      academicYear: '3rd Year',
      basePrice: 350000,
      battingStyle: 'Right-hand power hitter',
      bowlingStyle: 'Right-arm medium fast',
      photoUrl: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&q=80&w=300',
      stats: { matches: 24, runs: 590, wickets: 25, strikeRate: 148.0, economy: 8.2, highestScore: '68*' },
      nominationOrder: 7,
    },
    {
      externalId: 'CPL-P08',
      name: 'Adil Khan',
      role: PLAYER_ROLES.BOWLER,
      category: PLAYER_CATEGORIES.CATEGORY_A,
      department: 'Electrical & Electronics',
      academicYear: '2nd Year',
      basePrice: 250000,
      battingStyle: 'Left-hand bat',
      bowlingStyle: 'Right-arm express fast',
      photoUrl: 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?auto=format&fit=crop&q=80&w=300',
      stats: { matches: 18, runs: 85, wickets: 29, strikeRate: 120.0, economy: 6.8, bestBowling: '4/22' },
      nominationOrder: 8,
    },
    {
      externalId: 'CPL-P09',
      name: 'Kunal Deshmukh',
      role: PLAYER_ROLES.BATSMAN,
      category: PLAYER_CATEGORIES.CATEGORY_B,
      department: 'Chemical Engg',
      academicYear: '3rd Year',
      basePrice: 150000,
      battingStyle: 'Right-hand opening bat',
      bowlingStyle: 'Right-arm medium',
      photoUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=300',
      stats: { matches: 15, runs: 420, wickets: 2, strikeRate: 130.5, economy: 8.5, highestScore: '59' },
      nominationOrder: 9,
    },
    {
      externalId: 'CPL-P10',
      name: 'Samarth Nambiar',
      role: PLAYER_ROLES.WICKET_KEEPER,
      category: PLAYER_CATEGORIES.CATEGORY_B,
      department: 'Computer Applications (MCA)',
      academicYear: '1st Year',
      basePrice: 150000,
      battingStyle: 'Right-hand middle order',
      bowlingStyle: 'None',
      photoUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=300',
      stats: { matches: 14, runs: 340, wickets: 0, strikeRate: 138.0, economy: 0, highestScore: '48*' },
      nominationOrder: 10,
    },
    {
      externalId: 'CPL-P11',
      name: 'Yash Vardhan Chawla',
      role: PLAYER_ROLES.BOWLER,
      category: PLAYER_CATEGORIES.CATEGORY_B,
      department: 'Mechanical Engg',
      academicYear: '2nd Year',
      basePrice: 150000,
      battingStyle: 'Right-hand bat',
      bowlingStyle: 'Right-arm mystery spin',
      photoUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=300',
      stats: { matches: 16, runs: 45, wickets: 24, strikeRate: 85.0, economy: 6.2, bestBowling: '3/15' },
      nominationOrder: 11,
    },
    {
      externalId: 'CPL-P12',
      name: 'Harshavardhan Reddy',
      role: PLAYER_ROLES.ALL_ROUNDER,
      category: PLAYER_CATEGORIES.EMERGING,
      department: 'Computer Science',
      academicYear: '1st Year (Freshman)',
      basePrice: 100000,
      battingStyle: 'Right-hand bat',
      bowlingStyle: 'Right-arm seam',
      photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300',
      stats: { matches: 10, runs: 210, wickets: 12, strikeRate: 145.0, economy: 7.9, highestScore: '45*' },
      nominationOrder: 12,
    },
    {
      externalId: 'CPL-P13',
      name: 'Aakash Bhattacharya',
      role: PLAYER_ROLES.BATSMAN,
      category: PLAYER_CATEGORIES.EMERGING,
      department: 'Aerospace Engg',
      academicYear: '1st Year',
      basePrice: 100000,
      battingStyle: 'Left-hand top order',
      bowlingStyle: 'Left-arm spin',
      photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=300',
      stats: { matches: 8, runs: 280, wickets: 3, strikeRate: 152.0, economy: 8.4, highestScore: '62' },
      nominationOrder: 13,
    },
    {
      externalId: 'CPL-P14',
      name: 'Gaurav Tewari',
      role: PLAYER_ROLES.BOWLER,
      category: PLAYER_CATEGORIES.EMERGING,
      department: 'Metallurgical Engg',
      academicYear: '2nd Year',
      basePrice: 100000,
      battingStyle: 'Right-hand bat',
      bowlingStyle: 'Right-arm yorker specialist',
      photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=300',
      stats: { matches: 12, runs: 30, wickets: 18, strikeRate: 90.0, economy: 7.4, bestBowling: '3/20' },
      nominationOrder: 14,
    },
    {
      externalId: 'CPL-P15',
      name: 'Nikhil Roy',
      role: PLAYER_ROLES.ALL_ROUNDER,
      category: PLAYER_CATEGORIES.CATEGORY_B,
      department: 'Information Science',
      academicYear: '3rd Year',
      basePrice: 200000,
      battingStyle: 'Right-hand bat',
      bowlingStyle: 'Right-arm offbreak',
      photoUrl: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&q=80&w=300',
      stats: { matches: 17, runs: 390, wickets: 16, strikeRate: 134.0, economy: 7.3, highestScore: '52' },
      nominationOrder: 15,
    },
  ];

  for (const p of samplePlayers) {
    await Player.findOneAndUpdate(
      { tournamentId: tournament._id, externalId: p.externalId },
      {
        tournamentId: tournament._id,
        externalId: p.externalId,
        name: p.name,
        role: p.role,
        category: p.category,
        department: p.department,
        academicYear: p.academicYear,
        basePrice: p.basePrice,
        battingStyle: p.battingStyle,
        bowlingStyle: p.bowlingStyle,
        photoUrl: p.photoUrl,
        stats: p.stats,
        nominationOrder: p.nominationOrder,
        status: 'available',
      },
      { upsert: true }
    );
  }

  // 5. Initialize authoritative AuctionSession
  let session = await AuctionSession.findOne({ tournamentId: tournament._id });
  if (!session) {
    // Nominate the first player by default for an instantly live experience
    const firstPlayer = await Player.findOne({ tournamentId: tournament._id, nominationOrder: 1 });
    session = await AuctionSession.create({
      tournamentId: tournament._id,
      currentPlayerId: firstPlayer ? firstPlayer._id : null,
      status: firstPlayer ? AUCTION_STATUS.ACTIVE : AUCTION_STATUS.IDLE,
      currentBid: 0,
      deadline: firstPlayer ? new Date(Date.now() + 30 * 1000) : null,
      sessionVersion: 1,
    });

    if (firstPlayer) {
      firstPlayer.status = 'nominated';
      await firstPlayer.save();
    }
    console.log('[Seed] Initialized live Auction Session for tournament.');
  }

  console.log('[Seed] Database seeding completed successfully!');
  return {
    tournament,
    teams: createdTeams,
    users: [adminUser, auctioneerUser, ...createdOwners.map((o) => o.user)],
  };
}

// Standalone execution script
if (process.argv[1]?.endsWith('seed.js')) {
  (async () => {
    try {
      await connectDB();
      await seedDatabase({ clearExisting: true });
      console.log('[Seed] Standalone seed execution finished.');
      process.exit(0);
    } catch (err) {
      console.error('[Seed] Seeding failed:', err);
      process.exit(1);
    }
  })();
}
