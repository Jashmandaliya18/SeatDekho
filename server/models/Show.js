import mongoose from 'mongoose';

const showSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  poster: {
    type: String,
    required: true
  },
  artists: [
    {
      name: {
        type: String,
        required: true
      },
      category: {
        type: String,
        required: true
      }
    }
  ],
  date: {
    type: String, 
    required: true
  },
  time: {
    type: String, 
    required: true
  },
  venue: {
    type: String,
    required: true
  },
  address: {
    type: String,
    required: true
  },
  latitude: {
    type: Number,
    default: 23.0225
  },
  longitude: {
    type: Number,
    default: 72.5714
  },
  
  categories: [
    {
      name: {
        type: String, 
        required: true
      },
      price: {
        type: Number,
        required: true
      }
    }
  ],
  
  layout: [
    {
      rowName: {
        type: String, 
        required: true
      },
      seatsCount: {
        type: Number,
        required: true
      },
      category: {
        type: String, 
        required: true
      }
    }
  ],
  
  bookedSeats: {
    type: [String], 
    default: []
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Show = mongoose.model('Show', showSchema);
export default Show;
