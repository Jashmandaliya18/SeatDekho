import React from 'react';
import { Mail, Phone, MapPin, Theater, Facebook, Twitter, Instagram } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-maroon-950 text-maroon-50 border-t border-maroon-900 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 lg:gap-12">
          
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-tr from-maroon-700 to-saffron-500 rounded-lg text-white">
                <Theater className="w-5 h-5" />
              </div>
              <span className="text-xl font-black tracking-tight text-white">
                SeatDekho
              </span>
            </div>
            <p className="text-sm text-maroon-200/80 max-w-sm leading-relaxed">
              Bringing the finest Gujarati drama and performing arts since 1998. Experience stories that make you laugh, cry, and reflect with India's most talented stage actors.
            </p>
            <div className="flex space-x-4 pt-2">
              <a href="#" className="p-2 bg-maroon-900/40 hover:bg-maroon-900/80 text-maroon-200 hover:text-white rounded-full transition-colors">
                <Facebook className="w-4 h-4" />
              </a>
              <a href="#" className="p-2 bg-maroon-900/40 hover:bg-maroon-900/80 text-maroon-200 hover:text-white rounded-full transition-colors">
                <Twitter className="w-4 h-4" />
              </a>
              <a href="#" className="p-2 bg-maroon-900/40 hover:bg-maroon-900/80 text-maroon-200 hover:text-white rounded-full transition-colors">
                <Instagram className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Quick Contact info */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-saffron-400">Venue & Bookings</h3>
            <ul className="space-y-3 text-sm text-maroon-200/80">
              <li className="flex items-start space-x-2.5">
                <MapPin className="w-4 h-4 text-saffron-500 shrink-0 mt-0.5" />
                <span>SeatDekho Theatre, Ashram Road, Ahmedabad, Gujarat - 380009</span>
              </li>
              <li className="flex items-center space-x-2.5">
                <Phone className="w-4 h-4 text-saffron-500 shrink-0" />
                <span>+91 79 2658 8900</span>
              </li>
              <li className="flex items-center space-x-2.5">
                <Mail className="w-4 h-4 text-saffron-500 shrink-0" />
                <span>tickets@seatdekho.com</span>
              </li>
            </ul>
          </div>

          {/* Opening hours */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-saffron-400">Office Hours</h3>
            <ul className="space-y-2 text-sm text-maroon-200/80">
              <li>Monday - Friday: 10:00 AM - 6:00 PM</li>
              <li>Saturday: 10:00 AM - 3:00 PM</li>
              <li>Sunday (Show Days): Open until Show End</li>
              <li className="text-xs text-saffron-500/90 font-bold pt-2">
                * Online bookings open 24/7
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-maroon-900 mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-maroon-300/60 space-y-4 sm:space-y-0">
          <p>© {new Date().getFullYear()} SeatDekho Gujarati Theatre Company. All Rights Reserved.</p>
          <div className="flex space-x-6">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-white transition-colors">Refund Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
