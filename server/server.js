import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

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


// Serve static client assets in production
const distPath = path.resolve(import.meta.dirname, '../client/dist');
app.use(express.static(distPath));

app.get('*', (req, res) => {
  if (req.originalUrl.startsWith('/api')) {
    return res.status(404).json({ message: 'API route not found' });
  }

  const indexPath = path.resolve(distPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.json({ message: 'Rangmanch Drama Booking API is running successfully. (Frontend assets not built yet)' });
  }
});


app.use(errorHandler);


const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  startLockReleaseJob();
});

server.keepAliveTimeout = 65000;
server.headersTimeout = 66000;
