import mongoose from 'mongoose';
import Booking from '../models/Booking.js';
import Show from '../models/Show.js';
import Seat from '../models/Seat.js';
import Payment from '../models/Payment.js';
import jwt from 'jsonwebtoken';
import { generateQRCodeForBooking } from '../utils/qrcode.js';
import { sendConfirmationEmail } from '../utils/mailer.js';

import razorpayInstance from '../config/razorpay.js';
import Refund from '../models/Refund.js';

const generateBookingId = () => {
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let result = 'RANG-';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

const lockSeats = async (showId, seatsRequested, bookingId, lockExpiry, userId) => {
  const now = new Date();
  
  const result = await Seat.updateMany(
    {
      showId,
      seatNumber: { $in: seatsRequested },
      $or: [
        { status: 'available' },
        { status: 'locked', lockExpiresAt: { $lt: now } },
        { status: 'locked', lockedBy: userId }
      ]
    },
    {
      $set: {
        status: 'locked',
        bookingId: bookingId,
        lockExpiresAt: lockExpiry,
        lockedAt: now,
        lockedBy: userId
      }
    }
  );

  if (result.modifiedCount < seatsRequested.length) {
    await Seat.updateMany(
      {
        showId,
        seatNumber: { $in: seatsRequested },
        status: 'locked',
        bookingId: bookingId
      },
      {
        $set: {
          status: 'available',
          bookingId: null
        },
        $unset: {
          lockExpiresAt: 1,
          lockedAt: 1
        }
      }
    );
    return false;
  }
  return true;
};

export const createBooking = async (req, res) => {
  try {
    const { showId, customerDetails, seats, totalAmount } = req.body;
    const userId = req.user._id;

    if (!showId || !customerDetails || !seats || !seats.length || !totalAmount) {
      return res.status(400).json({ message: 'Missing required booking details.' });
    }

    if (seats.length > 10) {
      return res.status(400).json({ message: 'You can select a maximum of 10 seats.' });
    }

    const show = await Show.findById(showId);
    if (!show) {
      return res.status(404).json({ message: 'Show not found.' });
    }

    // Clean up any existing unconfirmed/pending bookings for this user and this show
    if (userId) {
      const existingPending = await Booking.find({
        show: showId,
        user: userId,
        paymentStatus: 'pending'
      });
      for (const ep of existingPending) {
        await Seat.updateMany(
          { bookingId: ep._id },
          { $set: { status: 'available' }, $unset: { lockedAt: 1, lockExpiresAt: 1, lockedBy: 1, bookingId: 1 } }
        );
        await Booking.findByIdAndDelete(ep._id);
        await Payment.deleteMany({ bookingId: ep._id });
      }
    }

    const alreadyBookedInShow = seats.filter(seat => show.bookedSeats.includes(seat));
    if (alreadyBookedInShow.length > 0) {
      return res.status(400).json({ 
        message: `Seats already booked: ${alreadyBookedInShow.join(', ')}`,
        alreadyBooked: alreadyBookedInShow
      });
    }

    const seatsStatus = await Seat.find({
      showId,
      seatNumber: { $in: seats }
    });

    const now = new Date();
    const alreadyReserved = seatsStatus
      .filter(s => s.status === 'booked' || (s.status === 'locked' && s.lockExpiresAt > now && s.lockedBy?.toString() !== userId.toString()))
      .map(s => s.seatNumber);

    if (alreadyReserved.length > 0) {
      return res.status(400).json({ 
        message: `Seats already locked or booked: ${alreadyReserved.join(', ')}`,
        alreadyBooked: alreadyReserved 
      });
    }

    let calculatedAmount = 0;
    for (const seatNumber of seats) {
      const [rowName] = seatNumber.split('-');
      const rowInfo = show.layout.find(r => r.rowName === rowName);
      if (!rowInfo) {
        return res.status(400).json({ message: `Invalid seat row in seat selection: ${seatNumber}` });
      }
      const categoryPrice = show.categories.find(c => c.name === rowInfo.category)?.price;
      if (categoryPrice === undefined) {
        return res.status(400).json({ message: `Pricing category not found for seat: ${seatNumber}` });
      }
      calculatedAmount += categoryPrice;
    }

    if (calculatedAmount !== totalAmount) {
      return res.status(400).json({ 
        message: `Amount mismatch: backend calculated ₹${calculatedAmount} but frontend sent ₹${totalAmount}.` 
      });
    }

    let bookingId = generateBookingId();
    let isUnique = false;
    while (!isUnique) {
      const existing = await Booking.findOne({ bookingId });
      if (!existing) {
        isUnique = true;
      } else {
        bookingId = generateBookingId();
      }
    }

    const booking = new Booking({
      bookingId,
      show: showId,
      user: userId || null,
      customerDetails,
      seats,
      totalAmount,
      paymentStatus: 'pending',
      bookingStatus: 'confirmed'
    });
    await booking.save();

    const lockExpiry = new Date(Date.now() + 5 * 60 * 1000);
    const lockSuccess = await lockSeats(showId, seats, booking._id, lockExpiry, userId);

    if (!lockSuccess) {
      await Booking.findByIdAndDelete(booking._id);
      return res.status(400).json({ 
        message: 'Could not lock your selected seats. They were booked by another customer.' 
      });
    }

    const populatedBooking = await Booking.findById(booking._id).populate('show');
    res.status(201).json(populatedBooking);

  } catch (error) {
    console.error('Booking post error:', error);
    res.status(500).json({ error: error.message, message: 'Server error processing booking.' });
  }
};

export const createOrder = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const booking = await Booking.findOne({ bookingId }).populate('show');
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found.' });
    }

    const show = booking.show;
    if (!show) {
      return res.status(404).json({ message: 'Show not found.' });
    }

    // Compute payable amount server-side (show price * seats)
    let calculatedAmount = 0;
    for (const seatNumber of booking.seats) {
      const [rowName] = seatNumber.split('-');
      const rowInfo = show.layout.find(r => r.rowName === rowName);
      if (!rowInfo) {
        return res.status(400).json({ message: `Invalid seat row: ${seatNumber}` });
      }
      const categoryPrice = show.categories.find(c => c.name === rowInfo.category)?.price;
      if (categoryPrice === undefined) {
        return res.status(400).json({ message: `Price category not found for seat: ${seatNumber}` });
      }
      calculatedAmount += categoryPrice;
    }

    const amountInPaise = Math.round(calculatedAmount * 100);

    const options = {
      amount: amountInPaise,
      currency: 'INR',
      receipt: booking.bookingId,
      notes: {
        bookingId: booking._id.toString(),
        userId: booking.user ? booking.user.toString() : 'guest'
      }
    };

    const razorpayOrder = await razorpayInstance.orders.create(options);

    const payment = new Payment({
      bookingId: booking._id,
      razorpayOrderId: razorpayOrder.id,
      amount: calculatedAmount, // Storing in Rupees
      currency: 'INR',
      status: 'created'
    });
    await payment.save();

    res.status(201).json({
      orderId: razorpayOrder.id,
      amount: amountInPaise,
      currency: 'INR',
      keyId: process.env.RAZORPAY_KEY_ID
    });
  } catch (error) {
    console.error('Razorpay Order Creation Failed:', error);
    res.status(500).json({ error: error.message, message: 'Failed to initialize payment order.' });
  }
};

export const getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user._id })
      .populate('show')
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ error: error.message, message: 'Server error retrieving your bookings.' });
  }
};

export const getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate('show')
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ error: error.message, message: 'Server error retrieving all bookings.' });
  }
};

export const cancelBooking = async (req, res) => {
  try {
    const idParam = req.params.id || req.params.bookingId;
    let booking = null;
    if (mongoose.Types.ObjectId.isValid(idParam)) {
      booking = await Booking.findById(idParam).populate('show');
    }
    if (!booking) {
      booking = await Booking.findOne({ bookingId: idParam }).populate('show');
    }
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found.' });
    }
    return cancelBookingImplementation(booking, req, res);
  } catch (error) {
    res.status(500).json({ error: error.message, message: 'Server error cancelling booking.' });
  }
};

const cancelBookingImplementation = async (booking, req, res) => {
  try {
    if (booking.bookingStatus === 'cancelled' || booking.bookingStatus === 'cancelled_refunded') {
      return res.status(400).json({ message: 'Booking is already cancelled.' });
    }

    // Validate cancellation window (at least 6 hours before show start time)
    const show = booking.show;
    if (show) {
      const showDateTime = new Date(`${show.date}T${show.time}`);
      const now = new Date();
      const hoursDiff = (showDateTime - now) / (1000 * 60 * 60);
      if (hoursDiff < 6) {
        return res.status(400).json({ 
          message: 'Cancellations are only allowed up to 6 hours before the show starts.' 
        });
      }
    }

    // Verify ownership (only the user who booked or admin can cancel)
    if (booking.user && booking.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'You are not authorized to cancel this booking.' });
    }

    // Look for an existing captured payment to refund
    const payment = await Payment.findOne({ bookingId: booking._id, status: { $in: ['paid', 'captured'] } });
    if (!payment) {
      // If payment has not been successfully captured yet, cancel immediately
      booking.bookingStatus = 'cancelled';
      booking.paymentStatus = 'failed';
      await booking.save();

      // Release seats
      await Seat.updateMany(
        { bookingId: booking._id },
        { 
          $set: { status: 'available', lockedBy: null, bookingId: null }, 
          $unset: { lockExpiresAt: 1, lockedAt: 1 } 
        }
      );

      const showRecord = await Show.findById(booking.show);
      if (showRecord) {
        showRecord.bookedSeats = showRecord.bookedSeats.filter(
          seat => !booking.seats.includes(seat)
        );
        await showRecord.save();
      }

      const populatedBooking = await Booking.findById(booking._id).populate('show');
      return res.json({ 
        message: 'Booking cancelled successfully (no captured payment found).', 
        booking: populatedBooking 
      });
    }

    // Trigger Razorpay Refunds API
    const refundResponse = await razorpayInstance.payments.refund(
      payment.razorpayPaymentId || payment.razorpayOrderId,
      {
        amount: Math.round(payment.amount * 100), // Convert Rupees to Paise
        notes: {
          bookingId: booking._id.toString(),
          reason: 'User requested cancellation'
        }
      }
    );

    // Store Refund record
    const refund = new Refund({
      paymentId: payment._id,
      razorpayRefundId: refundResponse.id,
      amount: payment.amount,
      status: 'refund_initiated',
      reason: 'User requested cancellation'
    });
    await refund.save();

    // Update payment status
    payment.status = 'refund_initiated';
    payment.refundId = refundResponse.id;
    await payment.save();

    // Update booking status to cancellation_requested
    booking.bookingStatus = 'cancellation_requested';
    booking.paymentStatus = 'refund_initiated';
    await booking.save();

    const populatedBooking = await Booking.findById(booking._id).populate('show');
    res.json({ 
      message: 'Cancellation and refund initiated. Awaiting confirmation.',
      booking: populatedBooking
    });
  } catch (error) {
    console.error('Error in refund processing:', error);
    res.status(500).json({ error: error.message, message: 'Server error processing refund during cancellation.' });
  }
};

export const unlockBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found.' });
    }

    if (booking.paymentStatus === 'paid') {
      return res.status(400).json({ message: 'Cannot release seats for a paid booking.' });
    }

    await Seat.updateMany(
      { bookingId: booking._id, status: 'locked' },
      { 
        $set: { 
          status: 'locked', 
          lockedBy: null, 
          bookingId: null,
          lockExpiresAt: new Date(Date.now() + 5 * 60 * 1000),
          lockedAt: new Date()
        }
      }
    );

    await Booking.findByIdAndDelete(booking._id);

    res.json({ message: 'Seats successfully released and pending booking cancelled.' });
  } catch (error) {
    res.status(500).json({ error: error.message, message: 'Server error releasing seats.' });
  }
};

export const verifyTicket = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ message: 'Missing ticket token.' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(400).json({ message: 'Invalid or tampered ticket QR code.' });
    }

    const booking = await Booking.findOne({ bookingId: decoded.bookingId }).populate('show');
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found.' });
    }

    if (booking.bookingStatus === 'cancelled') {
      return res.status(400).json({ message: 'This ticket belongs to a CANCELLED booking.', booking });
    }

    if (booking.checkedIn) {
      return res.status(400).json({ 
        message: 'Double Entry Alert! This ticket has already been scanned at check-in.', 
        booking 
      });
    }

    booking.checkedIn = true;
    await booking.save();

    res.json({
      message: 'Ticket scanned successfully. Entry allowed.',
      booking
    });

  } catch (error) {
    res.status(500).json({ error: error.message, message: 'Server error verifying ticket.' });
  }
};

export const getBookingByBookingId = async (req, res) => {
  try {
    const booking = await Booking.findOne({ bookingId: req.params.bookingId }).populate('show');
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found.' });
    }
    res.json(booking);
  } catch (error) {
    res.status(500).json({ error: error.message, message: 'Server error retrieving booking.' });
  }
};
