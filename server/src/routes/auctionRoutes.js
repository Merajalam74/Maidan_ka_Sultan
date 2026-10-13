import { Router } from 'express';
import {
  getAuctionState,
  nominate,
  submitBid,
  markSold,
  markUnsold,
  pause,
  resume,
  resetCountdown,
  cancelNom,
  reverseSale,
} from '../controllers/auctionController.js';
import { authenticate } from '../middleware/auth.js';
import { requireAuctioneerOrAdmin, requireSuperAdmin } from '../middleware/role.js';
import { bidLimiter } from '../middleware/rateLimiter.js';

const router = Router();

// Public live state
router.get('/state', getAuctionState);

// Authenticated live bidding (Team Owner or SuperAdmin)
router.post('/bid', authenticate, bidLimiter, submitBid);

// Privileged Auctioneer & Admin controls
router.post('/nominate', authenticate, requireAuctioneerOrAdmin, nominate);
router.post('/sold', authenticate, requireAuctioneerOrAdmin, markSold);
router.post('/unsold', authenticate, requireAuctioneerOrAdmin, markUnsold);
router.post('/pause', authenticate, requireAuctioneerOrAdmin, pause);
router.post('/resume', authenticate, requireAuctioneerOrAdmin, resume);
router.post('/reset-timer', authenticate, requireAuctioneerOrAdmin, resetCountdown);
router.post('/cancel-nomination', authenticate, requireAuctioneerOrAdmin, cancelNom);

// Privileged SuperAdmin reversal
router.post('/reverse-sale', authenticate, requireSuperAdmin, reverseSale);

export default router;
