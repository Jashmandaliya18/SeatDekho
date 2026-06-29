import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Theater, User as UserIcon, LogOut, ShieldAlert, Key, Loader2, Search } from 'lucide-react';
import { api } from '../services/api';

export default function Navbar({ user, onAuthChange, currentView, searchTerm, setSearchTerm, showAuthModal, setShowAuthModal, isRegister, setIsRegister }) {
  const navigate = useNavigate();
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [usePasswordLogin, setUsePasswordLogin] = useState(false);

  const handleOpenAuth = (registerMode = false) => {
    setIsRegister(registerMode);
    setName('');
    setEmail('');
    setPassword('');
    setError('');
    setIsOtpSent(false);
    setOtp('');
    setUsePasswordLogin(false);
    setShowAuthModal(true);
  };

  const handleGoogleLoginSuccess = async (response) => {
    setError('');
    setLoading(true);
    try {
      const data = await api.post('/auth/google-login', { credential: response.credential });
      localStorage.setItem('token', data.token);
      onAuthChange(data.user);
      setShowAuthModal(false);
      if (data.user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(err.message || 'Google Sign-In failed.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (showAuthModal) {
      setIsOtpSent(false);
      setOtp('');
      setError('');
      
      const initGoogle = () => {
        if (window.google) {
          window.google.accounts.id.initialize({
            client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || 'mock_google_client_id.apps.googleusercontent.com',
            callback: handleGoogleLoginSuccess
          });
          
          const btnParent = document.getElementById('google-login-btn');
          if (btnParent) {
            window.google.accounts.id.renderButton(
              btnParent,
              { theme: 'outline', size: 'large', width: 320 }
            );
          }
        }
      };
      setTimeout(initGoogle, 150);
    }
  }, [showAuthModal]);

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegister) {
        if (!isOtpSent) {
          await api.post('/auth/register/send-otp', { name, email, password });
          setIsOtpSent(true);
        } else {
          const data = await api.post('/auth/register/verify', { email, otp });
          localStorage.setItem('token', data.token);
          onAuthChange(data.user);
          setShowAuthModal(false);
        }
      } else {
        if (usePasswordLogin) {
          
          const data = await api.post('/auth/login', { email, password });
          localStorage.setItem('token', data.token);
          onAuthChange(data.user);
          setShowAuthModal(false);
          if (data.user.role === 'admin') navigate('/admin');
        } else {
          if (!isOtpSent) {
            
            await api.post('/auth/login/send-otp', { email });
            setIsOtpSent(true);
          } else {
            
            const data = await api.post('/auth/login/verify', { email, otp });
            localStorage.setItem('token', data.token);
            onAuthChange(data.user);
            setShowAuthModal(false);
            if (data.user.role === 'admin') navigate('/admin');
          }
        }
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    onAuthChange(null);
    navigate('/');
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 border-b border-gray-100 shadow-xs backdrop-blur-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {isMobileSearchOpen ? (
            
            <div className="flex items-center justify-between h-16 animate-fade-in sm:hidden">
              <button 
                onClick={() => setIsMobileSearchOpen(false)}
                className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-500 hover:text-gray-800 rounded-xl mr-2 text-xs font-black border border-gray-200 transition-colors"
              >
                &larr; Back
              </button>
              <div className="flex-1 relative">
                <input 
                  type="text" 
                  autoFocus
                  placeholder="Search drama name..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    if (currentView !== 'home') {
                      navigate('/');
                    }
                  }}
                  className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-hidden focus:border-maroon-700 text-xs"
                />
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
              </div>
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm('')}
                  className="ml-2 text-xs font-bold text-maroon-850 hover:underline"
                >
                  Clear
                </button>
              )}
            </div>
          ) : (
            
            <div className="flex items-center justify-between h-16 sm:h-20">
              
              <div 
                className="flex items-center space-x-3 cursor-pointer select-none group shrink-0"
                onClick={() => { setSearchTerm(''); navigate('/'); }}
              >
                <div className="p-2 sm:p-2.5 bg-gradient-to-tr from-maroon-700 to-saffron-500 rounded-xl text-white shadow-md shadow-maroon-700/10 group-hover:scale-105 transition-transform duration-200">
                  <Theater className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div>
                  <span className="text-xl sm:text-2xl font-black tracking-tight text-maroon-900 font-sans">
                    SeatDekho
                  </span>
                  <span className="hidden sm:block text-[10px] uppercase font-bold tracking-widest text-saffron-600 -mt-1">
                    Gujarati Drama Theatre
                  </span>
                </div>
              </div>

              
              <div className="hidden sm:flex flex-1 max-w-xs md:max-w-md mx-4 sm:mx-6 relative">
                <input 
                  type="text" 
                  placeholder="Search drama name or description..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    if (currentView !== 'home') {
                      navigate('/');
                    }
                  }}
                  className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-hidden focus:border-maroon-700 text-xs bg-gray-50/55 focus:bg-white transition-all shadow-3xs"
                />
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
              </div>

              
              <div className="flex items-center space-x-3 sm:space-x-4 shrink-0">
                
                <button 
                  onClick={() => setIsMobileSearchOpen(true)}
                  className="sm:hidden p-2 text-gray-500 hover:text-maroon-850 hover:bg-maroon-50 rounded-lg transition-colors"
                  title="Search Drama"
                >
                  <Search className="w-4.5 h-4.5" />
                </button>

                <button 
                  onClick={() => { setSearchTerm(''); navigate('/'); }}
                  className={`text-sm font-semibold px-3 py-2 rounded-lg transition-colors ${
                    currentView === 'home' || currentView === 'details' || currentView === 'booking' || currentView === 'checkout' || currentView === 'ticket'
                      ? 'text-maroon-800 bg-maroon-50' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  Shows
                </button>

              {user?.role === 'admin' && (
                <button 
                  onClick={() => navigate('/admin')}
                  className={`text-sm font-semibold px-3 py-2 rounded-lg transition-colors flex items-center space-x-1.5 ${
                    currentView === 'admin' 
                      ? 'text-saffron-700 bg-saffron-50 border border-saffron-100' 
                      : 'text-gray-600 hover:text-saffron-600 hover:bg-saffron-50'
                  }`}
                >
                  <ShieldAlert className="w-4 h-4" />
                  <span className="hidden xs:inline">Admin Dashboard</span>
                  <span className="xs:hidden">Admin</span>
                </button>
              )}

               {user ? (
                <div 
                  onClick={() => navigate('/profile')}
                  className="flex items-center space-x-2 sm:space-x-3 pl-2 sm:pl-4 border-l border-gray-100 cursor-pointer group"
                >
                  <div className="hidden md:flex flex-col text-right">
                    <span className="text-sm font-bold text-gray-900 max-w-[120px] truncate group-hover:text-maroon-700 transition-colors">{user.name}</span>
                    <span className="text-[10px] text-gray-500 font-medium capitalize">{user.role} profile</span>
                  </div>
                  <div className="w-8 h-8 sm:w-9 sm:h-9 bg-gradient-to-tr from-saffron-500 to-gold-500 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-xs border border-white group-hover:scale-105 transition-transform duration-200">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleLogout(); }}
                    title="Log Out"
                    className="p-2 text-gray-500 hover:text-maroon-700 hover:bg-maroon-50 rounded-lg transition-colors"
                  >
                    <LogOut className="w-4 h-5 sm:w-5 sm:h-5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-2 pl-2 sm:pl-4 border-l border-gray-100">
                  <button 
                    onClick={() => handleOpenAuth(false)}
                    className="text-xs sm:text-sm font-bold text-maroon-800 hover:bg-maroon-50 px-3 py-2 rounded-lg transition-colors"
                  >
                    Login
                  </button>
                  <button 
                    onClick={() => handleOpenAuth(true)}
                    className="text-xs sm:text-sm font-bold bg-gradient-to-r from-maroon-800 to-maroon-700 hover:from-maroon-900 hover:to-maroon-800 text-white px-3 sm:px-4 py-2 rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
                  >
                    Sign Up
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      </header>

      
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs transition-opacity animate-fade-in">
          <div className={`w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100 animate-scale-up ${error ? 'animate-shake' : ''}`}>
            
            <div className="relative p-6 sm:p-8 bg-gradient-to-br from-maroon-900 to-maroon-800 text-white">
              <button 
                onClick={() => setShowAuthModal(false)}
                className="absolute top-4 right-4 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-1.5 rounded-full transition-colors"
              >
                ✕
              </button>
              <Theater className="w-8 h-8 text-saffron-400 mb-2" />
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                {isRegister ? 'Create Account' : 'Welcome Back'}
              </h2>
              <p className="text-xs text-maroon-100/90 mt-1">
                {isRegister ? 'Sign up to reserve seats for upcoming dramas.' : 'Sign in to manage and book drama tickets.'}
              </p>
            </div>

            
            {loading && (
              <div className="loading-bar-container">
                <div className="loading-bar"></div>
              </div>
            )}

            
            <div className="p-6 sm:p-8">
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-700 text-xs sm:text-sm font-medium rounded-lg">
                  {error}
                </div>
              )}

              <form onSubmit={handleAuthSubmit} className={`space-y-4 transition-all duration-300 ${loading ? 'opacity-60 pointer-events-none' : ''}`}>
                {isRegister ? (
                  <>
                    {!isOtpSent ? (
                      <>
                        <div>
                          <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Full Name</label>
                          <input 
                            type="text" 
                            required
                            placeholder="e.g. Ramesh Mehta"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-3.5 py-2 sm:py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-hidden focus:border-maroon-700 transition-colors focus:ring-1 focus:ring-maroon-700/50"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Email Address</label>
                          <input 
                            type="email" 
                            required
                            placeholder="name@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-3.5 py-2 sm:py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-hidden focus:border-maroon-700 transition-colors focus:ring-1 focus:ring-maroon-700/50"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Password</label>
                          <input 
                            type="password" 
                            required
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-3.5 py-2 sm:py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-hidden focus:border-maroon-700 transition-colors focus:ring-1 focus:ring-maroon-700/50"
                          />
                        </div>
                        <button 
                          type="submit"
                          disabled={loading}
                          className="w-full bg-gradient-to-r from-maroon-800 to-maroon-700 hover:from-maroon-900 hover:to-maroon-800 text-white font-bold py-2.5 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 text-sm flex items-center justify-center space-x-2"
                        >
                          {loading ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>Sending OTP...</span>
                            </>
                          ) : (
                            <span>Send OTP Verification Code</span>
                          )}
                        </button>
                      </>
                    ) : (
                      <>
                        <div className="bg-gray-50 border border-gray-100 rounded-lg p-3 text-xs text-gray-600 mb-2">
                          We sent a 6-digit OTP to <strong className="text-gray-900">{email}</strong>.
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Verification OTP</label>
                          <input 
                            type="text" 
                            required
                            maxLength="6"
                            placeholder="123456"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            className="w-full px-3.5 py-2 sm:py-2.5 text-sm border border-gray-200 rounded-lg text-center tracking-widest font-mono focus:outline-hidden focus:border-maroon-700 transition-colors"
                          />
                        </div>
                        <button 
                          type="submit"
                          disabled={loading}
                          className="w-full bg-gradient-to-r from-maroon-800 to-maroon-700 hover:from-maroon-900 hover:to-maroon-800 text-white font-bold py-2.5 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 text-sm flex items-center justify-center space-x-2"
                        >
                          {loading ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>Verifying...</span>
                            </>
                          ) : (
                            <span>Verify & Register</span>
                          )}
                        </button>
                        <div className="text-center flex justify-between px-1">
                          <button 
                            type="button"
                            onClick={() => setIsOtpSent(false)}
                            className="text-xs text-gray-500 hover:text-maroon-800 font-bold"
                          >
                            &larr; Back
                          </button>
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  
                  <>
                    {usePasswordLogin ? (
                      
                      <>
                        <div>
                          <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Email Address</label>
                          <input 
                            type="email" 
                            required
                            placeholder="name@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-3.5 py-2 sm:py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-hidden focus:border-maroon-700 transition-colors focus:ring-1 focus:ring-maroon-700/50"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Password</label>
                          <input 
                            type="password" 
                            required
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-3.5 py-2 sm:py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-hidden focus:border-maroon-700 transition-colors focus:ring-1 focus:ring-maroon-700/50"
                          />
                        </div>
                        <button 
                          type="submit"
                          disabled={loading}
                          className="w-full bg-gradient-to-r from-maroon-800 to-maroon-700 hover:from-maroon-900 hover:to-maroon-800 text-white font-bold py-2.5 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 text-sm flex items-center justify-center space-x-2"
                        >
                          {loading ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>Logging in...</span>
                            </>
                          ) : (
                            <span>Sign In with Password</span>
                          )}
                        </button>
                        <div className="text-center">
                          <button 
                            type="button"
                            onClick={() => { setUsePasswordLogin(false); setIsOtpSent(false); }}
                            className="text-xs text-maroon-800 hover:underline font-bold"
                          >
                            Log in with OTP instead
                          </button>
                        </div>
                      </>
                    ) : (
                      
                      <>
                        {!isOtpSent ? (
                          
                          <>
                            <div>
                              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Email Address</label>
                              <input 
                                type="email" 
                                required
                                placeholder="name@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-3.5 py-2 sm:py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-hidden focus:border-maroon-700 transition-colors focus:ring-1 focus:ring-maroon-700/50"
                              />
                            </div>
                            <button 
                              type="submit"
                              disabled={loading}
                              className="w-full bg-gradient-to-r from-maroon-800 to-maroon-700 hover:from-maroon-900 hover:to-maroon-800 text-white font-bold py-2.5 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 text-sm flex items-center justify-center space-x-2"
                            >
                              {loading ? (
                                <>
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                  <span>Sending OTP...</span>
                                </>
                              ) : (
                                <span>Send OTP Verification Code</span>
                              )}
                            </button>
                            <div className="text-center">
                              <button 
                                type="button"
                                onClick={() => setUsePasswordLogin(true)}
                                className="text-xs text-maroon-800 hover:underline font-bold"
                              >
                                Log in with Password instead
                              </button>
                            </div>
                          </>
                        ) : (
                          
                          <>
                            <div className="bg-gray-50 border border-gray-100 rounded-lg p-3 text-xs text-gray-600 mb-2">
                              We sent a 6-digit OTP to <strong className="text-gray-900">{email}</strong>.
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Verification OTP</label>
                              <input 
                                type="text" 
                                required
                                maxLength="6"
                                placeholder="123456"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                className="w-full px-3.5 py-2 sm:py-2.5 text-sm border border-gray-200 rounded-lg text-center tracking-widest font-mono focus:outline-hidden focus:border-maroon-700 transition-colors"
                              />
                            </div>
                            <button 
                              type="submit"
                              disabled={loading}
                              className="w-full bg-gradient-to-r from-maroon-800 to-maroon-700 hover:from-maroon-900 hover:to-maroon-800 text-white font-bold py-2.5 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 text-sm flex items-center justify-center space-x-2"
                            >
                              {loading ? (
                                <>
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                  <span>Verifying...</span>
                                </>
                              ) : (
                                <span>Verify & Sign In</span>
                              )}
                            </button>
                            <div className="text-center flex justify-between px-1">
                              <button 
                                type="button"
                                onClick={() => setIsOtpSent(false)}
                                className="text-xs text-gray-500 hover:text-maroon-800 font-bold"
                              >
                                &larr; Change Email
                              </button>
                              <button 
                                type="submit"
                                className="text-xs text-maroon-800 hover:underline font-bold"
                              >
                                Resend OTP
                              </button>
                            </div>
                          </>
                        )}
                      </>
                    )}
                  </>
                )}
              </form>

              
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-100"></div>
                </div>
                <div className="relative flex justify-center text-[10px] uppercase tracking-wider font-bold">
                  <span className="bg-white px-3 text-gray-400">Or continue with</span>
                </div>
              </div>

              <div id="google-login-btn" className="w-full flex justify-center"></div>

              <div className="mt-6 text-center">
                <button 
                  onClick={() => { setIsRegister(!isRegister); setIsOtpSent(false); }}
                  className="text-xs font-semibold text-maroon-800 hover:underline"
                >
                  {isRegister ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
