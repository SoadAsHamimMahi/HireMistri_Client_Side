import { useContext, useEffect, useState } from 'react';
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
  const { user, logOut } = useContext(AuthContext); // ✅ access user state
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

  // Poll for notifications
  useEffect(() => {
    if (!user?.uid) return;

    fetchNotificationCount();
    const interval = setInterval(fetchNotificationCount, 10000); // Poll every 10 seconds
    return () => clearInterval(interval);
  }, [user?.uid]);

  const handleLogout = async () => {
    try {
      await logOut();
      alert("You have been logged out!");
      navigate('/login'); 
    } catch (error) {
      console.error("Logout error:", error.message);
    }
  };

  return (
    <div className="w-full">
      {/* Main Navbar */}
      <div className="navbar bg-base-200 text-base-content px-4 md:px-6 shadow-sm justify-between items-center transition-colors duration-300">

        <div className="flex gap-6">
          <Link to="/" className="text-4xl font-heading font-bold text-base-content">
            Hire<span className="text-primary">Mistri</span>
          </Link>

          {/* Desktop Search Bar - reduced width */}
          <div className="hidden lg:flex">
            <input
              type="text"
              placeholder="Find Workers"
              className="input input-bordered bg-base-100 text-base-content w-64 xl:w-80 rounded-l-full"
            />
            <button className="btn rounded-r-full border-none bg-[#1DC66C] hover:bg-[#17A858] text-white">
              <i className="fas fa-search"></i>
            </button>
          </div>
        </div>

        {/* Desktop Menu - gap-4, fewer visible links (My Jobs in dropdown only) */}
        <div className="hidden lg:flex items-center gap-4 text-sm">
          {user ? (
            <>
              <Link to="/dashboard" className="text-base-content hover:text-primary transition-colors font-medium py-2">
                Dashboard
              </Link>
              <Link to="/post-job" className="text-base-content hover:text-primary transition-colors font-medium py-2">
                Post Job
              </Link>
              <Link to="/applications" className="text-base-content hover:text-primary transition-colors font-medium py-2">
                Applications
              </Link>
              <Link to="/chats" className="text-base-content hover:text-primary transition-colors font-medium py-2">
                Messages
              </Link>
              <Link to="/support" className="text-base-content hover:text-primary transition-colors font-medium py-2">
                Support
              </Link>
              
              {/* Notifications */}
              <div className="relative">
                <button 
                  className="btn btn-ghost btn-circle relative"
                  onClick={() => setShowNotifications(true)}
                >
                  <i className="far fa-bell text-lg text-base-content"></i>
                  {notificationCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-error text-error-content text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {notificationCount > 9 ? '9+' : notificationCount}
                    </span>
                  )}
                </button>
              </div>

              {/* Theme Toggle - desktop: only in green bar; show here on smaller than lg */}
              <button 
                onClick={toggleTheme}
                className="btn btn-ghost btn-circle lg:hidden"
                title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                <i className={`text-lg text-base-content ${isDarkMode ? 'fas fa-sun' : 'far fa-moon'}`}></i>
              </button>

              {/* User Profile */}
              <div className="dropdown dropdown-end">
                <div tabIndex={0} role="button" className="flex items-center gap-2 text-base-content hover:text-primary transition-colors cursor-pointer">
                  <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-primary/20">
                    <img src="https://i.pravatar.cc/100?img=3" alt="User" className="w-full h-full object-cover" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-sm text-base-content">{user?.email?.split('@')[0] || 'Client'}</p>
                    <p className="text-xs text-muted">01990444882</p>
                  </div>
                  <i className="fas fa-chevron-down text-xs text-base-content"></i>
                </div>
                <ul className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow-xl rounded-xl w-48 bg-surface border border-base-300">
                  <li><Link to="/dashboard" className="rounded-lg text-base-content hover:bg-primary/10 hover:text-primary">Dashboard</Link></li>
                  <li><Link to="/post-job" className="rounded-lg text-base-content hover:bg-primary/10 hover:text-primary">Post Job</Link></li>
                  <li><Link to="/My-Posted-Jobs" className="rounded-lg text-base-content hover:bg-primary/10 hover:text-primary">My Posted Jobs</Link></li>
                  <li><Link to="/applications" className="rounded-lg text-base-content hover:bg-primary/10 hover:text-primary">Applications</Link></li>
                  <li><Link to="/chats" className="rounded-lg text-base-content hover:bg-primary/10 hover:text-primary">Messages</Link></li>
                  <li><Link to="/support" className="rounded-lg text-base-content hover:bg-primary/10 hover:text-primary">Support Center</Link></li>
                  <li><Link to="/my-profile" className="rounded-lg text-base-content hover:bg-primary/10 hover:text-primary">My Profile</Link></li>
                  <div className="divider my-1"></div>
                  <li><button onClick={handleLogout} className="rounded-lg text-base-content hover:bg-error/10 hover:text-error">Logout</button></li>
                </ul>
              </div>
            </>
          ) : (
            <Link to="/login" className="btn border-none font-medium px-6 bg-[#1DC66C] hover:bg-[#17A858] text-white">
              Login
            </Link>
          )}
        </div>

        {/* Mobile Hamburger */}
        <div className="lg:hidden">
          <button
            className="btn btn-ghost btn-circle"
            onClick={() => setIsMenuOpen(true)}
          >
            <i className="fas fa-bars text-base-content text-xl"></i>
          </button>
        </div>
      </div>

      {/* Mobile Search Bar */}
      <div className="lg:hidden px-4 py-2 shadow-sm transition-colors duration-300 bg-base-200">
        <div className="flex">
          <input
            type="text"
            placeholder="Find Workers"
            className="input input-bordered bg-base-100 text-base-content w-full rounded-l-full"
          />
          <button className="btn rounded-r-full border-none bg-[#1DC66C] hover:bg-[#17A858] text-white">
            <i className="fas fa-search"></i>
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isMenuOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
            onClick={() => setIsMenuOpen(false)}
          />
          <div className="fixed top-0 right-0 max-w-sm w-full h-full z-50 px-6 py-6 overflow-y-auto animate-fadeSlideIn rounded-l-xl shadow-lg transition-colors duration-300 bg-base-200 text-base-content">
            <div className="flex items-center justify-between mb-6">
              {user ? (
                <div className="flex items-center gap-3">
                  <img
                    src="https://i.pravatar.cc/100?img=3"
                    alt="User"
                    className="w-10 h-10 rounded-full"
                  />
                  <div className="font-semibold text-base-content">{user.email}</div>
                </div>
              ) : (
                <Link to="/login" onClick={() => setIsMenuOpen(false)} className="btn border-none bg-[#1DC66C] hover:bg-[#17A858] text-white">
                  Login
                </Link>
              )}
              <button className="text-xl text-base-content" onClick={() => setIsMenuOpen(false)}>✕</button>
            </div>

            {user && (
              <nav className="flex flex-col gap-4 text-sm">
                <Link to="/dashboard" onClick={() => setIsMenuOpen(false)} className="py-2 text-base-content transition-colors hover:text-primary">Dashboard</Link>
                <Link to="/post-job" onClick={() => setIsMenuOpen(false)} className="py-2 text-base-content transition-colors hover:text-primary">Post a Job</Link>
                <Link to="/My-Posted-Jobs" onClick={() => setIsMenuOpen(false)} className="py-2 text-base-content transition-colors hover:text-primary">My Posted Jobs</Link>
                <Link to="/applications" onClick={() => setIsMenuOpen(false)} className="py-2 text-base-content transition-colors hover:text-primary">Applications</Link>
                <Link to="/chats" onClick={() => setIsMenuOpen(false)} className="py-2 text-base-content transition-colors hover:text-primary">Messages</Link>
                <Link to="/support" onClick={() => setIsMenuOpen(false)} className="py-2 text-base-content transition-colors hover:text-primary">Support Center</Link>
                <Link to="/my-profile" onClick={() => setIsMenuOpen(false)} className="py-2 text-base-content transition-colors hover:text-primary">My Profile</Link>
                
                {/* Mobile Theme Toggle */}
                <button 
                  onClick={toggleTheme}
                  className="flex items-center gap-2 text-base-content transition-colors text-left hover:text-primary"
                >
                  <i className={`text-lg ${isDarkMode ? 'fas fa-sun' : 'far fa-moon'}`}></i>
                  {isDarkMode ? 'Light Mode' : 'Dark Mode'}
                </button>
                
                <button onClick={() => { handleLogout(); setIsMenuOpen(false); }} className="text-base-content transition-colors text-left hover:text-error">Logout</button>
              </nav>
            )}
          </div>
        </>
      )}

      {/* Notifications Modal */}
      {showNotifications && (
        <Notifications 
          onClose={() => {
            setShowNotifications(false);
            fetchNotificationCount(); // Refresh count when closing
          }} 
        />
      )}


      {/* Desktop Category Bar - dropdown on lg, horizontal scroll on xl only */}
      <div className="border-t border-base-300 px-4 py-2 hidden xl:flex gap-4 overflow-x-auto whitespace-nowrap transition-colors duration-300 bg-base-200">
        {categories.map((cat, idx) => (
          <NavLink
            key={idx}
            to={`/services/${cat.toLowerCase().replace(/\s|\(|\)/g, '-')}`}
            className={({ isActive }) =>
              `text-base hover:underline transition-colors ${isActive ? 'font-semibold text-primary' : 'text-base-content hover:text-base-content'}`
            }
          >
            {cat}
          </NavLink>
        ))}
      </div>
      {/* Categories dropdown for lg (when horizontal bar is hidden) */}
      <div className="border-t border-base-300 px-4 py-2 hidden lg:flex xl:hidden transition-colors duration-300 bg-base-200">
        <div className="dropdown">
          <label tabIndex={0} className="btn btn-ghost btn-sm gap-2 text-base-content">
            <i className="fas fa-th-large"></i> Categories
          </label>
          <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow-lg bg-base-200 rounded-box w-52 border border-base-300 mt-2">
            {categories.map((cat, idx) => (
              <li key={idx}>
                <Link to={`/services/${cat.toLowerCase().replace(/\s|\(|\)/g, '-')}`} className="text-base-content">
                  {cat}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
