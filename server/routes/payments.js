import express from 'express';
import crypto from 'crypto';
import Payment from '../models/Payment.js';
import Booking from '../models/Booking.js';
import Seat from '../models/Seat.js';
import Show from '../models/Show.js';
import { generateQRCodeForBooking } from '../utils/qrcode.js';
import { sendConfirmationEmail } from '../utils/mailer.js';

const router = express.Router();
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;
const RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET;
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID;
const isMockPaymentMode = !RAZORPAY_KEY_ID || RAZORPAY_KEY_ID;

const finalizeBooking = async (booking) => {
  
  await Seat.updateMany(
    { bookingId: booking._id },
    { $set: { status: 'booked' }, $unset: { lockExpiresAt: 1, lockedAt: 1 } }
  );

  
  const show = await Show.findById(booking.show);
  if (show) {
    const newSeats = booking.seats.filter(s => !show.bookedSeats.includes(s));
    if (newSeats.length > 0) {
      show.bookedSeats.push(...newSeats);
      await show.save();
    }
  }

  
  booking.paymentStatus = 'paid';
  booking.bookingStatus = 'confirmed';

  
  try {
    const qrCodeUrl = await generateQRCodeForBooking(booking);
    booking.qrCodeUrl = qrCodeUrl;
  } catch (qrErr) {
    console.error('QR generation failed (non-critical):', qrErr.message);
  }

  await booking.save();

  
  try {
    if (show) await sendConfirmationEmail(booking, show);
  } catch (emailErr) {
    console.error('Email sending failed (non-critical):', emailErr.message);
  }

  return await Booking.findById(booking._id).populate('show');
};

router.post('/verify', async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ message: 'Missing payment verification parameters.' });
    }

    
    
    
    if (isMockPaymentMode) {
      
      const payment = await Payment.findOne({ razorpayOrderId: razorpay_order_id });
      
      let booking;
      if (payment) {
        booking = await Booking.findById(payment.bookingId);
      }

      
      
      if (!booking) {
        booking = await Booking.findOne({ paymentStatus: 'pending' }).sort({ createdAt: -1 });
      }

      if (!booking) {
        return res.status(404).json({ message: 'No pending booking found to verify.' });
      }

      
      if (booking.paymentStatus === 'paid') {
        const populatedBooking = await Booking.findById(booking._id).populate('show');
        return res.status(200).json({
          success: true,
          message: 'Booking is already confirmed.',
          booking: populatedBooking
        });
      }

      
      const populatedBooking = await finalizeBooking(booking);

      
      if (payment) {
        payment.status = 'captured';
        payment.razorpayPaymentId = razorpay_payment_id;
        payment.razorpaySignature = razorpay_signature;
        await payment.save();
      }

      return res.status(200).json({
        success: true,
        message: 'Mock payment verified. Booking confirmed.',
        booking: populatedBooking
      });
    }

    
    
    
    
    
    const hmac = crypto.createHmac('sha256', RAZORPAY_KEY_SECRET);
    hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
    const generatedSignature = hmac.digest('hex');

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({ message: 'Signature verification failed. Potential tampering.' });
    }

    
    const payment = await Payment.findOne({ razorpayOrderId: razorpay_order_id });
    if (!payment) {
      return res.status(404).json({ message: 'Payment record not found for this order.' });
    }

    const booking = await Booking.findById(payment.bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking record not found.' });
    }

    
    if (booking.paymentStatus === 'paid') {
      const populatedBooking = await Booking.findById(booking._id).populate('show');
      return res.status(200).json({
        success: true,
        message: 'Booking is already verified and paid.',
        booking: populatedBooking
      });
    }

    
    const lockedSeats = await Seat.find({ bookingId: booking._id, status: 'locked' });
    if (lockedSeats.length !== booking.seats.length) {
      console.warn(`Seat lock expired for booking: ${booking.bookingId}.`);
      booking.bookingStatus = 'cancelled';
      await booking.save();

      return res.status(410).json({ 
        message: 'Your seating lock expired before payment was verified. Please try booking again.' 
      });
    }

    
    const populatedBooking = await finalizeBooking(booking);

    
    payment.status = 'captured';
    payment.razorpayPaymentId = razorpay_payment_id;
    payment.razorpaySignature = razorpay_signature;
    await payment.save();

    res.status(200).json({
      success: true,
      message: 'Payment verified and booking confirmed.',
      booking: populatedBooking
    });

  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(500).json({ error: error.message, message: 'Server error verifying payment.' });
  }
});

router.post('/webhook', async (req, res) => {
  try {
    
    if (isMockPaymentMode) {
      return res.status(200).json({ status: 'ok', message: 'Mock mode - webhook ignored.' });
    }

    const signature = req.headers['x-razorpay-signature'];
    if (!signature) {
      return res.status(400).send('Signature missing');
    }

    
    const hmac = crypto.createHmac('sha256', RAZORPAY_WEBHOOK_SECRET);
    hmac.update(JSON.stringify(req.body));
    const generatedSignature = hmac.digest('hex');

    if (generatedSignature !== signature) {
      return res.status(400).send('Webhook signature mismatch');
    }

    const event = req.body.event;
    console.log(`Razorpay Webhook Event Received: ${event}`);

    if (event === 'payment.captured' || event === 'order.paid') {
      const payload = req.body.payload.payment.entity;
      const razorpayOrderId = payload.order_id;

      const payment = await Payment.findOne({ razorpayOrderId });
      if (!payment) {
        return res.status(200).send('No corresponding order found; ignoring.');
      }

      const booking = await Booking.findById(payment.bookingId);
      if (!booking || booking.paymentStatus === 'paid') {
        return res.status(200).send('Already processed or not found.');
      }

      
      await finalizeBooking(booking);

      
      payment.status = 'captured';
      payment.razorpayPaymentId = payload.id;
      await payment.save();

      console.log(`Webhook finalized booking: ${booking.bookingId}`);
    }

    res.status(200).json({ status: 'ok' });
  } catch (error) {
    console.error('Webhook handler error:', error);
    res.status(500).send('Webhook error');
  }
});

export default router;
