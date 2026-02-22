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
  return (
      <div className="min-h-screen app-root transition-colors duration-300 flex flex-col overflow-x-hidden">
        <Navbar />
        <main className="flex-1 w-full max-w-7xl mx-auto">
          <Outlet />
        </main>
        <Footer></Footer>
      </div>
  );
}
