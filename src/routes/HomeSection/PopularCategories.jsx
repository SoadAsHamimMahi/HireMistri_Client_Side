import React from 'react';
import CarMechanic from '../../Images/CategoryIcon/CarMechanic.png';
import Electrician from '../../Images/CategoryIcon/Electrician.png';
import Mechanic from '../../Images/CategoryIcon/Mechanic.png';
import Plumber from '../../Images/CategoryIcon/Plumber.png';
import { useTheme } from '../../contexts/ThemeContext';

const PopularCategories = () => {
  const { isDarkMode } = useTheme();
  const categories = [
    { img: CarMechanic, label: 'Car Mechanic', count: '150+ Experts', color: 'blue' },
    { img: Electrician, label: 'Electrician', count: '200+ Experts', color: 'green' },
    { img: Mechanic, label: 'Mechanic', count: '180+ Experts', color: 'purple' },
    { img: Plumber, label: 'Plumber', count: '120+ Experts', color: 'orange' }
  ];

  const getColorClasses = (color) => {
    switch (color) {
      case 'blue':
        return 'hover:border-blue-200 hover:shadow-blue-100';
      case 'green':
        return 'hover:border-green-200 hover:shadow-green-100';
      case 'purple':
        return 'hover:border-purple-200 hover:shadow-purple-100';
      case 'orange':
        return 'hover:border-orange-200 hover:shadow-orange-100';
      default:
        return 'hover:border-gray-200 hover:shadow-gray-100';
    }
  };

  return (
    <div className="relative z-30 mt-8 md:-mt-20 w-11/12 md:w-4/5 mx-auto">
      <div className="text-center mb-8">
        <h2 className={`text-3xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Popular Categories</h2>
        <p className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>Find skilled professionals in your area</p>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-6">
        {categories.map((cat, i) => (
          <div 
            key={i} 
            className={`group rounded-xl shadow-sm border p-6 text-center transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} ${getColorClasses(cat.color)}`}
          >
            <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <img className="w-10 h-10 object-contain" src={cat.img} alt={cat.label} />
            </div>
            <h3 className={`text-lg font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{cat.label}</h3>
            <p className={`text-sm mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{cat.count}</p>
            <button className="w-full bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-300">
              Find Experts
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PopularCategories;
