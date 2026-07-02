import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle2, Download, Calendar, Clock, MapPin, QrCode, Home, Award, AlertCircle, XCircle } from 'lucide-react';
import { api } from '../services/api';

export default function TicketPage({ booking: initialBooking, onGoHome }) {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const stateBooking = location.state?.booking;
  const [booking, setBooking] = useState(initialBooking || stateBooking || null);
  const [loading, setLoading] = useState(!booking);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (!booking) {
      const fetchBooking = async () => {
        try {
          const data = await api.get(`/bookings/ticket/${id}`);
          setBooking(data);
        } catch (err) {
          console.error(err);
        } finally {
          setLoading(false);
        }
      };
      fetchBooking();
    }
  }, [id, booking]);



  if (loading || !booking) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-10 h-10 border-4 border-maroon-100 border-t-maroon-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  const show = booking.show;

  
  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  };

  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    const card = document.getElementById('ticket-receipt-card');
    if (!card) return;
    setDownloading(true);
    try {
      const { toPng } = await import('html-to-image');
      const { jsPDF } = await import('jspdf');

      const width = card.offsetWidth;
      const height = card.offsetHeight;

      const dataUrl = await toPng(card, {
        pixelRatio: 2,
        cacheBust: true
      });

      const pdf = new jsPDF({
        orientation: width > height ? 'l' : 'p',
        unit: 'px',
        format: [width, height]
      });

      pdf.addImage(dataUrl, 'PNG', 0, 0, width, height);
      pdf.save(`ticket-${booking.bookingId}.pdf`);

      if (window.showToast) {
        window.showToast('Ticket PDF downloaded successfully!', 'success');
      }
    } catch (err) {
      console.error('Failed to download ticket PDF:', err);
      if (window.showToast) {
        window.showToast('Failed to download ticket PDF.', 'error');
      } else {
        alert('Failed to download ticket PDF.');
      }
    } finally {
      setDownloading(false);
    }
  };

  const fromProfile = location.state?.from === 'profile';

  const handleBack = () => {
    if (fromProfile) {
      navigate('/profile');
    } else {
      onGoHome();
    }
  };

  const isCancellationAllowed = () => {
    if (!show) return false;
    const showDateTime = new Date(`${show.date}T${show.time}`);
    const now = new Date();
    const hoursDiff = (showDateTime - now) / (1000 * 60 * 60);
    return hoursDiff >= 6;
  };

  const handleRequestCancellation = async () => {
    if (!window.confirm("Are you sure you want to cancel this ticket booking? The admin will review and process your refund.")) {
      return;
    }
    setCancelling(true);
    try {
      const result = await api.post(`/bookings/${booking._id}/cancel`);
      setBooking(result.booking || result);
      if (window.showToast) {
        window.showToast('Cancellation request submitted successfully!', 'success');
      } else {
        alert('Cancellation request submitted successfully!');
      }
    } catch (err) {
      console.error(err);
      const errMsg = err.message || 'Failed to submit cancellation request.';
      if (window.showToast) {
        window.showToast(errMsg, 'error');
      } else {
        alert(errMsg);
      }
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-8 pb-20 animate-fade-in print:bg-white print:p-0">
      
      
      <div className="text-center space-y-3 print:hidden">
        {booking.bookingStatus === 'cancellation_requested' ? (
          <>
            <div className="inline-flex p-3 bg-amber-50 text-amber-600 rounded-full border border-amber-100 shadow-xs">
              <AlertCircle className="w-10 h-10" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-amber-900 tracking-tight">Cancellation Requested</h1>
            <p className="text-xs text-gray-500 font-medium max-w-md mx-auto">
              Your cancellation request is pending administrator review. Once approved, your refund will be processed back to your original payment method.
            </p>
          </>
        ) : booking.bookingStatus === 'cancelled' || booking.bookingStatus === 'cancelled_refunded' ? (
          <>
            <div className="inline-flex p-3 bg-red-50 text-red-650 rounded-full border border-red-100 shadow-xs">
              <XCircle className="w-10 h-10" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-red-900 tracking-tight">Booking Cancelled</h1>
            <p className="text-xs text-gray-500 font-medium max-w-md mx-auto">
              This ticket has been cancelled. If any payment was captured, the refund has been initiated or completed.
            </p>
          </>
        ) : (
          <>
            <div className="inline-flex p-3 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100 shadow-xs">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-maroon-900 tracking-tight">Booking Confirmed!</h1>
            <p className="text-xs text-gray-500 font-medium max-w-md mx-auto">
              Congratulations! Your seats have been successfully reserved. We have sent a copy of this ticket to <span className="font-bold text-gray-700">{booking.customerDetails.email}</span>.
            </p>
          </>
        )}
      </div>

      
      <div id="ticket-receipt-card" className="relative bg-white border border-gray-200 rounded-3xl shadow-lg overflow-hidden flex flex-col md:flex-row print:shadow-none print:border print:rounded-2xl">
        
        
        <div className="flex-1 p-6 sm:p-8 space-y-6">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[10px] bg-maroon-50 text-maroon-800 font-black tracking-widest px-2.5 py-0.5 rounded-full uppercase border border-maroon-100">
                Official Entry Ticket
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-maroon-900 leading-tight">
                {show.title}
              </h2>
            </div>
            <div className="text-right">
              <span className="block text-[8px] text-gray-400 font-bold uppercase tracking-wider">Booking ID</span>
              <span className="text-sm font-black text-saffron-600 font-mono bg-saffron-50 px-2 py-0.5 rounded-md border border-saffron-100">
                {booking.bookingId}
              </span>
            </div>
          </div>

          
          <div className="grid grid-cols-2 gap-4 border-t border-b border-gray-100 py-4 text-xs font-semibold text-gray-700">
            <div className="space-y-1">
              <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block">Show Date</span>
              <div className="flex items-center space-x-1">
                <Calendar className="w-3.5 h-3.5 text-saffron-600" />
                <span>{formatDate(show.date)}</span>
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block">Show Time</span>
              <div className="flex items-center space-x-1">
                <Clock className="w-3.5 h-3.5 text-saffron-600" />
                <span>{show.time} (IST)</span>
              </div>
            </div>
            <div className="space-y-1 col-span-2 border-t border-gray-50 pt-3">
              <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block">Auditorium Venue</span>
              <div className="flex flex-col">
                <div className="flex items-center space-x-1">
                  <MapPin className="w-3.5 h-3.5 text-saffron-600 shrink-0" />
                  <span className="font-extrabold text-gray-900">{show.venue}</span>
                </div>
                {show.address && (
                  <span className="block text-[10px] text-gray-500 font-semibold mt-0.5 pl-[18px]">{show.address}</span>
                )}
              </div>
            </div>
          </div>

          
          <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-gray-700">
            <div>
              <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block">Assigned Seats</span>
              <span className="text-base font-black text-gray-900">{booking.seats.join(', ')}</span>
            </div>
            <div>
              <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block">Attendee Name</span>
              <span className="text-sm font-bold text-gray-900 truncate block">{booking.customerDetails.name}</span>
            </div>
          </div>
        </div>

        
        <div className="hidden md:flex flex-col justify-between items-center w-px relative shrink-0">
          <div className="w-3 h-6 bg-gray-50 rounded-b-full border-b border-l border-r border-gray-200/60 -mt-px relative z-10 print:bg-white"></div>
          <div className="flex-1 border-r border-dashed border-gray-300 w-0 my-2"></div>
          <div className="w-3 h-6 bg-gray-50 rounded-t-full border-t border-l border-r border-gray-200/60 -mb-px relative z-10 print:bg-white"></div>
        </div>

        
        <div className="bg-gray-50 p-6 sm:p-8 md:w-64 flex flex-col justify-between items-center text-center shrink-0 border-t md:border-t-0 md:border-l border-gray-150 print:bg-white print:border-l">
          
          
          <div className="space-y-2">
            <div className="bg-white p-3 border border-gray-200 rounded-2xl shadow-xs inline-block">
              {booking.qrCodeUrl ? (
                <img src={booking.qrCodeUrl} alt="Ticket QR Code" className="w-28 h-28 object-contain" />
              ) : (
                <QrCode className="w-28 h-28 text-gray-900" />
              )}
            </div>
            <p className="text-[8px] text-gray-400 font-bold uppercase tracking-wider">Scan code for quick entry check-in</p>
          </div>

          <div className="mt-4 md:mt-0 w-full pt-4 border-t border-gray-200/60">
            <span className="block text-[8px] text-gray-400 font-bold uppercase tracking-wider">Total Amount Paid</span>
            <span className="text-lg font-black text-maroon-900">₹{booking.totalAmount.toLocaleString('en-IN')}</span>
            {booking.bookingStatus === 'cancellation_requested' ? (
              <span className="block text-[9px] text-amber-600 font-bold mt-0.5">⏳ Refund Pending Approval</span>
            ) : booking.bookingStatus === 'cancelled' || booking.bookingStatus === 'cancelled_refunded' ? (
              <span className="block text-[9px] text-red-600 font-bold mt-0.5">💸 Refunded / Cancelled</span>
            ) : (
              <span className="block text-[9px] text-emerald-600 font-bold mt-0.5">💰 Payment Successful</span>
            )}
          </div>
        </div>
      </div>

      
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-center pt-2 print:hidden">
        <button 
          onClick={handleBack}
          className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 text-sm font-bold text-gray-600 hover:text-gray-900 bg-white border border-gray-200 hover:bg-gray-50 px-6 py-3 rounded-xl shadow-xs transition-colors"
        >
          <Home className="w-4 h-4" />
          <span>{fromProfile ? 'Back to Profile' : 'Back to Home'}</span>
        </button>

        {booking.bookingStatus === 'confirmed' && booking.paymentStatus === 'paid' && (
          <button 
            onClick={handleRequestCancellation}
            disabled={cancelling || !isCancellationAllowed()}
            className={`w-full sm:w-auto inline-flex items-center justify-center space-x-2 text-sm font-bold px-6 py-3 rounded-xl shadow-xs border transition-colors ${
              isCancellationAllowed()
                ? 'bg-red-50 hover:bg-red-100 text-red-650 border-red-200'
                : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
            }`}
            title={!isCancellationAllowed() ? 'Cancellations are only allowed up to 6 hours before show starts' : ''}
          >
            <span>{cancelling ? 'Processing...' : 'Request Cancellation'}</span>
          </button>
        )}

        {booking.bookingStatus === 'cancellation_requested' && (
          <span className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 text-sm font-bold bg-amber-50 text-amber-700 border border-amber-200 px-6 py-3 rounded-xl cursor-default">
            ⏳ Cancellation Pending Review
          </span>
        )}

        <button 
          onClick={handleDownload}
          disabled={downloading}
          className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 text-sm font-bold text-white bg-gradient-to-r from-saffron-600 to-saffron-500 hover:from-saffron-700 hover:to-saffron-600 px-6 py-3 rounded-xl shadow-md hover:shadow-lg transition-all disabled:opacity-50"
        >
          <Download className="w-4 h-4" />
          <span>{downloading ? 'Downloading...' : 'Download Ticket'}</span>
        </button>
      </div>

      
      <div className="bg-gray-100 rounded-2xl p-4 text-[10px] text-gray-400 font-bold border border-gray-200/50 print:hidden text-center">
        ⚠️ Admittance is subject to check-in scanning of the QR code above. Digital copy on mobile screens is acceptable at the box office gate.
      </div>
    </div>
  );
}
