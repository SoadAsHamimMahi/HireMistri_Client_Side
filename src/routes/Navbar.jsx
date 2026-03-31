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
    <div className="w-full sticky top-0 z-50 bg-[#0b1121]/95 backdrop-blur-md border-b border-slate-800/80 transition-colors duration-300 font-sans shadow-lg">
      
      {/* Main Navbar */}
      <div className="flex justify-between items-center px-4 md:px-8 py-3">

        <div className="flex items-center gap-8">
          <Link to="/" className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2 drop-shadow-sm">
            <span className="bg-blue-600 text-white w-8 h-8 rounded-lg flex items-center justify-center text-xl shadow-[0_0_15px_rgba(37,99,235,0.5)]">
              <i className="fas fa-hammer"></i>
            </span>
            Hire<span className="text-blue-500">Mistri</span>
          </Link>

          {/* Desktop Search Bar */}
          <div className="hidden lg:flex items-center relative">
            <input
              type="text"
              placeholder="Find Expert Workers..."
              className="bg-[#121a2f] text-slate-200 border border-slate-700/60 focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 rounded-l-xl px-5 py-2.5 w-72 xl:w-96 outline-none transition-all placeholder:text-slate-500 text-sm font-medium"
            />
            <button className="bg-[#2563eb] hover:bg-blue-600 border border-[#2563eb] text-white px-5 py-2.5 rounded-r-xl transition-colors shadow-[0_4px_14px_0_rgba(37,99,235,0.2)]">
              <i className="fas fa-search"></i>
            </button>
          </div>
        </div>

        {/* Desktop Menu */}
        <div className="hidden lg:flex items-center gap-6 text-sm">
          {user ? (
            <>
              <Link to="/dashboard" className="text-slate-300 hover:text-white transition-colors font-semibold tracking-wide">
                Dashboard
              </Link>
              <Link to="/post-job" className="text-slate-300 hover:text-white transition-colors font-semibold tracking-wide">
                Post Job
              </Link>
              <Link to="/My-Posted-Jobs" className="text-slate-300 hover:text-white transition-colors font-semibold tracking-wide">
                My Posted Jobs
              </Link>
              <Link to="/applications" className="text-slate-300 hover:text-white transition-colors font-semibold tracking-wide">
                Applications
              </Link>
              <Link to="/chats" className="text-slate-300 hover:text-white transition-colors font-semibold tracking-wide">
                Messages
              </Link>
              
              <div className="h-6 w-px bg-slate-700/50 mx-2"></div>

              {/* Notifications */}
              <button 
                className="relative text-slate-300 hover:text-white hover:bg-slate-800 p-2 rounded-full transition-colors"
                onClick={() => setShowNotifications(true)}
              >
                <i className="far fa-bell text-lg"></i>
                {notificationCount > 0 && (
                  <span className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center shadow-sm">
                    {notificationCount > 9 ? '9+' : notificationCount}
                  </span>
                )}
              </button>

              {/* User Profile Dropdown */}
              <div className="dropdown dropdown-end relative">
                <div tabIndex={0} role="button" className="flex items-center gap-3 pl-2 py-1 bg-transparent hover:bg-slate-800/50 rounded-full transition-all cursor-pointer border border-transparent hover:border-slate-700">
                  <div className="text-right hidden xl:block">
                    <p className="font-bold text-sm text-white">
                      {dbUser ? [dbUser.firstName, dbUser.lastName].filter(Boolean).join(' ') : (user?.displayName || user?.email?.split('@')[0] || 'My Account')}
                    </p>
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest leading-none">Client</p>
                  </div>
                  <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-slate-700 shadow-sm relative">
                    <img src={user?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.displayName || 'User')}&background=1754cf&color=fff`} alt="User" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-[#0b1121] rounded-full"></div>
                  </div>
                </div>
                
                <ul tabIndex={0} className="dropdown-content absolute top-full mt-3 right-0 z-50 p-2 shadow-2xl rounded-2xl w-56 bg-[#172136] border border-slate-700/80 backdrop-blur-xl">
                  <li className="px-4 py-3 border-b border-slate-700/50 mb-1">
                    <p className="font-bold text-white text-sm truncate">{user.email}</p>
                  </li>
                  <li><Link to="/my-profile" className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-slate-300 hover:bg-blue-600/10 hover:text-blue-400 font-medium transition-colors"><i className="fas fa-user w-4"></i> Profile Settings</Link></li>
                  <li><Link to="/support" className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-slate-300 hover:bg-blue-600/10 hover:text-blue-400 font-medium transition-colors"><i className="fas fa-headset w-4"></i> Support / Help Center</Link></li>
                  <div className="h-px bg-slate-700/50 my-1 mx-2"></div>
                  <li><button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-red-400 hover:bg-red-500/10 font-bold transition-colors"><i className="fas fa-sign-out-alt w-4"></i> Logout</button></li>
                </ul>
              </div>
            </>
          ) : (
            <div className="flex gap-3">
              <Link to="/signup" className="text-slate-300 hover:text-white font-semibold py-2.5 px-4 transition-colors">
                Sign Up
              </Link>
              <Link to="/login" className="bg-[#2563eb] hover:bg-blue-600 text-white font-bold py-2.5 px-6 rounded-xl transition-all shadow-[0_4px_14px_0_rgba(37,99,235,0.39)]">
                Login
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Hamburger */}
        <div className="lg:hidden flex items-center gap-4">
          {user && (
            <button 
              className="relative text-slate-300 hover:text-white"
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
            className="text-slate-300 hover:text-white outline-none"
            onClick={() => setIsMenuOpen(true)}
          >
            <i className="fas fa-bars text-2xl"></i>
          </button>
        </div>
      </div>

      {/* Mobile Search Bar */}
      <div className="lg:hidden px-4 pb-4 bg-[#0b1121]">
        <div className="flex relative">
          <input
            type="text"
            placeholder="Search workers..."
            className="bg-[#121a2f] text-slate-200 border border-slate-700/80 rounded-l-xl px-4 py-3 w-full outline-none placeholder:text-slate-500 text-sm font-medium"
          />
          <button className="bg-[#2563eb] text-white px-5 rounded-r-xl border border-[#2563eb]">
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
          <div className="relative w-[80%] h-full bg-[#121a2f] border-l border-slate-800 p-6 flex flex-col shadow-2xl overflow-y-auto animate-slideInRight">
            <div className="flex items-center justify-between mb-8">
              {user ? (
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full border-2 border-slate-700 overflow-hidden">
                    <img src={user?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.displayName || 'User')}&background=1754cf&color=fff`} alt="User" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <div className="font-bold text-white leading-snug">
                      {dbUser ? [dbUser.firstName, dbUser.lastName].filter(Boolean).join(' ') : (user.displayName || 'Client')}
                    </div>
                    <div className="text-xs text-blue-400 font-semibold uppercase tracking-wider">My Account</div>
                  </div>
                </div>
              ) : (
                <span className="text-xl font-bold text-white">Menu</span>
              )}
              <button className="text-slate-400 hover:text-white w-8 h-8 flex items-center justify-center bg-slate-800 rounded-full" onClick={() => setIsMenuOpen(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>

            <nav className="flex flex-col gap-2 text-[15px] font-semibold flex-1">
              {!user && (
                <div className="flex flex-col gap-3 mb-6">
                  <Link to="/login" onClick={() => setIsMenuOpen(false)} className="bg-[#2563eb] text-center text-white py-3 rounded-xl shadow-lg shadow-blue-500/30">Login</Link>
                  <Link to="/signup" onClick={() => setIsMenuOpen(false)} className="bg-slate-800 text-center text-white py-3 rounded-xl border border-slate-700">Sign Up</Link>
                </div>
              )}
              
              <Link to="/" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-4 py-3 px-4 text-slate-300 hover:bg-slate-800 hover:text-white rounded-xl transition-colors"><i className="fas fa-home w-5 text-slate-400"></i> Home</Link>
              {user && (
                <>
                  <Link to="/dashboard" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-4 py-3 px-4 text-slate-300 hover:bg-slate-800 hover:text-white rounded-xl transition-colors"><i className="fas fa-chart-line w-5 text-slate-400"></i> Dashboard</Link>
                  <Link to="/post-job" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-4 py-3 px-4 text-slate-300 hover:bg-slate-800 hover:text-white rounded-xl transition-colors"><i className="fas fa-plus-circle w-5 text-slate-400"></i> Post a Job</Link>
                  <Link to="/My-Posted-Jobs" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-4 py-3 px-4 text-slate-300 hover:bg-slate-800 hover:text-white rounded-xl transition-colors"><i className="fas fa-list w-5 text-slate-400"></i> Posted Jobs</Link>
                  <Link to="/applications" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-4 py-3 px-4 text-slate-300 hover:bg-slate-800 hover:text-white rounded-xl transition-colors"><i className="fas fa-file-alt w-5 text-slate-400"></i> Applications</Link>
                  <Link to="/chats" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-4 py-3 px-4 text-slate-300 hover:bg-slate-800 hover:text-white rounded-xl transition-colors"><i className="fas fa-comment shadow-sm w-5 text-slate-400"></i> Messages</Link>
                  <Link to="/my-profile" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-4 py-3 px-4 text-slate-300 hover:bg-slate-800 hover:text-white rounded-xl transition-colors"><i className="fas fa-user-cog w-5 text-slate-400"></i> Profile Settings</Link>
                  <Link to="/support" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-4 py-3 px-4 text-slate-300 hover:bg-slate-800 hover:text-white rounded-xl transition-colors"><i className="fas fa-headset w-5 text-slate-400"></i> Support / Help Center</Link>
                </>
              )}
            </nav>

            {user && (
              <div className="mt-8 border-t border-slate-700 pt-6">
                <button onClick={() => { handleLogout(); setIsMenuOpen(false); }} className="flex items-center gap-4 py-3 px-4 w-full text-red-400 hover:bg-red-500/10 rounded-xl transition-colors font-bold">
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
      <div className="border-t border-slate-800/80 bg-[#0b1121] px-4 md:px-8 py-2.5 hidden xl:flex items-center gap-6 overflow-x-auto no-scrollbar scroll-smooth">
        {categories.map((cat, idx) => (
          <NavLink
            key={idx}
            to={`/services/${cat.toLowerCase().replace(/\s|\(|\)/g, '-')}`}
            className={({ isActive }) =>
              `text-[13px] whitespace-nowrap tracking-wide transition-all ${isActive ? 'font-bold text-blue-500 border-b-2 border-blue-500 pb-0.5' : 'text-slate-400 font-medium hover:text-white hover:border-b-2 hover:border-slate-500 pb-0.5 border-b-2 border-transparent'}`
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
