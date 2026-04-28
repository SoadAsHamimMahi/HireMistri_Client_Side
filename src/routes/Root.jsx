// src/routes/Root.jsx
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import { useTheme } from '../contexts/ThemeContext';


// Optional loader and action functions
export function loader() {
  return null;
}

export function action() {
  return null;
}

export default function Root() {
  const location = useLocation();
  const isMessagesPage = location.pathname.startsWith('/chats') || location.pathname.startsWith('/messages');

  return (
      <div className={`${isMessagesPage ? 'h-screen overflow-hidden' : 'min-h-screen'} app-root transition-colors duration-300 flex flex-col overflow-x-hidden`}>
        <Navbar />
        <main className="flex-1 w-full relative min-h-0">
          <Outlet />
        </main>
        {!isMessagesPage && <Footer />}
      </div>
  );
}
