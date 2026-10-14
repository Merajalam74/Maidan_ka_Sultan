import { Router } from 'express';
import multer from 'multer';
import {
  getPlayers,
  getPlayerById,
  createPlayer,
  updatePlayer,
  deletePlayer,
  previewImport,
  confirmImport,
  lookupCricHeroes,
  exportPlayersCsv,
} from '../controllers/playerController.js';
import { authenticate } from '../middleware/auth.js';
import { requireSuperAdmin } from '../middleware/role.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

const router = Router();

router.get('/', getPlayers);
router.get('/export/csv', exportPlayersCsv);
router.get('/:id', getPlayerById);
router.post('/', authenticate, requireSuperAdmin, createPlayer);
router.post('/register', authenticate, requireSuperAdmin, createPlayer); // Admin-only player registration
router.put('/:id', authenticate, requireSuperAdmin, updatePlayer);
router.delete('/:id', authenticate, requireSuperAdmin, deletePlayer);
router.post('/cricheroes-lookup', lookupCricHeroes);

// Player Import routes
router.post('/import/preview', authenticate, requireSuperAdmin, upload.single('file'), previewImport);
router.post('/import/confirm', authenticate, requireSuperAdmin, confirmImport);

export default router;
