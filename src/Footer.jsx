import React, { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
} from '@heroicons/react/24/outline';

const CATEGORIES = [
  'Electrician',
  'Plumber',
  'Mason (Rajmistri)',
  'Carpenter',
  'Welder',
  'Painter',
  'AC Technician',
  'Freezer Mechanic',
  'Car Mechanic',
];

function slugify(s) {
  return s
    .toLowerCase()
    .replace(/\s*\(.*\)\s*/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export default function Footer() {
  const year = new Date().getFullYear();
  const navigate = useNavigate();

  const cats = useMemo(() => CATEGORIES.slice(0, 8), []);

  return (
    <footer className="bg-[#f4f6f9] pt-16 pb-12 mt-12 border-t border-gray-200 text-gray-600">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          
          {/* Footer Column 1: Company Info */}
          <div>
            <Link to="/" className="inline-flex items-center gap-1 font-bold text-xl mb-4 text-gray-900 tracking-tight">
              <span className="text-[#0a58ca] w-6 h-6 flex items-center justify-center text-lg">
                <i className="fas fa-hammer"></i>
              </span>
              Hire Mistri
            </Link>
            <p className="text-sm mb-6 leading-relaxed">
              Find skilled workers fast with real-time hiring. Transparent profiles, direct chat, and quick bookings.
            </p>
            <div className="flex flex-col gap-3 text-sm text-gray-700">
              <span className="flex items-center gap-3">
                <MapPinIcon className="w-5 h-5 text-[#0a58ca] shrink-0" />
                Dhaka, Bangladesh
              </span>
              <a className="flex items-center gap-3 hover:text-[#0a58ca] transition-colors" href="tel:+8801990444882">
                <PhoneIcon className="w-5 h-5 text-[#0a58ca] shrink-0" />
                +8801990444882
              </a>
              <a className="flex items-center gap-3 hover:text-[#0a58ca] transition-colors" href="mailto:soadashamimmahi@gmail.com">
                <EnvelopeIcon className="w-5 h-5 text-[#0a58ca] shrink-0" />
                info@hiremistri.com
              </a>
            </div>
            
            {/* Socials */}
            <div className="mt-6 flex items-center gap-3">
              <a href="#" aria-label="Facebook" className="p-2 rounded-lg border border-gray-300 hover:border-[#0a58ca] hover:text-[#0a58ca] transition-colors">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06C2 17.06 5.66 21.2 10.44 22v-7.02H7.9v-2.92h2.54V9.41c0-2.5 1.49-3.89 3.77-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56v1.87h2.78l-.44 2.92h-2.34V22C18.34 21.2 22 17.06 22 12.06z"/></svg>
              </a>
              <a href="#" aria-label="X" className="p-2 rounded-lg border border-gray-300 hover:border-[#0a58ca] hover:text-[#0a58ca] transition-colors">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M3 3h3.6l5.1 6.93L17.4 3H21l-7.2 9.3 7.5 9.7h-3.6l-5.4-7.2-5.4 7.2H3l7.5-9.7L3 3z"/></svg>
              </a>
              <a href="#" aria-label="LinkedIn" className="p-2 rounded-lg border border-gray-300 hover:border-[#0a58ca] hover:text-[#0a58ca] transition-colors">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M4.98 3.5C4.98 4.88 3.86 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1s2.48 1.12 2.48 2.5zM0 8h5v15H0zM8 8h4.8v2.04h.07c.67-1.27 2.3-2.6 4.73-2.6 5.06 0 6 3.33 6 7.66V23h-5v-6.8c0-1.62-.03-3.7-2.25-3.7-2.25 0-2.6 1.76-2.6 3.58V23H8V8z"/></svg>
              </a>
            </div>
          </div>

          {/* Footer Column 2: Top Categories */}
          <div>
            <h4 className="font-bold text-gray-900 mb-6">Top Categories</h4>
            <ul className="flex flex-col gap-3 text-sm">
              {cats.map((c) => (
                <li key={c}>
                  <Link
                    to={`/category/${slugify(c)}`}
                    className="hover:text-[#0a58ca] transition-colors"
                  >
                    {c}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Footer Column 3: For Clients */}
          <div>
            <h4 className="font-bold text-gray-900 mb-6">For Clients</h4>
            <ul className="flex flex-col gap-3 text-sm">
              <li><Link to="/post-job" className="hover:text-[#0a58ca] transition-colors">Post Job</Link></li>
              <li><Link to="/how-it-works" className="hover:text-[#0a58ca] transition-colors">About us / How it works</Link></li>
              <li><Link to="/pricing" className="hover:text-[#0a58ca] transition-colors">Pricing</Link></li>
              <li><Link to="/privacy" className="hover:text-[#0a58ca] transition-colors">Privacy Policy</Link></li>
              <li><Link to="/support" className="hover:text-[#0a58ca] transition-colors">Contact Support</Link></li>
            </ul>
          </div>

          {/* Footer Column 4: Newsletter */}
          <div>
            <h4 className="font-bold text-gray-900 mb-6">Get updates</h4>
            <p className="text-sm mb-4 leading-relaxed">
              Sign up for our newsletter and email updates.
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const email = new FormData(e.currentTarget).get('email');
                if (!String(email).trim()) return;
                e.currentTarget.reset();
              }}
              className="flex flex-col gap-3"
            >
              <input
                name="email"
                type="email"
                required
                placeholder="Email address"
                className="w-full border border-gray-300 rounded-md px-4 py-2.5 text-sm focus:outline-none focus:border-[#0a58ca] focus:ring-1 focus:ring-[#0a58ca] bg-white text-gray-900"
              />
              <button
                className="w-full bg-[#0a58ca] hover:bg-[#084298] text-white px-4 py-2.5 rounded-md font-medium transition-colors text-sm"
                type="submit"
              >
                Subscribe
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-gray-200">
               <p className="text-xs text-gray-500 font-semibold mb-3">
                 Are you a skilled worker?
               </p>
               <Link
                 to="/registration"
                 className="inline-flex px-4 py-2 rounded-md bg-white border-2 border-gray-200 hover:border-[#0a58ca] hover:text-[#0a58ca] text-sm text-gray-700 font-bold transition-colors w-full justify-center shadow-sm"
               >
                 Create Worker Account
               </Link>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-6 mt-12 border-t border-gray-200 flex flex-col md:flex-row gap-3 md:items-center md:justify-between text-xs font-medium">
           <p>© {year} <span className="text-gray-900 font-bold tracking-wide">Hire Mistri</span>. All rights reserved.</p>
           <div className="flex gap-6">
             <Link to="/terms" className="hover:text-[#0a58ca] transition-colors">Terms of Service</Link>
             <Link to="/privacy" className="hover:text-[#0a58ca] transition-colors">Privacy Policy</Link>
           </div>
        </div>

      </div>
    </footer>
  );
}
