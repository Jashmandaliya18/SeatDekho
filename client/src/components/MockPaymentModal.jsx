import React, { useState, useEffect } from 'react';
import { CreditCard, QrCode, ShieldCheck, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';

const normalizePhone = (phoneStr) => {
  if (!phoneStr) return '';
  let cleaned = phoneStr.replace(/[^\d+]/g, '');
  if (cleaned.startsWith('+')) {
    return cleaned;
  }
  if (cleaned.length === 12 && cleaned.startsWith('91')) {
    return '+' + cleaned;
  }
  if (cleaned.length === 10) {
    return '+91' + cleaned;
  }
  return cleaned;
};

export default function MockPaymentModal({ isOpen, onClose, booking, onSuccess }) {
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [cardName, setCardName] = useState('');
  const [upiId, setUpiId] = useState('');
  const [qrImageUrl, setQrImageUrl] = useState('');
  const [qrLoading, setQrLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyingMessage, setVerifyingMessage] = useState('');
  const [error, setError] = useState('');
  const [pollStatus, setPollStatus] = useState(''); // 'pending', 'paid', 'failed'

  useEffect(() => {
    // Dynamically load Razorpay Checkout.js script
    if (isOpen && !window.Razorpay) {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      document.body.appendChild(script);
    }
  }, [isOpen]);

  // Load QR code when UPI tab is opened
  useEffect(() => {
    if (isOpen && paymentMethod === 'upi' && booking && !qrImageUrl && !qrLoading) {
      setQrLoading(true);
      setError('');
      api.post('/payments/create-qr', { bookingId: booking.bookingId })
        .then(res => {
          setQrImageUrl(res.imageUrl);
          setQrLoading(false);
        })
        .catch(err => {
          console.error('Failed to load QR code:', err);
          // Set no warning at the top; let the placeholder handle fallback UI gracefully
          setQrLoading(false);
        });
    }
  }, [isOpen, paymentMethod, booking, qrImageUrl]);

  // Reset states on close / open
  useEffect(() => {
    if (!isOpen) {
      setCardName('');
      setUpiId('');
      setQrImageUrl('');
      setQrLoading(false);
      setIsVerifying(false);
      setVerifyingMessage('');
      setError('');
      setPollStatus('');
    }
  }, [isOpen]);

  // Booking status polling to wait for webhook verification
  useEffect(() => {
    let interval;
    if (isOpen && booking && (pollStatus === 'pending' || paymentMethod === 'upi' || isVerifying)) {
      interval = setInterval(async () => {
        try {
          const currentBooking = await api.get(`/bookings/ticket/${booking.bookingId}`);
          
          if (currentBooking.paymentStatus === 'paid') {
            setPollStatus('paid');
            setIsVerifying(false);
            clearInterval(interval);
            setTimeout(() => {
              onSuccess(currentBooking);
            }, 1000);
          } else if (currentBooking.paymentStatus === 'failed') {
            setPollStatus('failed');
            setIsVerifying(false);
            setError('Payment transaction failed. Any partial amount charged will be auto-refunded.');
            clearInterval(interval);
          }
        } catch (err) {
          console.error('Polling error:', err);
        }
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [isOpen, booking, pollStatus, paymentMethod, isVerifying, onSuccess]);

  if (!isOpen || !booking) return null;

  const handlePay = async (e) => {
    e.preventDefault();
    setError('');
    setIsVerifying(true);
    setVerifyingMessage('Initializing secure connection...');

    try {
      // 1. Create order on the server
      const orderData = await api.post(`/bookings/${booking.bookingId}/create-order`);
      const { orderId, amount, currency, keyId } = orderData;

      if (!window.Razorpay) {
        throw new Error('Razorpay Checkout SDK is still loading. Please wait a moment and try again.');
      }

      // 2. Build configuration options
      const options = {
        key: keyId,
        amount: amount,
        currency: currency,
        name: 'SeatDekho',
        description: `Tickets for ${booking.show.title}`,
        order_id: orderId,
        prefill: {
          name: cardName || booking.customerDetails.name,
          email: booking.customerDetails.email,
          contact: normalizePhone(booking.customerDetails.phone)
        },
        theme: {
          color: '#800020'
        },
        handler: async function (response) {
          try {
            setVerifyingMessage('Verifying payment signature...');
            await api.post('/payments/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            });
            setVerifyingMessage('Awaiting bank confirmation...');
            setPollStatus('pending'); // Start aggressive status polling
          } catch (err) {
            console.error('Verification API error:', err);
            setError(err.message || 'Signature verification failed.');
            setIsVerifying(false);
          }
        },
        modal: {
          ondismiss: function () {
            setIsVerifying(false);
            setVerifyingMessage('');
          }
        }
      };

      // Only prefill method if it's card, or if it's upi and a VPA is entered.
      // This prevents the SDK from trying to headlessly process a UPI payment without a VPA.
      if (paymentMethod === 'card') {
        options.prefill.method = 'card';
      } else if (paymentMethod === 'upi') {
        if (upiId) {
          options.prefill.method = 'upi';
          options.prefill.vpa = upiId;
        } else {
          // If UPI tab is selected but no specific VPA is typed,
          // direct standard checkout to open the UPI screen showing the QR code natively.
          options.config = {
            display: {
              blocks: {
                banks: {
                  name: 'UPI / QR Code',
                  instruments: [
                    {
                      method: 'upi',
                      apps: ['qr']
                    }
                  ]
                }
              },
              sequence: ['block.banks']
            }
          };
        }
      }

      // Open Razorpay Checkout overlay
      const rzp = new window.Razorpay(options);
      rzp.open();

    } catch (err) {
      console.error('Checkout error:', err);
      setError(err.message || 'Failed to initiate secure checkout payment.');
      setIsVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs transition-opacity animate-fade-in">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100">
        
        {isVerifying || pollStatus === 'paid' ? (
          /* Processing / Confirmed state */
          <div className="p-8 text-center flex flex-col items-center justify-center min-h-[380px] space-y-6">
            {pollStatus === 'paid' ? (
              <div className="relative animate-bounce">
                <CheckCircle2 className="w-16 h-16 text-emerald-600" />
              </div>
            ) : (
              <div className="relative">
                <Loader2 className="w-16 h-16 text-saffron-500 animate-spin" />
                <ShieldCheck className="w-6 h-6 text-maroon-700 absolute inset-0 m-auto" />
              </div>
            )}
            
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-gray-900">
                {pollStatus === 'paid' ? 'Payment Confirmed!' : 'Processing Payment'}
              </h3>
              <p className="text-xs text-saffron-600 font-extrabold tracking-wider uppercase">
                Amount: ₹{booking.totalAmount.toLocaleString('en-IN')}
              </p>
            </div>
            
            <p className="text-sm text-gray-500 min-h-[40px] px-4 font-medium transition-all duration-300">
              {pollStatus === 'paid' 
                ? 'Your seat booking is confirmed! Redirecting...' 
                : verifyingMessage || 'Securing transaction...'}
            </p>
          </div>
        ) : (
          /* Checkout Dialog UI */
          <div className="p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <h3 className="text-lg font-bold text-maroon-900">Secure Checkout</h3>
                <p className="text-xs text-gray-500">Select payment method to complete booking</p>
              </div>
              <button 
                onClick={onClose}
                className="text-gray-400 hover:text-gray-650 font-bold p-1 hover:bg-gray-100 rounded-full text-sm transition-colors"
              >
                ✕
              </button>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-100 text-red-700 text-xs font-semibold rounded-xl flex items-start space-x-2 animate-fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Total Payable Banner */}
            <div className="bg-gradient-to-r from-maroon-900 to-maroon-800 text-white rounded-xl p-4 flex justify-between items-center shadow-xs">
              <span className="text-xs font-semibold uppercase text-maroon-100">Total Payable</span>
              <span className="text-xl font-black">₹{booking.totalAmount.toLocaleString('en-IN')}</span>
            </div>

            {/* Tab Switcher */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-gray-50 rounded-xl border border-gray-100">
              <button
                type="button"
                onClick={() => setPaymentMethod('card')}
                className={`flex items-center justify-center space-x-1.5 py-2.5 rounded-lg text-xs font-bold transition-all ${
                  paymentMethod === 'card' 
                    ? 'bg-white text-maroon-950 shadow-sm border border-gray-100' 
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                <CreditCard className="w-4 h-4" />
                <span>Credit/Debit Card</span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('upi')}
                className={`flex items-center justify-center space-x-1.5 py-2.5 rounded-lg text-xs font-bold transition-all ${
                  paymentMethod === 'upi' 
                    ? 'bg-white text-maroon-950 shadow-sm border border-gray-100' 
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                <QrCode className="w-4 h-4" />
                <span>UPI ID / QR Code</span>
              </button>
            </div>

            <form onSubmit={handlePay} className="space-y-4">
              {paymentMethod === 'card' ? (
                /* Card Fields Form */
                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Cardholder Name</label>
                    <input 
                      type="text" 
                      required={paymentMethod === 'card'}
                      placeholder="e.g. Ramesh K Patel"
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-hidden focus:border-maroon-700"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Card Number</label>
                    <div className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 text-gray-400 select-none">
                      •••• •••• •••• ••••
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Expiry Date</label>
                      <div className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 text-gray-400 text-center select-none">
                        MM/YY
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">CVV</label>
                      <div className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 text-gray-400 text-center select-none">
                        •••
                      </div>
                    </div>
                  </div>
                  <p className="text-[10px] text-gray-450 leading-relaxed text-center font-medium bg-gray-50 p-2 rounded-lg border border-gray-100">
                    ℹ️ For security & PCI compliance, full card details are captured securely inside Razorpay's overlay script.
                  </p>
                </div>
              ) : (
                /* UPI ID & QR Code Form */
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">UPI ID (Optional)</label>
                    <input 
                      type="text" 
                      placeholder="e.g. username@okhdfcbank"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-hidden focus:border-maroon-700"
                    />
                  </div>
                  
                  {/* Dynamic QR Code from Razorpay */}
                  <div className="bg-gray-50 rounded-xl p-3 text-center border border-dashed border-gray-200 flex flex-col justify-center items-center min-h-[170px]">
                    <p className="text-[10px] text-gray-400 font-bold mb-2 uppercase tracking-wider">Scan Live UPI QR Code</p>
                    
                    {qrLoading ? (
                      <div className="w-28 h-28 flex items-center justify-center">
                        <Loader2 className="w-8 h-8 text-maroon-700 animate-spin" />
                      </div>
                    ) : qrImageUrl ? (
                      <div className="w-32 h-32 bg-white border border-gray-200 rounded-lg flex items-center justify-center p-2 shadow-xs transition-all duration-300">
                        <img 
                          src={qrImageUrl} 
                          alt="Razorpay UPI QR Code" 
                          className="w-full h-full object-contain" 
                        />
                      </div>
                    ) : (
                      <div className="text-[11px] text-gray-500 py-3 font-semibold px-4 leading-relaxed bg-white border border-gray-100 rounded-lg shadow-xs">
                        ⚡ Direct UPI payment is ready.<br/>
                        Click <strong>"Authorize & Pay"</strong> below to open the secure checkout window, where you can scan the live dynamic QR code or select any UPI App.
                      </div>
                    )}
                    <p className="text-[9px] text-gray-500 mt-2.5 font-medium px-2 leading-relaxed">
                      This QR is tied to order. Scan and complete payment on any UPI app (GPay, PhonePe, Paytm, BHIM, etc.).
                    </p>
                  </div>
                </div>
              )}

              {/* Authorize & Pay button */}
              <button 
                type="submit"
                className="w-full mt-2 bg-gradient-to-r from-saffron-600 to-saffron-500 hover:from-saffron-700 hover:to-saffron-600 text-white font-bold py-2.5 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 text-sm flex items-center justify-center space-x-2"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Authorize & Pay ₹{booking.totalAmount.toLocaleString('en-IN')}</span>
              </button>

              <p className="text-[10px] text-gray-450 text-center font-semibold">
                🔒 256-bit SSL encrypted connection. Secure booking transaction.
              </p>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
