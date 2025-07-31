import React from 'react';
import BannerImage from '../../Images/BannerImage.png';
import BannerBg from '../../Images/BannerBg.png';
import { Link } from 'react-router-dom';

const Banner = () => {
  return (
    <div
      className="relative w-full mx-auto h-auto md:h-[75vh] lg:h-[85vh] overflow-hidden bg-no-repeat bg-cover bg-right"
      style={{
        backgroundImage: `url(${BannerBg})`,
      }}
    >
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
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">Empower Your Work with Hire<span className='text-green-400'>Mistri!</span></h1>
          <p className="mb-6 text-base sm:text-lg max-w-md leading-relaxed">
           Find skilled workers fast with real-time hiring.
          </p>
          <button className="btn bg-green-500 text-white font-bold hover:bg-green-900 border-none shadow-md text-xl px-5 py-3">
        <Link to="/post-job">Post Job</Link>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Banner;
