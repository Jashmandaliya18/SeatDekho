import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema({
  bookingId: {
    type: String,
    required: true,
    unique: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  show: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Show',
    required: true
  },
  customerDetails: {
    name: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true
    },
    phone: {
      type: String,
      required: true
    }
  },
  seats: {
    type: [String], 
    required: true
  },
  totalAmount: {
    type: Number,
    required: true
  },
  paymentStatus: {
    type: String,
    enum: [
      'pending',
      'paid',
      'refunded',
      'pending_webhook_confirmation',
      'failed',
      'refund_initiated',
      'refund_failed'
    ],
    default: 'pending'
  },
  bookingStatus: {
    type: String,
    enum: [
      'confirmed',
      'cancelled',
      'cancellation_requested',
      'cancelled_refunded'
    ],
    default: 'confirmed'
  },
  qrCodeUrl: {
    type: String,
    default: null
  },
  checkedIn: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Booking = mongoose.model('Booking', bookingSchema);
export default Booking;
