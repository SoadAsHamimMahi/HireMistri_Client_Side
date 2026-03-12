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
    <div className="relative z-30 mt-8 md:-mt-16 w-full px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-extrabold mb-3 text-white tracking-tight">Popular Categories</h2>
        <p className="text-slate-400 text-sm font-medium">Find highly-rated skilled professionals in your area instantly</p>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {categories.map((cat, i) => (
          <div 
            key={i} 
            className="group card bg-[#121a2f] backdrop-blur-xl border border-slate-800/80 p-6 text-center transition-all duration-500 hover:shadow-[0_8px_30px_rgba(37,99,235,0.15)] hover:border-blue-500/40 hover:-translate-y-2 rounded-2xl relative overflow-hidden"
          >
            {/* Subtle glow effect behind card on hover */}
            <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-blue-500/0 via-blue-500 to-blue-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

            <div className="w-16 h-16 mx-auto mb-5 rounded-2xl flex items-center justify-center transition-transform duration-500 group-hover:scale-110 bg-[#172136] shadow-inner border border-slate-700/50 relative">
              <img className="w-10 h-10 object-contain drop-shadow-md z-10 relative" src={cat.img} alt={cat.label} />
              <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            </div>
            
            <h3 className="text-lg font-bold mb-1 text-white group-hover:text-blue-400 transition-colors">{cat.label}</h3>
            <p className="text-xs font-semibold uppercase tracking-wider mb-5 text-slate-500">{cat.count}</p>
            
            <button className="w-full bg-[#1e293b] hover:bg-blue-600 text-slate-300 hover:text-white font-bold py-2.5 rounded-xl border border-slate-700/50 hover:border-blue-500 transition-all duration-300 text-sm shadow-sm group-hover:shadow-[0_4px_14px_0_rgba(37,99,235,0.39)]">
              Find Experts
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PopularCategories;
