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
import { getTeamHistoryData } from '../config/teamHistory.js';
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
  let tournament = await Tournament.findOne({ name: 'Maidan ke Sultan - Season 5' });
  if (!tournament) {
    tournament = await Tournament.create({
      name: 'Maidan ke Sultan - Season 5',
      status: AUCTION_STATUS.LIVE,
      currency: 'CREDITS',
      currencySymbol: 'CR',
      defaultPurse: 100, // 100 Credits per team
      minBidIncrement: 1,  // 1 Credit minimum increment
      minBasePrice: 1,     // 1 Credit minimum base price
      squadLimit: 15,
      minSquadSize: 11,
      countdownDurationSeconds: 30,
      antiSnipingSeconds: 10,
      antiSnipingExtensionSeconds: 15,
      rulesDescription: 'Maidan ke Sultan Season 5 Live Player Auction. 5 Franchises: Jeb Katre, Maqsad XI, Khalnayak XI, Phurtile Sher, Dhurandar XI. 100 Credits allocated per franchise with CricHeroes stats integration and mathematical purse guarantees.',
      scheduledStartTime: new Date(),
    });
    console.log('[Seed] Created Tournament:', tournament.name);
  }

  // 2. Create Users (Superadmin, Auctioneer, 5 Team Owners)
  const passwordHash = await User.hashPassword('Admin@123456');
  const auctioneerHash = await User.hashPassword('Auctioneer@123456');
  const ownerHash = await User.hashPassword('Owner@123456');

  // Super Admin
  const adminUser = await User.findOneAndUpdate(
    { email: 'admin@mks.edu' },
    {
      name: 'Tournament Director (Maidan ke Sultan)',
      email: 'admin@mks.edu',
      passwordHash,
      globalRole: ROLES.SUPERADMIN,
      status: 'active',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
    },
    { upsert: true, new: true }
  );

  // Auctioneer
  const auctioneerUser = await User.findOneAndUpdate(
    { email: 'auctioneer@mks.edu' },
    {
      name: 'Charu Sharma (Official Gavel Master)',
      email: 'auctioneer@mks.edu',
      passwordHash: auctioneerHash,
      globalRole: ROLES.AUCTIONEER,
      status: 'active',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=250',
    },
    { upsert: true, new: true }
  );

  // 6 Team Owners (Captain is Owner)
  const ownerConfigs = [
    { email: 'jebkatre@mks.edu', name: 'Suryansh Patel', teamName: 'Jeb Katre' },
    { email: 'maqsad@mks.edu', name: 'Mukhtar Ali', teamName: 'Maqsad XI' },
    { email: 'khalnayak@mks.edu', name: 'Bhanu Pratap', teamName: 'Khalnayak XI' },
    { email: 'phurtile@mks.edu', name: 'Prabhat Kumar', teamName: 'Phurtile Sher' },
    { email: 'dhurandar@mks.edu', name: 'Hrishabh', teamName: 'Dhurandar XI' },
    { email: 'paltan@mks.edu', name: 'Vamsi', teamName: 'Paltan XI' },
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
        avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(o.teamName)}`,
      },
      { upsert: true, new: true }
    );
    createdOwners.push({ user: owner, teamName: o.teamName });
  }

  // 3. Create 6 Participating Teams
  const teamTemplates = [
    {
      name: 'Jeb Katre',
      shortCode: 'JBK',
      captainName: 'Suryansh Patel',
      logoUrl: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&q=80&w=200',
      primaryColor: '#EF4444', // Crimson Red
      secondaryColor: '#991B1B',
      initialPurse: 100,
      ownerEmail: 'jebkatre@mks.edu',
    },
    {
      name: 'Maqsad XI',
      shortCode: 'MQX',
      captainName: 'Mukhtar Ali',
      logoUrl: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&q=80&w=200',
      primaryColor: '#10B981', // Emerald Green
      secondaryColor: '#064E3B',
      initialPurse: 100,
      ownerEmail: 'maqsad@mks.edu',
    },
    {
      name: 'Khalnayak XI',
      shortCode: 'KLX',
      captainName: 'Bhanu Pratap',
      logoUrl: 'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?auto=format&fit=crop&q=80&w=200',
      primaryColor: '#8B5CF6', // Royal Purple
      secondaryColor: '#5B21B6',
      initialPurse: 100,
      ownerEmail: 'khalnayak@mks.edu',
    },
    {
      name: 'Phurtile Sher',
      shortCode: 'PHS',
      captainName: 'Prabhat Kumar',
      logoUrl: 'https://images.unsplash.com/photo-1569517282132-25d22f4573e6?auto=format&fit=crop&q=80&w=200',
      primaryColor: '#F97316', // Tiger Orange
      secondaryColor: '#C2410C',
      initialPurse: 100,
      ownerEmail: 'phurtile@mks.edu',
    },
    {
      name: 'Dhurandar XI',
      shortCode: 'DHX',
      captainName: 'Hrishabh',
      logoUrl: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&q=80&w=200',
      primaryColor: '#06B6D4', // Cyan
      secondaryColor: '#0E7490',
      initialPurse: 100,
      ownerEmail: 'dhurandar@mks.edu',
    },
    {
      name: 'Paltan XI',
      shortCode: 'PTX',
      captainName: 'Vamsi',
      logoUrl: 'https://images.unsplash.com/photo-1589487391730-58f20eb2c308?auto=format&fit=crop&q=80&w=200',
      primaryColor: '#F59E0B', // Gold / Amber
      secondaryColor: '#D97706',
      initialPurse: 100,
      ownerEmail: 'paltan@mks.edu',
    },
  ];

  const createdTeams = [];
  for (const t of teamTemplates) {
    const ownerObj = createdOwners.find((o) => o.user.email === t.ownerEmail);
    const history = getTeamHistoryData(t.name) || {};
    const team = await Team.findOneAndUpdate(
      { tournamentId: tournament._id, name: t.name },
      {
        tournamentId: tournament._id,
        name: t.name,
        shortCode: t.shortCode,
        captainName: t.captainName || '',
        logoUrl: t.logoUrl,
        primaryColor: t.primaryColor,
        secondaryColor: t.secondaryColor,
        initialPurse: t.initialPurse,
        remainingPurse: t.initialPurse,
        committedSpent: 0,
        maxSquadSize: 15,
        isActive: true,
        description: history.description || '',
        achievements: history.achievements || [],
        championshipTitles: history.championshipTitles || [],
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

  // 4. Create 15 Realistic College Cricket Players with Phone Numbers and CricHeroes Stats / nan
  const samplePlayers = [
    {
      externalId: 'MKS-P01',
      name: 'Rudra Pratap Sengupta',
      phoneNumber: '+91 98765 11001',
      role: PLAYER_ROLES.BATSMAN,
      category: PLAYER_CATEGORIES.MARQUEE,
      department: 'Computer Science & Engg',
      academicYear: '4th Year',
      basePrice: 10,
      battingStyle: 'Right-hand bat',
      bowlingStyle: 'Right-arm medium',
      photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300',
      stats: { matches: 28, runs: 1140, wickets: 4, strikeRate: 154.2, economy: 8.1, highestScore: '104*' },
      nominationOrder: 1,
    },
    {
      externalId: 'MKS-P02',
      name: 'Arjun Venkatesh',
      phoneNumber: '+91 98765 11002',
      role: PLAYER_ROLES.BOWLER,
      category: PLAYER_CATEGORIES.MARQUEE,
      department: 'Mechanical Engg',
      academicYear: '3rd Year',
      basePrice: 10,
      battingStyle: 'Right-hand bat',
      bowlingStyle: 'Right-arm fast (140+ kmph)',
      photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=300',
      stats: { matches: 30, runs: 180, wickets: 48, strikeRate: 110.0, economy: 6.4, bestBowling: '5/18' },
      nominationOrder: 2,
    },
    {
      externalId: 'MKS-P03',
      name: 'Manish Karthik',
      phoneNumber: '+91 98765 11003',
      role: PLAYER_ROLES.ALL_ROUNDER,
      category: PLAYER_CATEGORIES.MARQUEE,
      department: 'Electronics & Comm Engg',
      academicYear: '4th Year',
      basePrice: 10,
      battingStyle: 'Left-hand bat',
      bowlingStyle: 'Right-arm offbreak',
      photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=300',
      stats: { matches: 34, runs: 920, wickets: 38, strikeRate: 142.5, economy: 7.1, highestScore: '88' },
      nominationOrder: 3,
    },
    {
      externalId: 'MKS-P04',
      name: 'Dhruv Rishabh Pant',
      phoneNumber: '+91 98765 11004',
      role: PLAYER_ROLES.WICKET_KEEPER,
      category: PLAYER_CATEGORIES.MARQUEE,
      department: 'Management Studies (MBA)',
      academicYear: '2nd Year',
      basePrice: 8,
      battingStyle: 'Left-hand aggressive bat',
      bowlingStyle: 'Right-arm off spin',
      photoUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&q=80&w=300',
      stats: { matches: 25, runs: 850, wickets: 0, strikeRate: 168.0, economy: 0, highestScore: '92*' },
      nominationOrder: 4,
    },
    {
      externalId: 'MKS-P05',
      name: 'Siddharth Iyer',
      phoneNumber: '+91 98765 11005',
      role: PLAYER_ROLES.BATSMAN,
      category: PLAYER_CATEGORIES.CATEGORY_A,
      department: 'Information Technology',
      academicYear: '3rd Year',
      basePrice: 5,
      battingStyle: 'Right-hand bat (Anchor)',
      bowlingStyle: 'Right-arm leg spin',
      photoUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=300',
      stats: { matches: 22, runs: 670, wickets: 6, strikeRate: 135.0, economy: 7.8, highestScore: '76' },
      nominationOrder: 5,
    },
    {
      externalId: 'MKS-P06',
      name: 'Tariq Al-Mansoor',
      phoneNumber: '+91 98765 11006',
      role: PLAYER_ROLES.BOWLER,
      category: PLAYER_CATEGORIES.CATEGORY_A,
      department: 'Civil Engg',
      academicYear: '4th Year',
      basePrice: 5,
      battingStyle: 'Right-hand bat',
      bowlingStyle: 'Left-arm orthodox spin',
      photoUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=300',
      // Demonstrating 'nan' fallback for players with no CricHeroes match record
      stats: { matches: 'nan', runs: 'nan', wickets: 'nan', strikeRate: 'nan', economy: 'nan', highestScore: 'nan', bestBowling: 'nan' },
      nominationOrder: 6,
    },
    {
      externalId: 'MKS-P07',
      name: 'Pranav Kulkarni',
      phoneNumber: '+91 98765 11007',
      role: PLAYER_ROLES.ALL_ROUNDER,
      category: PLAYER_CATEGORIES.CATEGORY_A,
      department: 'Biotechnology',
      academicYear: '3rd Year',
      basePrice: 6,
      battingStyle: 'Right-hand power hitter',
      bowlingStyle: 'Right-arm medium fast',
      photoUrl: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&q=80&w=300',
      stats: { matches: 24, runs: 590, wickets: 25, strikeRate: 148.0, economy: 8.2, highestScore: '68*' },
      nominationOrder: 7,
    },
    {
      externalId: 'MKS-P08',
      name: 'Adil Khan',
      phoneNumber: '+91 98765 11008',
      role: PLAYER_ROLES.BOWLER,
      category: PLAYER_CATEGORIES.CATEGORY_A,
      department: 'Electrical & Electronics',
      academicYear: '2nd Year',
      basePrice: 5,
      battingStyle: 'Left-hand bat',
      bowlingStyle: 'Right-arm express fast',
      photoUrl: 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?auto=format&fit=crop&q=80&w=300',
      stats: { matches: 18, runs: 85, wickets: 29, strikeRate: 120.0, economy: 6.8, bestBowling: '4/22' },
      nominationOrder: 8,
    },
    {
      externalId: 'MKS-P09',
      name: 'Kunal Deshmukh',
      phoneNumber: '+91 98765 11009',
      role: PLAYER_ROLES.BATSMAN,
      category: PLAYER_CATEGORIES.CATEGORY_B,
      department: 'Chemical Engg',
      academicYear: '3rd Year',
      basePrice: 3,
      battingStyle: 'Right-hand opening bat',
      bowlingStyle: 'Right-arm medium',
      photoUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=300',
      stats: { matches: 'nan', runs: 'nan', wickets: 'nan', strikeRate: 'nan', economy: 'nan', highestScore: 'nan', bestBowling: 'nan' },
      nominationOrder: 9,
    },
    {
      externalId: 'MKS-P10',
      name: 'Samarth Nambiar',
      phoneNumber: '+91 98765 11010',
      role: PLAYER_ROLES.WICKET_KEEPER,
      category: PLAYER_CATEGORIES.CATEGORY_B,
      department: 'Computer Applications (MCA)',
      academicYear: '1st Year',
      basePrice: 3,
      battingStyle: 'Right-hand middle order',
      bowlingStyle: 'None',
      photoUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=300',
      stats: { matches: 14, runs: 340, wickets: 0, strikeRate: 138.0, economy: 0, highestScore: '48*' },
      nominationOrder: 10,
    },
    {
      externalId: 'MKS-P11',
      name: 'Yash Vardhan Chawla',
      phoneNumber: '+91 98765 11011',
      role: PLAYER_ROLES.BOWLER,
      category: PLAYER_CATEGORIES.CATEGORY_B,
      department: 'Mechanical Engg',
      academicYear: '2nd Year',
      basePrice: 3,
      battingStyle: 'Right-hand bat',
      bowlingStyle: 'Right-arm mystery spin',
      photoUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=300',
      stats: { matches: 16, runs: 45, wickets: 24, strikeRate: 85.0, economy: 6.2, bestBowling: '3/15' },
      nominationOrder: 11,
    },
    {
      externalId: 'MKS-P12',
      name: 'Harshavardhan Reddy',
      phoneNumber: '+91 98765 11012',
      role: PLAYER_ROLES.ALL_ROUNDER,
      category: PLAYER_CATEGORIES.EMERGING,
      department: 'Computer Science',
      academicYear: '1st Year (Freshman)',
      basePrice: 2,
      battingStyle: 'Right-hand bat',
      bowlingStyle: 'Right-arm seam',
      photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300',
      stats: { matches: 10, runs: 210, wickets: 12, strikeRate: 145.0, economy: 7.9, highestScore: '45*' },
      nominationOrder: 12,
    },
    {
      externalId: 'MKS-P13',
      name: 'Aakash Bhattacharya',
      phoneNumber: '+91 98765 11013',
      role: PLAYER_ROLES.BATSMAN,
      category: PLAYER_CATEGORIES.EMERGING,
      department: 'Aerospace Engg',
      academicYear: '1st Year',
      basePrice: 2,
      battingStyle: 'Left-hand top order',
      bowlingStyle: 'Left-arm spin',
      photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=300',
      stats: { matches: 'nan', runs: 'nan', wickets: 'nan', strikeRate: 'nan', economy: 'nan', highestScore: 'nan', bestBowling: 'nan' },
      nominationOrder: 13,
    },
    {
      externalId: 'MKS-P14',
      name: 'Gaurav Tewari',
      phoneNumber: '+91 98765 11014',
      role: PLAYER_ROLES.BOWLER,
      category: PLAYER_CATEGORIES.EMERGING,
      department: 'Metallurgical Engg',
      academicYear: '2nd Year',
      basePrice: 2,
      battingStyle: 'Right-hand bat',
      bowlingStyle: 'Right-arm yorker specialist',
      photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=300',
      stats: { matches: 12, runs: 30, wickets: 18, strikeRate: 90.0, economy: 7.4, bestBowling: '3/20' },
      nominationOrder: 14,
    },
    {
      externalId: 'MKS-P15',
      name: 'Nikhil Roy',
      phoneNumber: '+91 98765 11015',
      role: PLAYER_ROLES.ALL_ROUNDER,
      category: PLAYER_CATEGORIES.CATEGORY_B,
      department: 'Information Science',
      academicYear: '3rd Year',
      basePrice: 3,
      battingStyle: 'Right-hand bat',
      bowlingStyle: 'Right-arm offbreak',
      photoUrl: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&q=80&w=300',
      stats: { matches: 17, runs: 390, wickets: 16, strikeRate: 134.0, economy: 7.3, highestScore: '52' },
      nominationOrder: 15,
    },
    {
      externalId: 'MKS-CAP01',
      name: 'Suryansh Patel',
      phoneNumber: '+91 98765 00001',
      role: PLAYER_ROLES.BATSMAN,
      category: PLAYER_CATEGORIES.MARQUEE,
      department: 'Computer Science & Engg',
      academicYear: '4th Year',
      basePrice: 10,
      battingStyle: 'Right-hand aggressive bat',
      bowlingStyle: 'Right-arm medium',
      photoUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=300',
      stats: { matches: 32, runs: 1280, wickets: 6, strikeRate: 158.4, economy: 7.9, highestScore: '108*' },
      nominationOrder: 16,
    },
    {
      externalId: 'MKS-CAP02',
      name: 'Mukhtar Ali',
      phoneNumber: '+91 98765 00002',
      role: PLAYER_ROLES.ALL_ROUNDER,
      category: PLAYER_CATEGORIES.MARQUEE,
      department: 'Mechanical Engg',
      academicYear: '4th Year',
      basePrice: 10,
      battingStyle: 'Right-hand bat (Anchor)',
      bowlingStyle: 'Right-arm fast medium',
      photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=300',
      stats: { matches: 30, runs: 940, wickets: 34, strikeRate: 145.2, economy: 6.9, highestScore: '92*' },
      nominationOrder: 17,
    },
    {
      externalId: 'MKS-CAP03',
      name: 'Bhanu Pratap',
      phoneNumber: '+91 98765 00003',
      role: PLAYER_ROLES.BOWLER,
      category: PLAYER_CATEGORIES.MARQUEE,
      department: 'Civil Engg',
      academicYear: '4th Year',
      basePrice: 10,
      battingStyle: 'Right-hand bat',
      bowlingStyle: 'Right-arm express fast (142 kmph)',
      photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=300',
      stats: { matches: 28, runs: 240, wickets: 52, strikeRate: 115.0, economy: 6.2, bestBowling: '5/14' },
      nominationOrder: 18,
    },
    {
      externalId: 'MKS-CAP04',
      name: 'Prabhat Kumar',
      phoneNumber: '+91 98765 00004',
      role: PLAYER_ROLES.BATSMAN,
      category: PLAYER_CATEGORIES.MARQUEE,
      department: 'Electronics & Comm Engg',
      academicYear: '4th Year',
      basePrice: 10,
      battingStyle: 'Left-hand explosive bat',
      bowlingStyle: 'Right-arm offbreak',
      photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300',
      stats: { matches: 35, runs: 1420, wickets: 12, strikeRate: 162.8, economy: 7.5, highestScore: '116*' },
      nominationOrder: 19,
    },
    {
      externalId: 'MKS-CAP05',
      name: 'Hrishabh',
      phoneNumber: '+91 98765 00005',
      role: PLAYER_ROLES.ALL_ROUNDER,
      category: PLAYER_CATEGORIES.MARQUEE,
      department: 'Information Technology',
      academicYear: '3rd Year',
      basePrice: 10,
      battingStyle: 'Right-hand middle order',
      bowlingStyle: 'Right-arm mystery spin',
      photoUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=300',
      stats: { matches: 26, runs: 810, wickets: 31, strikeRate: 139.5, economy: 6.5, highestScore: '84' },
      nominationOrder: 20,
    },
    {
      externalId: 'MKS-CAP06',
      name: 'Vamsi',
      phoneNumber: '+91 98765 00006',
      role: PLAYER_ROLES.WICKET_KEEPER,
      category: PLAYER_CATEGORIES.MARQUEE,
      department: 'Electrical & Electronics',
      academicYear: '3rd Year',
      basePrice: 10,
      battingStyle: 'Right-hand finisher',
      bowlingStyle: 'None',
      photoUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&q=80&w=300',
      stats: { matches: 27, runs: 790, wickets: 0, strikeRate: 155.0, economy: 0, highestScore: '78*' },
      nominationOrder: 21,
    },
  ];

  for (const p of samplePlayers) {
    await Player.findOneAndUpdate(
      { tournamentId: tournament._id, externalId: p.externalId },
      {
        tournamentId: tournament._id,
        externalId: p.externalId,
        name: p.name,
        phoneNumber: p.phoneNumber || '',
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
