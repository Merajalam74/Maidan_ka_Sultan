import { Router } from 'express';
import { getTournament, updateTournament } from '../controllers/tournamentController.js';
import { authenticate } from '../middleware/auth.js';
import { requireSuperAdmin } from '../middleware/role.js';

import { validateObjectId } from '../middleware/validate.js';

const router = Router();

router.get('/active', getTournament);
router.get('/:id', validateObjectId('id'), getTournament);
router.put('/:id', authenticate, requireSuperAdmin, validateObjectId('id'), updateTournament);

export default router;
