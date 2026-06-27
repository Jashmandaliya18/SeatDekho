import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import User from './models/User.js';

import authRoutes from './routes/auth.js';
import showRoutes from './routes/shows.js';
import bookingRoutes from './routes/bookings.js';
import paymentRoutes from './routes/payments.js';
import { startLockReleaseJob } from './utils/lockJob.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;

app.use(cors({
  origin: '*', 
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

console.log('Connecting to MongoDB database...');
mongoose.connect(MONGODB_URI)
  .then(async () => {
    console.log('Successfully connected to MongoDB.');
    try {
      const adminExists = await User.findOne({ role: 'admin' });
      if (!adminExists) {
        const adminPassword = process.env.ADMIN_INITIAL_PASSWORD || 'adminpassword';
        const adminUser = new User({
          name: 'SeatDekho Administrator',
          email: 'admin@seatdekho.com',
          password: adminPassword,
          role: 'admin'
        });
        await adminUser.save();
        console.log(`Successfully created default admin user (admin@seatdekho.com / ${adminPassword}).`);
      }
    } catch (e) {
      console.error('Failed to auto-create default admin user:', e.message);
    }
  })
  .catch(err => {
    console.error('MongoDB database connection error:', err);
    console.log('Please ensure MongoDB service is running locally on port 27017.');
  });

app.use('/api/auth', authRoutes);
app.use('/api/shows', showRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/payments', paymentRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Rangmanch Drama Booking API is running successfully.' });
});

app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err.stack);
  res.status(500).json({ 
    message: 'Something went wrong on the server.',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal Server Error',
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  
  startLockReleaseJob();
});
