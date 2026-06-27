import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import OTP from '../models/OTP.js';
import { auth } from '../middleware/auth.js';
import { sendOTPEmail } from '../utils/mailer.js';

const router = express.Router();
const getJWTSecret = () => process.env.JWT_SECRET;

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'A user with this email already exists.' });
    }

    const user = new User({
      name,
      email,
      password,
      role: role || 'user'
    });

    await user.save();

    const token = jwt.sign({ id: user._id }, getJWTSecret(), { expiresIn: '7d' });

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message, message: 'Server error during registration.' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please enter all fields.' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials. User does not exist.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials. Incorrect password.' });
    }

    const token = jwt.sign({ id: user._id }, getJWTSecret(), { expiresIn: '7d' });

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message, message: 'Server error during login.' });
  }
});

router.post('/register/send-otp', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please fill in all registration fields.' });
    }

    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'A user with this email already exists.' });
    }

    const otpCode = generateOTP();

    
    await OTP.findOneAndDelete({ email });
    const otpDoc = new OTP({
      email,
      otp: otpCode,
      name,
      password 
    });
    await otpDoc.save();

    
    await sendOTPEmail(email, otpCode);

    res.json({ message: 'OTP verification code has been sent to your email.' });
  } catch (error) {
    res.status(500).json({ error: error.message, message: 'Server error sending registration OTP.' });
  }
});

router.post('/register/verify', async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: 'Please enter your email and the verification code.' });
    }

    const otpRecord = await OTP.findOne({ email });
    if (!otpRecord) {
      return res.status(400).json({ message: 'Verification code expired or invalid. Please request a new OTP.' });
    }

    if (otpRecord.otp !== otp) {
      return res.status(400).json({ message: 'Incorrect verification code.' });
    }

    
    const user = new User({
      name: otpRecord.name,
      email: otpRecord.email,
      password: otpRecord.password, 
      role: 'user'
    });
    await user.save();

    
    await OTP.deleteOne({ email });

    const token = jwt.sign({ id: user._id }, getJWTSecret(), { expiresIn: '7d' });

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message, message: 'Server error verifying registration OTP.' });
  }
});

router.post('/login/send-otp', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Please enter your email address.' });
    }

    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'No account found with this email. Please sign up first.' });
    }

    const otpCode = generateOTP();

    
    await OTP.findOneAndDelete({ email });
    const otpDoc = new OTP({
      email,
      otp: otpCode
    });
    await otpDoc.save();

    
    await sendOTPEmail(email, otpCode);

    res.json({ message: 'OTP verification code has been sent to your email.' });
  } catch (error) {
    res.status(500).json({ error: error.message, message: 'Server error sending login OTP.' });
  }
});

router.post('/login/verify', async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: 'Please enter your email and verification code.' });
    }

    const otpRecord = await OTP.findOne({ email });
    if (!otpRecord) {
      return res.status(400).json({ message: 'Verification code expired or invalid. Please request a new OTP.' });
    }

    if (otpRecord.otp !== otp) {
      return res.status(400).json({ message: 'Incorrect verification code.' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'User record not found.' });
    }

    
    await OTP.deleteOne({ email });

    const token = jwt.sign({ id: user._id }, getJWTSecret(), { expiresIn: '7d' });

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message, message: 'Server error verifying login OTP.' });
  }
});

router.post('/google-login', async (req, res) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({ message: 'Missing Google authentication credential.' });
    }

    let payload;
    const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;

    if (GOOGLE_CLIENT_ID && GOOGLE_CLIENT_ID !== 'mock_google_client_id.apps.googleusercontent.com') {
      const { OAuth2Client } = await import('google-auth-library');
      const client = new OAuth2Client(GOOGLE_CLIENT_ID);
      const ticket = await client.verifyIdToken({
        idToken: credential,
        audience: GOOGLE_CLIENT_ID
      });
      payload = ticket.getPayload();
    } else {
      
      payload = jwt.decode(credential);
    }

    if (!payload || !payload.email) {
      return res.status(400).json({ message: 'Failed to verify Google account details.' });
    }

    const { email, name } = payload;

    
    let user = await User.findOne({ email });

    if (!user) {
      
      const randomPassword = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      user = new User({
        name: name || email.split('@')[0],
        email,
        password: randomPassword,
        role: 'user'
      });
      await user.save();
    }

    const token = jwt.sign({ id: user._id }, getJWTSecret(), { expiresIn: '7d' });

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message, message: 'Server error during Google Authentication.' });
  }
});

router.put('/profile', auth, async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    
    if (email && email.toLowerCase() !== user.email.toLowerCase()) {
      const emailTaken = await User.findOne({ email: email.toLowerCase() });
      if (emailTaken) {
        return res.status(400).json({ message: 'This email is already in use by another account.' });
      }
      user.email = email;
    }

    if (name) user.name = name;
    if (password) user.password = password; 

    await user.save();

    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    });
  } catch (error) {
    res.status(500).json({ error: error.message, message: 'Server error updating profile details.' });
  }
});

router.get('/me', auth, async (req, res) => {
  try {
    res.json({
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role
    });
  } catch (error) {
    res.status(500).json({ error: error.message, message: 'Server error fetching user.' });
  }
});

export default router;
