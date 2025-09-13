import { useContext, useEffect, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { AuthContext } from '../Authentication/AuthProvider';
import { useTheme } from '../contexts/ThemeContext';

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showCategories, setShowCategories] = useState(false);
  const { user, logOut } = useContext(AuthContext); // ✅ access user state
  const { isDarkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();

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
      {/* Top Navbar */}
      <div className={`navbar text-white px-4 md:px-6 shadow-sm justify-between items-center transition-colors duration-300 ${isDarkMode ? 'bg-gray-900' : 'bg-black'}`}>

        <div className='flex gap-7'>
          <Link to="/" className="text-4xl font-bold text-white">
            Hire<span className="text-green-500">Mistri</span>
          </Link>

          {/* Desktop Search Bar */}
          <div className="hidden lg:flex">
            <input
              type="text"
              placeholder="Find Workers"
              className={`input input-bordered w-[400px] xl:w-[500px] rounded-l-full ${isDarkMode ? 'text-white bg-gray-700 border-gray-600' : 'text-gray-600 bg-white border-gray-300'}`}
            />
            <button className="btn rounded-r-full bg-green-500 hover:bg-green-600 border-none text-white">
              <i className="fas fa-search"></i>
            </button>
          </div>
        </div>

        {/* Desktop Menu */}
        <div className="hidden lg:flex items-center gap-6 text-sm">
          {user ? (
            <>
              <Link to="/dashboard" className="text-white hover:text-green-400 transition-colors font-medium">
                Dashboard
              </Link>
              <Link to="/post-job" className="text-white hover:text-green-400 transition-colors font-medium">
                Post Job
              </Link>
              <Link to="/My-Posted-Jobs" className="text-white hover:text-green-400 transition-colors font-medium">
                My Jobs
              </Link>
              <Link to="/applications" className="text-white hover:text-green-400 transition-colors font-medium">
                Applications
              </Link>
              
              {/* Notifications */}
              <div className="relative">
                <button className="btn btn-ghost btn-circle text-white hover:bg-gray-800 relative">
                  <i className="far fa-bell text-lg"></i>
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    2
                  </span>
                </button>
              </div>
              
              {/* Messages */}
              <div className="relative">
                <button className="btn btn-ghost btn-circle text-white hover:bg-gray-800 relative">
                  <i className="far fa-envelope text-lg"></i>
                  <span className="absolute -top-1 -right-1 bg-green-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    1
                  </span>
                </button>
              </div>

              {/* Theme Toggle */}
              <button 
                onClick={toggleTheme}
                className="btn btn-ghost btn-circle text-white hover:bg-gray-800 dark:hover:bg-gray-700"
                title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                <i className={`text-lg ${isDarkMode ? 'fas fa-sun' : 'far fa-moon'}`}></i>
              </button>

              {/* User Profile */}
              <div className="dropdown dropdown-end">
                <div tabIndex={0} role="button" className="flex items-center gap-2 text-white hover:text-green-400 transition-colors cursor-pointer">
                  <div className="w-10 h-10 rounded-full overflow-hidden">
                    <img src="https://i.pravatar.cc/100?img=3" alt="User" className="w-full h-full object-cover" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-sm">{user?.email?.split('@')[0] || 'Client'}</p>
                    <p className="text-xs text-gray-300">01990444882</p>
                  </div>
                  <i className="fas fa-chevron-down text-xs"></i>
                </div>
                <ul className={`menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow rounded-xl w-48 border transition-colors duration-300 ${isDarkMode ? 'bg-gray-800 text-white border-gray-700' : 'bg-white text-black border-gray-100'}`}>
                  <li><Link to="/dashboard" className={`rounded-lg ${isDarkMode ? 'hover:bg-green-900/20 hover:text-green-400' : 'hover:bg-green-50 hover:text-green-600'}`}>Dashboard</Link></li>
                  <li><Link to="/post-job" className={`rounded-lg ${isDarkMode ? 'hover:bg-green-900/20 hover:text-green-400' : 'hover:bg-green-50 hover:text-green-600'}`}>Post Job</Link></li>
                  <li><Link to="/My-Posted-Jobs" className={`rounded-lg ${isDarkMode ? 'hover:bg-green-900/20 hover:text-green-400' : 'hover:bg-green-50 hover:text-green-600'}`}>My Posted Jobs</Link></li>
                  <li><Link to="/applications" className={`rounded-lg ${isDarkMode ? 'hover:bg-green-900/20 hover:text-green-400' : 'hover:bg-green-50 hover:text-green-600'}`}>Applications</Link></li>
                  <li><Link to="/my-profile" className={`rounded-lg ${isDarkMode ? 'hover:bg-green-900/20 hover:text-green-400' : 'hover:bg-green-50 hover:text-green-600'}`}>My Profile</Link></li>
                  <div className="divider my-1"></div>
                  <li><button onClick={handleLogout} className={`rounded-lg ${isDarkMode ? 'hover:bg-red-900/20 hover:text-red-400' : 'hover:bg-red-50 hover:text-red-600'}`}>Logout</button></li>
                </ul>
              </div>
            </>
          ) : (
            <Link to="/login" className="btn bg-green-500 border-none hover:bg-green-600 text-white font-medium px-6">
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
            <i className="fas fa-bars text-white text-xl"></i>
          </button>
        </div>
      </div>

      {/* Mobile Search Bar */}
      <div className={`lg:hidden px-4 py-2 shadow-sm transition-colors duration-300 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="flex">
          <input
            type="text"
            placeholder="Find Workers"
            className={`input input-bordered w-full rounded-l-full ${isDarkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300'}`}
          />
          <button className={`btn rounded-r-full border-none text-white ${isDarkMode ? 'bg-gray-600 hover:bg-gray-500' : 'bg-gray-800 hover:bg-gray-700'}`}>
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
          <div className={`fixed top-0 right-0 w-4/5 h-full z-50 px-6 py-6 overflow-y-auto animate-fadeSlideIn rounded-l-xl shadow-lg transition-colors duration-300 ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-black'}`}>
            <div className="flex items-center justify-between mb-6">
              {user ? (
                <div className="flex items-center gap-3">
                  <img
                    src="https://i.pravatar.cc/100?img=3"
                    alt="User"
                    className="w-10 h-10 rounded-full"
                  />
                  <div className="font-semibold">{user.email}</div>
                </div>
              ) : (
                <Link to="/login" onClick={() => setIsMenuOpen(false)} className="btn bg-green-500 border-none hover:bg-green-600">
                  Login
                </Link>
              )}
              <button className="text-xl" onClick={() => setIsMenuOpen(false)}>✕</button>
            </div>

            {user && (
              <nav className="flex flex-col gap-3 text-sm">
                <Link to="/dashboard" onClick={() => setIsMenuOpen(false)} className={`transition-colors ${isDarkMode ? 'hover:text-green-400' : 'hover:text-green-500'}`}>Dashboard</Link>
                <Link to="/post-job" onClick={() => setIsMenuOpen(false)} className={`transition-colors ${isDarkMode ? 'hover:text-green-400' : 'hover:text-green-500'}`}>Post a Job</Link>
                <Link to="/My-Posted-Jobs" onClick={() => setIsMenuOpen(false)} className={`transition-colors ${isDarkMode ? 'hover:text-green-400' : 'hover:text-green-500'}`}>My Posted Jobs</Link>
                <Link to="/applications" onClick={() => setIsMenuOpen(false)} className={`transition-colors ${isDarkMode ? 'hover:text-green-400' : 'hover:text-green-500'}`}>Applications</Link>
                <Link to="/my-profile" onClick={() => setIsMenuOpen(false)} className={`transition-colors ${isDarkMode ? 'hover:text-green-400' : 'hover:text-green-500'}`}>My Profile</Link>
                
                {/* Mobile Theme Toggle */}
                <button 
                  onClick={toggleTheme}
                  className={`flex items-center gap-2 transition-colors text-left ${isDarkMode ? 'hover:text-green-400' : 'hover:text-green-500'}`}
                >
                  <i className={`text-lg ${isDarkMode ? 'fas fa-sun' : 'far fa-moon'}`}></i>
                  {isDarkMode ? 'Light Mode' : 'Dark Mode'}
                </button>
                
                <button onClick={() => { handleLogout(); setIsMenuOpen(false); }} className={`transition-colors text-left ${isDarkMode ? 'hover:text-red-400' : 'hover:text-red-500'}`}>Logout</button>
              </nav>
            )}
          </div>
        </>
      )}

      {/* Desktop Category Bar */}
      <div className={`border-t text-xl px-4 py-2 hidden lg:flex gap-4 overflow-x-auto whitespace-nowrap transition-colors duration-300 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-300'}`}>
        {categories.map((cat, idx) => (
          <NavLink
            key={idx}
            to={`/services/${cat.toLowerCase().replace(/\s|\(|\)/g, '-')}`}
            className={({ isActive }) =>
              `hover:underline transition-colors ${isActive ? `font-semibold ${isDarkMode ? 'text-white' : 'text-black'}` : `${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}`
            }
          >
            {cat}
          </NavLink>
        ))}
      </div>
    </div>
  );
}
