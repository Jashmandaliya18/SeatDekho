import express from 'express';
import { auth, adminOnly } from '../middleware/auth.js';
import * as showController from '../controllers/showController.js';

const router = express.Router();

router.get('/', showController.getShows);
router.get('/:id', showController.getShowById);
router.post('/', auth, adminOnly, showController.createShow);
router.put('/:id', auth, adminOnly, showController.updateShow);
router.delete('/:id', auth, adminOnly, showController.deleteShow);

export default router;
