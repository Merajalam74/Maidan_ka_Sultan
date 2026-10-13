import mongoose from 'mongoose';

let mongoMemoryServer = null;
export let isReplicaSetSupported = false;

/**
 * Connect to MongoDB Atlas or local instance, with automatic
 * embedded MongoDB fallback for zero-friction local development.
 */
export async function connectDB() {
  const uri = process.env.MONGODB_URI;

  // Attempt connection to configured URI if present
  if (uri && !uri.includes('localhost:27017')) {
    try {
      console.log(`[DB] Connecting to MongoDB at ${uri.replace(/\/\/[^@]+@/, '//***:***@')}...`);
      const conn = await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 5000,
      });
      console.log(`[DB] Successfully connected to MongoDB: ${conn.connection.host}`);
      await detectReplicaSetSupport();
      return conn;
    } catch (err) {
      console.warn(`[DB] Warning: Failed to connect to configured MONGODB_URI (${err.message}).`);
      console.log('[DB] Falling back to embedded MongoMemoryServer for development...');
    }
  }

  // Fallback to embedded MongoDB (using mongodb-memory-server)
  try {
    const { MongoMemoryReplSet, MongoMemoryServer } = await import('mongodb-memory-server');
    
    // Try starting in-memory Replica Set first (for real MongoDB transactions support)
    try {
      console.log('[DB] Initializing embedded in-memory MongoDB Replica Set...');
      mongoMemoryServer = await MongoMemoryReplSet.create({
        replSet: { count: 1, storageEngine: 'wiredTiger' },
      });
      const replUri = mongoMemoryServer.getUri();
      const conn = await mongoose.connect(replUri);
      console.log(`[DB] Connected to embedded MongoDB Replica Set: ${replUri}`);
      isReplicaSetSupported = true;
      return conn;
    } catch (replErr) {
      console.warn(`[DB] Replica Set fallback to standalone instance (${replErr.message})`);
      mongoMemoryServer = await MongoMemoryServer.create();
      const memUri = mongoMemoryServer.getUri();
      const conn = await mongoose.connect(memUri);
      console.log(`[DB] Connected to embedded standalone MongoDB: ${memUri}`);
      isReplicaSetSupported = false;
      return conn;
    }
  } catch (memErr) {
    console.error('[DB] Failed to start embedded MongoDB server:', memErr.message);
    throw memErr;
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
