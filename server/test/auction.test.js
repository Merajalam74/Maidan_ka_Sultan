import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app.js';
import { connectDB, disconnectDB } from '../src/config/db.js';
import { seedDatabase } from '../src/utils/seed.js';
import Tournament from '../src/models/Tournament.js';
import Team from '../src/models/Team.js';
import Player from '../src/models/Player.js';
import AuctionSession from '../src/models/AuctionSession.js';
import Bid from '../src/models/Bid.js';
import Purchase from '../src/models/Purchase.js';
import AuditLog from '../src/models/AuditLog.js';
import {
  placeBid,
  markPlayerSold,
  markPlayerUnsold,
  reversePurchase,
  nominatePlayer,
  calculateNextMinBid,
  checkPurseFeasibility,
} from '../src/services/auctionService.js';
import { previewPlayerImport, commitPlayerImport } from '../src/services/playerService.js';
import { fetchCricHeroesStatsByPhone } from '../src/services/cricheroesService.js';

let tournamentId;
let adminToken;
let auctioneerToken;
let owner1Token;
let owner2Token;
let team1;
let team2;
let player1;
let player2;
let adminUser;
let owner1User;
let owner2User;

beforeAll(async () => {
  await connectDB();
});

afterAll(async () => {
  await disconnectDB();
});

beforeEach(async () => {
  const seedResult = await seedDatabase({ clearExisting: true });
  tournamentId = seedResult.tournament._id.toString();

  // Log in as Superadmin
  const adminRes = await request(app).post('/api/auth/login').send({
    email: 'admin@mks.edu',
    password: 'Admin@123456',
  });
  adminToken = adminRes.body.token;
  adminUser = adminRes.body.user;

  // Log in as Auctioneer
  const auctioneerRes = await request(app).post('/api/auth/login').send({
    email: 'auctioneer@mks.edu',
    password: 'Auctioneer@123456',
  });
  auctioneerToken = auctioneerRes.body.token;

  // Log in as Owner 1 (Jeb Katre)
  const owner1Res = await request(app).post('/api/auth/login').send({
    email: 'jebkatre@mks.edu',
    password: 'Owner@123456',
  });
  owner1Token = owner1Res.body.token;
  owner1User = owner1Res.body.user;

  // Log in as Owner 2 (Maqsad XI)
  const owner2Res = await request(app).post('/api/auth/login').send({
    email: 'maqsad@mks.edu',
    password: 'Owner@123456',
  });
  owner2Token = owner2Res.body.token;
  owner2User = owner2Res.body.user;

  // Fetch teams and players
  team1 = await Team.findOne({ tournamentId, ownerUserId: owner1User._id });
  team2 = await Team.findOne({ tournamentId, ownerUserId: owner2User._id });

  const players = await Player.find({ tournamentId }).sort({ nominationOrder: 1 });
  player1 = players[0];
  player2 = players[1];
});

describe('1. Authentication & Role-Based Access Control', () => {
  it('allows public access to auction state without credentials', async () => {
    const res = await request(app).get('/api/auction/state');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.teams).toHaveLength(6);
    expect(res.body.tournament).toBeDefined();
  });

  it('rejects unauthorized users from privileged auctioneer endpoints', async () => {
    // Public viewer attempt
    const publicRes = await request(app).post('/api/auction/nominate').send({
      tournamentId,
      playerId: player2._id,
    });
    expect(publicRes.status).toBe(401);

    // Team owner attempt
    const ownerRes = await request(app)
      .post('/api/auction/nominate')
      .set('Authorization', `Bearer ${owner1Token}`)
      .send({
        tournamentId,
        playerId: player2._id,
      });
    expect(ownerRes.status).toBe(403);
  });

  it('allows auctioneer and superadmin to control nomination', async () => {
    // First clear existing nominated player
    await request(app)
      .post('/api/auction/cancel-nomination')
      .set('Authorization', `Bearer ${auctioneerToken}`)
      .send({ tournamentId });

    const res = await request(app)
      .post('/api/auction/nominate')
      .set('Authorization', `Bearer ${auctioneerToken}`)
      .send({
        tournamentId,
        playerId: player2._id,
      });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

describe('2. Bidding Rules & Validation', () => {
  it('calculates next minimum valid bid accurately', () => {
    // Opening bid on player with 10 Credits base price
    expect(calculateNextMinBid(0, 10, 1)).toBe(10);
    // Subsequent bid after 10 Credits
    expect(calculateNextMinBid(10, 10, 1)).toBe(11);
  });

  it('rejects bid below player base price on opening bid', async () => {
    await expect(
      placeBid({
        tournamentId,
        teamId: team1._id,
        bidderId: owner1User._id,
        bidAmount: 5, // player1 base price is 10 Credits
        idempotencyKey: 'test_low_bid_1',
      })
    ).rejects.toThrow(/below the minimum required bid/i);
  });

  it('accepts valid opening bid at or above base price', async () => {
    const result = await placeBid({
      tournamentId,
      teamId: team1._id,
      bidderId: owner1User._id,
      bidAmount: 10,
      idempotencyKey: 'valid_open_bid_1',
    });
    expect(result.bid.bidAmount).toBe(10);
    expect(result.session.currentBid).toBe(10);
    expect(result.session.leadingTeamId._id.toString()).toBe(team1._id.toString());
  });

  it('prevents a leading team from outbidding itself consecutively', async () => {
    await placeBid({
      tournamentId,
      teamId: team1._id,
      bidderId: owner1User._id,
      bidAmount: 10,
      idempotencyKey: 'bid_self_1',
    });

    await expect(
      placeBid({
        tournamentId,
        teamId: team1._id,
        bidderId: owner1User._id,
        bidAmount: 11,
        idempotencyKey: 'bid_self_2',
      })
    ).rejects.toThrow(/currently holds the highest bid/i);
  });

  it('rejects bids when a team has insufficient purse', async () => {
    // Artificially deplete team2 purse
    team2.remainingPurse = 5;
    await team2.save();

    await expect(
      placeBid({
        tournamentId,
        teamId: team2._id,
        bidderId: owner2User._id,
        bidAmount: 10,
        idempotencyKey: 'insufficient_purse_bid',
      })
    ).rejects.toThrow(/insufficient purse/i);
  });

  it('prevents team owner from submitting bids for another team', async () => {
    const res = await request(app)
      .post('/api/auction/bid')
      .set('Authorization', `Bearer ${owner1Token}`) // Logged in as Owner of team 1
      .send({
        tournamentId,
        teamId: team2._id.toString(), // Attempting to bid for team 2!
        bidAmount: 10,
      });

    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/only authorized to submit bids for your assigned team/i);
  });

  it('handles duplicate idempotency keys without corrupting state', async () => {
    const key = 'idempotent_test_key_123';
    const first = await placeBid({
      tournamentId,
      teamId: team1._id,
      bidderId: owner1User._id,
      bidAmount: 10,
      idempotencyKey: key,
    });
    expect(first.alreadyProcessed).toBe(false);

    const duplicate = await placeBid({
      tournamentId,
      teamId: team1._id,
      bidderId: owner1User._id,
      bidAmount: 10,
      idempotencyKey: key,
    });
    expect(duplicate.alreadyProcessed).toBe(true);
    expect(duplicate.bid._id.toString()).toBe(first.bid._id.toString());
  });
});

describe('3. Concurrency Safety', () => {
  it('serializes competing simultaneous bids correctly', async () => {
    // Both teams attempt to place opening bid at the same instant
    const attempts = await Promise.allSettled([
      placeBid({
        tournamentId,
        teamId: team1._id,
        bidderId: owner1User._id,
        bidAmount: 10,
        idempotencyKey: 'concurrent_bid_team1',
      }),
      placeBid({
        tournamentId,
        teamId: team2._id,
        bidderId: owner2User._id,
        bidAmount: 10,
        idempotencyKey: 'concurrent_bid_team2',
      }),
    ]);

    // Exactly one must succeed, the other must be rejected due to version check or stale bid
    const fulfilled = attempts.filter((a) => a.status === 'fulfilled');
    const rejected = attempts.filter((a) => a.status === 'rejected');

    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);

    const session = await AuctionSession.findOne({ tournamentId });
    expect(session.currentBid).toBe(10);
  });
});

describe('4. SOLD & UNSOLD Workflows & Reversal', () => {
  it('atomically settles a player purchase and updates purse and roster', async () => {
    // Place winning bid
    await placeBid({
      tournamentId,
      teamId: team1._id,
      bidderId: owner1User._id,
      bidAmount: 10,
      idempotencyKey: 'winning_bid_1',
    });

    const initialPurse = team1.remainingPurse;
    const soldResult = await markPlayerSold(tournamentId, adminUser._id);

    expect(soldResult.player.status).toBe('sold');
    expect(soldResult.player.winningTeamId.toString()).toBe(team1._id.toString());
    expect(soldResult.player.soldPrice).toBe(10);

    // Verify purse deducted
    const updatedTeam = await Team.findById(team1._id);
    expect(updatedTeam.committedSpent).toBe(10);
    expect(updatedTeam.remainingPurse).toBe(initialPurse - 10);

    // Verify purchase record
    const purchase = await Purchase.findOne({ playerId: player1._id, status: 'completed' });
    expect(purchase).toBeDefined();
    expect(purchase.finalPurchasePrice).toBe(10);

    // Verify session reset
    const session = await AuctionSession.findOne({ tournamentId });
    expect(session.currentPlayerId).toBeNull();
    expect(session.currentBid).toBe(0);
  });

  it('does not deduct funds when a player is marked UNSOLD', async () => {
    const initialPurse = team1.remainingPurse;
    const unsoldResult = await markPlayerUnsold(tournamentId, adminUser._id);

    expect(unsoldResult.player.status).toBe('unsold');

    const updatedTeam = await Team.findById(team1._id);
    expect(updatedTeam.remainingPurse).toBe(initialPurse);
    expect(updatedTeam.committedSpent).toBe(0);
  });

  it('allows superadmin to reverse a completed transaction with audit trail', async () => {
    // Sell player first
    await placeBid({
      tournamentId,
      teamId: team1._id,
      bidderId: owner1User._id,
      bidAmount: 10,
      idempotencyKey: 'reversal_test_bid',
    });
    const soldResult = await markPlayerSold(tournamentId, adminUser._id);
    const purchaseId = soldResult.purchase._id;

    // Execute reversal
    const reversal = await reversePurchase(
      purchaseId,
      'Mistaken winning bid entered during test demo',
      adminUser._id
    );

    expect(reversal.success).toBe(true);
    expect(reversal.purchase.status).toBe('reversed');
    expect(reversal.player.status).toBe('available');
    expect(reversal.player.winningTeamId).toBeNull();

    // Verify restored purse
    const restoredTeam = await Team.findById(team1._id);
    expect(restoredTeam.committedSpent).toBe(0);
    expect(restoredTeam.remainingPurse).toBe(restoredTeam.initialPurse);

    // Verify audit log
    const audit = await AuditLog.findOne({ targetId: purchaseId.toString(), action: 'PURCHASE_REVERSED' });
    expect(audit).toBeDefined();
    expect(audit.action).toBe('PURCHASE_REVERSED');
  });
});

describe('5. Player Import & Validation', () => {
  it('previews and validates CSV rows with column mapping', async () => {
    const rawRows = [
      { 'Name': 'Kavya Raman', 'Role': 'Batsman', 'Base Price': '5', 'Dept': 'CSE', 'Year': '2nd Year' },
      { 'Name': 'Tanmay Roy', 'Role': 'Bowler', 'Base Price': '4', 'Dept': 'ECE', 'Year': '3rd Year' },
      { 'Name': '', 'Role': 'All-Rounder', 'Base Price': '2' }, // Invalid row (missing name)
    ];

    const mapping = {
      name: 'Name',
      role: 'Role',
      basePrice: 'Base Price',
      department: 'Dept',
      academicYear: 'Year',
    };

    const preview = await previewPlayerImport({
      tournamentId,
      rawRows,
      mapping,
    });

    expect(preview.totalRows).toBe(3);
    expect(preview.validCount).toBe(2);
    expect(preview.errorCount).toBe(1);
    expect(preview.preview[2].isValid).toBe(false);
  });

  it('never overwrites a SOLD player during import', async () => {
    // Sell player1 first
    await placeBid({
      tournamentId,
      teamId: team1._id,
      bidderId: owner1User._id,
      bidAmount: 10,
      idempotencyKey: 'import_sold_bid',
    });
    await markPlayerSold(tournamentId, adminUser._id);

    // Attempt to import row with same name as sold player
    const rowsToImport = [
      {
        name: player1.name,
        role: 'Bowler',
        basePrice: 2,
        isSoldAlready: true,
      },
    ];

    const result = await commitPlayerImport({
      tournamentId,
      mappedRows: rowsToImport,
    });

    expect(result.skipped).toBe(1);

    // Verify player1 remains sold with original price
    const checkPlayer = await Player.findById(player1._id);
    expect(checkPlayer.status).toBe('sold');
    expect(checkPlayer.soldPrice).toBe(10);
  });
});

describe('7. CricHeroes Scraping & Mathematical Purse Infeasibility Warning', () => {
  it('returns "nan" stats when phone number is invalid or not listed', async () => {
    const stats = await fetchCricHeroesStatsByPhone('123', 'Dummy Player');
    expect(stats.matches).toBe('nan');
    expect(stats.runs).toBe('nan');
    expect(stats.wickets).toBe('nan');
    expect(stats.strikeRate).toBe('nan');
    expect(stats.economy).toBe('nan');
  });

  it('correctly calculates mathematical purse deficit when bid jeopardizes minimum squad', () => {
    // 0 players purchased, remainingPurse = 100 Credits
    // minSquadSize = 11, minBasePrice = 1 Credit
    // If bidding 95 Credits, leaves 5 Credits
    // 10 players needed * 1 Credit = 10 Credits reserve required
    // Deficit = 5 Credits -> isFeasible: false
    const feasibility = checkPurseFeasibility({
      remainingPurse: 100,
      purchasedCount: 0,
      bidAmount: 95,
      minSquadSize: 11,
      minBasePrice: 1,
    });

    expect(feasibility.isFeasible).toBe(false);
    expect(feasibility.deficit).toBe(5);
    expect(feasibility.warning).toContain('Mathematical Purse Deficit Warning');
    expect(feasibility.maxSafeBid).toBe(90); // 100 - (10 * 1)
  });

  it('marks bid as feasible when remaining purse comfortably covers minimum base reserve', () => {
    const feasibility = checkPurseFeasibility({
      remainingPurse: 100, // 100 Credits
      purchasedCount: 2,
      bidAmount: 20, // 20 Credits
      minSquadSize: 11,
      minBasePrice: 1,
    });

    expect(feasibility.isFeasible).toBe(true);
    expect(feasibility.deficit).toBe(0);
    expect(feasibility.warning).toBeNull();
  });
});
