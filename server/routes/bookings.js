import express from 'express';
import { auth, adminOnly } from '../middleware/auth.js';
import * as bookingController from '../controllers/bookingController.js';

const router = express.Router();

router.post('/', auth, bookingController.createBooking);
router.get('/my-bookings', auth, bookingController.getMyBookings);
router.get('/', auth, adminOnly, bookingController.getAllBookings);
router.put('/:id/cancel', auth, adminOnly, bookingController.cancelBooking);
router.post('/:id/unlock', bookingController.unlockBooking);
router.get('/ticket/:bookingId', bookingController.getBookingByBookingId);
router.post('/verify-ticket', auth, adminOnly, bookingController.verifyTicket);

export default router;
