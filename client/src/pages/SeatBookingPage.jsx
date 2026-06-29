import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ArrowLeft, Armchair, Ticket } from 'lucide-react';
import { api } from '../services/api';

export default function SeatBookingPage({ show, onBack, onContinueToCheckout, user, onAuthRequired }) {
  const { id } = useParams();
  const [currentShow, setCurrentShow] = useState(show);
  const [loadingShow, setLoadingShow] = useState(true);
  const [selectedSeats, setSelectedSeats] = useState([]);

  useEffect(() => {
    const fetchShowDetails = async () => {
      try {
        const fetchedShow = await api.get(`/shows/${id}`);
        setCurrentShow(fetchedShow);
      } catch (err) {
        console.error(err);
      }
    };

    const initFetch = async () => {
      try {
        const fetchedShow = await api.get(`/shows/${id}`);
        setCurrentShow(fetchedShow);
        if (fetchedShow.currentUserLocks) {
          setSelectedSeats(fetchedShow.currentUserLocks);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingShow(false);
      }
    };

    initFetch();
    const interval = setInterval(fetchShowDetails, 2000);
    return () => clearInterval(interval);
  }, [id]);

  if (loadingShow || !currentShow) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-10 h-10 border-4 border-maroon-100 border-t-maroon-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  
  const getCategoryPrice = (catName) => {
    const category = currentShow.categories.find(c => c.name === catName);
    return category ? category.price : 0;
  };

  const getSeatCategory = (rowName) => {
    const rowInfo = currentShow.layout.find(r => r.rowName === rowName);
    return rowInfo ? rowInfo.category : 'Silver';
  };

  const handleSeatClick = async (seatId) => {
    if (!user) {
      onAuthRequired();
      return;
    }
    if (currentShow.bookedSeats.includes(seatId)) return;

    const isSelected = selectedSeats.includes(seatId);

    if (isSelected) {
      try {
        setSelectedSeats(prev => prev.filter(id => id !== seatId));
        await api.post(`/shows/${currentShow._id}/unlock-seat`, { seatNumber: seatId });
      } catch (err) {
        console.error(err);
        setSelectedSeats(prev => [...prev, seatId]);
      }
    } else {
      if (selectedSeats.length >= 10) {
        alert('You can select a maximum of 10 seats.');
        return;
      }
      try {
        setSelectedSeats(prev => [...prev, seatId]);
        await api.post(`/shows/${currentShow._id}/lock-seat`, { seatNumber: seatId });
      } catch (err) {
        console.error(err);
        setSelectedSeats(prev => prev.filter(id => id !== seatId));
        alert(err.message || 'Failed to lock seat. It may have been locked by another user.');
      }
    }
  };

  
  const seatDetailsList = selectedSeats.map(seatId => {
    const [rowName, seatNum] = seatId.split('-');
    const category = getSeatCategory(rowName);
    const price = getCategoryPrice(category);
    return { seatId, rowName, seatNum, category, price };
  });

  const totalAmount = seatDetailsList.reduce((sum, item) => sum + item.price, 0);

  const handleCheckoutClick = () => {
    if (selectedSeats.length === 0) return;
    onContinueToCheckout(selectedSeats, totalAmount);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 pb-20">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-gray-100 pb-4 gap-4">
        <div className="flex items-center space-x-3">
          <button 
            onClick={onBack}
            className="p-2 text-gray-500 hover:text-maroon-850 hover:bg-gray-100 rounded-lg transition-colors border border-gray-150"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-maroon-900 tracking-tight leading-tight">
              {currentShow.title}
            </h1>
            <p className="text-xs text-gray-500 font-medium">
              {currentShow.venue.split(',')[0]} • {currentShow.date} at {currentShow.time}
            </p>
          </div>
        </div>

        
        <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-gray-700 bg-white px-4 py-2 border border-gray-100 rounded-xl shadow-xs">
          <div className="flex items-center space-x-1.5">
            <span className="w-3.5 h-3.5 bg-emerald-500 rounded-md border border-emerald-600 block"></span>
            <span>Available</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3.5 h-3.5 bg-blue-600 rounded-md border border-blue-700 block animate-pulse"></span>
            <span>Selected</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3.5 h-3.5 bg-amber-500 rounded-md border border-amber-600 block animate-pulse"></span>
            <span>Hold (Selected by Others)</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3.5 h-3.5 bg-gray-200 rounded-md border border-gray-300 block"></span>
            <span>Booked</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        
        <div className="lg:col-span-2 bg-white border border-gray-100 rounded-3xl p-6 sm:p-8 shadow-xs flex flex-col items-center">
          
          
          <div className="w-full max-w-lg mb-16 text-center relative">
            <div className="w-full h-8 bg-gradient-to-b from-maroon-900 to-maroon-950 rounded-b-3xl shadow-lg relative border-b-4 border-saffron-500/80 overflow-hidden flex items-center justify-center">
              <div className="absolute inset-0 stage-glow"></div>
              <span className="text-[10px] sm:text-xs font-black tracking-[0.25em] text-white uppercase relative z-10">
                STAGE / SEATDEKHO
              </span>
            </div>
            <div className="absolute top-8 left-1/2 -translate-x-1/2 w-4/5 h-16 bg-gradient-to-b from-saffron-500/5 to-transparent blur-md pointer-events-none"></div>
          </div>

          
          <div className="w-full space-y-4 overflow-x-auto pb-4">
            <div className="min-w-[640px] flex flex-col space-y-3.5">
              {(() => {
                const maxSeats = Math.max(...currentShow.layout.map(r => r.seatsCount));
                return currentShow.layout.map((row) => {
                  let badgeStyle = 'bg-gray-100 text-gray-500';
                  if (row.category === 'VIP') badgeStyle = 'bg-gold-100 text-gold-700 border border-gold-200';
                  if (row.category === 'Gold') badgeStyle = 'bg-orange-50 text-saffron-700 border border-saffron-100';

                  return (
                    <div key={row.rowName} className="flex items-center justify-between space-x-4">
                      <div className="w-16 flex items-center space-x-1.5 shrink-0">
                        <span className="text-sm font-black text-gray-800 w-5">{row.rowName}</span>
                        <span className={`text-[8px] font-black tracking-wider px-1.5 py-0.5 rounded-sm uppercase ${badgeStyle}`}>
                          {row.category}
                        </span>
                      </div>

                      <div className="flex-1 flex justify-center items-center">
                        <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${maxSeats * 2}, 1rem)` }}>
                          {Array.from({ length: row.seatsCount }, (_, index) => {
                            const seatNumber = index + 1;
                            const seatId = `${row.rowName}-${seatNumber}`;
                            const isBooked = currentShow.bookedSeats.includes(seatId);
                            const isOtherLocked = currentShow.otherUserLocks?.includes(seatId);
                            const isSelected = selectedSeats.includes(seatId);

                            let seatColor = 'bg-emerald-500 border-emerald-600 text-white hover:bg-emerald-650';
                            if (isBooked) {
                              seatColor = 'bg-gray-200 border-gray-300 text-gray-400 cursor-not-allowed';
                            } else if (isOtherLocked) {
                              seatColor = 'bg-amber-500 border-amber-600 text-white cursor-not-allowed animate-pulse';
                            } else if (isSelected) {
                              seatColor = 'bg-blue-600 border-blue-750 text-white hover:bg-blue-700 shadow-sm';
                            }

                            const offset = maxSeats - row.seatsCount;
                            const style = {
                              gridColumn: index === 0 ? `${offset + 1} / span 2` : 'span 2'
                            };

                            return (
                              <button
                                key={seatId}
                                onClick={() => handleSeatClick(seatId)}
                                disabled={isBooked || isOtherLocked}
                                style={style}
                                title={`${row.category} Row ${row.rowName} Seat ${seatNumber} - ₹${getCategoryPrice(row.category)}`}
                                className={`w-8 h-8 rounded-lg border text-[10px] font-black flex items-center justify-center transition-all ${seatColor}`}
                              >
                                {seatNumber}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <span className="text-sm font-black text-gray-800 w-5 text-right shrink-0">{row.rowName}</span>
                    </div>
                  );
                });
              })()}
            </div>
          </div>

          <div className="mt-8 border-t border-gray-150 pt-6 w-full flex flex-wrap justify-center gap-6 text-xs font-bold text-gray-500">
            {currentShow.categories.map(cat => (
              <div key={cat.name} className="flex items-center space-x-1.5">
                <Armchair className={`w-4.5 h-4.5 ${
                  cat.name === 'VIP' ? 'text-gold-500' : cat.name === 'Gold' ? 'text-saffron-500' : 'text-gray-400'
                }`} />
                <span>{cat.name}: ₹{cat.price}</span>
              </div>
            ))}
          </div>

        </div>

        
        <div className="space-y-6">
          <div className="bg-white border border-gray-100 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
            <h3 className="text-lg font-black text-maroon-900 border-b border-gray-50 pb-2">Booking Summary</h3>

            
            {selectedSeats.length === 0 ? (
              <div className="text-center py-10 space-y-2">
                <Armchair className="w-10 h-10 text-gray-300 mx-auto" />
                <p className="text-xs text-gray-400 font-bold">No seats selected yet</p>
                <p className="text-[10px] text-gray-400 font-medium px-4">Please tap on the available green seats in the grid to pick your ticket spots.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="max-h-[160px] overflow-y-auto space-y-2 pr-1">
                  {seatDetailsList.map((item) => (
                    <div 
                      key={item.seatId}
                      className="flex items-center justify-between text-xs font-bold border border-gray-50 p-2 rounded-xl"
                    >
                      <div className="flex items-center space-x-2">
                        <span className="w-6 h-6 bg-blue-50 text-blue-700 rounded-md flex items-center justify-center text-[10px] font-black border border-blue-100">
                          {item.seatId}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-sm bg-gray-50 border border-gray-100 uppercase text-gray-500">
                          {item.category}
                        </span>
                      </div>
                      <span className="text-gray-800">₹{item.price}</span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-gray-100 pt-4 space-y-2">
                  <div className="flex justify-between text-xs font-bold text-gray-500">
                    <span>Seats Picked</span>
                    <span>{selectedSeats.length} ticket(s)</span>
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-sm font-bold text-gray-850">Subtotal Amount</span>
                    <span className="text-xl font-black text-maroon-900">₹{totalAmount.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                <button 
                  onClick={handleCheckoutClick}
                  className="w-full bg-gradient-to-r from-saffron-600 to-saffron-500 hover:from-saffron-700 hover:to-saffron-600 text-white font-extrabold py-3.5 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 text-sm flex items-center justify-center space-x-2"
                >
                  <Ticket className="w-4 h-4" />
                  <span>Continue to Checkout</span>
                </button>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
