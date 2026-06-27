import mongoose from 'mongoose';

const seatSchema = new mongoose.Schema({
  showId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Show',
    required: true
  },
  seatNumber: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['available', 'locked', 'booked'],
    default: 'available',
    required: true
  },
  lockedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  lockedAt: {
    type: Date,
    default: null
  },
  lockExpiresAt: {
    type: Date,
    default: null
  },
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    default: null
  }
}, {
  timestamps: true
});

seatSchema.index({ showId: 1, seatNumber: 1 }, { unique: true });

seatSchema.index({ lockExpiresAt: 1 }, { sparse: true });

const Seat = mongoose.model('Seat', seatSchema);
export default Seat;
