import { Router } from 'express';
import { getTournament, updateTournament } from '../controllers/tournamentController.js';
import { authenticate } from '../middleware/auth.js';
import { requireSuperAdmin } from '../middleware/role.js';

const router = Router();

router.get('/active', getTournament);
router.get('/:id', getTournament);
router.put('/:id', authenticate, requireSuperAdmin, updateTournament);

export default router;
