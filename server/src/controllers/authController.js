import User from '../models/User.js';
import TournamentMembership from '../models/TournamentMembership.js';
import Tournament from '../models/Tournament.js';
import Team from '../models/Team.js';
import { generateToken } from '../middleware/auth.js';
import { ROLES } from '../config/constants.js';

/**
 * Register a new user
 */
export async function register(req, res, next) {
  try {
    const { name, email, password } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'A valid name with at least 2 characters is required.',
        code: 'VALIDATION_ERROR',
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || typeof email !== 'string' || !emailRegex.test(email.trim())) {
      return res.status(400).json({
        success: false,
        message: 'A valid email address is required.',
        code: 'VALIDATION_ERROR',
      });
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.',
        code: 'VALIDATION_ERROR',
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'A user with this email already exists.',
        code: 'USER_ALREADY_EXISTS',
      });
    }

    const passwordHash = await User.hashPassword(password);
    // Public registration strictly assigns VIEWER role to prevent privilege escalation
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
      globalRole: ROLES.VIEWER,
      tokenVersion: 0,
    });

    const token = generateToken(user);
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(201).json({
      success: true,
      token,
      user: user.toSafeJSON(),
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Log in with email and password
 */
export async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (
      !email ||
      !password ||
      typeof email !== 'string' ||
      typeof password !== 'string' ||
      !email.trim() ||
      !password.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required.',
        code: 'INVALID_REQUEST',
      });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
        code: 'INVALID_CREDENTIALS',
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
        code: 'INVALID_CREDENTIALS',
      });
    }

    if (user.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'Account is suspended or deactivated.',
        code: 'ACCOUNT_INACTIVE',
      });
    }

    const token = generateToken(user);
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // Fetch user memberships and assigned team if any
    const memberships = await TournamentMembership.find({ userId: user._id })
      .populate('teamId')
      .populate('tournamentId', 'name status');

    const safeUser = user.toSafeJSON();

    return res.json({
      success: true,
      token,
      user: safeUser,
      memberships,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Log out and clear session cookie
 */
export async function logout(req, res) {
  res.clearCookie('token');
  return res.json({
    success: true,
    message: 'Logged out successfully.',
  });
}

/**
 * Get current authenticated user profile
 */
export async function getMe(req, res, next) {
  try {
    const memberships = await TournamentMembership.find({ userId: req.user._id })
      .populate('teamId')
      .populate('tournamentId', 'name status');

    // Also check if assigned in Team directly
    const ownedTeam = await Team.findOne({ ownerUserId: req.user._id });

    return res.json({
      success: true,
      user: req.user.toSafeJSON(),
      memberships,
      assignedTeam: ownedTeam,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Returns pre-seeded test accounts for quick demo selection in UI
 */
export async function getDemoAccounts(req, res, next) {
  try {
    if (process.env.NODE_ENV === 'production') {
      return res.status(404).json({
        success: false,
        message: 'Endpoint not found.',
        code: 'NOT_FOUND',
      });
    }

    const users = await User.find({
      $or: [
        {
          email: {
            $in: [
              'admin@mks.edu',
              'auctioneer@mks.edu',
              'jebkatre@mks.edu',
              'maqsad@mks.edu',
              'khalnayak@mks.edu',
              'phurtile@mks.edu',
              'dhurandar@mks.edu',
              'admin@cpl.edu',
              'auctioneer@cpl.edu',
              'owner1@cpl.edu',
            ],
          },
        },
        { globalRole: { $in: [ROLES.SUPERADMIN, ROLES.AUCTIONEER, ROLES.TEAM_OWNER] } },
      ],
    }).limit(10).select('name email globalRole avatar');

    const teams = await Team.find({}).select('name shortCode ownerUserId logoUrl primaryColor');
    const teamMap = new Map();
    teams.forEach((t) => {
      if (t.ownerUserId) teamMap.set(t.ownerUserId.toString(), t);
    });

    const demoList = users.map((u) => {
      const assigned = teamMap.get(u._id.toString());
      return {
        id: u._id,
        name: u.name,
        email: u.email,
        role: u.globalRole,
        teamName: assigned ? assigned.name : null,
        teamShortCode: assigned ? assigned.shortCode : null,
        teamLogo: assigned ? assigned.logoUrl : null,
      };
    });

    return res.json({
      success: true,
      demoAccounts: demoList,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Change password for authenticated user (e.g. Team Owner)
 */
export async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || typeof currentPassword !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Current password is required.',
        code: 'CURRENT_PASSWORD_REQUIRED',
      });
    }

    if (!newPassword || typeof newPassword !== 'string' || newPassword.trim().length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long.',
        code: 'VALIDATION_ERROR',
      });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.', code: 'NOT_FOUND' });
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password does not match.',
        code: 'INVALID_CURRENT_PASSWORD',
      });
    }

    user.passwordHash = await User.hashPassword(newPassword.trim());
    user.tokenVersion = (user.tokenVersion || 0) + 1;
    await user.save();

    const token = generateToken(user);
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.json({
      success: true,
      token,
      message: 'Password updated successfully. Existing sessions have been invalidated.',
    });
  } catch (err) {
    next(err);
  }
}
