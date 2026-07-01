import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

import connectDB from './config/db.js';
import authRoutes from './routes/auth.js';
import showRoutes from './routes/shows.js';
import bookingRoutes from './routes/bookings.js';
import paymentRoutes from './routes/payments.js';
import { startLockReleaseJob } from './utils/lockJob.js';
import { errorHandler } from './middleware/error.js';


dotenv.config({ path: path.resolve(import.meta.dirname, '../.env') });

// Verify Razorpay env vars strictly at startup - fail fast if missing
const requiredEnvVars = ['RAZORPAY_KEY_ID', 'RAZORPAY_KEY_SECRET', 'RAZORPAY_WEBHOOK_SECRET'];
for (const varName of requiredEnvVars) {
  if (!process.env[varName]) {
    throw new Error(`CRITICAL STARTUP ERROR: Environment variable ${varName} is missing. Refusing to boot.`);
  }
}

const app = express();
const PORT = process.env.PORT || 5000;


connectDB();


app.use(cors({
  origin: '*', 
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({
  limit: '10mb',
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ limit: '10mb', extended: true }));


app.use('/api/auth', authRoutes);
app.use('/api/shows', showRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/payments', paymentRoutes);


app.get('/', (req, res) => {
  res.json({ message: 'Rangmanch Drama Booking API is running successfully.' });
});


app.use(errorHandler);


const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  startLockReleaseJob();
});

server.keepAliveTimeout = 65000;
server.headersTimeout = 66000;
