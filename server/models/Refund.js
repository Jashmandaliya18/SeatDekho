import mongoose from 'mongoose';

const refundSchema = new mongoose.Schema({
  paymentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment',
    required: true
  },
  razorpayRefundId: {
    type: String,
    required: true,
    unique: true
  },
  amount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: [
      'created',
      'pending',
      'processed',
      'completed',
      'failed',
      'refund_initiated',
      'refunded',
      'refund_failed'
    ],
    default: 'created',
    required: true
  },
  reason: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

const Refund = mongoose.model('Refund', refundSchema);
export default Refund;
