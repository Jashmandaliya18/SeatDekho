import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true
  },
  razorpayOrderId: {
    type: String,
    required: true,
    unique: true
  },
  razorpayPaymentId: {
    type: String,
    default: null
  },
  razorpaySignature: {
    type: String,
    default: null
  },
  amount: {
    type: Number, 
    required: true
  },
  status: {
    type: String,
    enum: ['created', 'captured', 'failed', 'refunded'],
    default: 'created',
    required: true
  },
  errorDetails: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  refundId: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

const Payment = mongoose.model('Payment', paymentSchema);
export default Payment;
