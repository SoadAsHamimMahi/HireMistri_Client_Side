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
  // #region agent log
  try {
    fetch('http://127.0.0.1:7244/ingest/911a7613-44ba-43a9-92c1-5f0fb37aadca',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Root.jsx:17',message:'Root component rendering',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
  } catch(e) {}
  // #endregion

  try {
    return (
      <div className="min-h-screen bg-base-100 transition-colors duration-300">
        <Navbar />
        <main className="min-h-[calc(100vh-200px)]">
          <Outlet />
        </main>
        <Footer></Footer>
      </div>
    );
  } catch (error) {
    // #region agent log
    try {
      fetch('http://127.0.0.1:7244/ingest/911a7613-44ba-43a9-92c1-5f0fb37aadca',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Root.jsx:28',message:'Root render error',data:{error:error.message,stack:error.stack},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
    } catch(e) {}
    // #endregion
    console.error('Root component error:', error);
    return <div>Error in Root component: {error.message}</div>;
  }
}
