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
} from '../controllers/playerController.js';
import { authenticate } from '../middleware/auth.js';
import { requireSuperAdmin } from '../middleware/role.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

const router = Router();

router.get('/', getPlayers);
router.get('/:id', getPlayerById);
router.post('/', authenticate, requireSuperAdmin, createPlayer);
router.put('/:id', authenticate, requireSuperAdmin, updatePlayer);
router.delete('/:id', authenticate, requireSuperAdmin, deletePlayer);

// Player Import routes
router.post('/import/preview', authenticate, requireSuperAdmin, upload.single('file'), previewImport);
router.post('/import/confirm', authenticate, requireSuperAdmin, confirmImport);

export default router;
