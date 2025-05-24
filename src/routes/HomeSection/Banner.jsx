import React from 'react';
import BannerImage from '../../Images/BannerImage.png';
import BannerBg from '../../Images/BannerBg.png';

const Banner = () => {
  return (
    <div
      className="relative w-full h-auto md:h-[75vh] lg:h-[85vh] overflow-hidden bg-no-repeat bg-cover bg-right"
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
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">Box Office News!</h1>
          <p className="mb-6 text-base sm:text-lg max-w-md leading-relaxed">
            Provident cupiditate voluptatem et in. Quaerat fugiat ut assumenda excepturi exercitationem quasi.
            In deleniti eaque aut repudiandae et a id nisi.
          </p>
          <button className="btn bg-violet-600 text-white font-bold hover:bg-violet-700 border-none shadow-md text-sm px-5">
            Get Started
          </button>
        </div>
      </div>
    </div>
  );
};

export default Banner;
