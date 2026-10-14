import { Router } from 'express';
import multer from 'multer';
import {
  getTeams,
  getTeamById,
  createTeam,
  updateTeam,
  deleteTeam,
  uploadTeamLogo,
  getCloudinaryStatus,
  assignOwner,
  reconcilePurse,
} from '../controllers/teamController.js';
import { authenticate } from '../middleware/auth.js';
import { requireSuperAdmin } from '../middleware/role.js';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
});

router.get('/', getTeams);
router.get('/cloudinary/status', authenticate, requireSuperAdmin, getCloudinaryStatus);
router.get('/:id', getTeamById);

router.post('/', authenticate, requireSuperAdmin, createTeam);
router.put('/:id', authenticate, requireSuperAdmin, updateTeam);
router.delete('/:id', authenticate, requireSuperAdmin, deleteTeam);

// Cloudinary logo upload endpoints
router.post('/upload-logo', authenticate, requireSuperAdmin, upload.single('logo'), uploadTeamLogo);
router.post('/:id/upload-logo', authenticate, requireSuperAdmin, upload.single('logo'), uploadTeamLogo);

router.post('/:id/assign-owner', authenticate, requireSuperAdmin, assignOwner);
router.post('/:id/reconcile', authenticate, requireSuperAdmin, reconcilePurse);

export default router;
