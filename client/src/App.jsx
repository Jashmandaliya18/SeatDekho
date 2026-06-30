import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { Theater } from 'lucide-react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import ShowDetailsPage from './pages/ShowDetailsPage';
import SeatBookingPage from './pages/SeatBookingPage';
import CheckoutPage from './pages/CheckoutPage';
import TicketPage from './pages/TicketPage';
import AdminPage from './pages/AdminPage';
import ProfilePage from './pages/ProfilePage';
import { api } from './services/api';
import ToastContainer from './components/ToastContainer';
export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [selectedShow, setSelectedShow] = useState(null);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [bookingAmount, setBookingAmount] = useState(0);
  const [finalBooking, setFinalBooking] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isRegister, setIsRegister] = useState(false);

  
  useEffect(() => {
    const authenticateUser = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const userData = await api.get('/auth/me');
          setUser(userData);
        } catch (err) {
          console.warn('Session expired or invalid token:', err.message);
          localStorage.removeItem('token');
          setUser(null);
        }
      }
      setAuthLoading(false);
    };

    authenticateUser();
  }, []);

  
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const handleSelectShow = (show) => {
    setSelectedShow(show);
    navigate(`/show/${show._id}`);
  };

  const handleBookSeats = (showObj) => {
    const activeShow = showObj || selectedShow;
    if (activeShow) {
      setSelectedShow(activeShow);
      if (!user) {
        setIsRegister(false);
        setShowAuthModal(true);
      } else {
        navigate(`/show/${activeShow._id}/booking`);
      }
    }
  };

  const handleContinueToCheckout = (seats, amount) => {
    setSelectedSeats(seats);
    setBookingAmount(amount);
    navigate('/checkout');
  };

  const handleBookingSuccess = (bookingDetails) => {
    setFinalBooking(bookingDetails);
    navigate(`/ticket/${bookingDetails.bookingId}`);
  };

  const handleGoHome = () => {
    setSelectedShow(null);
    setSelectedSeats([]);
    setBookingAmount(0);
    setFinalBooking(null);
    setSearchTerm('');
    navigate('/');
  };

  const handleAuthChange = (newUser) => {
    setUser(newUser);
  };

  
  let currentView = 'home';
  if (location.pathname.includes('/show/') && location.pathname.includes('/booking')) {
    currentView = 'booking';
  } else if (location.pathname.includes('/show/')) {
    currentView = 'details';
  } else if (location.pathname.includes('/checkout')) {
    currentView = 'checkout';
  } else if (location.pathname.includes('/ticket/')) {
    currentView = 'ticket';
  } else if (location.pathname === '/admin') {
    currentView = 'admin';
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <div className="print:hidden">
        <Navbar 
          user={user} 
          onAuthChange={handleAuthChange} 
          currentView={currentView}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          showAuthModal={showAuthModal}
          setShowAuthModal={setShowAuthModal}
          isRegister={isRegister}
          setIsRegister={setIsRegister}
        />
      </div>

      <main className="flex-1">
        {authLoading ? (
          <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gray-50 space-y-6">
            <div className="relative flex items-center justify-center">
              <div className="w-16 h-16 border-4 border-maroon-100 border-t-maroon-800 rounded-full preloader-spinner"></div>
              <div className="absolute p-3 bg-gradient-to-tr from-maroon-700 to-saffron-500 rounded-xl text-white shadow-md">
                <Theater className="w-6 h-6" />
              </div>
            </div>
            <div className="text-center space-y-1">
              <h1 className="text-lg font-black tracking-tight text-maroon-900">SeatDekho</h1>
              <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Loading Theatre Systems...</p>
            </div>
          </div>
        ) : (
          <Routes>
            <Route 
              path="/" 
              element={
                <HomePage 
                  onSelectShow={handleSelectShow} 
                  searchTerm={searchTerm}
                  setSearchTerm={setSearchTerm}
                />
              } 
            />
            
            <Route 
              path="/show/:id" 
              element={
                <ShowDetailsPage 
                  show={selectedShow}
                  onBack={handleGoHome}
                  onBookSeats={handleBookSeats}
                />
              } 
            />

             <Route 
              path="/show/:id/booking" 
              element={
                <SeatBookingPage 
                  show={selectedShow}
                  onBack={() => navigate(`/show/${selectedShow?._id || location.pathname.split('/')[2]}`)}
                  onContinueToCheckout={handleContinueToCheckout}
                  user={user}
                  onAuthRequired={() => {
                    setIsRegister(false);
                    setShowAuthModal(true);
                  }}
                />
              } 
            />

            <Route 
              path="/checkout" 
              element={
                selectedSeats.length && user ? (
                  <CheckoutPage 
                    show={selectedShow}
                    selectedSeats={selectedSeats}
                    totalAmount={bookingAmount}
                    user={user}
                    onBack={() => navigate(`/show/${selectedShow?._id || selectedSeats[0]?.split('-')[0]}/booking`)}
                    onBookingSuccess={handleBookingSuccess}
                  />
                ) : <Navigate to="/" />
              } 
            />

            <Route 
              path="/ticket/:id" 
              element={
                <TicketPage 
                  booking={finalBooking}
                  onGoHome={handleGoHome}
                />
              } 
            />

            <Route 
              path="/admin" 
              element={
                user?.role === 'admin' ? <AdminPage /> : <Navigate to="/" />
              } 
            />

            <Route 
              path="/profile" 
              element={
                user ? <ProfilePage /> : <Navigate to="/" />
              } 
            />
          </Routes>
        )}
      </main>

      <div className="print:hidden">
        <Footer />
        <ToastContainer />
      </div>
    </div>
  );
}
