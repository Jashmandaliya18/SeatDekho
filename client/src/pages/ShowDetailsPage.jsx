import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Calendar, Clock, MapPin, ArrowLeft, Ticket, User, Film, Info } from 'lucide-react';
import VenueMap from '../components/VenueMap';
import { api } from '../services/api';

export default function ShowDetailsPage({ show: initialShow, onBack, onBookSeats }) {
  const { id } = useParams();
  const [currentShow, setCurrentShow] = useState(initialShow);
  const [loading, setLoading] = useState(!initialShow);

  useEffect(() => {
    if (!currentShow) {
      const fetchShow = async () => {
        try {
          const data = await api.get(`/shows/${id}`);
          setCurrentShow(data);
        } catch (err) {
          console.error(err);
        } finally {
          setLoading(false);
        }
      };
      fetchShow();
    }
  }, [id, currentShow]);

  if (loading || !currentShow) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-10 h-10 border-4 border-maroon-100 border-t-maroon-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  const show = currentShow;

  
  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  };

  
  const getMockCastCrew = (title) => {
    const defaultData = {
      writer: 'Saumya Joshi',
      director: 'Siddharth Randeria',
      cast: ['Siddharth Randeria', 'Tejal Vyas', 'Lopa Shah', 'Purvi Vyas'],
      duration: '2h 15m',
      language: 'Gujarati'
    };

    if (title.includes('Welcome')) {
      return {
        writer: 'Saumya Joshi',
        director: 'Saumya Joshi',
        cast: ['Jignesh Vyas', 'Prem Gadhvi', 'Rinku Patel', 'Devanshi Shah'],
        duration: '2h 30m',
        language: 'Gujarati'
      };
    }

    if (title.includes('102')) {
      return {
        writer: 'Saumya Joshi',
        director: 'Umesh Shukla',
        cast: ['Dharmendra Gohil', 'Pratik Gandhi', 'Babu Suthar', 'Alok Mehta'],
        duration: '2h 10m',
        language: 'Gujarati'
      };
    }

    if (title.includes('Sardar')) {
      return {
        writer: 'Manoj Shah',
        director: 'Manoj Shah',
        cast: ['Jayesh More', 'Dharmesh Vyas', 'Kamlesh Oza', 'Sanjay Bhatia'],
        duration: '2h 45m',
        language: 'Gujarati'
      };
    }

    return defaultData;
  };

  const castCrew = getMockCastCrew(show.title);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 pb-20">
      
      <button 
        onClick={onBack}
        className="inline-flex items-center space-x-2 text-sm font-bold text-gray-500 hover:text-maroon-800 transition-colors bg-white px-3.5 py-2 rounded-xl shadow-xs border border-gray-100"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Shows</span>
      </button>

      
      <div className="bg-white border border-gray-100 rounded-3xl shadow-xs overflow-hidden flex flex-col md:flex-row gap-8 p-6 sm:p-8 relative">
        
        
        <div className="w-full md:w-80 shrink-0 rounded-2xl overflow-hidden shadow-md border border-gray-100">
          <img 
            src={show.poster} 
            alt={show.title} 
            className="w-full aspect-[3/4] object-cover"
          />
        </div>

        
        <div className="flex-1 space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <span className="bg-maroon-50 text-maroon-800 text-[10px] font-black tracking-widest px-2.5 py-1 rounded-full uppercase border border-maroon-100">
                {castCrew.language} Play
              </span>
              <span className="bg-saffron-50 text-saffron-700 text-[10px] font-black tracking-widest px-2.5 py-1 rounded-full uppercase border border-saffron-100">
                {castCrew.duration}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-maroon-900 leading-tight">
              {show.title}
            </h1>

            <p className="text-sm sm:text-base text-gray-600 leading-relaxed font-medium">
              {show.description}
            </p>
          </div>

          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-100">
            <div className="flex items-start space-x-3 text-sm text-gray-700">
              <Calendar className="w-4.5 h-4.5 text-saffron-600 shrink-0 mt-0.5" />
              <div>
                <span className="block text-[10px] text-gray-400 font-bold uppercase tracking-wider">Date</span>
                <span className="font-bold">{formatDate(show.date)}</span>
              </div>
            </div>
            <div className="flex items-start space-x-3 text-sm text-gray-700">
              <Clock className="w-4.5 h-4.5 text-saffron-600 shrink-0 mt-0.5" />
              <div>
                <span className="block text-[10px] text-gray-400 font-bold uppercase tracking-wider">Show Time</span>
                <span className="font-bold">{show.time} (IST)</span>
              </div>
            </div>
            <div className="flex items-start space-x-3 text-sm text-gray-700 sm:col-span-2 border-t border-gray-200/50 pt-3">
              <MapPin className="w-4.5 h-4.5 text-saffron-600 shrink-0 mt-0.5" />
              <div>
                <span className="block text-[10px] text-gray-400 font-bold uppercase tracking-wider">Venue & Address</span>
                <span className="font-extrabold text-gray-900">{show.venue}</span>
                {show.address && <span className="block text-xs text-gray-505 font-medium mt-0.5">{show.address}</span>}
              </div>
            </div>
          </div>
        </div>
      </div>

      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        
        <div className="lg:col-span-2 space-y-6">
          
          <div className="bg-white border border-gray-100 rounded-3xl p-6 sm:p-8 shadow-xs space-y-4">
            <h3 className="text-lg font-black text-maroon-900 border-b border-gray-50 pb-2">Artist Crew & Cast</h3>
            
            {show.artists && show.artists.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {show.artists.map((artist, idx) => (
                  <div key={idx} className="flex items-center space-x-3 p-3 bg-gray-50 border border-gray-150 rounded-2xl hover:bg-maroon-50/20 transition-all group">
                    <div className="w-10 h-10 bg-maroon-50 rounded-xl flex items-center justify-center text-maroon-800 font-extrabold text-sm border border-maroon-100/50 group-hover:scale-105 transition-all">
                      {artist.category.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <span className="block text-[9px] text-gray-450 font-bold uppercase tracking-wider">{artist.category}</span>
                      <span className="text-sm font-bold text-gray-800">{artist.name}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-maroon-50 rounded-xl flex items-center justify-center text-maroon-800 font-bold">
                      W
                    </div>
                    <div>
                      <span className="block text-[10px] text-gray-400 font-bold uppercase">Play Writer</span>
                      <span className="text-sm font-bold text-gray-800">{castCrew.writer}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-maroon-50 rounded-xl flex items-center justify-center text-maroon-800 font-bold">
                      D
                    </div>
                    <div>
                      <span className="block text-[10px] text-gray-400 font-bold uppercase">Stage Director</span>
                      <span className="text-sm font-bold text-gray-800">{castCrew.director}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <span className="block text-[10px] text-gray-400 font-bold uppercase mb-2">Lead Cast</span>
                  <div className="flex flex-wrap gap-2">
                    {castCrew.cast.map((actor, idx) => (
                      <span 
                        key={idx}
                        className="bg-gray-100 hover:bg-maroon-50 text-gray-800 hover:text-maroon-800 transition-colors text-xs font-bold px-3 py-2 rounded-xl border border-gray-200/50"
                      >
                        🎭 {actor}
                      </span>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          
          <div className="bg-white border border-gray-100 rounded-3xl p-6 sm:p-8 shadow-xs space-y-4">
            <h3 className="text-lg font-black text-maroon-900 border-b border-gray-50 pb-2 flex items-center space-x-2">
              <Info className="w-5 h-5 text-saffron-600" />
              <span>Important Guidelines</span>
            </h3>
            <ul className="list-disc pl-5 text-xs text-gray-500 space-y-2 font-medium">
              <li>Please reach the auditorium at least 20 minutes prior to show time.</li>
              <li>Late entry is strictly prohibited inside the hall after the play begins.</li>
              <li>Audio and video recording inside the auditorium is strictly banned.</li>
              <li>Food and beverages are not allowed inside the main auditorium seating arena.</li>
            </ul>
          </div>

          
          <div className="bg-white border border-gray-100 rounded-3xl p-6 sm:p-8 shadow-xs space-y-4">
            <h3 className="text-lg font-black text-maroon-900 border-b border-gray-50 pb-2 flex items-center space-x-2">
              <MapPin className="w-5 h-5 text-saffron-600" />
              <span>Auditorium Location Map</span>
            </h3>
            
            <div className="space-y-3">
              <p className="text-xs text-gray-650 font-bold">
                📍 <span className="text-gray-900 font-extrabold">{show.venue}</span>
                {show.address && <span className="text-gray-550 block mt-1 font-medium font-sans">{show.address}</span>}
              </p>
              <div className="w-full h-80">
                <VenueMap 
                  lat={show.latitude || 23.0225} 
                  lng={show.longitude || 72.5714} 
                  venueName={show.venue} 
                  address={show.address || show.venue} 
                  isDraggable={false} 
                />
              </div>
            </div>
          </div>
        </div>

        
        <div className="space-y-6">
          <div className="bg-white border border-gray-100 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
            <h3 className="text-lg font-black text-maroon-900 border-b border-gray-50 pb-2">Ticket Pricing</h3>
            
            
            <div className="space-y-3.5">
              {show.categories.map((cat, idx) => {
                
                let colorClass = 'bg-gray-100 text-gray-800 border-gray-200';
                if (cat.name === 'VIP') colorClass = 'bg-gold-100 text-gold-700 border-gold-200';
                if (cat.name === 'Gold') colorClass = 'bg-orange-50 text-saffron-700 border-saffron-100';
                
                return (
                  <div 
                    key={idx}
                    className="flex items-center justify-between p-3 border border-gray-100 rounded-2xl hover:bg-gray-50/50 transition-colors"
                  >
                    <div className="flex items-center space-x-2.5">
                      <span className={`text-[10px] font-black tracking-widest px-2.5 py-0.5 rounded-md border ${colorClass}`}>
                        {cat.name}
                      </span>
                      <span className="text-xs text-gray-400 font-bold">
                        {cat.name === 'VIP' ? 'Front Rows' : cat.name === 'Gold' ? 'Middle Rows' : 'Balcony/Back Rows'}
                      </span>
                    </div>
                    <span className="text-base font-black text-gray-850">
                      ₹{cat.price.toLocaleString('en-IN')}
                    </span>
                  </div>
                );
              })}
            </div>

            
            <div className="bg-gray-50 rounded-2xl p-3 border border-gray-100 flex justify-between items-center text-xs font-bold text-gray-650">
              <span className="flex items-center space-x-1">
                <Ticket className="w-4 h-4 text-maroon-700" />
                <span>Reserved seats:</span>
              </span>
              <span className="text-maroon-800 font-black">{show.bookedSeats.length} seats</span>
            </div>

            
            <button 
              onClick={onBookSeats}
              className="w-full bg-gradient-to-r from-saffron-600 to-saffron-500 hover:from-saffron-700 hover:to-saffron-600 text-white font-extrabold py-3.5 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 text-sm flex items-center justify-center space-x-2"
            >
              <Ticket className="w-4 h-4" />
              <span>Book Seats Now</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
