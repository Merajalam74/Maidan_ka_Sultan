import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

let socket = null;

export function getSocket() {
  if (!socket) {
    const token = localStorage.getItem('cpl_auth_token');
    socket = io(SOCKET_URL, {
      autoConnect: true,
      withCredentials: true,
      auth: { token },
      query: { token },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 20,
      reconnectionDelay: 1000,
    });

    socket.on('connect', () => {
      console.log('⚡ Connected to CPL Live Auction WebSocket:', socket.id);
    });

    socket.on('disconnect', (reason) => {
      console.log('🔌 Disconnected from CPL WebSocket:', reason);
    });

    socket.on('connect_error', (err) => {
      console.warn('⚠️ WebSocket connection error:', err.message);
    });
  }

  return socket;
}

export function refreshSocketAuth() {
  if (socket) {
    const token = localStorage.getItem('cpl_auth_token');
    socket.auth = { token };
    socket.io.opts.query = { token };
    if (socket.connected) {
      socket.disconnect().connect();
    }
  }
}
