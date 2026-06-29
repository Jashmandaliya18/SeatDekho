import Show from '../models/Show.js';
import Seat from '../models/Seat.js';
import jwt from 'jsonwebtoken';

export const getShows = async (req, res) => {
  try {
    const shows = await Show.find().sort({ date: 1, time: 1 });
    
    const now = new Date();
    const showsWithLocks = await Promise.all(shows.map(async (show) => {
      const activeLocks = await Seat.find({
        showId: show._id,
        status: 'locked',
        lockExpiresAt: { $gt: now }
      }).select('seatNumber');

      const lockNumbers = activeLocks.map(l => l.seatNumber);
      const plainShow = show.toObject();
      plainShow.bookedSeats = [...new Set([...plainShow.bookedSeats, ...lockNumbers])];
      return plainShow;
    }));

    res.json(showsWithLocks);
  } catch (error) {
    res.status(500).json({ error: error.message, message: 'Server error retrieving shows.' });
  }
};

export const getShowById = async (req, res) => {
  try {
    const show = await Show.findById(req.params.id);
    if (!show) {
      return res.status(404).json({ message: 'Show not found.' });
    }
    const now = new Date();
    let userId = null;
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.split(' ')[1];
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        if (verified) {
          userId = verified.id;
        }
      } catch (err) {}
    }
    const activeLocks = await Seat.find({
      showId: show._id,
      status: 'locked',
      lockExpiresAt: { $gt: now }
    });
    const otherUserLocks = activeLocks
      .filter(l => !userId || l.lockedBy?.toString() !== userId.toString())
      .map(l => l.seatNumber);
    const currentUserLocks = activeLocks
      .filter(l => userId && l.lockedBy?.toString() === userId.toString())
      .map(l => l.seatNumber);
    const plainShow = show.toObject();
    plainShow.bookedSeats = show.bookedSeats;
    plainShow.otherUserLocks = otherUserLocks;
    plainShow.currentUserLocks = currentUserLocks;
    res.json(plainShow);
  } catch (error) {
    res.status(500).json({ error: error.message, message: 'Server error retrieving show details.' });
  }
};

export const createShow = async (req, res) => {
  try {
    const { title, description, poster, date, time, venue, categories, layout, artists, address, latitude, longitude } = req.body;

    if (!title || !description || !poster || !date || !time || !venue || !categories || !layout || !address) {
      return res.status(400).json({ message: 'Please provide all required fields (including address).' });
    }

    const show = new Show({
      title,
      description,
      poster,
      date,
      time,
      venue,
      address,
      latitude: latitude || 23.0225,
      longitude: longitude || 72.5714,
      categories,
      layout,
      artists: artists || [],
      bookedSeats: []
    });

    await show.save();

    const seatsToInsert = [];
    for (const row of layout) {
      const categoryPrice = categories.find(c => c.name === row.category)?.price || 0;
      for (let i = 1; i <= row.seatsCount; i++) {
        seatsToInsert.push({
          showId: show._id,
          seatNumber: `${row.rowName}-${i}`,
          category: row.category,
          price: categoryPrice,
          status: 'available'
        });
      }
    }
    await Seat.insertMany(seatsToInsert);

    res.status(201).json(show);
  } catch (error) {
    res.status(500).json({ error: error.message, message: 'Server error creating show.' });
  }
};

export const updateShow = async (req, res) => {
  try {
    const { title, description, poster, date, time, venue, categories, layout, artists, address, latitude, longitude } = req.body;

    const show = await Show.findById(req.params.id);
    if (!show) {
      return res.status(404).json({ message: 'Show not found.' });
    }

    if (title) show.title = title;
    if (description) show.description = description;
    if (poster) show.poster = poster;
    if (date) show.date = date;
    if (time) show.time = time;
    if (venue) show.venue = venue;
    if (address) show.address = address;
    if (latitude !== undefined) show.latitude = latitude;
    if (longitude !== undefined) show.longitude = longitude;
    if (categories) show.categories = categories;
    if (layout) show.layout = layout;
    if (artists) show.artists = artists;

    await show.save();
    res.json(show);
  } catch (error) {
    res.status(500).json({ error: error.message, message: 'Server error updating show.' });
  }
};

export const deleteShow = async (req, res) => {
  try {
    const show = await Show.findByIdAndDelete(req.params.id);
    if (!show) {
      return res.status(404).json({ message: 'Show not found.' });
    }
    
    await Seat.deleteMany({ showId: req.params.id });
    res.json({ message: 'Show deleted successfully.', showId: req.params.id });
  } catch (error) {
    res.status(500).json({ error: error.message, message: 'Server error deleting show.' });
  }
};

export const lockSeat = async (req, res) => {
  try {
    const { seatNumber } = req.body;
    const showId = req.params.id;
    const userId = req.user._id;
    if (!seatNumber) {
      return res.status(400).json({ message: 'Seat number is required.' });
    }
    const now = new Date();
    const lockExpiry = new Date(Date.now() + 10 * 60 * 1000);
    const seat = await Seat.findOne({ showId, seatNumber });
    if (!seat) {
      return res.status(404).json({ message: 'Seat not found.' });
    }
    if (seat.status === 'booked') {
      return res.status(400).json({ message: 'Seat is already booked.' });
    }
    if (seat.status === 'locked' && seat.lockExpiresAt > now && seat.lockedBy?.toString() !== userId.toString()) {
      return res.status(400).json({ message: 'Seat is locked by another user.' });
    }
    const userLocksCount = await Seat.countDocuments({
      showId,
      status: 'locked',
      lockedBy: userId,
      lockExpiresAt: { $gt: now }
    });
    if (userLocksCount >= 10) {
      return res.status(400).json({ message: 'You can select a maximum of 10 seats.' });
    }
    seat.status = 'locked';
    seat.lockedBy = userId;
    seat.lockedAt = now;
    seat.lockExpiresAt = lockExpiry;
    await seat.save();
    res.json({ message: 'Seat locked successfully.', seat });
  } catch (error) {
    res.status(500).json({ error: error.message, message: 'Server error locking seat.' });
  }
};

export const unlockSeat = async (req, res) => {
  try {
    const { seatNumber } = req.body;
    const showId = req.params.id;
    const userId = req.user._id;
    if (!seatNumber) {
      return res.status(400).json({ message: 'Seat number is required.' });
    }
    const seat = await Seat.findOne({
      showId,
      seatNumber,
      status: 'locked',
      lockedBy: userId
    });
    if (!seat) {
      return res.status(400).json({ message: 'Seat not locked by you.' });
    }
    seat.status = 'available';
    seat.lockedBy = null;
    seat.lockedAt = null;
    seat.lockExpiresAt = null;
    seat.bookingId = null;
    await seat.save();
    res.json({ message: 'Seat unlocked successfully.', seat });
  } catch (error) {
    res.status(500).json({ error: error.message, message: 'Server error unlocking seat.' });
  }
};
