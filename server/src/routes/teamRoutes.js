import { Router } from 'express';
import {
  getTeams,
  getTeamById,
  createTeam,
  updateTeam,
  assignOwner,
  reconcilePurse,
} from '../controllers/teamController.js';
import { authenticate } from '../middleware/auth.js';
import { requireSuperAdmin } from '../middleware/role.js';

const router = Router();

router.get('/', getTeams);
router.get('/:id', getTeamById);
router.post('/', authenticate, requireSuperAdmin, createTeam);
router.put('/:id', authenticate, requireSuperAdmin, updateTeam);
router.post('/:id/assign-owner', authenticate, requireSuperAdmin, assignOwner);
router.post('/:id/reconcile', authenticate, requireSuperAdmin, reconcilePurse);

export default router;
