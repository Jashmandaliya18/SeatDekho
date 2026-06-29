import mongoose from 'mongoose';
import User from '../models/User.js';

const connectDB = async () => {
  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) {
    console.error('CRITICAL: MONGODB_URI environment variable is not defined.');
    process.exit(1);
  }

  console.log('Connecting to MongoDB database...');
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Successfully connected to MongoDB.');
  } catch (error) {
    console.error('MongoDB database connection error:', error.message);
    console.log('Please ensure MongoDB service is running locally on port 27017.');
    throw error;
  }

  try {
    const adminEmail = 'admin@seatdekho.com';
    const adminExists = await User.findOne({ email: adminEmail });
    if (!adminExists) {
      const adminPassword = process.env.ADMIN_INITIAL_PASSWORD || 'adminpassword';
      const adminUser = new User({
        name: 'SeatDekho Administrator',
        email: adminEmail,
        password: adminPassword,
        role: 'admin'
      });
      await adminUser.save();
      console.log(`Successfully created default admin user (${adminEmail} / ${adminPassword}).`);
    }
  } catch (e) {
    console.error('Failed to auto-create default admin user:', e.message);
  }
};

export default connectDB;
