import React, { useState, useEffect } from 'react';
import { 
  BarChart3, Film, Armchair, Library, Plus, Trash2, 
  X, Check, DollarSign, Calendar, MapPin, Search, Loader2, Edit3 
} from 'lucide-react';
import { api } from '../services/api';
import VenueMap from '../components/VenueMap';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [shows, setShows] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  
  const [showTitle, setShowTitle] = useState('');
  const [showDesc, setShowDesc] = useState('');
  const [showPoster, setShowPoster] = useState(''); 
  const [showDate, setShowDate] = useState('');
  const [showTime, setShowTime] = useState('');
  const [showVenue, setShowVenue] = useState('Pandit Dindayal Upadhyay Auditorium, Ahmedabad');
  const [showAddress, setShowAddress] = useState('');
  const [latitude, setLatitude] = useState(23.0225);
  const [longitude, setLongitude] = useState(72.5714);
  const [uploadDimensions, setUploadDimensions] = useState(null); 
  const [artistsList, setArtistsList] = useState([]);
  const [artistNameInput, setArtistNameInput] = useState('');
  const [artistCategoryInput, setArtistCategoryInput] = useState('Actor');
  const [editingShowId, setEditingShowId] = useState(null); 
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);
  const [successOverlayMessage, setSuccessOverlayMessage] = useState('');
  
  
  const [showCategories, setShowCategories] = useState([
    { name: 'VIP', price: 800 },
    { name: 'Gold', price: 500 },
    { name: 'Silver', price: 300 }
  ]);
  const [newCatName, setNewCatName] = useState('');
  const [newCatPrice, setNewCatPrice] = useState('');

  
  const [builderRows, setBuilderRows] = useState([
    { rowName: 'A', seatsCount: 10, category: 'VIP' },
    { rowName: 'B', seatsCount: 10, category: 'VIP' },
    { rowName: 'C', seatsCount: 12, category: 'Gold' },
    { rowName: 'D', seatsCount: 12, category: 'Gold' },
    { rowName: 'E', seatsCount: 15, category: 'Silver' },
    { rowName: 'F', seatsCount: 15, category: 'Silver' }
  ]);

  
  const [bookingSearch, setBookingSearch] = useState('');
  const [selectedBookingShowId, setSelectedBookingShowId] = useState(null); 

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      const showsData = await api.get('/shows');
      const bookingsData = await api.get('/bookings');
      setShows(showsData);
      setBookings(bookingsData);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch dashboard metrics. Check server logs.');
    } finally {
      setLoading(false);
    }
  };

  
  const handleAddCategory = (e) => {
    e.preventDefault();
    if (!newCatName || !newCatPrice) return;
    
    const formattedName = newCatName.trim();
    if (showCategories.some(c => c.name.toLowerCase() === formattedName.toLowerCase())) {
      alert('This category name already exists!');
      return;
    }

    setShowCategories([...showCategories, { name: formattedName, price: Number(newCatPrice) }]);
    setNewCatName('');
    setNewCatPrice('');
  };

  
  const handleRemoveCategory = (nameToRemove) => {
    if (showCategories.length <= 1) {
      alert('A show must configure at least one pricing category!');
      return;
    }
    const updated = showCategories.filter(c => c.name !== nameToRemove);
    setShowCategories(updated);

    
    const fallbackCategory = updated[0].name;
    const updatedRows = builderRows.map(row => 
      row.category === nameToRemove ? { ...row, category: fallbackCategory } : row
    );
    setBuilderRows(updatedRows);
  };

  
  const handleAddBuilderRow = () => {
    const nextRowLetter = String.fromCharCode(65 + builderRows.length); 
    const defaultCategory = showCategories[0]?.name || 'Silver';
    setBuilderRows([...builderRows, {
      rowName: nextRowLetter,
      seatsCount: 10,
      category: defaultCategory
    }]);
  };

  const handleRemoveBuilderRow = (index) => {
    const updated = builderRows.filter((_, idx) => idx !== index);
    
    const reAdjusted = updated.map((row, idx) => ({
      ...row,
      rowName: String.fromCharCode(65 + idx)
    }));
    setBuilderRows(reAdjusted);
  };

  const handleBuilderRowChange = (index, field, value) => {
    const updated = builderRows.map((row, idx) => {
      if (idx === index) {
        return {
          ...row,
          [field]: field === 'seatsCount' ? Math.min(25, Math.max(1, Number(value))) : value
        };
      }
      return row;
    });
    setBuilderRows(updated);
  };

  
  const handleCreateShow = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!showTitle || !showDesc || !showPoster || !showDate || !showTime || !showVenue || !showAddress) {
      return setError('Please fill in all show fields, upload a poster image, and specify a venue address.');
    }

    try {
      const payload = {
        title: showTitle,
        description: showDesc,
        poster: showPoster,
        date: showDate,
        time: showTime,
        venue: showVenue,
        address: showAddress,
        latitude,
        longitude,
        categories: showCategories,
        layout: builderRows,
        artists: artistsList
      };

      if (editingShowId) {
        await api.put(`/shows/${editingShowId}`, payload);
        setSuccessOverlayMessage(`Show "${showTitle}" updated successfully!`);
      } else {
        await api.post('/shows', payload);
        setSuccessOverlayMessage(`Show "${showTitle}" created successfully!`);
      }

      setShowSuccessOverlay(true);
      
      
      setShowTitle('');
      setShowDesc('');
      setShowDate('');
      setShowTime('');
      setShowPoster('');
      setUploadDimensions(null);
      setArtistsList([]);
      setEditingShowId(null);
      setShowAddress('');
      setLatitude(23.0225);
      setLongitude(72.5714);
      setShowCategories([
        { name: 'VIP', price: 800 },
        { name: 'Gold', price: 500 },
        { name: 'Silver', price: 300 }
      ]);
      setBuilderRows([
        { rowName: 'A', seatsCount: 10, category: 'VIP' },
        { rowName: 'B', seatsCount: 10, category: 'VIP' },
        { rowName: 'C', seatsCount: 12, category: 'Gold' },
        { rowName: 'D', seatsCount: 12, category: 'Gold' },
        { rowName: 'E', seatsCount: 15, category: 'Silver' },
        { rowName: 'F', seatsCount: 15, category: 'Silver' }
      ]);

      
      setTimeout(() => setShowSuccessOverlay(false), 2500);

      
      const refreshedShows = await api.get('/shows');
      setShows(refreshedShows);
    } catch (err) {
      setError(err.message || 'Failed to submit show details.');
    }
  };

  const handleStartEditShow = (show) => {
    setEditingShowId(show._id);
    setShowTitle(show.title);
    setShowDesc(show.description);
    setShowPoster(show.poster);
    
    
    if (show.poster && show.poster.startsWith('data:')) {
      const img = new Image();
      img.onload = () => {
        setUploadDimensions({ width: img.width, height: img.height });
      };
      img.src = show.poster;
    } else {
      setUploadDimensions(null);
    }
    
    setShowDate(show.date);
    setShowTime(show.time);
    setShowVenue(show.venue);
    setShowAddress(show.address || '');
    setLatitude(show.latitude || 23.0225);
    setLongitude(show.longitude || 72.5714);
    setShowCategories(show.categories);
    setBuilderRows(show.layout);
    setArtistsList(show.artists || []);
    
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEditShow = () => {
    setEditingShowId(null);
    setShowTitle('');
    setShowDesc('');
    setShowPoster('');
    setUploadDimensions(null);
    setShowDate('');
    setShowTime('');
    setShowAddress('');
    setLatitude(23.0225);
    setLongitude(72.5714);
    setShowCategories([
      { name: 'VIP', price: 800 },
      { name: 'Gold', price: 500 },
      { name: 'Silver', price: 300 }
    ]);
    setBuilderRows([
      { rowName: 'A', seatsCount: 10, category: 'VIP' },
      { rowName: 'B', seatsCount: 10, category: 'VIP' },
      { rowName: 'C', seatsCount: 12, category: 'Gold' },
      { rowName: 'D', seatsCount: 12, category: 'Gold' },
      { rowName: 'E', seatsCount: 15, category: 'Silver' },
      { rowName: 'F', seatsCount: 15, category: 'Silver' }
    ]);
    setArtistsList([]);
  };

  
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file (PNG, JPG, etc.).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Data = event.target.result;
      const img = new Image();
      img.onload = () => {
        setUploadDimensions({ width: img.width, height: img.height });
        setShowPoster(base64Data);
      };
      img.src = base64Data;
    };
    reader.readAsDataURL(file);
  };

  
  const handleDeleteShow = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"? This will remove all associated ticket slots.`)) return;
    try {
      await api.delete(`/shows/${id}`);
      setShows(shows.filter(s => s._id !== id));
      setSuccessMsg(`Show "${title}" deleted.`);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError('Failed to delete show.');
    }
  };

  
  const handleCancelBooking = async (id, bookingId) => {
    if (!window.confirm(`Cancel Booking ${bookingId} and release seats?`)) return;
    try {
      await api.put(`/bookings/${id}/cancel`);
      setBookings(bookings.map(b => b._id === id ? { ...b, bookingStatus: 'cancelled' } : b));
      
      const showsData = await api.get('/shows');
      setShows(showsData);
      
      setSuccessMsg(`Booking ${bookingId} cancelled.`);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError('Failed to cancel booking.');
    }
  };

  
  const totalShows = shows.length;
  const activeBookings = bookings.filter(b => b.bookingStatus === 'confirmed');
  const totalBookings = activeBookings.length;
  const totalRevenue = activeBookings.reduce((sum, b) => sum + b.totalAmount, 0);
  const upcomingShows = shows.filter(s => new Date(s.date) >= new Date()).length;

  
  const filteredBookings = bookings.filter(b => {
    const term = bookingSearch.toLowerCase();
    const matchesSearch = b.bookingId.toLowerCase().includes(term) ||
                          b.customerDetails.name.toLowerCase().includes(term) ||
                          b.customerDetails.email.toLowerCase().includes(term);
    
    if (selectedBookingShowId === 'deleted') {
      return matchesSearch && !b.show;
    } else {
      return matchesSearch && b.show && b.show._id === selectedBookingShowId;
    }
  });

  
  const getSelectedShowStats = () => {
    if (!selectedBookingShowId) return null;
    if (selectedBookingShowId === 'deleted') {
      const showBookings = bookings.filter(b => !b.show && b.bookingStatus === 'confirmed');
      const revenue = showBookings.reduce((sum, b) => sum + b.totalAmount, 0);
      return {
        title: 'Archived & Deleted Shows',
        revenue,
        bookingsCount: showBookings.length,
        bookedSeats: showBookings.reduce((sum, b) => sum + b.seats.length, 0),
        capacity: 0,
        percentage: 0
      };
    }
    const showObj = shows.find(s => s._id === selectedBookingShowId);
    if (!showObj) return null;

    const showBookings = bookings.filter(b => b.show && b.show._id === selectedBookingShowId && b.bookingStatus === 'confirmed');
    const revenue = showBookings.reduce((sum, b) => sum + b.totalAmount, 0);
    const bookedCount = showObj.bookedSeats ? showObj.bookedSeats.length : 0;
    const totalCapacity = showObj.layout.reduce((sum, r) => sum + r.seatsCount, 0);

    return {
      title: showObj.title,
      revenue,
      bookingsCount: showBookings.length,
      bookedSeats: bookedCount,
      capacity: totalCapacity,
      percentage: totalCapacity > 0 ? Math.round((bookedCount / totalCapacity) * 100) : 0
    };
  };

  const selectedShowStats = getSelectedShowStats();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 pb-24">
      
      <div className="border-b border-gray-100 pb-4">
        <h1 className="text-2xl sm:text-3xl font-black text-maroon-900 tracking-tight">Admin Control Panel</h1>
        <p className="text-xs text-gray-500 font-medium">Manage shows, configure seating arrangements per show, track bookings logs, and process refunds.</p>
      </div>

      
      {error && (
        <div className="p-4 bg-red-50 border border-red-100 text-red-700 text-sm font-semibold rounded-2xl animate-fade-in flex justify-between items-center">
          <span>{error}</span>
          <button onClick={() => setError('')}>✕</button>
        </div>
      )}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-100 text-emerald-800 text-sm font-semibold rounded-2xl animate-fade-in flex justify-between items-center">
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg('')}>✕</button>
        </div>
      )}

      
      <div className="flex flex-wrap border-b border-gray-200 gap-1 bg-white p-1.5 border border-gray-100 rounded-2xl shadow-xs">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center space-x-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'overview' ? 'bg-maroon-800 text-white shadow-xs' : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Overview</span>
        </button>
        <button
          onClick={() => setActiveTab('shows')}
          className={`flex items-center space-x-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'shows' ? 'bg-maroon-800 text-white shadow-xs' : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          <Film className="w-4 h-4" />
          <span>Shows & Seating Builder</span>
        </button>
        <button
          onClick={() => setActiveTab('bookings')}
          className={`flex items-center space-x-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'bookings' ? 'bg-maroon-800 text-white shadow-xs' : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          <Library className="w-4 h-4" />
          <span>Bookings Logs</span>
        </button>
      </div>

      {loading ? (
        <div className="text-center py-20 flex flex-col items-center justify-center space-y-4">
          <Loader2 className="w-10 h-10 text-saffron-500 animate-spin" />
          <p className="text-sm font-semibold text-gray-500">Loading admin parameters...</p>
        </div>
      ) : (
        
        <div className="space-y-6">
          
          
          {activeTab === 'overview' && (
            <div className="space-y-8">
              
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                <div className="bg-white border border-gray-100 rounded-3xl p-5 sm:p-6 shadow-xs flex items-center space-x-4">
                  <div className="p-3.5 bg-maroon-50 rounded-2xl text-maroon-800">
                    <Film className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <div>
                    <span className="block text-[10px] text-gray-400 font-bold uppercase">Total Shows</span>
                    <span className="text-xl sm:text-2xl font-black text-gray-900">{totalShows}</span>
                  </div>
                </div>

                <div className="bg-white border border-gray-100 rounded-3xl p-5 sm:p-6 shadow-xs flex items-center space-x-4">
                  <div className="p-3.5 bg-emerald-50 rounded-2xl text-emerald-600">
                    <Library className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <div>
                    <span className="block text-[10px] text-gray-400 font-bold uppercase">Total Bookings</span>
                    <span className="text-xl sm:text-2xl font-black text-gray-900">{totalBookings}</span>
                  </div>
                </div>

                <div className="bg-white border border-gray-100 rounded-3xl p-5 sm:p-6 shadow-xs flex items-center space-x-4">
                  <div className="p-3.5 bg-saffron-50 rounded-2xl text-saffron-600">
                    <DollarSign className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <div>
                    <span className="block text-[10px] text-gray-400 font-bold uppercase">Total Revenue</span>
                    <span className="text-xl sm:text-2xl font-black text-gray-900">₹{totalRevenue.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                <div className="bg-white border border-gray-100 rounded-3xl p-5 sm:p-6 shadow-xs flex items-center space-x-4">
                  <div className="p-3.5 bg-blue-50 rounded-2xl text-blue-600">
                    <Calendar className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <div>
                    <span className="block text-[10px] text-gray-400 font-bold uppercase">Upcoming Shows</span>
                    <span className="text-xl sm:text-2xl font-black text-gray-900">{upcomingShows}</span>
                  </div>
                </div>
              </div>

              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                
                <div className="lg:col-span-2 bg-white border border-gray-100 rounded-3xl p-6 sm:p-8 shadow-xs space-y-4">
                  <h3 className="text-lg font-black text-maroon-900 border-b border-gray-50 pb-2">Active Drama Shows</h3>
                  
                  <div className="divide-y divide-gray-100">
                    {shows.map(show => (
                      <div key={show._id} className="flex justify-between items-center py-4 first:pt-0 last:pb-0 gap-4">
                        <div className="flex items-center space-x-3.5 truncate">
                          <img src={show.poster} alt="" className="w-12 h-16 object-cover rounded-lg border border-gray-100 shrink-0" />
                          <div className="truncate">
                            <span className="text-sm font-bold text-gray-900 truncate block">{show.title}</span>
                            <span className="text-[10px] text-gray-500 block truncate">{show.venue.split(',')[0]}</span>
                            <span className="text-[10px] text-saffron-600 font-bold block">{show.date} • {show.time}</span>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-xs text-gray-400 font-bold block">Booked Seats</span>
                          <span className="text-sm font-black text-maroon-900">{show.bookedSeats ? show.bookedSeats.length : 0} seats</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                
                <div className="bg-white border border-gray-100 rounded-3xl p-6 sm:p-8 shadow-xs space-y-4 flex flex-col justify-between">
                  <div className="space-y-4">
                    <h3 className="text-lg font-black text-maroon-900 border-b border-gray-50 pb-2">Capacity Utilization</h3>
                    
                    <div className="space-y-4">
                      {shows.slice(0, 3).map(show => {
                        const totalHallSeats = show.layout.reduce((sum, r) => sum + r.seatsCount, 0);
                        const bookedCount = show.bookedSeats ? show.bookedSeats.length : 0;
                        const percentage = totalHallSeats > 0 ? Math.round((bookedCount / totalHallSeats) * 100) : 0;

                        return (
                          <div key={show._id} className="space-y-1">
                            <div className="flex justify-between text-xs font-bold text-gray-700">
                              <span className="truncate max-w-[150px]">{show.title}</span>
                              <span>{percentage}% ({bookedCount}/{totalHallSeats})</span>
                            </div>
                            <div className="w-full bg-gray-150 h-2 rounded-full overflow-hidden">
                              <div 
                                className="bg-gradient-to-r from-maroon-800 to-saffron-500 h-full rounded-full transition-all duration-500" 
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100/50 mt-6 text-center space-y-1 text-xs text-gray-500">
                    <p className="font-bold text-gray-800">Seating layouts are fully custom.</p>
                    <p className="font-medium">Define rows, seats, and pricing category configurations directly when adding a new show.</p>
                  </div>
                </div>

              </div>
            </div>
          )}

          
          {activeTab === 'shows' && (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start">
              
              
              <div className="xl:col-span-2 bg-white border border-gray-100 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
                <div>
                  <h3 className="text-lg font-black text-maroon-900 border-b border-gray-50 pb-2">Create New Drama Show & Configure Layout</h3>
                  <p className="text-[10px] text-gray-500 font-medium mt-1">Configure details, category prices, and seating rows specifically for this play.</p>
                </div>

                <form onSubmit={handleCreateShow} className="space-y-6">
                  
                  <div className="space-y-4">
                    <h4 className="text-xs font-black uppercase tracking-wider text-saffron-600">1. Basic Show Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Drama Name</label>
                        <input 
                          type="text" 
                          required 
                          placeholder="e.g. Welcome Zindagi"
                          value={showTitle}
                          onChange={(e) => setShowTitle(e.target.value)}
                          className="w-full px-3.5 py-2 text-sm border border-gray-200 rounded-xl focus:outline-hidden focus:border-maroon-700"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Show Poster Image</label>
                        
                        <div className="space-y-3">
                          {!showPoster ? (
                            <div className="flex items-center justify-center w-full">
                              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-250 border-dashed rounded-2xl cursor-pointer bg-gray-50 hover:bg-gray-100/50 hover:border-maroon-800/40 transition-colors">
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                  <Plus className="w-6 h-6 text-gray-400 mb-1" />
                                  <p className="text-[11px] font-bold text-gray-500">Click or drag image here to upload from device</p>
                                  <p className="text-[9px] text-gray-450 mt-0.5">PNG, JPG, WEBP formats supported</p>
                                </div>
                                <input 
                                  type="file" 
                                  accept="image/*" 
                                  onChange={handleImageUpload} 
                                  className="hidden" 
                                />
                              </label>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between p-3 bg-maroon-50/50 border border-maroon-100 rounded-2xl">
                              <div className="flex items-center space-x-3">
                                <img src={showPoster} alt="Preview" className="w-12 h-16 object-cover rounded-lg border border-gray-100" />
                                <div className="text-xs">
                                  <span className="font-bold text-gray-800 block">Poster Image Selected</span>
                                  {uploadDimensions && (
                                    <span className="text-[10px] text-maroon-900 font-extrabold block">
                                      Size: {uploadDimensions.width} px (width) × {uploadDimensions.height} px (length/height)
                                    </span>
                                  )}
                                  <span className="text-[9px] text-gray-455 block mt-0.5 font-medium">
                                    Ideal size: 600 x 900 px (2:3 aspect ratio).
                                  </span>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  setShowPoster('');
                                  setUploadDimensions(null);
                                }}
                                className="p-2 bg-red-50 hover:bg-red-100 text-red-650 hover:text-red-700 rounded-xl transition-all border border-red-100 shadow-3xs"
                                title="Remove Poster Image"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Description / Synopsis</label>
                      <textarea 
                        required 
                        rows="2"
                        placeholder="Enter synopsis details, cast information..."
                        value={showDesc}
                        onChange={(e) => setShowDesc(e.target.value)}
                        className="w-full px-3.5 py-2 text-sm border border-gray-200 rounded-xl focus:outline-hidden focus:border-maroon-700"
                      ></textarea>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Date</label>
                        <input 
                          type="date" 
                          required 
                          value={showDate}
                          onChange={(e) => setShowDate(e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-hidden focus:border-maroon-700"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Time (24h)</label>
                        <input 
                          type="time" 
                          required 
                          value={showTime}
                          onChange={(e) => setShowTime(e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-hidden focus:border-maroon-700 text-center"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Auditorium Venue</label>
                        <input 
                          type="text" 
                          required 
                          value={showVenue}
                          onChange={(e) => setShowVenue(e.target.value)}
                          className="w-full px-3.5 py-2 text-sm border border-gray-200 rounded-xl focus:outline-hidden focus:border-maroon-700"
                        />
                      </div>
                    </div>

                    
                    <div className="space-y-4 pt-2">
                      <div className="grid grid-cols-1 gap-4">
                        <div>
                          <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Venue Full Address</label>
                          <input 
                            type="text" 
                            required 
                            placeholder="e.g. 1, Rajpath Club Rd, Vikram Nagar, Ahmedabad, Gujarat 380054"
                            value={showAddress}
                            onChange={(e) => setShowAddress(e.target.value)}
                            className="w-full px-3.5 py-2 text-sm border border-gray-200 rounded-xl focus:outline-hidden focus:border-maroon-700"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-gray-500 uppercase">Pin Venue on Map</label>
                        <span className="block text-[8px] text-gray-400 font-bold uppercase tracking-wider mb-2">Drag the marker or click on the map to set the exact coordinates of the play venue.</span>
                        <div className="w-full h-72">
                          <VenueMap 
                            lat={latitude} 
                            lng={longitude} 
                            isDraggable={true} 
                            onChange={(newLat, newLng) => {
                              setLatitude(newLat);
                              setLongitude(newLng);
                            }} 
                          />
                        </div>
                        <div className="flex space-x-4 text-[9px] font-mono font-bold text-gray-400 pt-1">
                          <span>Lat: {latitude.toFixed(6)}</span>
                          <span>Lng: {longitude.toFixed(6)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  
                  <div className="space-y-4 pt-4 border-t border-gray-100">
                    <h4 className="text-xs font-black uppercase tracking-wider text-saffron-600">2. Seating Categories & Prices</h4>
                    
                    
                    <div className="flex flex-wrap items-end gap-3 p-3 bg-gray-50 rounded-2xl border border-gray-100">
                      <div className="flex-1 min-w-[120px]">
                        <label className="block text-[8px] font-black text-gray-500 uppercase mb-1">Category Name</label>
                        <input 
                          type="text" 
                          placeholder="e.g. Platinum"
                          value={newCatName}
                          onChange={(e) => setNewCatName(e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs border border-gray-200 bg-white rounded-lg focus:outline-hidden"
                        />
                      </div>
                      <div className="w-24">
                        <label className="block text-[8px] font-black text-gray-500 uppercase mb-1">Price (₹)</label>
                        <input 
                          type="number" 
                          placeholder="650"
                          value={newCatPrice}
                          onChange={(e) => setNewCatPrice(e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs border border-gray-200 bg-white rounded-lg focus:outline-hidden text-center"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleAddCategory}
                        disabled={!newCatName || !newCatPrice}
                        className="px-4 py-1.5 bg-saffron-600 hover:bg-saffron-700 text-white font-extrabold text-xs rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shrink-0 h-[32px] flex items-center justify-center space-x-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add</span>
                      </button>
                    </div>

                    
                    <div className="flex flex-wrap gap-2">
                      {showCategories.map(cat => (
                        <div 
                          key={cat.name} 
                          className="flex items-center space-x-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-800 shadow-3xs"
                        >
                          <span className={`w-2 h-2 rounded-full ${
                            cat.name === 'VIP' ? 'bg-gold-500' : cat.name === 'Gold' ? 'bg-saffron-500' : 'bg-slate-400'
                          }`}></span>
                          <span>{cat.name}:</span>
                          <span className="text-maroon-900 font-extrabold">₹{cat.price}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveCategory(cat.name)}
                            className="p-0.5 text-gray-400 hover:text-red-500 rounded-md transition-colors"
                            title={`Remove ${cat.name} Category`}
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  
                  <div className="space-y-4 pt-4 border-t border-gray-100">
                    <h4 className="text-xs font-black uppercase tracking-wider text-saffron-600">3. Cast & Crew Artists</h4>
                    
                    
                    <div className="flex flex-wrap items-end gap-3 p-3 bg-gray-50 rounded-2xl border border-gray-100">
                      <div className="flex-1 min-w-[150px]">
                        <label className="block text-[8px] font-black text-gray-500 uppercase mb-1">Artist Name</label>
                        <input 
                          type="text" 
                          placeholder="e.g. Siddharth Randeria"
                          value={artistNameInput}
                          onChange={(e) => setArtistNameInput(e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs border border-gray-200 bg-white rounded-lg focus:outline-hidden font-bold"
                        />
                      </div>
                      <div className="flex-1 min-w-[120px]">
                        <label className="block text-[8px] font-black text-gray-500 uppercase mb-1">Artist Category/Role</label>
                        <input 
                          type="text" 
                          placeholder="e.g. Lead Actor, Director, Writer"
                          value={artistCategoryInput}
                          onChange={(e) => setArtistCategoryInput(e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs border border-gray-200 bg-white rounded-lg focus:outline-hidden font-bold"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          if (!artistNameInput.trim() || !artistCategoryInput.trim()) return;
                          setArtistsList([...artistsList, { name: artistNameInput.trim(), category: artistCategoryInput.trim() }]);
                          setArtistNameInput('');
                          setArtistCategoryInput('Actor');
                        }}
                        className="px-4 py-1.5 bg-saffron-650 hover:bg-saffron-700 text-white font-extrabold text-xs rounded-lg transition-all shrink-0 h-[32px] flex items-center justify-center"
                      >
                        Add Artist
                      </button>
                    </div>

                    
                    <div className="flex flex-wrap gap-2">
                      {artistsList.map((artist, idx) => (
                        <div 
                          key={idx} 
                          className="flex items-center space-x-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-800 shadow-3xs animate-fade-in"
                        >
                          <span className="text-[9px] text-gray-400 uppercase font-black">{artist.category}:</span>
                          <span className="text-maroon-900 font-extrabold">{artist.name}</span>
                          <button
                            type="button"
                            onClick={() => setArtistsList(artistsList.filter((_, i) => i !== idx))}
                            className="p-0.5 text-gray-400 hover:text-red-500 rounded-md transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                      {artistsList.length === 0 && (
                        <span className="text-[10px] text-gray-400 font-semibold italic">No custom cast or crew configured for this show.</span>
                      )}
                    </div>
                  </div>

                  
                  <div className="space-y-4 pt-4 border-t border-gray-100">
                    <h4 className="text-xs font-black uppercase tracking-wider text-saffron-600">4. Custom Seating Layout configuration</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                      
                      <div className="space-y-3">
                        <span className="block text-[10px] text-gray-400 font-bold uppercase tracking-wider">Configure Seating Rows</span>
                        <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                          {builderRows.map((row, idx) => (
                            <div 
                              key={idx}
                              className="flex items-center space-x-2 p-2 bg-gray-50 border border-gray-150 rounded-xl"
                            >
                              <span className="w-6 text-sm font-black text-gray-800 text-center">{row.rowName}</span>
                              
                              <div className="flex-grow grid grid-cols-2 gap-2">
                                <div className="flex items-center bg-white border border-gray-200 rounded-lg px-2 py-1">
                                  <span className="text-[9px] text-gray-450 font-bold mr-1 shrink-0">Seats:</span>
                                  <input 
                                    type="number" 
                                    min="1"
                                    max="25"
                                    value={row.seatsCount}
                                    onChange={(e) => handleBuilderRowChange(idx, 'seatsCount', e.target.value)}
                                    className="w-full text-xs font-bold focus:outline-hidden text-center bg-transparent"
                                  />
                                </div>
                                
                                <select
                                  value={row.category}
                                  onChange={(e) => handleBuilderRowChange(idx, 'category', e.target.value)}
                                  className="px-2 py-1 text-xs border border-gray-200 bg-white rounded-lg focus:outline-hidden font-bold"
                                >
                                  {showCategories.map(cat => (
                                    <option key={cat.name} value={cat.name}>{cat.name}</option>
                                  ))}
                                </select>
                              </div>

                              {builderRows.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveBuilderRow(idx)}
                                  className="p-1.5 text-red-500 hover:bg-red-50 border border-transparent hover:border-red-100 rounded-lg transition-colors shrink-0"
                                  title="Delete Row"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>

                        <button
                          type="button"
                          onClick={handleAddBuilderRow}
                          className="w-full py-2 border border-dashed border-gray-300 hover:border-maroon-700 rounded-xl text-xs font-bold text-gray-500 hover:text-maroon-800 transition-colors flex items-center justify-center space-x-1.5"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Append Seating Row</span>
                        </button>
                      </div>

                      
                      <div className="bg-gray-50 border border-gray-150 rounded-2xl p-4 flex flex-col items-center">
                        <span className="block text-[10px] text-gray-400 font-bold uppercase tracking-wider w-full text-left mb-4">Real-Time Layout Preview</span>
                        
                        
                        <div className="w-full max-w-[200px] mb-8 text-center">
                          <div className="w-full h-5 bg-gradient-to-b from-maroon-900 to-maroon-950 rounded-b-xl shadow-xs border-b border-saffron-500 flex items-center justify-center">
                            <span className="text-[7px] font-black tracking-widest text-saffron-400 uppercase">Stage</span>
                          </div>
                        </div>

                        
                        <div className="w-full space-y-2 overflow-x-auto pb-2 text-center">
                          <div className="min-w-[200px] flex flex-col space-y-1.5">
                            {builderRows.map((row, idx) => {
                              let seatColor = 'bg-slate-400 border-slate-500 text-white';
                              
                              if (row.category === 'VIP') seatColor = 'bg-gold-500 border-gold-600 text-white';
                              if (row.category === 'Gold') seatColor = 'bg-saffron-500 border-saffron-600 text-white';

                              return (
                                <div key={idx} className="flex items-center justify-center space-x-2">
                                  <span className="text-[10px] font-black text-gray-800 w-4 shrink-0">{row.rowName}</span>
                                  <div className="flex items-center space-x-0.5 justify-center">
                                    {Array.from({ length: Math.min(row.seatsCount, 15) }, (_, seatIndex) => (
                                      <span 
                                        key={seatIndex} 
                                        className={`w-2.5 h-2.5 rounded-xs border-[0.5px] text-[4px] font-black flex items-center justify-center shrink-0 shadow-3xs ${seatColor}`}
                                      ></span>
                                    ))}
                                    {row.seatsCount > 15 && <span className="text-[8px] text-gray-400 font-bold pl-0.5">+{row.seatsCount - 15}</span>}
                                  </div>
                                  <span className="text-[10px] font-black text-gray-800 w-4 text-right shrink-0">{row.rowName}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        <div className="mt-4 border-t border-gray-200 pt-2 w-full flex justify-center gap-3 text-[8px] font-bold text-gray-400">
                          <div className="flex items-center space-x-1">
                            <span className="w-2.5 h-2.5 bg-gold-500 rounded-sm"></span>
                            <span>VIP</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <span className="w-2.5 h-2.5 bg-saffron-500 rounded-sm"></span>
                            <span>Gold</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <span className="w-2.5 h-2.5 bg-slate-400 rounded-sm"></span>
                            <span>Silver/Other</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    {editingShowId && (
                      <button 
                        type="button"
                        onClick={handleCancelEditShow}
                        className="w-full sm:w-1/3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-extrabold py-3.5 rounded-xl transition-all text-sm flex items-center justify-center border border-gray-200"
                      >
                        Cancel Edit
                      </button>
                    )}
                    <button 
                      type="submit"
                      className={`flex-grow bg-gradient-to-r ${
                        editingShowId 
                          ? 'from-blue-650 to-blue-600 hover:from-blue-700 hover:to-blue-650' 
                          : 'from-saffron-600 to-saffron-500 hover:from-saffron-700 hover:to-saffron-600'
                      } text-white font-extrabold py-3.5 rounded-xl shadow-xs hover:shadow-md transition-all duration-200 text-sm flex items-center justify-center space-x-1.5`}
                    >
                      {editingShowId ? <Edit3 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                      <span>{editingShowId ? 'Update Show Seating & Details' : 'Create Drama Show & Seating Layout'}</span>
                    </button>
                  </div>
                </form>
              </div>

              
              <div className="xl:col-span-1 bg-white border border-gray-100 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
                <h3 className="text-lg font-black text-maroon-900 border-b border-gray-50 pb-2">Registered Plays</h3>

                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
                  {shows.map(show => (
                    <div 
                      key={show._id}
                      className="flex justify-between items-center p-3.5 border border-gray-100 rounded-2xl hover:bg-gray-50/50 transition-colors gap-3"
                    >
                      <div className="flex items-start space-x-3 truncate">
                        <img src={show.poster} alt="" className="w-10 h-14 object-cover rounded-lg border border-gray-100 shrink-0" />
                        <div className="truncate space-y-0.5">
                          <span className="text-xs font-bold text-gray-900 block truncate">{show.title}</span>
                          <div className="flex items-center space-x-0.5 text-[9px] text-gray-500">
                            <MapPin className="w-3 h-3 text-saffron-600 shrink-0" />
                            <span className="truncate">{show.venue.split(',')[0]}</span>
                          </div>
                          <span className="text-[9px] text-gray-400 font-bold block">{show.date} • {show.time}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right">
                          <span className="text-[8px] text-gray-400 font-bold block">Bookings</span>
                          <span className="text-[10px] font-black text-maroon-900">
                            {show.bookedSeats ? show.bookedSeats.length : 0} booked
                          </span>
                        </div>

                        <button 
                          onClick={() => handleStartEditShow(show)}
                          className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-650 hover:text-blue-705 rounded-lg transition-colors border border-blue-150"
                          title="Edit Drama Show"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        <button 
                          onClick={() => handleDeleteShow(show._id, show.title)}
                          className="p-1.5 bg-red-50 hover:bg-red-100 text-red-650 hover:text-red-700 rounded-lg transition-colors border border-red-100"
                          title="Delete Drama Show"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {shows.length === 0 && (
                    <p className="text-xs text-gray-400 font-medium text-center py-6">No shows registered yet.</p>
                  )}
                </div>
              </div>

            </div>
          )}

          
          {activeTab === 'bookings' && (
            <div className="space-y-6">
              {!selectedBookingShowId ? (
                
                <div className="bg-white border border-gray-100 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
                  <div>
                    <h3 className="text-lg font-black text-maroon-900">Show-Wise Bookings & Sales Ledger</h3>
                    <p className="text-xs text-gray-500 font-medium">Select a show to manage reservations, track capacity utilization, and process refunds.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
                    {shows.map(show => {
                      const totalHallSeats = show.layout.reduce((sum, r) => sum + r.seatsCount, 0);
                      const bookedCount = show.bookedSeats ? show.bookedSeats.length : 0;
                      const percentage = totalHallSeats > 0 ? Math.round((bookedCount / totalHallSeats) * 100) : 0;
                      const showBookings = bookings.filter(b => b.show && b.show._id === show._id);
                      const confirmedBookingsCount = showBookings.filter(b => b.bookingStatus === 'confirmed').length;
                      const revenue = showBookings.filter(b => b.bookingStatus === 'confirmed').reduce((sum, b) => sum + b.totalAmount, 0);

                      return (
                        <div 
                          key={show._id} 
                          onClick={() => { setSelectedBookingShowId(show._id); setBookingSearch(''); }}
                          className="border border-gray-150 rounded-2xl p-4 flex gap-4 hover:border-maroon-700/40 hover:shadow-md transition-all cursor-pointer group bg-gray-50/50"
                        >
                          <img 
                            src={show.poster} 
                            alt={show.title} 
                            className="w-16 h-24 object-cover rounded-lg border border-gray-200 shrink-0" 
                          />
                          <div className="flex-1 min-w-0 flex flex-col justify-between">
                            <div>
                              <h4 className="text-xs font-black text-gray-900 group-hover:text-maroon-800 transition-colors truncate" title={show.title}>
                                {show.title}
                              </h4>
                              <p className="text-[9px] text-gray-500 font-medium truncate mt-0.5">{show.venue.split(',')[0]}</p>
                              <p className="text-[9px] text-saffron-650 font-bold mt-0.5">{show.date} • {show.time}</p>
                            </div>
                            
                            <div className="border-t border-gray-200/60 pt-1.5 space-y-1 text-[9px] font-bold text-gray-650">
                              <div className="flex justify-between">
                                <span>Orders:</span>
                                <span className="text-gray-900">{confirmedBookingsCount} confirmed</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Seats Filled:</span>
                                <span className="text-gray-900">{bookedCount}/{totalHallSeats} ({percentage}%)</span>
                              </div>
                              <div className="flex justify-between items-center text-maroon-900">
                                <span>Sales Revenue:</span>
                                <span className="text-xs font-black text-saffron-700">₹{revenue.toLocaleString('en-IN')}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    
                    {bookings.some(b => !b.show) && (
                      <div 
                        onClick={() => { setSelectedBookingShowId('deleted'); setBookingSearch(''); }}
                        className="border border-gray-250 border-dashed rounded-2xl p-4 flex gap-4 hover:border-red-700/40 hover:shadow-md transition-all cursor-pointer group bg-red-50/10"
                      >
                        <div className="w-16 h-24 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-400 shrink-0">
                          <Trash2 className="w-6 h-6" />
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col justify-between">
                          <div>
                            <h4 className="text-xs font-black text-gray-900 group-hover:text-red-700 transition-colors truncate">
                              Archived & Deleted Shows
                            </h4>
                            <p className="text-[9px] text-gray-500 font-medium mt-0.5">Bookings from deleted plays</p>
                          </div>
                          
                          <div className="border-t border-gray-200/60 pt-1.5 space-y-1 text-[9px] font-bold text-gray-650">
                            <div className="flex justify-between">
                              <span>Orders:</span>
                              <span className="text-gray-900">
                                {bookings.filter(b => !b.show && b.bookingStatus === 'confirmed').length} confirmed
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Tickets:</span>
                              <span className="text-gray-900">
                                {bookings.filter(b => !b.show && b.bookingStatus === 'confirmed').reduce((sum, b) => sum + b.seats.length, 0)} spots
                              </span>
                            </div>
                            <div className="flex justify-between items-center text-red-950">
                              <span>Sales Revenue:</span>
                              <span className="text-xs font-black text-red-700">
                                ₹{bookings.filter(b => !b.show && b.bookingStatus === 'confirmed').reduce((sum, b) => sum + b.totalAmount, 0).toLocaleString('en-IN')}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                
                <div className="bg-white border border-gray-100 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
                  
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-50 pb-4 gap-4">
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => setSelectedBookingShowId(null)}
                        className="flex items-center space-x-1.5 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-600 hover:text-gray-900 rounded-xl text-xs font-bold transition-all border border-gray-200"
                      >
                        <span>&larr; Back to Shows</span>
                      </button>
                      <div>
                        <h3 className="text-base font-black text-maroon-900">
                          {selectedBookingShowId === 'deleted' ? 'Archived Bookings Ledger' : 'Show-Wise Bookings Details'}
                        </h3>
                        <p className="text-[10px] text-gray-500 font-medium">
                          {selectedBookingShowId === 'deleted' ? 'Manage bookings for deleted plays.' : 'View specific bookings log for this play.'}
                        </p>
                      </div>
                    </div>

                    
                    <div className="relative w-full sm:w-64">
                      <input 
                        type="text" 
                        placeholder="Search ID, name, email..."
                        value={bookingSearch}
                        onChange={(e) => setBookingSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-hidden focus:border-maroon-700 text-xs"
                      />
                      <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
                    </div>
                  </div>

                  
                  {selectedShowStats && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-5 bg-maroon-900/5 border border-maroon-900/10 rounded-2xl items-center animate-fade-in">
                      <div>
                        <span className="block text-[9px] text-gray-450 font-bold uppercase tracking-wider">Show Name</span>
                        <span className="text-xs font-black text-maroon-950 truncate block max-w-[200px]" title={selectedShowStats.title}>
                          {selectedShowStats.title}
                        </span>
                      </div>
                      <div>
                        <span className="block text-[9px] text-gray-450 font-bold uppercase tracking-wider">Tickets Booked</span>
                        <span className="text-sm font-black text-maroon-950">
                          {selectedBookingShowId === 'deleted' ? `${selectedShowStats.bookedSeats} spots` : `${selectedShowStats.bookedSeats} / ${selectedShowStats.capacity} Seats (${selectedShowStats.percentage}%)`}
                        </span>
                      </div>
                      <div>
                        <span className="block text-[9px] text-gray-450 font-bold uppercase tracking-wider">Show Bookings</span>
                        <span className="text-sm font-black text-maroon-950">{selectedShowStats.bookingsCount} orders</span>
                      </div>
                      <div>
                        <span className="block text-[9px] text-gray-450 font-bold uppercase tracking-wider font-bold">Total Sales Revenue</span>
                        <span className="text-base font-black text-saffron-700">₹{selectedShowStats.revenue.toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  )}

                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-gray-100 text-gray-400 font-bold uppercase">
                          <th className="py-3 px-4">Booking ID</th>
                          <th className="py-3 px-4">Customer Details</th>
                          <th className="py-3 px-4">Drama Play</th>
                          <th className="py-3 px-4 text-center">Seat Spot(s)</th>
                          <th className="py-3 px-4 text-right">Revenue</th>
                          <th className="py-3 px-4 text-center">Status</th>
                          <th className="py-3 px-4 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 font-medium text-gray-700">
                        {filteredBookings.map(b => (
                          <tr key={b._id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="py-4 px-4 font-mono font-black text-saffron-600">{b.bookingId}</td>
                            <td className="py-4 px-4">
                              <span className="font-bold text-gray-900 block">{b.customerDetails.name}</span>
                              <span className="text-[10px] text-gray-500 block">{b.customerDetails.email}</span>
                              <span className="text-[10px] text-gray-400 block">{b.customerDetails.phone}</span>
                            </td>
                            <td className="py-4 px-4 font-bold text-gray-900">
                              {b.show ? b.show.title : <span className="text-gray-400 font-normal">Show Deleted</span>}
                              {b.show && <span className="text-[10px] text-gray-450 font-bold block">{b.show.date}</span>}
                            </td>
                            <td className="py-4 px-4 text-center">
                              <span className="font-black text-gray-800 bg-gray-100 px-2.5 py-1 rounded-md border border-gray-200/50">
                                {b.seats.join(', ')}
                              </span>
                            </td>
                            <td className="py-4 px-4 text-right font-black text-gray-950">₹{b.totalAmount}</td>
                            <td className="py-4 px-4 text-center">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold border uppercase ${
                                b.bookingStatus === 'confirmed'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-250'
                                  : 'bg-red-50 text-red-650 border-red-200'
                              }`}>
                                {b.bookingStatus}
                              </span>
                            </td>
                            <td className="py-4 px-4 text-center">
                              {b.bookingStatus === 'confirmed' ? (
                                <button
                                  onClick={() => handleCancelBooking(b._id, b.bookingId)}
                                  className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-650 hover:text-red-700 rounded-lg transition-colors font-bold border border-red-150"
                                >
                                  Cancel
                                </button>
                              ) : (
                                <span className="text-gray-400 italic">Released</span>
                              )}
                            </td>
                          </tr>
                        ))}
                        {filteredBookings.length === 0 && (
                          <tr>
                            <td colSpan="7" className="text-center py-10 text-gray-450 font-bold">
                              No reservation logs found matching queries.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      )}

      
      {showSuccessOverlay && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/75 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl p-8 flex flex-col items-center text-center space-y-4 max-w-sm mx-4 shadow-2xl border border-gray-150 animate-scale-up">
            <svg className="checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
              <circle className="checkmark-circle" cx="26" cy="26" r="25" fill="none"/>
              <path className="checkmark-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
            </svg>
            <h3 className="text-lg font-black text-maroon-900 leading-tight">Success Acknowledgement</h3>
            <p className="text-xs text-gray-500 font-bold leading-relaxed">{successOverlayMessage}</p>
          </div>
        </div>
      )}
    </div>
  );
}
