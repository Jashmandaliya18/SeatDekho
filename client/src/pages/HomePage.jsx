import React, { useState, useEffect } from 'react';
import { Search, MapPin, Calendar, Clock, Sparkles, SlidersHorizontal, Loader2 } from 'lucide-react';
import { api } from '../services/api';

export default function HomePage({ onSelectShow, setView, searchTerm, setSearchTerm }) {
  const [shows, setShows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedVenue, setSelectedVenue] = useState('All');

  useEffect(() => {
    const fetchShows = async () => {
      try {
        setLoading(true);
        const data = await api.get('/shows');
        setShows(data);
      } catch (err) {
        console.error(err);
        setError('Failed to fetch upcoming drama shows. Check backend server.');
      } finally {
        setLoading(false);
      }
    };
    fetchShows();
  }, []);

  
  const filteredShows = shows.filter(show => {
    const matchesSearch = show.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          show.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    
    let matchesCategory = true;
    if (selectedCategory !== 'All') {
      const desc = show.description.toLowerCase();
      if (selectedCategory === 'Comedy') {
        matchesCategory = desc.includes('comedy') || desc.includes('hilarious') || desc.includes('laugh');
      } else if (selectedCategory === 'Drama') {
        matchesCategory = desc.includes('drama') || desc.includes('emotional') || desc.includes('relationship');
      } else if (selectedCategory === 'Historical') {
        matchesCategory = desc.includes('historical') || desc.includes('biography') || desc.includes('sardar');
      }
    }

    let matchesVenue = true;
    if (selectedVenue !== 'All') {
      matchesVenue = show.venue.includes(selectedVenue);
    }

    return matchesSearch && matchesCategory && matchesVenue;
  });

  
  const getStartingPrice = (show) => {
    if (!show.categories || show.categories.length === 0) return 0;
    return Math.min(...show.categories.map(c => c.price));
  };

  
  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  
  const featuredShow = shows.length > 0 ? shows[0] : null;

  return (
    <div className="space-y-8 sm:space-y-12 pb-16">
      
      {featuredShow && (
        <div className="relative overflow-hidden bg-gradient-to-r from-maroon-950 via-maroon-900 to-maroon-950 text-white rounded-3xl shadow-xl max-w-7xl mx-auto px-4 sm:px-8 py-10 sm:py-16 flex flex-col md:flex-row items-center gap-8 md:gap-12 animate-fade-in mx-4 sm:mx-6 lg:mx-8">
          
          <div className="absolute inset-0 bg-radial-gradient from-saffron-600/10 via-transparent to-transparent pointer-events-none"></div>

          
          <div className="relative w-full md:w-2/5 shrink-0 rounded-2xl overflow-hidden shadow-2xl border border-maroon-800/50 group">
            <img 
              src={featuredShow.poster} 
              alt={featuredShow.title} 
              className="w-full aspect-video md:aspect-[4/3] object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute top-3 left-3 bg-saffron-500 text-white text-[10px] font-black tracking-widest px-2.5 py-1 rounded-full uppercase shadow-sm">
              Featured Drama
            </div>
          </div>

          
          <div className="space-y-4 md:space-y-6 flex-1 text-center md:text-left">
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 bg-maroon-800/60 border border-maroon-700/50 rounded-full text-xs font-bold text-saffron-300">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Housefull Comedy Performance</span>
            </div>
            
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white leading-tight font-sans">
              {featuredShow.title}
            </h1>
            
            <p className="text-sm sm:text-base text-maroon-200/90 leading-relaxed font-medium line-clamp-3 md:line-clamp-none max-w-2xl">
              {featuredShow.description}
            </p>

            <div className="grid grid-cols-2 gap-4 max-w-md pt-2 border-t border-maroon-800/40">
              <div className="flex items-center space-x-2 text-maroon-200 text-xs sm:text-sm font-semibold justify-center md:justify-start">
                <Calendar className="w-4 h-4 text-saffron-400 shrink-0" />
                <span>{formatDate(featuredShow.date)}</span>
              </div>
              <div className="flex items-center space-x-2 text-maroon-200 text-xs sm:text-sm font-semibold justify-center md:justify-start">
                <MapPin className="w-4 h-4 text-saffron-400 shrink-0" />
                <span className="truncate">{featuredShow.venue.split(',')[0]}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4 pt-4 justify-center md:justify-start">
              <div>
                <span className="block text-[10px] text-maroon-300 uppercase font-extrabold tracking-wider">Tickets From</span>
                <span className="text-2xl font-black text-saffron-400">₹{getStartingPrice(featuredShow)}</span>
              </div>
              <button 
                onClick={() => onSelectShow(featuredShow)}
                className="w-full sm:w-auto bg-gradient-to-r from-saffron-500 to-saffron-600 hover:from-saffron-600 hover:to-saffron-700 text-white font-extrabold px-8 py-3.5 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-0.5 text-sm"
              >
                Book Tickets Now
              </button>
            </div>
          </div>
        </div>
      )}

      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-gray-100 pb-4 gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-maroon-900 tracking-tight">Upcoming Shows</h2>
            <p className="text-xs text-gray-500 font-medium">Select a drama play below to explore timings, layouts, and seats booking.</p>
          </div>
        </div>

        
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 bg-white p-3.5 border border-gray-100 rounded-2xl shadow-xs overflow-hidden">
          <div className="flex items-center space-x-1.5 text-xs text-gray-500 font-bold px-2 py-1 shrink-0">
            <SlidersHorizontal className="w-3.5 h-3.5 text-maroon-800" />
            <span>Filters:</span>
          </div>

          
          <div className="flex items-center overflow-x-auto pb-1 sm:pb-0 scrollbar-none gap-1.5 shrink-0 max-w-full">
            {['All', 'Comedy', 'Drama', 'Historical'].map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-all shrink-0 ${
                  selectedCategory === cat 
                    ? 'bg-maroon-800 text-white border-maroon-800 shadow-xs' 
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="hidden sm:block h-6 w-px bg-gray-250 mx-1 shrink-0"></div>

          
          <div className="flex items-center overflow-x-auto pb-1 sm:pb-0 scrollbar-none gap-1.5 shrink-0 max-w-full">
            {['All', 'Ahmedabad', 'Surat', 'Mumbai'].map(ven => (
              <button
                key={ven}
                onClick={() => setSelectedVenue(ven)}
                className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-all shrink-0 ${
                  selectedVenue === ven 
                    ? 'bg-saffron-600 text-white border-saffron-600 shadow-xs' 
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                }`}
              >
                {ven}
              </button>
            ))}
          </div>
        </div>

        
        {loading ? (
          <div className="text-center py-20 flex flex-col items-center justify-center space-y-4">
            <Loader2 className="w-10 h-10 text-saffron-500 animate-spin" />
            <p className="text-sm font-semibold text-gray-500">Loading upcoming drama listings...</p>
          </div>
        ) : error ? (
          <div className="text-center py-20 bg-white border border-red-100 rounded-3xl p-8 max-w-xl mx-auto space-y-3">
            <p className="text-red-600 font-bold">{error}</p>
            <p className="text-xs text-gray-500">Please make sure your Node/Express backend is running and the database is seeded.</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-maroon-800 hover:bg-maroon-900 text-white text-xs font-bold rounded-lg"
            >
              Retry
            </button>
          </div>
        ) : filteredShows.length === 0 ? (
          <div className="text-center py-20 bg-white border border-gray-100 rounded-3xl p-8 space-y-2">
            <p className="text-gray-900 font-bold text-lg">No Shows Found</p>
            <p className="text-xs text-gray-500 max-w-md mx-auto">No drama shows match your current search queries or filter categories. Try resetting filters.</p>
            <button 
              onClick={() => { setSearchTerm(''); setSelectedCategory('All'); setSelectedVenue('All'); }}
              className="text-xs font-bold text-maroon-800 hover:underline mt-2"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {filteredShows.map(show => (
              <div 
                key={show._id}
                className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col group"
              >
                
                <div className="relative aspect-video sm:aspect-[4/3] w-full overflow-hidden bg-gray-100 shrink-0">
                  <img 
                    src={show.poster} 
                    alt={show.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-xs px-2.5 py-1 rounded-full shadow-xs flex items-center space-x-1">
                    <MapPin className="w-3.5 h-3.5 text-maroon-800 shrink-0" />
                    <span className="text-[10px] font-bold text-gray-800">{show.venue.split(',')[0]}</span>
                  </div>
                </div>

                
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <h3 className="text-base sm:text-lg font-black text-maroon-900 leading-tight group-hover:text-maroon-700 transition-colors">
                      {show.title}
                    </h3>
                    <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed font-medium">
                      {show.description}
                    </p>
                  </div>

                  <div className="space-y-3 pt-3 border-t border-gray-50">
                    <div className="grid grid-cols-2 gap-2 text-xs font-bold text-gray-700">
                      <div className="flex items-center space-x-1.5">
                        <Calendar className="w-3.5 h-3.5 text-saffron-600 shrink-0" />
                        <span>{formatDate(show.date)}</span>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <Clock className="w-3.5 h-3.5 text-saffron-600 shrink-0" />
                        <span>{show.time}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <div>
                        <span className="block text-[9px] font-bold text-gray-400 uppercase tracking-widest">Tickets from</span>
                        <span className="text-lg font-black text-maroon-900">₹{getStartingPrice(show)}</span>
                      </div>
                      <button 
                        onClick={() => onSelectShow(show)}
                        className="bg-maroon-800 hover:bg-maroon-900 group-hover:bg-gradient-to-r group-hover:from-maroon-800 group-hover:to-maroon-700 text-white font-extrabold px-4.5 py-2 rounded-xl text-xs shadow-xs group-hover:shadow-md transition-all duration-200"
                      >
                        Book Now
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
