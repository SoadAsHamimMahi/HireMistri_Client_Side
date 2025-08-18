// src/routes/Root.jsx
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from '../Footer';


// Optional loader and action functions
export function loader() {
  return null;
}

export function action() {
  return null;
}

export default function Root() {
  return (
    <div className=''>
      <Navbar />
      <main className="p-2">
        <Outlet />
      </main>
      <Footer></Footer>
    </div>
  );
}
