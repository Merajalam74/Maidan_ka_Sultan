import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import TournamentMembership from '../models/TournamentMembership.js';
import Team from '../models/Team.js';
import AuctionSession from '../models/AuctionSession.js';
import {
  getOrCreateSession,
  placeBid as placeBidService,
  nominatePlayer,
  markPlayerSold,
  markPlayerUnsold,
  pauseAuction,
  resumeAuction,
  resetTimer,
  cancelNomination,
} from '../services/auctionService.js';
import { getTeamsWithDetails } from '../services/teamService.js';

let ioInstance = null;
let timerInterval = null;

const JWT_SECRET = process.env.JWT_SECRET || 'campus_premier_league_jwt_secret_key_2026_production_grade';

/**
 * Initialize Socket.IO with Handshake Authentication and Room Management
 */
export function initSockets(io) {
  ioInstance = io;

  // Handshake authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.query?.token;
      if (token) {
        try {
          const decoded = jwt.verify(token, JWT_SECRET);
          const user = await User.findById(decoded.id);
          if (user && user.status === 'active') {
            socket.user = user;

            // Resolve team ownership
            const membership = await TournamentMembership.findOne({ userId: user._id });
            const ownedTeam = await Team.findOne({ ownerUserId: user._id });
            socket.teamId = (membership && membership.teamId) || (ownedTeam && ownedTeam._id);
          }
        } catch (e) {
          // Token invalid, allow as anonymous viewer
        }
      }
      // Public viewer by default if no valid token
      next();
    } catch (err) {
      next(err);
    }
  });

  io.on('connection', (socket) => {
    // 1. Join Tournament Room
    socket.on('auction:join', async ({ tournamentId, teamId }) => {
      if (!tournamentId) return;

      const publicRoom = `tournament:${tournamentId}:public`;
      socket.join(publicRoom);

      // Join Admin room if authorized
      if (socket.user && (socket.user.globalRole === 'superadmin' || socket.user.globalRole === 'auctioneer')) {
        socket.join(`tournament:${tournamentId}:admin`);
      }

      // Join Team Private Room if authorized
      if (socket.user) {
        if (socket.user.globalRole === 'superadmin' && teamId) {
          socket.join(`tournament:${tournamentId}:team:${teamId}`);
        } else if (socket.teamId) {
          socket.join(`tournament:${tournamentId}:team:${socket.teamId.toString()}`);
        }
      }

      // Emit current authoritative state immediately to the connecting client
      try {
        const session = await getOrCreateSession(tournamentId);
        const teams = await getTeamsWithDetails(tournamentId);
        socket.emit('auction:state', { session, teams });
      } catch (err) {
        console.error('[Socket] Error sending initial state:', err.message);
      }
    });

    // 2. Submit Live Bid
    socket.on('bid:submit', async (data) => {
      try {
        if (!socket.user) {
          return socket.emit('bid:rejected', { message: 'Authentication required to place a bid.' });
        }

        const { tournamentId, teamId, bidAmount, idempotencyKey } = data;

        // Verify that the user is authorized for this team
        if (socket.user.globalRole !== 'superadmin') {
          if (!socket.teamId || socket.teamId.toString() !== teamId.toString()) {
            return socket.emit('bid:rejected', {
              message: 'Unauthorized: You can only bid for your assigned team.',
            });
          }
        }

        const result = await placeBidService({
          tournamentId,
          teamId,
          bidderId: socket.user._id,
          bidAmount,
          idempotencyKey,
        });

        // Broadcast accepted bid to public tournament room
        broadcastBidAccepted(tournamentId, result);
      } catch (err) {
        socket.emit('bid:rejected', { message: err.message });
      }
    });

    // 3. Nominate Player (Privileged)
    socket.on('auction:nominate', async ({ tournamentId, playerId }) => {
      try {
        if (!socket.user || (socket.user.globalRole !== 'superadmin' && socket.user.globalRole !== 'auctioneer')) {
          return socket.emit('auction:error', { message: 'Permission denied: Auctioneer or Admin only.' });
        }

        const session = await nominatePlayer(tournamentId, playerId, socket.user._id);
        broadcastAuctionState(tournamentId);
      } catch (err) {
        socket.emit('auction:error', { message: err.message });
      }
    });

    // 4. Mark SOLD (Privileged)
    socket.on('auction:sold', async ({ tournamentId }) => {
      try {
        if (!socket.user || (socket.user.globalRole !== 'superadmin' && socket.user.globalRole !== 'auctioneer')) {
          return socket.emit('auction:error', { message: 'Permission denied.' });
        }

        const result = await markPlayerSold(tournamentId, socket.user._id);
        broadcastPlayerSold(tournamentId, result);
      } catch (err) {
        socket.emit('auction:error', { message: err.message });
      }
    });

    // 5. Mark UNSOLD (Privileged)
    socket.on('auction:unsold', async ({ tournamentId }) => {
      try {
        if (!socket.user || (socket.user.globalRole !== 'superadmin' && socket.user.globalRole !== 'auctioneer')) {
          return socket.emit('auction:error', { message: 'Permission denied.' });
        }

        const result = await markPlayerUnsold(tournamentId, socket.user._id);
        broadcastPlayerUnsold(tournamentId, result);
      } catch (err) {
        socket.emit('auction:error', { message: err.message });
      }
    });

    // 6. Pause Auction (Privileged)
    socket.on('auction:pause', async ({ tournamentId }) => {
      try {
        if (!socket.user || (socket.user.globalRole !== 'superadmin' && socket.user.globalRole !== 'auctioneer')) {
          return socket.emit('auction:error', { message: 'Permission denied.' });
        }

        await pauseAuction(tournamentId, socket.user._id);
        broadcastAuctionState(tournamentId);
      } catch (err) {
        socket.emit('auction:error', { message: err.message });
      }
    });

    // 7. Resume Auction (Privileged)
    socket.on('auction:resume', async ({ tournamentId }) => {
      try {
        if (!socket.user || (socket.user.globalRole !== 'superadmin' && socket.user.globalRole !== 'auctioneer')) {
          return socket.emit('auction:error', { message: 'Permission denied.' });
        }

        await resumeAuction(tournamentId, socket.user._id);
        broadcastAuctionState(tournamentId);
      } catch (err) {
        socket.emit('auction:error', { message: err.message });
      }
    });

    // 8. Reset Countdown (Privileged)
    socket.on('auction:reset-timer', async ({ tournamentId, seconds }) => {
      try {
        if (!socket.user || (socket.user.globalRole !== 'superadmin' && socket.user.globalRole !== 'auctioneer')) {
          return socket.emit('auction:error', { message: 'Permission denied.' });
        }

        await resetTimer(tournamentId, seconds, socket.user._id);
        broadcastAuctionState(tournamentId);
      } catch (err) {
        socket.emit('auction:error', { message: err.message });
      }
    });

    // 9. Cancel Nomination (Privileged)
    socket.on('auction:cancel-nomination', async ({ tournamentId }) => {
      try {
        if (!socket.user || (socket.user.globalRole !== 'superadmin' && socket.user.globalRole !== 'auctioneer')) {
          return socket.emit('auction:error', { message: 'Permission denied.' });
        }

        await cancelNomination(tournamentId, socket.user._id);
        broadcastAuctionState(tournamentId);
      } catch (err) {
        socket.emit('auction:error', { message: err.message });
      }
    });
  });

  // Start background ticker for countdown synchronization
  startTimerSyncTicker();
}

/**
 * Ticker loop to periodically emit timer updates and check expiration
 */
function startTimerSyncTicker() {
  if (timerInterval) clearInterval(timerInterval);

  timerInterval = setInterval(async () => {
    if (!ioInstance) return;

    try {
      const activeSessions = await AuctionSession.find({ status: 'active', deadline: { $ne: null } });
      const now = Date.now();

      for (const session of activeSessions) {
        const remainingMs = session.deadline ? new Date(session.deadline).getTime() - now : 0;
        const remainingSeconds = Math.max(0, Math.floor(remainingMs / 1000));

        ioInstance.to(`tournament:${session.tournamentId}:public`).emit('auction:timer-updated', {
          tournamentId: session.tournamentId,
          deadline: session.deadline,
          remainingSeconds,
          serverTime: new Date(),
        });
      }
    } catch (e) {
      // Ignore ticker errors
    }
  }, 1000);
}

/**
 * Broadcast full authoritative auction state to tournament room
 */
export async function broadcastAuctionState(tournamentId) {
  if (!ioInstance || !tournamentId) return;

  try {
    const session = await getOrCreateSession(tournamentId);
    const teams = await getTeamsWithDetails(tournamentId);

    let remainingSeconds = 0;
    if (session.status === 'active' && session.deadline) {
      remainingSeconds = Math.max(0, Math.floor((new Date(session.deadline).getTime() - Date.now()) / 1000));
    } else if (session.status === 'paused') {
      remainingSeconds = session.pausedRemainingSeconds || 0;
    }

    ioInstance.to(`tournament:${tournamentId}:public`).emit('auction:state', {
      session: {
        ...session.toObject(),
        remainingSeconds,
      },
      teams,
    });
  } catch (err) {
    console.error('[Socket] broadcastAuctionState error:', err.message);
  }
}

/**
 * Broadcast accepted bid event
 */
export async function broadcastBidAccepted(tournamentId, { bid, session, feasibility }) {
  if (!ioInstance || !tournamentId) return;

  try {
    const teams = await getTeamsWithDetails(tournamentId);

    ioInstance.to(`tournament:${tournamentId}:public`).emit('bid:accepted', {
      bid,
      session,
      teams,
      feasibility,
    });
  } catch (err) {
    console.error('[Socket] broadcastBidAccepted error:', err.message);
  }
}

/**
 * Broadcast player sold event
 */
export async function broadcastPlayerSold(tournamentId, result) {
  if (!ioInstance || !tournamentId) return;

  try {
    const teams = await getTeamsWithDetails(tournamentId);

    ioInstance.to(`tournament:${tournamentId}:public`).emit('auction:player-sold', {
      result,
      teams,
    });

    broadcastAuctionState(tournamentId);
  } catch (err) {
    console.error('[Socket] broadcastPlayerSold error:', err.message);
  }
}

/**
 * Broadcast player unsold event
 */
export async function broadcastPlayerUnsold(tournamentId, result) {
  if (!ioInstance || !tournamentId) return;

  try {
    ioInstance.to(`tournament:${tournamentId}:public`).emit('auction:player-unsold', {
      result,
    });

    broadcastAuctionState(tournamentId);
  } catch (err) {
    console.error('[Socket] broadcastPlayerUnsold error:', err.message);
  }
}
