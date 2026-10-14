import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { v2 as cloudinary } from 'cloudinary';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const serverDir = path.resolve(__dirname, '../../');
const clientDir = path.resolve(__dirname, '../../../client');

// Load server/.env explicitly
const serverEnvPath = path.join(serverDir, '.env');
const clientEnvPath = path.join(clientDir, '.env');

dotenv.config({ path: serverEnvPath });

console.log('====================================================');
console.log('🔍 REAL ENVIRONMENT DIAGNOSTICS & CONNECTIVITY TEST');
console.log('====================================================\n');

let hasFatalError = false;

// 1. Check Server .env File
console.log('1️⃣ Checking server/.env Configuration...');
if (!fs.existsSync(serverEnvPath)) {
  console.error('   ❌ server/.env NOT FOUND at:', serverEnvPath);
  hasFatalError = true;
} else {
  console.log('   ✓ server/.env file found');
}

const requiredServerVars = ['PORT', 'MONGODB_URI', 'JWT_SECRET', 'CLIENT_URL'];
const missingVars = requiredServerVars.filter((v) => !process.env[v]);

if (missingVars.length > 0) {
  console.error(`   ❌ Missing required variables in server/.env: ${missingVars.join(', ')}`);
  hasFatalError = true;
} else {
  console.log('   ✓ All required environment variables present:');
  console.log(`     - PORT:        ${process.env.PORT}`);
  console.log(`     - MONGODB_URI: ${process.env.MONGODB_URI.replace(/\/\/[^@]+@/, '//***:***@')}`);
  console.log(`     - JWT_SECRET:  ${process.env.JWT_SECRET ? 'Configured (' + process.env.JWT_SECRET.length + ' chars)' : 'MISSING'}`);
  console.log(`     - CLIENT_URL:  ${process.env.CLIENT_URL}`);
  console.log(`     - NODE_ENV:    ${process.env.NODE_ENV || 'development'}`);
}

// 2. Check Client .env File
console.log('\n2️⃣ Checking client/.env Configuration...');
if (!fs.existsSync(clientEnvPath)) {
  console.warn('   ⚠️  client/.env NOT FOUND at:', clientEnvPath);
} else {
  const clientEnvContent = fs.readFileSync(clientEnvPath, 'utf8');
  console.log('   ✓ client/.env file found:');
  clientEnvContent.split('\n').filter(Boolean).forEach((line) => {
    if (!line.startsWith('#')) {
      console.log(`     - ${line.trim()}`);
    }
  });
}

// 3. Test JWT Secret
console.log('\n3️⃣ Testing JWT Cryptographic Signing...');
try {
  const token = jwt.sign({ test: 'cpl_diagnostic' }, process.env.JWT_SECRET || 'fallback', { expiresIn: '1m' });
  const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback');
  if (decoded.test === 'cpl_diagnostic') {
    console.log('   ✓ JWT signing & verification test PASSED');
  }
} catch (jwtErr) {
  console.error('   ❌ JWT validation failed:', jwtErr.message);
  hasFatalError = true;
}

// 4. Test Cloudinary Integration
console.log('\n4️⃣ Testing Cloudinary Media CDN Integration...');
if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });

  try {
    const pingResult = await new Promise((resolve, reject) => {
      cloudinary.api.ping((err, res) => {
        if (err) reject(err);
        else resolve(res);
      });
    });
    console.log(`   ✓ Cloudinary Ping PASSED (Cloud: ${process.env.CLOUDINARY_CLOUD_NAME}, Status: ${pingResult.status})`);
  } catch (cErr) {
    console.warn(`   ⚠️  Cloudinary connection notice: ${cErr.message}`);
    console.log('      (Fallback: images will be stored as base64 data URIs)');
  }
} else {
  console.log('   ℹ️  Cloudinary credentials not set in server/.env (using inline data URI mode)');
}

// 5. Test Real MongoDB Connection
console.log('\n5️⃣ Testing Real MongoDB Atlas Connectivity...');
const mongoUri = process.env.MONGODB_URI;

if (!mongoUri) {
  console.error('   ❌ Cannot test MongoDB: MONGODB_URI is not set in server/.env');
  hasFatalError = true;
  printSummaryAndExit(hasFatalError);
} else {
  try {
    console.log(`   Connecting to: ${mongoUri.replace(/\/\/[^@]+@/, '//***:***@')} (5s timeout)...`);
    const conn = await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
    console.log(`   ✓ SUCCESS: Connected to real MongoDB: ${conn.connection.host}`);

    const admin = conn.connection.db.admin();
    const pingRes = await admin.ping();
    console.log(`   ✓ MongoDB Ping Response: ${JSON.stringify(pingRes)}`);

    const collections = await conn.connection.db.listCollections().toArray();
    console.log(`   ✓ Existing Database Collections (${collections.length}):`, collections.map((c) => c.name).join(', ') || 'None (Clean Database)');

    await mongoose.disconnect();
    printSummaryAndExit(hasFatalError);
  } catch (mongoErr) {
    console.error(`\n   ❌ FAILED TO CONNECT TO REAL MONGODB: ${mongoErr.message}\n`);
    hasFatalError = true;

    if (mongoErr.message.includes('bad auth') || mongoErr.message.includes('authentication failed')) {
      console.log('   ┌─────────────────────────────────────────────────────────────┐');
      console.log('   │ 🔑 RESOLUTION STEPS FOR MONGODB ATLAS AUTHENTICATION:       │');
      console.log('   ├─────────────────────────────────────────────────────────────┤');
      console.log('   │ 1. Open MongoDB Atlas: https://cloud.mongodb.com            │');
      console.log('   │ 2. Navigate to "Security" -> "Database Access".             │');
      console.log('   │ 3. Check your database username (e.g. codingclubnitn_db_user)│');
      console.log('   │ 4. Click "Edit" -> "Edit Password" -> Set a new password.   │');
      console.log('   │ 5. Under "Network Access", ensure 0.0.0.0/0 is enabled.     │');
      console.log('   │ 6. Update MONGODB_URI in server/.env with the new password: │');
      console.log('   │    mongodb+srv://<user>:<password>@cluster0.../db_name      │');
      console.log('   └─────────────────────────────────────────────────────────────┘\n');
    }
    printSummaryAndExit(hasFatalError);
  }
}

function printSummaryAndExit(failed) {
  console.log('====================================================');
  if (failed) {
    console.log('❌ DIAGNOSTIC RESULT: Issues found with real .env values!');
    console.log('   Please review the instructions above to fix credentials.');
    console.log('====================================================\n');
    process.exit(1);
  } else {
    console.log('✨ DIAGNOSTIC RESULT: 100% PASS! Real .env is ready for live use.');
    console.log('====================================================\n');
    process.exit(0);
  }
}
