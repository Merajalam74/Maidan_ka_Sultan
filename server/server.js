import http from 'http';
import dotenv from 'dotenv';
import { Server } from 'socket.io';
import app from './src/app.js';
import { connectDB, disconnectDB } from './src/config/db.js';
import { initSockets } from './src/sockets/socketHandler.js';
import { seedDatabase } from './src/utils/seed.js';
import Tournament from './src/models/Tournament.js';

dotenv.config();

const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

const server = http.createServer(app);

// Setup Socket.IO with CORS
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (
        process.env.NODE_ENV !== 'production' ||
        origin === CLIENT_URL ||
        origin.endsWith('.vercel.app') ||
        origin.includes('localhost')
      ) {
        return callback(null, true);
      }
      return callback(new Error('CORS not allowed for Socket.IO'));
    },
    methods: ['GET', 'POST'],
    credentials: true,
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

// Initialize socket handlers
initSockets(io);

// Boot server
async function startServer() {
  try {
    await connectDB();

    // Auto-seed if database is freshly started and empty
    const tournamentCount = await Tournament.countDocuments();
    if (tournamentCount === 0) {
      console.log('[Server] No tournament detected. Running auto-seeding with default 6 teams and players...');
      await seedDatabase({ clearExisting: false });
    }

    server.listen(PORT, () => {
      console.log('====================================================');
      console.log(`🏏 CAMPUS PREMIER LEAGUE — AUCTION SERVER ONLINE`);
      console.log(`📡 HTTP Server running on http://localhost:${PORT}`);
      console.log(`⚡ WebSocket Server ready for real-time live bidding`);
      console.log(`🌐 Allowed Client URL: ${CLIENT_URL}`);
      console.log('====================================================');
    });
  } catch (err) {
    console.error('[Server] Critical startup error:', err);
    process.exit(1);
  }
}

// Graceful termination
const shutdown = async (signal) => {
  console.log(`\n[Server] Received ${signal}. Gracefully closing connections...`);
  server.close(async () => {
    await disconnectDB();
    console.log('[Server] Process exited gracefully.');
    process.exit(0);
  });
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

startServer();

export { app, server, io };
