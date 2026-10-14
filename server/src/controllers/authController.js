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
    const { name, email, password, globalRole } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required.',
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'A user with this email already exists.',
      });
    }

    const passwordHash = await User.hashPassword(password);
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
      globalRole: globalRole && Object.values(ROLES).includes(globalRole) ? globalRole : ROLES.VIEWER,
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

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required.',
      });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    if (user.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'Account is suspended or deactivated.',
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
      const isSuper = u.globalRole === ROLES.SUPERADMIN || u.email.startsWith('admin');
      const isAuct = u.globalRole === ROLES.AUCTIONEER || u.email.startsWith('auction');
      return {
        id: u._id,
        name: u.name,
        email: u.email,
        role: u.globalRole,
        teamName: assigned ? assigned.name : null,
        teamShortCode: assigned ? assigned.shortCode : null,
        teamLogo: assigned ? assigned.logoUrl : null,
        defaultPassword: isSuper ? 'Admin@123456' : isAuct ? 'Auctioneer@123456' : 'Owner@123456',
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

    if (!newPassword || newPassword.trim().length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long.',
      });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // If current password provided, verify it
    if (currentPassword) {
      const isMatch = await user.comparePassword(currentPassword);
      if (!isMatch) {
        return res.status(400).json({
          success: false,
          message: 'Current password does not match.',
        });
      }
    }

    user.passwordHash = await User.hashPassword(newPassword.trim());
    await user.save();

    return res.json({
      success: true,
      message: 'Password updated successfully.',
    });
  } catch (err) {
    next(err);
  }
}
