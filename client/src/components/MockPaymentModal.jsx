import React, { useState, useEffect } from 'react';
import { CreditCard, QrCode, ShieldCheck, Loader2, CheckCircle2 } from 'lucide-react';

export default function MockPaymentModal({ isOpen, onClose, totalAmount, onSuccess }) {
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [loading, setLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState(0);
  const [cardNo, setCardNo] = useState('');
  const [cardName, setCardName] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [upiId, setUpiId] = useState('');

  const loadingMessages = [
    'Connecting to secure payment gateway...',
    'Authorizing transaction with your bank...',
    'Securing seat allocations...',
    'Generating digital ticket and confirmation...'
  ];

  useEffect(() => {
    let interval;
    if (loading) {
      interval = setInterval(() => {
        setLoadingStage((prev) => {
          if (prev >= loadingMessages.length - 1) {
            clearInterval(interval);
            
            setTimeout(() => {
              setLoading(false);
              onSuccess();
            }, 800);
            return prev;
          }
          return prev + 1;
        });
      }, 700);
    }
    return () => clearInterval(interval);
  }, [loading]);

  if (!isOpen) return null;

  const handlePay = (e) => {
    e.preventDefault();
    setLoading(true);
    setLoadingStage(0);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs transition-opacity animate-fade-in">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100">
        {loading ? (
          
          <div className="p-8 text-center flex flex-col items-center justify-center min-h-[380px] space-y-6">
            <div className="relative">
              <Loader2 className="w-16 h-16 text-saffron-500 animate-spin" />
              <ShieldCheck className="w-6 h-6 text-maroon-700 absolute inset-0 m-auto" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-gray-900">Processing Payment</h3>
              <p className="text-xs text-saffron-600 font-extrabold tracking-wider uppercase">Amount: ₹{totalAmount.toLocaleString('en-IN')}</p>
            </div>
            <p className="text-sm text-gray-500 min-h-[40px] px-4 font-medium transition-all duration-300">
              {loadingMessages[loadingStage]}
            </p>
          </div>
        ) : (
          
          <div className="p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Secure Checkout</h3>
                <p className="text-xs text-gray-500">Select payment method to complete booking</p>
              </div>
              <button 
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 font-bold p-1 hover:bg-gray-100 rounded-full text-sm"
              >
                ✕
              </button>
            </div>

            
            <div className="bg-gradient-to-r from-maroon-900 to-maroon-800 text-white rounded-xl p-4 flex justify-between items-center shadow-xs">
              <span className="text-xs font-semibold uppercase text-maroon-100">Total Payable</span>
              <span className="text-xl font-black">₹{totalAmount.toLocaleString('en-IN')}</span>
            </div>

            
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
                <span>UPI ID</span>
              </button>
            </div>

            <form onSubmit={handlePay} className="space-y-4">
              {paymentMethod === 'card' ? (
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Cardholder Name</label>
                    <input 
                      type="text" 
                      required 
                      placeholder="e.g. Ramesh K Patel"
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-hidden focus:border-maroon-700"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Card Number</label>
                    <input 
                      type="text" 
                      required 
                      placeholder="4111 2222 3333 4444"
                      maxLength="19"
                      value={cardNo}
                      onChange={(e) => setCardNo(e.target.value.replace(/[^\d]/g, '').replace(/(.{4})/g, '$1 ').trim())}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-hidden focus:border-maroon-700"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Expiry Date</label>
                      <input 
                        type="text" 
                        required 
                        placeholder="MM/YY"
                        maxLength="5"
                        value={expiry}
                        onChange={(e) => setExpiry(e.target.value.replace(/[^\d]/g, '').replace(/(.{2})/g, '$1/').replace(/\/$/, ''))}
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-hidden focus:border-maroon-700 text-center"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">CVV</label>
                      <input 
                        type="password" 
                        required 
                        placeholder="•••"
                        maxLength="3"
                        value={cvv}
                        onChange={(e) => setCvv(e.target.value.replace(/[^\d]/g, ''))}
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-hidden focus:border-maroon-700 text-center"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">UPI ID</label>
                    <input 
                      type="text" 
                      required 
                      placeholder="e.g. username@okhdfcbank"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-hidden focus:border-maroon-700"
                    />
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3 text-center border border-dashed border-gray-200">
                    <p className="text-[10px] text-gray-400 font-bold mb-1">OR SCAN CODE</p>
                    <div className="w-28 h-28 bg-white border border-gray-200 rounded-lg mx-auto flex items-center justify-center p-2 shadow-xs">
                      <QrCode className="w-full h-full text-gray-800" />
                    </div>
                    <p className="text-[10px] text-gray-500 mt-2 font-medium">Scan using any UPI App (GPay, PhonePe, Paytm)</p>
                  </div>
                </div>
              )}

              <button 
                type="submit"
                className="w-full mt-2 bg-gradient-to-r from-saffron-600 to-saffron-500 hover:from-saffron-700 hover:to-saffron-600 text-white font-bold py-2.5 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 text-sm flex items-center justify-center space-x-2"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Authorize & Pay ₹{totalAmount.toLocaleString('en-IN')}</span>
              </button>

              <p className="text-[10px] text-gray-400 text-center font-medium">
                🔒 256-bit SSL encrypted connection. This is a secure mock sandbox.
              </p>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
