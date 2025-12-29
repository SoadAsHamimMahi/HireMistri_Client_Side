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
    <div className="min-h-screen bg-base-100 transition-colors duration-300">
      <Navbar />
      <main className="min-h-[calc(100vh-200px)]">
        <Outlet />
      </main>
      <Footer></Footer>
    </div>
  );
}
