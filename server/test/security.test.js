import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { connectDB, disconnectDB } from '../src/config/db.js';
import { seedDatabase } from '../src/utils/seed.js';
import User from '../src/models/User.js';

let tournamentId;
let adminToken;
let viewerToken;
let viewerUser;

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

  // Register a regular test viewer
  const viewerEmail = `viewer_${Date.now()}@example.com`;
  const regRes = await request(app).post('/api/auth/register').send({
    name: 'Normal Viewer',
    email: viewerEmail,
    password: 'Password@123',
  });
  viewerToken = regRes.body.token;
  viewerUser = regRes.body.user;
});

describe('Production-Grade Application Security Suite', () => {
  // ==========================================
  // 1. Authentication & Privilege Hardening
  // ==========================================
  describe('1. Authentication & Role-Based Access Control', () => {
    it('prevents privilege escalation by forcing VIEWER role on public registration', async () => {
      const maliciousEmail = `attacker_${Date.now()}@example.com`;
      const res = await request(app).post('/api/auth/register').send({
        name: 'Malicious Attacker',
        email: maliciousEmail,
        password: 'Attacker@123',
        globalRole: 'superadmin', // Privilege escalation attempt
      });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.user.globalRole).toBe('viewer'); // Must strictly be viewer

      // Double check in database directly
      const savedUser = await User.findOne({ email: maliciousEmail });
      expect(savedUser.globalRole).toBe('viewer');
    });

    it('rejects registration with invalid or malformed data', async () => {
      const res = await request(app).post('/api/auth/register').send({
        name: 'A', // Too short
        email: 'invalid-email',
        password: '123', // Too short
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('VALIDATION_ERROR');
    });

    it('requires current password when changing passwords', async () => {
      const res = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${viewerToken}`)
        .send({
          newPassword: 'BrandNewPassword@123',
          // currentPassword omitted!
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('CURRENT_PASSWORD_REQUIRED');
    });

    it('rejects password change if current password is wrong', async () => {
      const res = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${viewerToken}`)
        .send({
          currentPassword: 'WrongPassword@123',
          newPassword: 'BrandNewPassword@123',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('INVALID_CURRENT_PASSWORD');
    });

    it('invalidates active session tokens when password is changed', async () => {
      const oldToken = viewerToken;

      const changeRes = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${oldToken}`)
        .send({
          currentPassword: 'Password@123',
          newPassword: 'BrandNewPassword@123',
        });

      expect(changeRes.status).toBe(200);
      expect(changeRes.body.success).toBe(true);
      const newToken = changeRes.body.token;
      expect(newToken).toBeDefined();

      // Attempt to access protected endpoint with OLD token
      const oldTokenRes = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${oldToken}`);

      expect(oldTokenRes.status).toBe(401);
      expect(oldTokenRes.body.code).toBe('SESSION_INVALIDATED');

      // Access protected endpoint with NEW token succeeds
      const newTokenRes = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${newToken}`);

      expect(newTokenRes.status).toBe(200);
      expect(newTokenRes.body.success).toBe(true);
    });

    it('rejects unauthenticated access to demo accounts endpoint', async () => {
      const res = await request(app).get('/api/auth/demo-accounts');
      expect(res.status).toBe(401);
      expect(res.body.code).toBe('AUTH_REQUIRED');
    });

    it('never exposes default passwords in demo accounts response', async () => {
      const res = await request(app)
        .get('/api/auth/demo-accounts')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.demoAccounts)).toBe(true);

      for (const account of res.body.demoAccounts) {
        expect(account.defaultPassword).toBeUndefined();
        expect(account.password).toBeUndefined();
        expect(account.passwordHash).toBeUndefined();
      }
    });
  });

  // ==========================================
  // 2. Centralized Sanitized Error Handling
  // ==========================================
  describe('2. Sanitized Error Handling & Information Disclosure Prevention', () => {
    it('returns standardized JSON error format on malformed JSON payload', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .set('Content-Type', 'application/json')
        .send('{"email": "bad json", invalid_json}');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Invalid request format.');
      expect(res.body.code).toBe('INVALID_REQUEST');
      expect(res.body.stack).toBeUndefined();
    });

    it('returns standardized 404 for unknown API routes', async () => {
      const res = await request(app).get('/api/nonexistent-route-xyz');

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('NOT_FOUND');
      expect(res.body.message).toBe('Requested route was not found.');
      expect(res.body.stack).toBeUndefined();
    });

    it('sanitizes invalid ObjectId parameters without leaking schema paths', async () => {
      const res = await request(app).get('/api/players/not-a-valid-object-id-12345');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('INVALID_ID');
      expect(res.body.message).toContain('Invalid identifier format');
      expect(res.body.stack).toBeUndefined();
    });

    it('rejects unsupported HTTP methods with 405', async () => {
      const res = await request(app).patch('/api/auth/login');

      expect(res.status).toBe(405);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('METHOD_NOT_ALLOWED');
    });
  });

  // ==========================================
  // 3. NoSQL Injection & Input Sanitization
  // ==========================================
  describe('3. NoSQL Operator Injection Sanitization', () => {
    it('strips MongoDB operator injection keys from request body', async () => {
      // Attempt NoSQL injection with $gt operator
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: { $gt: '' },
          password: { $ne: null },
        });

      // Since $gt and $ne are stripped by mongoSanitize, email and password become undefined/empty
      expect(res.status).toBe(400);
      expect(res.body.code).toBe('INVALID_REQUEST');
    });
  });

  // ==========================================
  // 4. HTTP Security Headers
  // ==========================================
  describe('4. HTTP Security Headers', () => {
    it('includes essential security headers on API responses', async () => {
      const res = await request(app).get('/api/health');

      expect(res.status).toBe(200);
      expect(res.headers['x-content-type-options']).toBe('nosniff');
      expect(res.headers['permissions-policy']).toBeDefined();
      expect(res.headers['content-security-policy']).toBeDefined();
      expect(res.headers['cache-control']).toContain('no-store');
    });
  });

  // ==========================================
  // 5. Mass-Assignment & Parameter Validation
  // ==========================================
  describe('5. Mass-Assignment & Parameter Protection', () => {
    it('prevents overwriting internal tournament properties during update', async () => {
      const res = await request(app)
        .put(`/api/tournaments/${tournamentId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Updated Tournament Name',
          _id: '666666666666666666666666', // Attempt to overwrite primary key
          createdAt: new Date('2020-01-01'), // Attempt to overwrite timestamp
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.tournament._id.toString()).toBe(tournamentId);
    });

    it('rejects invalid or non-integer bid amounts', async () => {
      const res = await request(app)
        .post('/api/auction/bid')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          tournamentId,
          teamId: '666666666666666666666666',
          bidAmount: -50, // Negative bid
        });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('INVALID_BID_AMOUNT');
    });
  });
});
