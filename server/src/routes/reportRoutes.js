import { Router } from 'express';
import { getSummary, getBids, getPurchases, exportCsv } from '../controllers/reportController.js';

const router = Router();

router.get('/summary', getSummary);
router.get('/bids', getBids);
router.get('/purchases', getPurchases);
router.get('/export-csv', exportCsv);

export default router;
