import mongoose from 'mongoose';

const otpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  otp: {
    type: String,
    required: true
  },
  name: {
    type: String,
    default: null
  },
  password: {
    type: String,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 300 
  }
});

const OTP = mongoose.model('OTP', otpSchema);
export default OTP;
