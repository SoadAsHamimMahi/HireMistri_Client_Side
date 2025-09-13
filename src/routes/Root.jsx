// src/routes/Root.jsx
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from '../Footer';
import { useTheme } from '../contexts/ThemeContext';


// Optional loader and action functions
export function loader() {
  return null;
}

export function action() {
  return null;
}

export default function Root() {
  const { isDarkMode } = useTheme();
  
  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <Navbar />
      <main className="">
        <Outlet />
      </main>
      <Footer></Footer>
    </div>
  );
}
