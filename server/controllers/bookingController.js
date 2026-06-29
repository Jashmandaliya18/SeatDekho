import Booking from '../models/Booking.js';
import Show from '../models/Show.js';
import Seat from '../models/Seat.js';
import Payment from '../models/Payment.js';
import jwt from 'jsonwebtoken';
import { generateQRCodeForBooking } from '../utils/qrcode.js';
import { sendConfirmationEmail } from '../utils/mailer.js';

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID;
const isMockPaymentMode = !RAZORPAY_KEY_ID || RAZORPAY_KEY_ID;

let razorpay = null;
const getRazorpay = async () => {
  if (!razorpay && !isMockPaymentMode) {
    const module = await import('../config/razorpay.js');
    razorpay = module.default;
  }
  return razorpay;
};

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

    if (isMockPaymentMode) {
      const booking = new Booking({
        bookingId,
        show: showId,
        user: userId || null,
        customerDetails,
        seats,
        totalAmount,
        paymentStatus: 'paid',
        bookingStatus: 'confirmed'
      });
      await booking.save();

      await Seat.updateMany(
        {
          showId,
          seatNumber: { $in: seats },
          $or: [
            { status: 'available' },
            { status: 'locked', lockExpiresAt: { $lt: new Date() } },
            { status: 'locked', lockedBy: userId }
          ]
        },
        {
          $set: { status: 'booked', bookingId: booking._id },
          $unset: { lockExpiresAt: 1, lockedAt: 1, lockedBy: 1 }
        }
      );

      show.bookedSeats.push(...seats);
      await show.save();

      try {
        const qrCodeUrl = await generateQRCodeForBooking(booking);
        booking.qrCodeUrl = qrCodeUrl;
        await booking.save();
      } catch (qrErr) {
        console.error('QR generation failed (non-critical):', qrErr.message);
      }

      try {
        await sendConfirmationEmail(booking, show);
      } catch (emailErr) {
        console.error('Email sending failed (non-critical):', emailErr.message);
      }

      const populatedBooking = await Booking.findById(booking._id).populate('show');
      return res.status(201).json(populatedBooking);
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

    let razorpayOrder = null;
    try {
      const rzp = await getRazorpay();
      const options = {
        amount: totalAmount * 100,
        currency: 'INR',
        receipt: bookingId
      };
      razorpayOrder = await rzp.orders.create(options);

      const payment = new Payment({
        bookingId: booking._id,
        razorpayOrderId: razorpayOrder.id,
        amount: totalAmount * 100,
        status: 'created'
      });
      await payment.save();

    } catch (paymentError) {
      console.error('Razorpay Order Creation Failed:', paymentError);
      
      await Seat.updateMany(
        { bookingId: booking._id },
        { 
          $set: { status: 'available', lockedBy: null, bookingId: null }, 
          $unset: { lockExpiresAt: 1, lockedAt: 1 } 
        }
      );
      await Booking.findByIdAndDelete(booking._id);

      return res.status(500).json({ 
        message: 'Failed to initialize payment gateway. Seats have been released.',
        error: paymentError.message 
      });
    }

    res.status(201).json({
      booking,
      razorpayOrder
    });

  } catch (error) {
    console.error('Booking post error:', error);
    res.status(500).json({ error: error.message, message: 'Server error processing booking.' });
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
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found.' });
    }

    if (booking.bookingStatus === 'cancelled') {
      return res.status(400).json({ message: 'Booking is already cancelled.' });
    }

    booking.bookingStatus = 'cancelled';
    booking.paymentStatus = 'refunded';
    await booking.save();

    await Seat.updateMany(
      { bookingId: booking._id },
      { 
        $set: { status: 'available', lockedBy: null, bookingId: null }, 
        $unset: { lockExpiresAt: 1, lockedAt: 1 } 
      }
    );

    const show = await Show.findById(booking.show);
    if (show) {
      show.bookedSeats = show.bookedSeats.filter(
        seat => !booking.seats.includes(seat)
      );
      await show.save();
    }

    const populatedBooking = await Booking.findById(booking._id).populate('show');
    res.json({ 
      message: 'Booking cancelled successfully.',
      booking: populatedBooking
    });
  } catch (error) {
    res.status(500).json({ error: error.message, message: 'Server error cancelling booking.' });
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
