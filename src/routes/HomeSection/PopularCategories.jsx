import React from 'react';
import CarMechanic from '../../Images/CategoryIcon/CarMechanic.png';
import Electrician from '../../Images/CategoryIcon/Electrician.png';
import Mechanic from '../../Images/CategoryIcon/Mechanic.png';
import Plumber from '../../Images/CategoryIcon/Plumber.png';

const PopularCategories = () => {
  const categories = [
    { img: CarMechanic, label: 'Car Mechanic' },
    { img: Electrician, label: 'Electrician' },
    { img: Mechanic, label: 'Mechanic' },
    { img: Plumber, label: 'Plumber' }
  ];

  return (
    <div className="relative z-30 mt-4 md:-mt-20 w-11/12 md:w-4/5 mx-auto grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
      {categories.map((cat, i) => (
        <div key={i} className="card bg-white text-center shadow-md p-3 sm:p-5">
          <div className="card-body items-center p-0">
            <img className="w-12 sm:w-20 mx-auto mb-2" src={cat.img} alt={cat.label} />
            <h2 className="text-black font-semibold text-sm sm:text-lg">{cat.label}</h2>
            <button className="btn btn-primary btn-sm sm:btn-md mt-2">Find Experts</button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default PopularCategories;
