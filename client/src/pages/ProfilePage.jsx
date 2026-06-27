import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Shield, Key, Calendar, MapPin, Ticket, ShieldCheck, Edit3, Save, X, Loader2 } from 'lucide-react';
import { api } from '../services/api';

export default function ProfilePage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    fetchProfileAndBookings();
  }, []);

  const fetchProfileAndBookings = async () => {
    setLoading(true);
    setError('');
    try {
      const userProfile = await api.get('/auth/me');
      setProfile(userProfile);
      setName(userProfile.name);
      setEmail(userProfile.email);

      
      try {
        const bookingsList = await api.get('/bookings/my-bookings');
        setBookings(bookingsList);
      } catch (err) {
        console.warn('Could not fetch user bookings list:', err.message);
      }
    } catch (err) {
      console.error(err);
      setError('Session expired or failed to load profile data.');
      
      setTimeout(() => navigate('/'), 2000);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password && password !== confirmPassword) {
      return setError('Passwords do not match.');
    }

    setUpdating(true);
    try {
      const payload = { name, email };
      if (password) payload.password = password;

      const updated = await api.put('/auth/profile', payload);
      setProfile(updated);
      setSuccess('Profile updated successfully!');
      setIsEditing(false);
      setPassword('');
      setConfirmPassword('');
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.message || 'Failed to update profile.');
    } finally {
      setUpdating(false);
    }
  };

  
  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className="text-center py-20 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 text-maroon-800 animate-spin" />
        <p className="text-sm font-semibold text-gray-500">Loading your profile dashboard...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 pb-24">
      
      <div className="border-b border-gray-100 pb-4">
        <h1 className="text-2xl sm:text-3xl font-black text-maroon-900 tracking-tight">My Profile Dashboard</h1>
        <p className="text-xs text-gray-500 font-medium">Manage your personal settings, passwords, and track tickets bookings history.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        <div className="lg:col-span-1 bg-white border border-gray-100 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex flex-col items-center text-center space-y-3 pb-6 border-b border-gray-50">
            <div className="w-20 h-20 bg-gradient-to-tr from-maroon-800 to-saffron-500 rounded-full flex items-center justify-center text-white font-black text-3xl shadow-md border-4 border-white">
              {profile?.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 leading-tight">{profile?.name}</h2>
              <p className="text-xs text-gray-500 font-medium">{profile?.email}</p>
            </div>
            <span className="inline-flex items-center space-x-1.5 px-3 py-1 bg-maroon-50 text-maroon-800 text-[10px] font-black rounded-full uppercase tracking-wider border border-maroon-100">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{profile?.role} Account</span>
            </span>
          </div>

          
          {error && (
            <div className="p-3 bg-red-50 border border-red-100 text-red-700 text-xs font-semibold rounded-xl">
              {error}
            </div>
          )}
          {success && (
            <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs font-semibold rounded-xl">
              {success}
            </div>
          )}

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Full Name</label>
              <div className="relative">
                <input 
                  type="text" 
                  required
                  disabled={!isEditing}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-hidden focus:border-maroon-700 text-sm disabled:bg-gray-50 disabled:text-gray-500"
                />
                <User className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Email Address</label>
              <div className="relative">
                <input 
                  type="email" 
                  required
                  disabled={!isEditing}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-hidden focus:border-maroon-700 text-sm disabled:bg-gray-50 disabled:text-gray-500"
                />
                <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              </div>
            </div>

            {isEditing && (
              <>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">New Password (optional)</label>
                  <div className="relative">
                    <input 
                      type="password" 
                      placeholder="Enter new password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-hidden focus:border-maroon-700 text-sm"
                    />
                    <Key className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Confirm New Password</label>
                  <div className="relative">
                    <input 
                      type="password" 
                      placeholder="Confirm new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-hidden focus:border-maroon-700 text-sm"
                    />
                    <Key className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                  </div>
                </div>
              </>
            )}

            {isEditing ? (
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={updating}
                  className="flex-1 bg-gradient-to-r from-maroon-800 to-maroon-700 hover:from-maroon-900 hover:to-maroon-800 text-white font-extrabold py-2.5 rounded-xl shadow-xs text-xs flex items-center justify-center space-x-1.5"
                >
                  {updating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  <span>Save Changes</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setIsEditing(false); setName(profile.name); setEmail(profile.email); }}
                  className="px-3 border border-gray-200 hover:bg-gray-50 rounded-xl text-gray-500 text-xs flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="w-full py-2.5 border border-maroon-850 hover:bg-maroon-50 rounded-xl text-xs font-black text-maroon-900 transition-colors flex items-center justify-center space-x-1.5"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Profile Settings</span>
              </button>
            )}
          </form>
        </div>

        
        <div className="lg:col-span-2 bg-white border border-gray-100 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
          <h3 className="text-lg font-black text-maroon-900 border-b border-gray-50 pb-2">My Ticket Bookings History</h3>

          {bookings.length === 0 ? (
            <div className="text-center py-16 space-y-3">
              <Ticket className="w-12 h-12 text-gray-300 mx-auto" />
              <h4 className="text-sm font-bold text-gray-700">No tickets booked yet</h4>
              <p className="text-xs text-gray-400 font-medium max-w-sm mx-auto">Explore upcoming dramas on the homepage and visual book your seats to find your tickets here!</p>
              <button 
                onClick={() => navigate('/')}
                className="px-5 py-2.5 bg-gradient-to-r from-saffron-500 to-saffron-600 hover:from-saffron-600 hover:to-saffron-700 text-white text-xs font-extrabold rounded-xl shadow-xs"
              >
                Browse Drama Shows
              </button>
            </div>
          ) : (
            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
              {bookings.map(booking => (
                <div 
                  key={booking._id} 
                  className="border border-gray-100 rounded-2xl p-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between hover:bg-gray-50/50 transition-colors"
                >
                  <div className="flex items-start space-x-4 truncate">
                    {booking.show?.poster ? (
                      <img src={booking.show.poster} alt="" className="w-14 h-20 object-cover rounded-lg border border-gray-150 shrink-0 shadow-3xs" />
                    ) : (
                      <div className="w-14 h-20 bg-gray-100 rounded-lg flex items-center justify-center shrink-0 border border-gray-200">
                        <Ticket className="w-5 h-5 text-gray-400" />
                      </div>
                    )}
                    <div className="truncate space-y-1">
                      <h4 className="text-sm font-bold text-gray-900 truncate block">
                        {booking.show ? booking.show.title : <span className="text-gray-400 italic">Deleted Show</span>}
                      </h4>
                      {booking.show && (
                        <div className="flex items-center space-x-1 text-[10px] text-gray-500 font-medium">
                          <MapPin className="w-3.5 h-3.5 text-saffron-600 shrink-0" />
                          <span className="truncate">{booking.show.venue.split(',')[0]}</span>
                        </div>
                      )}
                      <div className="flex items-center space-x-1 text-[10px] text-gray-400 font-medium">
                        <Calendar className="w-3.5 h-3.5 shrink-0" />
                        <span>{booking.show ? formatDate(booking.show.date) : ''} • {booking.show?.time}</span>
                      </div>
                      <div className="flex items-center space-x-1 pt-1">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Seats:</span>
                        <span className="text-[10px] font-black text-gray-800 bg-gray-100 border border-gray-200/50 px-1.5 py-0.5 rounded-sm">
                          {booking.seats.join(', ')}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex sm:flex-col justify-between sm:items-end w-full sm:w-auto border-t sm:border-t-0 pt-3 sm:pt-0 gap-3">
                    <div className="text-left sm:text-right">
                      <span className="block text-[8px] text-gray-400 font-bold uppercase tracking-wider">Booking ID: <strong className="text-saffron-600 font-mono text-[10px] font-black">{booking.bookingId}</strong></span>
                      <span className="text-base font-black text-maroon-900">₹{booking.totalAmount}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-extrabold border uppercase ${
                        booking.bookingStatus === 'confirmed'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-250'
                          : 'bg-red-50 text-red-650 border-red-200'
                      }`}>
                        {booking.bookingStatus}
                      </span>
                      {booking.bookingStatus === 'confirmed' && (
                        <button
                          onClick={() => navigate(`/ticket/${booking.bookingId}`, { state: { booking } })}
                          className="px-3 py-1.5 bg-maroon-800 hover:bg-maroon-900 text-white text-[10px] font-black rounded-lg transition-colors shadow-3xs"
                        >
                          View Ticket
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
