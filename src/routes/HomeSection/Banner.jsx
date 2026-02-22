import React from 'react';
import BannerImage from '../../Images/BannerImage.png';
import BannerBg from '../../Images/BannerBg.png';
import { Link } from 'react-router-dom';

const Banner = () => {
  return (
    <div
      className="relative w-screen left-1/2 -translate-x-1/2 h-[60vh] md:h-[75vh] overflow-hidden bg-no-repeat bg-cover bg-right"
      style={{
        backgroundImage: `url(${BannerBg})`,
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-[#66BB6A]/30 to-[#66BB6A]/10 pointer-events-none z-10" aria-hidden="true" />
      <div className="relative z-20 flex flex-col lg:flex-row items-center justify-between h-full">
        {/* Image Section - Always Left */}
        <div className="w-full lg:w-1/2 flex justify-center lg:justify-start order-1 lg:order-none">
          <img
            src={BannerImage}
            alt="Workers"
            className="h-[300px] sm:h-[350px] lg:h-full w-auto object-contain"
          />
        </div>

        {/* Text Section - Always Right */}
        <div className="w-full lg:w-1/2 text-white text-center lg:text-right px-4 sm:px-6 lg:px-16 py-8 flex flex-col justify-center items-center lg:items-end order-2">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
            Find the Perfect <span className='text-[#1DC66C]'>Worker</span> for Your Project
          </h1>
          <p className="mb-8 text-lg sm:text-xl max-w-lg leading-relaxed text-white/90">
            Connect with skilled professionals in your area. Post your job and get matched with the best workers instantly.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link 
              to="/post-job" 
              className="btn font-bold border-none shadow-lg text-lg px-8 py-4 rounded-xl transition-all duration-300 hover:shadow-xl hover:-translate-y-1 bg-[#1DC66C] hover:bg-[#17A858] text-white"
            >
              <i className="fas fa-plus mr-2"></i>
              Post a Job
            </Link>
            <button className="btn bg-transparent border-2 border-[#1DC66C] hover:bg-[#1DC66C] text-[#1DC66C] hover:text-white font-bold shadow-lg text-lg px-8 py-4 rounded-xl transition-all duration-300">
              <i className="fas fa-search mr-2"></i>
              Browse Workers
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Banner;
