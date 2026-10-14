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
import { validateObjectId } from '../middleware/validate.js';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml', 'image/gif'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid image file format. Only JPEG, PNG, WEBP, and SVG are supported.'));
    }
  },
});

router.get('/', getTeams);
router.get('/cloudinary/status', authenticate, requireSuperAdmin, getCloudinaryStatus);
router.get('/:id', validateObjectId('id'), getTeamById);

router.post('/', authenticate, requireSuperAdmin, createTeam);
router.put('/:id', authenticate, requireSuperAdmin, validateObjectId('id'), updateTeam);
router.delete('/:id', authenticate, requireSuperAdmin, validateObjectId('id'), deleteTeam);

// Cloudinary logo upload endpoints
router.post('/upload-logo', authenticate, requireSuperAdmin, upload.single('logo'), uploadTeamLogo);
router.post('/:id/upload-logo', authenticate, requireSuperAdmin, upload.single('logo'), uploadTeamLogo);

router.post('/:id/assign-owner', authenticate, requireSuperAdmin, validateObjectId('id'), assignOwner);
router.post('/:id/reconcile', authenticate, requireSuperAdmin, validateObjectId('id'), reconcilePurse);

export default router;
