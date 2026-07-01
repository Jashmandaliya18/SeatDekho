import React, { useState } from 'react';
import { ArrowLeft, User, Mail, Phone, Ticket, ShieldCheck, HelpCircle, MapPin } from 'lucide-react';
import MockPaymentModal from '../components/MockPaymentModal';
import { api } from '../services/api';

export default function CheckoutPage({ show, selectedSeats, totalAmount, user, onBack, onBookingSuccess }) {
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState('');
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [error, setError] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [pendingBooking, setPendingBooking] = useState(null);
  const [razorpayOrder, setRazorpayOrder] = useState(null);

  if (!show || !selectedSeats.length) return null;

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) return setError('Please enter your full name.');
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) return setError('Please enter a valid email address.');
    if (!phone.trim() || phone.replace(/[^\d]/g, '').length < 10) {
      return setError('Please enter a valid 10-digit contact number.');
    }

    setSubmitLoading(true);
    try {
      const payload = {
        showId: show._id,
        customerDetails: {
          name,
          email,
          phone: phone.replace(/[^\d]/g, '')
        },
        seats: selectedSeats,
        totalAmount,
        userId: user?.id || null
      };

      const bookingData = await api.post('/bookings', payload);
      setPendingBooking(bookingData);
      setSubmitLoading(false);
      setIsPaymentOpen(true);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to initialize checkout. Please try choosing other seats.');
      setSubmitLoading(false);
    }
  };

  const handlePaymentSuccess = (confirmedBooking) => {
    setIsPaymentOpen(false);
    onBookingSuccess(confirmedBooking);
  };

  const handlePaymentClose = async () => {
    setIsPaymentOpen(false);
    if (pendingBooking) {
      try {
        await api.post(`/bookings/${pendingBooking._id}/unlock`);
      } catch (err) {
        console.error('Failed to release seats on cancel:', err);
      } finally {
        setPendingBooking(null);
      }
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 pb-20">
      
      <button 
        onClick={onBack}
        className="inline-flex items-center space-x-2 text-sm font-bold text-gray-500 hover:text-maroon-850 transition-colors bg-white px-3.5 py-2 rounded-xl shadow-xs border border-gray-100"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Seating</span>
      </button>

      {error && (
        <div className="p-4 bg-red-50 border border-red-100 text-red-700 text-sm font-semibold rounded-2xl animate-fade-in">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
        
        
        <div className="md:col-span-2 bg-white border border-gray-100 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
          <div>
            <h2 className="text-lg font-black text-maroon-900 border-b border-gray-50 pb-2">Customer Details</h2>
            <p className="text-xs text-gray-500 font-medium mt-1">Please fill in your billing details. Tickets will be sent to this email/phone.</p>
          </div>

          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Full Name</label>
              <div className="relative">
                <input 
                  type="text" 
                  required
                  placeholder="Please enter your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-hidden focus:border-maroon-700"
                />
                <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Email Address</label>
                <div className="relative">
                  <input 
                    type="email" 
                    required
                    placeholder="Please enter your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-hidden focus:border-maroon-700"
                  />
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Mobile Number</label>
                <div className="relative">
                  <input 
                    type="tel" 
                    required
                    placeholder="Please enter mobile number"
                    maxLength="14"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-hidden focus:border-maroon-700"
                  />
                  <Phone className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-50 flex items-center space-x-2 text-xs text-gray-500">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>We value privacy. Your contact details are stored securely for reservation check-ins.</span>
            </div>

            <button 
              type="submit"
              disabled={submitLoading}
              className="w-full bg-gradient-to-r from-saffron-600 to-saffron-500 hover:from-saffron-700 hover:to-saffron-600 text-white font-extrabold py-3.5 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 text-sm flex items-center justify-center space-x-2"
            >
              <span>{submitLoading ? 'Reserving...' : 'Proceed to payment'}</span>
            </button>
          </form>
        </div>

        
        <div className="space-y-6">
          <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-xs space-y-6">
            <div>
              <h3 className="text-base font-black text-maroon-900 border-b border-gray-50 pb-2">Ticket Summary</h3>
              <p className="text-[10px] text-gray-400 font-bold tracking-wider uppercase mt-1">{show.title}</p>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs font-bold text-gray-600 border-b border-gray-50 pb-2">
                <span className="flex items-center space-x-1">
                  <MapPin className="w-4 h-4 text-maroon-800" />
                  <span>Venue</span>
                </span>
                <span className="text-gray-800 break-words max-w-[150px] text-right">{show.venue}</span>
              </div>
              <div className="flex justify-between items-center text-xs font-bold text-gray-600 border-b border-gray-50 pb-2">
                <span className="flex items-center space-x-1">
                  <Ticket className="w-4 h-4 text-maroon-800" />
                  <span>Ticket Seats</span>
                </span>
                <span className="text-gray-800 break-words max-w-[120px] text-right">{selectedSeats.join(', ')}</span>
              </div>
              <div className="flex justify-between items-center text-xs font-bold text-gray-600 border-b border-gray-50 pb-2">
                <span>Quantity</span>
                <span className="text-gray-800">{selectedSeats.length} seat(s)</span>
              </div>
              <div className="flex justify-between items-center text-xs font-bold text-gray-600 border-b border-gray-50 pb-2">
                <span>Internet Fee (Mock)</span>
                <span className="text-emerald-600 font-bold">FREE</span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="text-sm font-bold text-gray-850">Total Amount</span>
                <span className="text-xl font-black text-maroon-900">₹{totalAmount.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 border border-gray-150 rounded-3xl p-5 flex items-start space-x-3 text-xs text-gray-550">
            <HelpCircle className="w-5 h-5 text-maroon-800 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-gray-800 block mb-1">Need help with booking?</span>
              <p className="font-medium leading-relaxed">Reach out to our customer helpline at +91 79 2658 8900 during standard box office operating hours.</p>
            </div>
          </div>
        </div>

      </div>

      
      <MockPaymentModal 
        isOpen={isPaymentOpen}
        onClose={handlePaymentClose}
        booking={pendingBooking}
        onSuccess={handlePaymentSuccess}
      />
    </div>
  );
}
