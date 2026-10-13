import rateLimit from 'express-rate-limit';

/**
 * Standard rate limiter for login and authentication
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 attempts per 15 min
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again after 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * High-throughput limiter for live bidding submissions
 */
export const bidLimiter = rateLimit({
  windowMs: 1000, // 1 second
  max: 10, // 10 bids per second per IP
  message: {
    success: false,
    message: 'Bid submission rate exceeded. Please slow down.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
