import { useContext, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { AuthContext } from '../Authentication/AuthProvider';
import { useTheme } from '../contexts/ThemeContext';
import axios from 'axios';
import Notifications from '../components/Notifications';

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showCategories, setShowCategories] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const { user, logOut } = useContext(AuthContext);
  const [dbUser, setDbUser] = useState(null);
  const { isDarkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '');

  const categories = [
    'Electrician',
    'Plumber',
    'Mason (Rajmistri)',
    'Carpenter',
    'Welder',
    'Painter',
    'AC Technician',
    'Freezer Mechanic',
    'Car Mechanic'
  ];

  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? 'hidden' : 'auto';
  }, [isMenuOpen]);

  // Fetch notification count
  const fetchNotificationCount = async () => {
    if (!user?.uid) {
      setNotificationCount(0);
      return;
    }

    try {
      const response = await axios.get(`${API_BASE}/api/notifications/${user.uid}`);
      setNotificationCount(response.data.unreadCount || 0);
    } catch (err) {
      console.error('Failed to fetch notification count:', err);
    }
  };

  // Poll for notifications and user data
  useEffect(() => {
    if (!user?.uid) return;

    fetchNotificationCount();

    // Also fetch user profile for real name
    const fetchDbUser = async () => {
      try {
        const response = await axios.get(`${API_BASE}/api/users/${user.uid}`);
        setDbUser(response.data);
      } catch (err) {
        console.error('Failed to fetch user profile in Navbar:', err);
      }
    };
    fetchDbUser();

    const interval = setInterval(fetchNotificationCount, 10000); // Poll every 10 seconds
    return () => clearInterval(interval);
  }, [user?.uid]);

  const handleLogout = async () => {
    try {
      await logOut();
      navigate('/login');
    } catch (error) {
      console.error("Logout error:", error.message);
    }
  };

  return (
    <div className="w-full sticky top-0 z-50 bg-white border-b border-gray-100 font-sans">

      {/* Main Navbar */}
      <div className="max-w-[90%] mx-auto flex justify-between items-center px-4 md:px-8 py-4">

        <div className="flex items-center gap-8">
          <Link to="/" className="text-4xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <span className="text-[#0a58ca] w-8 h-8 flex items-center justify-center text-xl">
              <i className="fas fa-hammer"></i>
            </span>
            Hire Mistri
          </Link>

          {/* Desktop Search Bar */}
          <div className="hidden lg:flex items-center relative">
            <input
              type="text"
              placeholder="Search..."
              className="bg-white text-gray-900 border border-gray-300 focus:border-[#0a58ca] focus:ring-1 focus:ring-[#0a58ca] rounded-l-md px-4 py-2 w-72 xl:w-96 outline-none transition-all placeholder:text-gray-400 text-sm"
            />
            <button className="bg-[#0a58ca] hover:bg-[#084298] text-white px-4 py-2 rounded-r-md transition-colors flex items-center justify-center">
              <i className="fas fa-search"></i>
            </button>
          </div>
        </div>

        {/* Desktop Menu */}
        <div className="hidden lg:flex items-center gap-6 text-base font-medium text-gray-600">
          {user ? (
            <>
              <Link to="/dashboard" className="hover:text-[#0a58ca] transition-colors">
                Dashboard
              </Link>
              <Link to="/post-job" className="hover:text-[#0a58ca] transition-colors">
                Post Job
              </Link>
              <Link to="/My-Posted-Jobs" className="hover:text-[#0a58ca] transition-colors">
                My Posted Jobs
              </Link>
              <Link to="/applications" className="hover:text-[#0a58ca] transition-colors">
                Applications
              </Link>
              <Link to="/chats" className="hover:text-[#0a58ca] transition-colors">
                Messages
              </Link>

              <div className="h-6 w-px bg-gray-200 mx-2"></div>

              {/* Notifications */}
              <button
                className="relative text-gray-500 hover:text-gray-800 p-2 rounded-full transition-colors"
                onClick={() => setShowNotifications(true)}
              >
                <i className="far fa-bell text-lg"></i>
                {notificationCount > 0 && (
                  <span className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                    {notificationCount > 9 ? '9+' : notificationCount}
                  </span>
                )}
              </button>

              {/* User Profile Dropdown */}
              <div className="dropdown dropdown-end relative">
                <div tabIndex={0} role="button" className="flex items-center gap-3 pl-2 py-1 bg-transparent hover:bg-gray-100 rounded-full transition-all cursor-pointer border border-transparent hover:border-gray-200">
                  <div className="text-right hidden xl:block">
                    <p className="font-bold text-sm text-gray-900">
                      {dbUser ? [dbUser.firstName, dbUser.lastName].filter(Boolean).join(' ') : (user?.displayName || user?.email?.split('@')[0] || 'My Account')}
                    </p>
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest leading-none">Client</p>
                  </div>
                  <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-gray-200 shadow-sm relative">
                    <img src={user?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.displayName || 'User')}&background=0a58ca&color=fff`} alt="User" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"></div>
                  </div>
                </div>

                <ul tabIndex={0} className="dropdown-content absolute top-full mt-3 right-0 z-50 p-2 shadow-2xl rounded-2xl w-56 bg-white border border-gray-200">
                  <li className="px-4 py-3 border-b border-gray-100 mb-1">
                    <p className="font-bold text-gray-900 text-sm truncate">{user.email}</p>
                  </li>
                  <li><Link to="/my-profile" className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-gray-700 hover:bg-gray-50 hover:text-[#0a58ca] font-medium transition-colors"><i className="fas fa-user w-4"></i> Profile Settings</Link></li>
                  <li><Link to="/support" className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-gray-700 hover:bg-gray-50 hover:text-[#0a58ca] font-medium transition-colors"><i className="fas fa-headset w-4"></i> Support / Help Center</Link></li>
                  <div className="h-px bg-gray-100 my-1 mx-2"></div>
                  <li><button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-red-500 hover:bg-red-50 font-bold transition-colors"><i className="fas fa-sign-out-alt w-4"></i> Logout</button></li>
                </ul>
              </div>
            </>
          ) : (
            <div className="flex gap-3">
              <Link to="/signup" className="text-gray-600 hover:text-gray-900 font-semibold py-2.5 px-4 transition-colors">
                Sign Up
              </Link>
              <Link to="/login" className="bg-[#0a58ca] hover:bg-[#084298] text-white font-bold py-2.5 px-6 rounded-md transition-all shadow-md shadow-blue-500/20">
                Login
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Hamburger */}
        <div className="lg:hidden flex items-center gap-4">
          {user && (
            <button
              className="relative text-gray-500 hover:text-gray-900"
              onClick={() => setShowNotifications(true)}
            >
              <i className="far fa-bell text-xl"></i>
              {notificationCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {notificationCount}
                </span>
              )}
            </button>
          )}
          <button
            className="text-gray-600 hover:text-gray-900 outline-none"
            onClick={() => setIsMenuOpen(true)}
          >
            <i className="fas fa-bars text-2xl"></i>
          </button>
        </div>
      </div>

      {/* Mobile Search Bar */}
      <div className="lg:hidden px-4 pb-4 bg-white">
        <div className="flex relative">
          <input
            type="text"
            placeholder="Search workers..."
            className="bg-white text-gray-900 border border-gray-300 rounded-l-md px-4 py-3 w-full outline-none placeholder:text-gray-400 text-sm font-medium focus:border-[#0a58ca]"
          />
          <button className="bg-[#0a58ca] hover:bg-[#084298] text-white px-5 rounded-r-md border border-[#0a58ca]">
            <i className="fas fa-search"></i>
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsMenuOpen(false)}
          />
          <div className="relative w-[80%] h-full bg-white border-l border-gray-200 p-6 flex flex-col shadow-2xl overflow-y-auto animate-slideInRight">
            <div className="flex items-center justify-between mb-8">
              {user ? (
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full border border-gray-200 overflow-hidden">
                    <img src={user?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.displayName || 'User')}&background=0a58ca&color=fff`} alt="User" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <div className="font-bold text-gray-900 leading-snug">
                      {dbUser ? [dbUser.firstName, dbUser.lastName].filter(Boolean).join(' ') : (user.displayName || 'Client')}
                    </div>
                    <div className="text-xs text-[#0a58ca] font-semibold uppercase tracking-wider">My Account</div>
                  </div>
                </div>
              ) : (
                <span className="text-xl font-bold text-gray-900">Menu</span>
              )}
              <button className="text-gray-500 hover:text-gray-900 w-8 h-8 flex items-center justify-center bg-gray-100 rounded-full" onClick={() => setIsMenuOpen(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>

            <nav className="flex flex-col gap-2 text-[15px] font-semibold flex-1">
              {!user && (
                <div className="flex flex-col gap-3 mb-6">
                  <Link to="/login" onClick={() => setIsMenuOpen(false)} className="bg-[#0a58ca] text-center text-white py-3 rounded-md shadow-sm">Login</Link>
                  <Link to="/signup" onClick={() => setIsMenuOpen(false)} className="bg-white text-gray-700 text-center py-3 rounded-md border border-gray-300">Sign Up</Link>
                </div>
              )}

              <Link to="/" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-4 py-3 px-4 text-gray-700 hover:bg-gray-50 hover:text-[#0a58ca] rounded-md transition-colors"><i className="fas fa-home w-5 text-gray-400"></i> Home</Link>
              {user && (
                <>
                  <Link to="/dashboard" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-4 py-3 px-4 text-gray-700 hover:bg-gray-50 hover:text-[#0a58ca] rounded-md transition-colors"><i className="fas fa-chart-line w-5 text-gray-400"></i> Dashboard</Link>
                  <Link to="/post-job" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-4 py-3 px-4 text-gray-700 hover:bg-gray-50 hover:text-[#0a58ca] rounded-md transition-colors"><i className="fas fa-plus-circle w-5 text-gray-400"></i> Post a Job</Link>
                  <Link to="/My-Posted-Jobs" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-4 py-3 px-4 text-gray-700 hover:bg-gray-50 hover:text-[#0a58ca] rounded-md transition-colors"><i className="fas fa-list w-5 text-gray-400"></i> Posted Jobs</Link>
                  <Link to="/applications" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-4 py-3 px-4 text-gray-700 hover:bg-gray-50 hover:text-[#0a58ca] rounded-md transition-colors"><i className="fas fa-file-alt w-5 text-gray-400"></i> Applications</Link>
                  <Link to="/chats" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-4 py-3 px-4 text-gray-700 hover:bg-gray-50 hover:text-[#0a58ca] rounded-md transition-colors"><i className="fas fa-comment shadow-sm w-5 text-gray-400"></i> Messages</Link>
                  <Link to="/my-profile" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-4 py-3 px-4 text-gray-700 hover:bg-gray-50 hover:text-[#0a58ca] rounded-md transition-colors"><i className="fas fa-user-cog w-5 text-gray-400"></i> Profile Settings</Link>
                  <Link to="/support" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-4 py-3 px-4 text-gray-700 hover:bg-gray-50 hover:text-[#0a58ca] rounded-md transition-colors"><i className="fas fa-headset w-5 text-gray-400"></i> Support / Help Center</Link>
                </>
              )}
            </nav>

            {user && (
              <div className="mt-8 border-t border-gray-200 pt-6">
                <button onClick={() => { handleLogout(); setIsMenuOpen(false); }} className="flex items-center gap-4 py-3 px-4 w-full text-red-500 hover:bg-red-50 rounded-md transition-colors font-bold">
                  <i className="fas fa-sign-out-alt w-5"></i> Logout
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Notifications Drawer */}
      {showNotifications && createPortal(
        <Notifications onClose={() => { setShowNotifications(false); fetchNotificationCount(); }} />,
        document.body
      )}

      {/* Categories Bar */}
      <div className="border-t border-gray-100 px-4 md:px-8 py-2.5 hidden xl:flex items-center gap-6 overflow-x-auto no-scrollbar scroll-smooth max-w-[90%] mx-auto">
        {categories.map((cat, idx) => (
          <NavLink
            key={idx}
            to={`/services/${cat.toLowerCase().replace(/\s|\(|\)/g, '-')}`}
            className={({ isActive }) =>
              `text-[16px] whitespace-nowrap tracking-wide transition-all ${isActive ? 'font-bold text-[#0a58ca] border-b-2 border-[#0a58ca] pb-0.5' : 'text-gray-600 font-medium hover:text-[#0a58ca] hover:border-b-2 hover:border-gray-300 pb-0.5 border-b-2 border-transparent'}`
            }
          >
            {cat}
          </NavLink>
        ))}
      </div>

      <style>{`
        .animate-slideInRight {
          animation: slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
