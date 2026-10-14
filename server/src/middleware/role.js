import { ROLES } from '../config/constants.js';

/**
 * Authorize users based on their global role
 * Superadmin automatically satisfies any required role.
 */
export function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.',
        code: 'AUTH_REQUIRED',
      });
    }

    // Superadmin has absolute administrative privileges
    if (req.user.globalRole === ROLES.SUPERADMIN) {
      return next();
    }

    if (allowedRoles.includes(req.user.globalRole)) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: 'Access denied. You do not have permission to perform this action.',
      code: 'FORBIDDEN',
    });
  };
}

/**
 * Convenience guards
 */
export const requireSuperAdmin = authorizeRoles(ROLES.SUPERADMIN);
export const requireAuctioneerOrAdmin = authorizeRoles(ROLES.SUPERADMIN, ROLES.AUCTIONEER);
export const requireTeamOwner = authorizeRoles(ROLES.TEAM_OWNER);
