import { Link } from 'react-router-dom';

export default function Navbar() {
  return (
    <div className="w-full">
      {/* Top nav */}
      <div className="navbar bg-black text-white px-4 md:px-6 shadow-sm justify-between">
        {/* Left - Logo */}
        <div className="flex items-center gap-4">
          <Link to="/" className="text-2xl font-bold text-white">
            hire<span className="text-green-500">mistri</span>
          </Link>
        </div>

        {/* Center - Search Bar */}
        <div className="hidden lg:flex">
          <input
            type="text"
            placeholder="What service are you looking for today?"
            className="input input-bordered w-[400px] xl:w-[500px] rounded-l-full"
          />
          <button className="btn rounded-r-full bg-gray-800 hover:bg-gray-700 border-none text-white">
            <i className="fas fa-search"></i>
          </button>
        </div>

        {/* Right - Menu */}
        <div className="hidden lg:flex items-center gap-4 text-sm">
          <a href="#" className="hover:underline">Orders</a>
          <a href="#" className="text-pink-500 font-semibold">Try HireMistri Go</a>
          <a href="#" className="text-green-600 font-semibold">Switch to Selling</a>

          <button className="btn btn-ghost btn-circle text-lg">
            <i className="far fa-bell"></i>
          </button>
          <button className="btn btn-ghost btn-circle text-lg">
            <i className="far fa-envelope"></i>
          </button>

          {/* Avatar dropdown */}
          <div className="dropdown dropdown-end">
            <div tabIndex={0} role="button" className="btn btn-ghost btn-circle avatar">
              <div className="w-8 rounded-full">
                <img src="https://i.pravatar.cc/100?img=3" alt="User" />
              </div>
            </div>
            <ul tabIndex={0} className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-40 text-black">
              <li><Link to="/dashboard">Dashboard</Link></li>
              <li><Link to="/post-job">Post Job</Link></li>
              <li><a href="#">Logout</a></li>
            </ul>
          </div>
        </div>

        {/* Mobile Menu Toggle */}
        <div className="lg:hidden dropdown dropdown-end">
          <label tabIndex={0} className="btn btn-ghost btn-circle">
            <i className="fas fa-bars text-white text-xl"></i>
          </label>
          <ul tabIndex={0} className="menu menu-sm dropdown-content mt-3 z-[1] p-3 shadow bg-base-100 rounded-box w-56 text-black">
            <li><a href="#">Orders</a></li>
            <li><a href="#">Try HireMistri Go</a></li>
            <li><a href="#">Switch to Selling</a></li>
            <li><Link to="/dashboard">Dashboard</Link></li>
            <li><Link to="/post-job">Post Job</Link></li>
            <li><a href="#">Logout</a></li>
          </ul>
        </div>
      </div>

      {/* Bottom category nav */}
      <div className="bg-white border-t border-gray-200 text-sm px-4 md:px-6 py-2 flex flex-wrap gap-x-6 overflow-x-auto whitespace-nowrap">
        {[
          "Graphics & Design",
          "Programming & Tech",
          "Digital Marketing",
          "Video & Animation",
          "Writing & Translation",
          "Music & Audio",
          "Business",
          "Finance",
          "AI Services",
          "Personal",
        ].map((cat) => (
          <a key={cat} href="#" className="hover:underline">
            {cat}
          </a>
        ))}
      </div>
    </div>
  );
}
