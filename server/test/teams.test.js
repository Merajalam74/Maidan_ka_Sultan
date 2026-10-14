import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { connectDB, disconnectDB } from '../src/config/db.js';
import { seedDatabase } from '../src/utils/seed.js';
import Team from '../src/models/Team.js';

let tournamentId;
let adminToken;
let ownerToken;

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

  // Log in as Team Owner
  const ownerRes = await request(app).post('/api/auth/login').send({
    email: 'jebkatre@mks.edu',
    password: 'Owner@123456',
  });
  ownerToken = ownerRes.body.token;
});

describe('Team Management & Cloudinary Logo Uploads', () => {
  it('allows superadmin to create a new team with captain, colors, and purse', async () => {
    const res = await request(app)
      .post('/api/teams')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        tournamentId,
        name: 'Royal Strikers XI',
        shortCode: 'RSX',
        captainName: 'Jasprit Bumrah',
        primaryColor: '#F59E0B',
        secondaryColor: '#B45309',
        initialPurse: 10000000,
        maxSquadSize: 15,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.team.name).toBe('Royal Strikers XI');
    expect(res.body.team.shortCode).toBe('RSX');
    expect(res.body.team.captainName).toBe('Jasprit Bumrah');
    expect(res.body.team.primaryColor).toBe('#F59E0B');

    // Verify in database
    const dbTeam = await Team.findOne({ shortCode: 'RSX' });
    expect(dbTeam).toBeTruthy();
    expect(dbTeam.captainName).toBe('Jasprit Bumrah');
  });

  it('rejects team creation from non-superadmin accounts', async () => {
    const res = await request(app)
      .post('/api/teams')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        tournamentId,
        name: 'Unauthorized Team',
        shortCode: 'UNAUTH',
      });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('allows superadmin to update team name, captain, and colors', async () => {
    const team = await Team.findOne({ shortCode: 'JBK' });
    expect(team).toBeTruthy();

    const res = await request(app)
      .put(`/api/teams/${team._id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Jeb Katre Superstars',
        captainName: 'Virat Kohli',
        primaryColor: '#DC2626',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.team.name).toBe('Jeb Katre Superstars');
    expect(res.body.team.captainName).toBe('Virat Kohli');
    expect(res.body.team.primaryColor).toBe('#DC2626');
  });

  it('supports uploading a logo via multipart file', async () => {
    const team = await Team.findOne({ shortCode: 'MQX' });
    expect(team).toBeTruthy();

    // Valid 1x1 transparent PNG buffer for real Cloudinary validation
    const dummyImageBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64'
    );

    const res = await request(app)
      .post(`/api/teams/${team._id}/upload-logo`)
      .set('Authorization', `Bearer ${adminToken}`)
      .attach('logo', dummyImageBuffer, 'team-logo.png');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.url).toBeTruthy();

    // Verify team logoUrl in database was updated
    const updatedTeam = await Team.findById(team._id);
    expect(updatedTeam.logoUrl).toBe(res.body.url);
  });

  it('allows superadmin to delete an empty team without purchases', async () => {
    // Create new team
    const createRes = await request(app)
      .post('/api/teams')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        tournamentId,
        name: 'Temp Deletable Team',
        shortCode: 'DEL',
      });
    const newTeamId = createRes.body.team._id;

    // Delete it
    const delRes = await request(app)
      .delete(`/api/teams/${newTeamId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(delRes.status).toBe(200);
    expect(delRes.body.success).toBe(true);

    const check = await Team.findById(newTeamId);
    expect(check).toBeNull();
  });
});
