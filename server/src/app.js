import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';

import authRoutes from './routes/authRoutes.js';
import tournamentRoutes from './routes/tournamentRoutes.js';
import teamRoutes from './routes/teamRoutes.js';
import playerRoutes from './routes/playerRoutes.js';
import auctionRoutes from './routes/auctionRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { mongoSanitize, rejectDisallowedMethods } from './middleware/validate.js';

const app = express();

const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

// 1. HTTP Security Headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
        imgSrc: [
          "'self'",
          'data:',
          'blob:',
          'https://res.cloudinary.com',
          'https://api.dicebear.com',
          'https://lh3.googleusercontent.com',
          'https://drive.google.com',
        ],
        connectSrc: [
          "'self'",
          'http://localhost:*',
          'ws://localhost:*',
          'https://*.vercel.app',
          'wss://*.vercel.app',
          'https://*.onrender.com',
          'wss://*.onrender.com',
        ],
        frameAncestors: ["'none'"],
      },
    },
    hsts:
      process.env.NODE_ENV === 'production'
        ? {
            maxAge: 31536000,
            includeSubDomains: true,
            preload: true,
          }
        : false,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  })
);

// 2. Browser & Permissions Security Headers
app.use((req, res, next) => {
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  // Prevent caching of sensitive dynamic API data
  if (req.path.startsWith('/api')) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
  next();
});

// 3. Reject unsupported HTTP methods
app.use(rejectDisallowedMethods(['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD']));

// 4. CORS configuration with explicit allowlist
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or server-to-server)
      if (!origin) return callback(null, true);
      if (
        process.env.NODE_ENV !== 'production' ||
        origin === clientUrl ||
        origin.endsWith('.vercel.app') ||
        origin.includes('localhost')
      ) {
        return callback(null, true);
      }
      return callback(new Error('CORS policy: Not allowed by CORS'));
    },
    credentials: true,
  })
);

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// 5. Strict Body Parsing Limits (File uploads use multer memory buffers)
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());

// 6. NoSQL Operator Injection Sanitization
app.use(mongoSanitize);

// 7. Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    platform: 'Campus Premier League Auction Platform',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// 8. Mount Protected & Validated Routes
app.use('/api/auth', authRoutes);
app.use('/api/tournaments', tournamentRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/players', playerRoutes);
app.use('/api/auction', auctionRoutes);
app.use('/api/reports', reportRoutes);

// 9. Generic 404 for undefined API routes
app.use('/api', notFoundHandler);

// 10. Centralized Error Handling
app.use(errorHandler);

export default app;
