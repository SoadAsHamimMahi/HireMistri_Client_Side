import React from 'react';
import CarMechanic from '../../Images/CategoryIcon/CarMechanic.png';
import Electrician from '../../Images/CategoryIcon/Electrician.png';
import Mechanic from '../../Images/CategoryIcon/Mechanic.png';
import Plumber from '../../Images/CategoryIcon/Plumber.png';

const PopularCategories = () => {
  const categories = [
    { img: CarMechanic, label: 'Car Mechanic', count: '150+ Experts', color: 'blue' },
    { img: Electrician, label: 'Electrician', count: '200+ Experts', color: 'green' },
    { img: Mechanic, label: 'Mechanic', count: '180+ Experts', color: 'purple' },
    { img: Plumber, label: 'Plumber', count: '120+ Experts', color: 'orange' }
  ];

  return (
    <section className="py-16 bg-white w-full">
      <div className="container mx-auto px-4 lg:px-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center lg:text-left">Popular Categories</h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((cat, i) => (
            <div
              key={i}
              className="bg-[#f4f6f9] rounded-xl p-8 flex flex-col items-center sm:items-start transition-transform hover:-translate-y-1 duration-300 shadow-sm"
            >
              <div className="text-[#0a58ca] mb-6 w-14 h-14 bg-white rounded-lg flex items-center justify-center shadow-sm">
                <img className="w-8 h-8 object-contain" src={cat.img} alt={cat.label} />
              </div>

              <h3 className="text-xl font-bold text-gray-900 mb-2">{cat.label}</h3>
              <p className="text-xs font-semibold uppercase tracking-wider mb-6 text-gray-500">{cat.count}</p>

              <button className="bg-[#0a58ca] hover:bg-[#084298] text-white px-6 py-2 rounded-md text-sm font-medium transition-colors mt-auto w-full sm:w-auto">
                Find Experts
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PopularCategories;
