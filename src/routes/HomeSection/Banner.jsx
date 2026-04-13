import React from 'react';
import BannerImage from '../../Images/BannerImage.png';
import BannerBg from '../../Images/BannerBg.png';
import { Link } from 'react-router-dom';

const Banner = () => {
  return (
    <section className="relative bg-gray-100 pt-12 overflow-hidden">
      <div className="container mx-auto px-4 lg:px-8 flex flex-col lg:flex-row items-stretch gap-12">
        {/* Hero Content - Always Left on Desktop */}
        <div className="flex-1 lg:max-w-2xl text-center lg:text-left z-10 order-2 lg:order-1 mt-8 lg:mt-0 flex flex-col justify-center">
          <div className="inline-block w-fit self-center lg:self-start px-4 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-[#0a58ca] font-bold text-sm mb-6 uppercase tracking-wider">
            <i className="fas fa-bolt text-yellow-500 mr-2"></i> Instant Booking Available
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 leading-tight mb-6 tracking-tight">
            Find the <span className="text-[#0a58ca]">Perfect Worker</span><br className="hidden lg:block" /> for Your Project
          </h1>

          <p className="text-lg text-gray-600 mb-8 max-w-lg mx-auto lg:mx-0 leading-relaxed font-medium">
            Connect with skilled professionals in your area. Post your job and get matched with the top-rated workers instantly.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start w-full sm:w-auto">
            <Link
              to="/post-job"
              className="group bg-[#0a58ca] hover:bg-[#084298] text-white px-8 py-3.5 rounded-md font-bold text-lg transition-colors flex items-center justify-center gap-2 w-full sm:w-auto shadow-md shadow-blue-500/20"
            >
              Post a Job
              <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
            </Link>

            <button className="w-full sm:w-auto border-2 border-gray-200 text-gray-700 hover:bg-gray-50 px-8 py-3.5 rounded-md font-bold text-lg transition-colors flex items-center justify-center gap-2">
              <i className="fas fa-search text-[#0a58ca]"></i>
              Browse Workers
            </button>
          </div>

          <div className="mt-10 flex items-center justify-center lg:justify-start gap-4 text-sm font-semibold text-gray-500">
            <div className="flex -space-x-3">
              <img src="https://i.pravatar.cc/100?img=1" className="w-8 h-8 rounded-full border-2 border-white" alt="User" />
              <img src="https://i.pravatar.cc/100?img=2" className="w-8 h-8 rounded-full border-2 border-white" alt="User" />
              <img src="https://i.pravatar.cc/100?img=3" className="w-8 h-8 rounded-full border-2 border-white" alt="User" />
            </div>
            <span>Trusted by <span className="text-gray-900">10,000+</span> Customers</span>
          </div>

        </div>

        {/* Hero Image - Right Side on Desktop */}
        <div className="flex-1 w-full relative z-0 order-1 lg:order-2 flex items-end justify-center lg:justify-end">
          <img
            src={BannerImage}
            alt="Workers ready for project"
            className="block w-full max-h-[500px] lg:max-h-[600px] object-contain drop-shadow-2xl translate-y-[2px] -mb-px"
          />
        </div>
      </div>
    </section>
  );
};

export default Banner;
