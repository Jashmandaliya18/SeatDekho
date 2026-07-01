import express from 'express';
import * as paymentController from '../controllers/paymentController.js';

const router = express.Router();

router.post('/verify', paymentController.verifyPayment);
router.post('/dev-confirm', paymentController.devConfirmPayment);
router.post('/webhook', paymentController.handleWebhook);
router.post('/create-qr', paymentController.createQRCode);
router.post('/:paymentId/refund', paymentController.refundPayment);

export default router;
