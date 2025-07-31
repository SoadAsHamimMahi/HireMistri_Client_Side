import { useContext, useEffect, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { AuthContext } from '../Authentication/AuthProvider';

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showCategories, setShowCategories] = useState(false);
  const { user, logOut } = useContext(AuthContext); // ✅ access user state
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
      <div className="navbar bg-black text-white px-4 md:px-6 shadow-sm justify-between items-center">

        <div className='flex gap-7'>
          <Link to="/" className="text-4xl font-bold text-white">
            Hire<span className="text-green-500">Mistri</span>
          </Link>

          {/* Desktop Search Bar */}
          <div className="hidden lg:flex">
            <input
              type="text"
              placeholder="Find Workers"
              className="input input-bordered w-[400px] xl:w-[500px] rounded-l-full text-gray-600"
            />
            <button className="btn rounded-r-full bg-green-500 hover:bg-gray-700 border-none text-white">
              <i className="fas fa-search"></i>
            </button>
          </div>
        </div>

        {/* Desktop Menu */}
        <div className="hidden lg:flex items-center gap-4 text-sm">
          {user ? (
            <>
              <a href="#">Orders</a>
              <button className="btn btn-ghost btn-circle text-lg">
                <i className="far fa-bell"></i>
              </button>
              <button className="btn btn-ghost btn-circle text-lg">
                <i className="far fa-envelope"></i>
              </button>

              <div className="dropdown dropdown-end">
                <div tabIndex={0} role="button" className="btn btn-ghost btn-circle avatar">
                  <div className="w-8 rounded-full">
                    <img src="https://i.pravatar.cc/100?img=3" alt="User" />
                  </div>
                </div>
                <ul className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-40 text-black">
                  <li><Link to="/dashboard">Dashboard</Link></li>
                  <li><Link to="/post-job">Post Job</Link></li>
                  <li><Link to="/My-Posted-Jobs">My Posted Jobs</Link></li>
                  <li><button onClick={handleLogout}>Logout</button></li>
                </ul>
              </div>
            </>
          ) : (
            <Link to="/login" className="btn bg-green-500 border-none hover:bg-green-600">
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
      <div className="lg:hidden bg-white px-4 py-2 shadow-sm">
        <div className="flex">
          <input
            type="text"
            placeholder="Find Workers"
            className="input input-bordered w-full rounded-l-full"
          />
          <button className="btn rounded-r-full bg-gray-800 border-none text-white">
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
          <div className="fixed top-0 right-0 w-4/5 h-full bg-white text-black z-50 px-6 py-6 overflow-y-auto animate-fadeSlideIn rounded-l-xl shadow-lg">
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
                <Link to="/dashboard" onClick={() => setIsMenuOpen(false)}>Dashboard</Link>
                <Link to="/post-job" onClick={() => setIsMenuOpen(false)}>Post a Job</Link>
                <Link to="/My-Posted-Jobs" onClick={() => setIsMenuOpen(false)}>My Posted Jobs</Link>
                <button onClick={() => { handleLogout(); setIsMenuOpen(false); }}>Logout</button>
              </nav>
            )}
          </div>
        </>
      )}

      {/* Desktop Category Bar */}
      <div className="bg-gray-100 border-t text-xl border-gray-300 px-4 py-2 hidden lg:flex gap-4 overflow-x-auto whitespace-nowrap">
        {categories.map((cat, idx) => (
          <NavLink
            key={idx}
            to={`/services/${cat.toLowerCase().replace(/\s|\(|\)/g, '-')}`}
            className={({ isActive }) =>
              `hover:underline ${isActive ? 'font-semibold text-black' : 'text-gray-700'}`
            }
          >
            {cat}
          </NavLink>
        ))}
      </div>
    </div>
  );
}
