import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const JWT_SECRET = process.env.JWT_SECRET || 'campus_premier_league_jwt_secret_key_2026_production_grade';

/**
 * Authentication middleware to verify JWT from cookie or Bearer header
 */
export async function authenticate(req, res, next) {
  try {
    let token = null;

    // Check Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please log in.',
        code: 'AUTH_REQUIRED',
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User account not found.',
        code: 'AUTH_FAILED',
      });
    }

    if (user.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'Account is suspended or inactive.',
        code: 'ACCOUNT_INACTIVE',
      });
    }

    // Check if token was issued prior to password change/invalidation
    if (
      decoded.tokenVersion !== undefined &&
      user.tokenVersion !== undefined &&
      decoded.tokenVersion !== user.tokenVersion
    ) {
      return res.status(401).json({
        success: false,
        message: 'Session has been invalidated. Please log in again.',
        code: 'SESSION_INVALIDATED',
      });
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Session expired. Please log in again.',
        code: 'TOKEN_EXPIRED',
      });
    }
    return res.status(401).json({
      success: false,
      message: 'Invalid authentication token.',
      code: 'INVALID_TOKEN',
    });
  }
}

/**
 * Optional authentication middleware for public pages that can render extra details if logged in
 */
export async function optionalAuth(req, res, next) {
  try {
    let token = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (token) {
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = await User.findById(decoded.id);
      if (
        user &&
        user.status === 'active' &&
        (decoded.tokenVersion === undefined || decoded.tokenVersion === (user.tokenVersion || 0))
      ) {
        req.user = user;
      }
    }
  } catch (err) {
    // Ignore invalid token for optional auth
  }
  next();
}

/**
 * Generate JWT token
 */
export function generateToken(user) {
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      globalRole: user.globalRole,
      tokenVersion: user.tokenVersion || 0,
    },
    JWT_SECRET,
    { expiresIn }
  );
}
