import React from 'react';
import BannerImage from '../../Images/BannerImage.png';
import BannerBg from '../../Images/BannerBg.png';
import { Link } from 'react-router-dom';

const Banner = () => {
  return (
    <div
      className="relative w-screen left-1/2 -translate-x-1/2 h-[60vh] md:h-[75vh] overflow-hidden bg-[#0b1121] bg-no-repeat bg-cover bg-right"
      style={{
        backgroundImage: `url(${BannerBg})`,
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-[#0b1121] via-[#0b1121]/80 to-[#0b1121]/30 pointer-events-none z-10" aria-hidden="true" />
      <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-[#0b1121] to-transparent z-10"></div>
      
      {/* Decorative Glow Elements */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-[120px] z-0 pointer-events-none"></div>

      <div className="relative z-20 flex flex-col lg:flex-row items-center justify-between h-full w-full px-4 md:px-8">
        
        {/* Image Section - Always Left */}
        <div className="w-full lg:w-1/2 flex justify-center lg:justify-start order-1 lg:order-none relative">
          <img
            src={BannerImage}
            alt="Workers"
            className="h-[300px] sm:h-[350px] lg:h-full w-auto object-contain drop-shadow-[0_20px_50px_rgba(37,99,235,0.2)]"
          />
        </div>

        {/* Text Section - Always Right */}
        <div className="w-full lg:w-1/2 text-white text-center lg:text-left py-8 flex flex-col justify-center items-center lg:items-start order-2">
          
          <div className="inline-block px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 font-bold text-sm mb-6 uppercase tracking-wider">
            <i className="fas fa-bolt text-yellow-500 mr-2"></i> Instant Booking Available
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold mb-6 leading-tight tracking-tight">
            Find the Perfect <br className="hidden lg:block" />
            <span className='text-[#2563eb] drop-shadow-[0_0_20px_rgba(37,99,235,0.5)]'>Worker</span> for Your Project
          </h1>
          
          <p className="mb-8 text-lg sm:text-xl max-w-lg leading-relaxed text-slate-300 font-medium">
            Connect with skilled professionals in your area. Post your job and get matched with the top-rated workers instantly.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-5 w-full sm:w-auto">
            <Link 
              to="/post-job" 
              className="group bg-[#2563eb] hover:bg-blue-600 text-white font-bold text-lg px-8 py-4 rounded-xl shadow-[0_4px_20px_0_rgba(37,99,235,0.4)] transition-all duration-300 hover:-translate-y-1 flex items-center justify-center gap-3 w-full sm:w-auto"
            >
              Post a Job <i className="fas fa-arrow-right group-hover:translate-x-1 transition-transform"></i>
            </Link>
            
            <button className="bg-[#121a2f] border border-slate-700 hover:border-blue-500/50 hover:bg-[#172136] text-white font-bold text-lg px-8 py-4 rounded-xl transition-all duration-300 flex items-center justify-center gap-3 w-full sm:w-auto">
              <i className="fas fa-search text-blue-400"></i>
              Browse Workers
            </button>
          </div>
          
          <div className="mt-8 flex items-center gap-4 text-sm font-semibold text-slate-400">
            <div className="flex -space-x-3">
              <img src="https://i.pravatar.cc/100?img=1" className="w-8 h-8 rounded-full border-2 border-[#0b1121]" alt="User"/>
              <img src="https://i.pravatar.cc/100?img=2" className="w-8 h-8 rounded-full border-2 border-[#0b1121]" alt="User"/>
              <img src="https://i.pravatar.cc/100?img=3" className="w-8 h-8 rounded-full border-2 border-[#0b1121]" alt="User"/>
            </div>
            <span>Trusted by <span className="text-white">10,000+</span> Customers</span>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Banner;
