import express from 'express';
import Show from '../models/Show.js';
import Seat from '../models/Seat.js';
import { auth, adminOnly } from '../middleware/auth.js';

const router = express.Router();

router.get('/', async (req, res) => {
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
});

router.get('/:id', async (req, res) => {
  try {
    const show = await Show.findById(req.params.id);
    if (!show) {
      return res.status(404).json({ message: 'Show not found.' });
    }

    
    const now = new Date();
    const activeLocks = await Seat.find({
      showId: show._id,
      status: 'locked',
      lockExpiresAt: { $gt: now }
    }).select('seatNumber');

    const lockNumbers = activeLocks.map(l => l.seatNumber);
    const plainShow = show.toObject();
    plainShow.bookedSeats = [...new Set([...plainShow.bookedSeats, ...lockNumbers])];

    res.json(plainShow);
  } catch (error) {
    res.status(500).json({ error: error.message, message: 'Server error retrieving show details.' });
  }
});

router.post('/', auth, adminOnly, async (req, res) => {
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
});

router.put('/:id', auth, adminOnly, async (req, res) => {
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
});

router.delete('/:id', auth, adminOnly, async (req, res) => {
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
});

export default router;
