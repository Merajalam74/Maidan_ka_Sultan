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
import { validateObjectId, validatePagination } from '../middleware/validate.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    // Allow csv and plain text MIME types or .csv extensions
    if (
      file.mimetype === 'text/csv' ||
      file.mimetype === 'text/plain' ||
      file.mimetype === 'application/vnd.ms-excel' ||
      file.originalname.toLowerCase().endsWith('.csv')
    ) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are permitted for player imports.'));
    }
  },
});

const router = Router();

router.get('/', validatePagination, getPlayers);
router.get('/export/csv', exportPlayersCsv);
router.get('/:id', validateObjectId('id'), getPlayerById);
router.post('/', authenticate, requireSuperAdmin, createPlayer);
router.post('/register', authenticate, requireSuperAdmin, createPlayer); // Admin-only player registration
router.put('/:id', authenticate, requireSuperAdmin, validateObjectId('id'), updatePlayer);
router.delete('/:id', authenticate, requireSuperAdmin, validateObjectId('id'), deletePlayer);
router.post('/cricheroes-lookup', lookupCricHeroes);

// Player Import routes
router.post('/import/preview', authenticate, requireSuperAdmin, upload.single('file'), previewImport);
router.post('/import/confirm', authenticate, requireSuperAdmin, confirmImport);

export default router;
