import mongoose from 'mongoose';

let mongoMemoryServer = null;
export let isReplicaSetSupported = false;

/**
 * Connect to MongoDB Atlas or local instance, with automatic
 * embedded MongoDB fallback for zero-friction local development.
 */
export async function connectDB() {
  const isTestEnv = process.env.NODE_ENV === 'test';

  // In automated test runs (vitest), strictly use isolated in-memory replica set
  // so tests run in parallel without clobbering the live database or throwing duplicate key conflicts.
  if (isTestEnv) {
    try {
      const { MongoMemoryReplSet, MongoMemoryServer } = await import('mongodb-memory-server');
      try {
        mongoMemoryServer = await MongoMemoryReplSet.create({
          replSet: { count: 1, storageEngine: 'wiredTiger' },
        });
        const replUri = mongoMemoryServer.getUri();
        const conn = await mongoose.connect(replUri);
        isReplicaSetSupported = true;
        return conn;
      } catch (replErr) {
        mongoMemoryServer = await MongoMemoryServer.create();
        const memUri = mongoMemoryServer.getUri();
        const conn = await mongoose.connect(memUri);
        isReplicaSetSupported = false;
        return conn;
      }
    } catch (memErr) {
      console.error('[DB] Failed to start test MongoDB server:', memErr.message);
      throw memErr;
    }
  }

  // Non-test environment: strictly require and connect to the real MONGODB_URI from server/.env
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    const errorMsg = '[DB] MONGODB_URI is missing in server/.env. Please configure your real MongoDB connection string.';
    console.error(`\n❌ ${errorMsg}\n`);
    throw new Error(errorMsg);
  }

  try {
    console.log(`[DB] Connecting to real MongoDB at ${uri.replace(/\/\/[^@]+@/, '//***:***@')}...`);
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`[DB] Successfully connected to real MongoDB: ${conn.connection.host}`);
    await detectReplicaSetSupport();
    return conn;
  } catch (err) {
    console.error(`\n❌ [DB] FATAL: Failed to connect to configured real MONGODB_URI in server/.env!`);
    console.error(`   Error details: ${err.message}`);
    if (err.message.includes('bad auth') || err.message.includes('authentication failed')) {
      console.error(`\n💡 Authentication failed for MongoDB Atlas:`);
      console.error(`   1. Open MongoDB Atlas (https://cloud.mongodb.com) -> Security -> Database Access.`);
      console.error(`   2. Verify username and reset password for the database user.`);
      console.error(`   3. Under Network Access, ensure 0.0.0.0/0 (Allow access from anywhere) is enabled.`);
      console.error(`   4. Update MONGODB_URI in server/.env with the exact connection string.\n`);
    }
    throw err;
  }
}

/**
 * Detects if the current MongoDB connection supports multi-document transactions
 */
async function detectReplicaSetSupport() {
  try {
    const admin = mongoose.connection.db.admin();
    const serverStatus = await admin.serverStatus();
    if (serverStatus.repl && serverStatus.repl.setName) {
      isReplicaSetSupported = true;
      console.log(`[DB] Replica Set detected (${serverStatus.repl.setName}). MongoDB transactions enabled.`);
    } else {
      isReplicaSetSupported = false;
      console.log('[DB] Standalone MongoDB detected. Using atomic document transitions.');
    }
  } catch (e) {
    // Fallback: check connection replica set state
    isReplicaSetSupported = false;
  }
}

/**
 * Disconnect and cleanup resources
 */
export async function disconnectDB() {
  try {
    await mongoose.disconnect();
    if (mongoMemoryServer) {
      await mongoMemoryServer.stop();
      mongoMemoryServer = null;
    }
    console.log('[DB] Disconnected from MongoDB.');
  } catch (err) {
    console.error('[DB] Error during disconnect:', err.message);
  }
}
