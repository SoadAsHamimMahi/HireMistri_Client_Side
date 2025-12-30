import React from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import './index.css';

import Root, { loader as rootLoader, action as rootAction } from './routes/Root';
import ErrorPage from './routes/ErrorPage';
import Home from './routes/HomeSection/Home';
import PostJob from './routes/PostJob';
import Dashboard from './routes/Dashboard';
import Applications from './routes/Applications';
import WorkerProfile from './routes/WorkerProfile';
import PostedJobs from './routes/PostedJobs';
import PostJobWizard from './routes/PosteJobForm/PostJobWizard';
import Register from './Authentication/Register';
import Login from './Authentication/Login';
import ProtectedRoute from './Authentication/ProtectedRoute';

import '@fortawesome/fontawesome-free/css/all.min.css';
import AuthProvider from './Authentication/AuthProvider';
import PublicRoute from './Authentication/PublicRoute';
import ThemeProvider from './contexts/ThemeContext';
import { MessagesProvider } from './contexts/MessagesContext';
import { WebSocketProvider } from './contexts/WebSocketContext';
import PostedJobDetails from './routes/MyPostedJobs/PostedJobDetails';
import MyProfile from './routes/MyProfile';
import EditJob from './routes/EditJob';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Root />,
    loader: rootLoader,
    action: rootAction,
    errorElement: <ErrorPage />,
    children: [
      { path: '', element: <Home /> },
      {
        path: 'registration', element: (
          <PublicRoute>
            <Register />
          </PublicRoute>
        )
      },
      {
        path: 'login', element: (
          <PublicRoute>
            <Login />
          </PublicRoute>
        )
      },

      // ✅ Protected pages
      {
        path: 'dashboard',
        element: (
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        )
      },
      {
        path: 'post-job',
        element: (
          <ProtectedRoute>
            <PostJob />
          </ProtectedRoute>
        )
      },
      {
        path: 'applications/:jobId',
        element: (
          <ProtectedRoute>
            <Applications />
          </ProtectedRoute>
        )
      },
      {
        path: 'applications',
        element: (
          <ProtectedRoute>
            <Applications />
          </ProtectedRoute>
        )
      },
      {
        path: 'worker/:workerId',
        element: (
          <ProtectedRoute>
            <WorkerProfile />
          </ProtectedRoute>
        )
      },
      {
        path: 'My-Posted-Jobs',
        element: (
          <ProtectedRoute>
            <PostedJobs />
          </ProtectedRoute>
        )
      },
      {
        path: 'My-Posted-Job-Details/:id',   // <-- must include :id
        element: (
          <ProtectedRoute>
            <PostedJobDetails />
          </ProtectedRoute>
        ),
      },
      {
        path: 'edit-job/:id',
        element: (
          <ProtectedRoute>
            <EditJob />
          </ProtectedRoute>
        ),
      },
      {
        path: 'post-job-wizard',
        element: (
          <ProtectedRoute>
            <PostJobWizard />
          </ProtectedRoute>
        )
      },
      {
        path: 'my-profile',
        element: (
          <ProtectedRoute>
            <MyProfile />
          </ProtectedRoute>
        )
      },
    ],
  },
]);

// #region agent log
try {
  fetch('http://127.0.0.1:7244/ingest/911a7613-44ba-43a9-92c1-5f0fb37aadca',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'main.jsx:139',message:'Starting React render',data:{timestamp:Date.now()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
} catch(e) {}
// #endregion

try {
  const rootElement = document.getElementById('root');
  
  // #region agent log
  fetch('http://127.0.0.1:7244/ingest/911a7613-44ba-43a9-92c1-5f0fb37aadca',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'main.jsx:145',message:'Root element check',data:{exists:!!rootElement},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion
  
  if (!rootElement) {
    throw new Error('Root element not found');
  }

  // #region agent log
  fetch('http://127.0.0.1:7244/ingest/911a7613-44ba-43a9-92c1-5f0fb37aadca',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'main.jsx:152',message:'Creating root',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion

  const root = createRoot(rootElement);

  // #region agent log
  fetch('http://127.0.0.1:7244/ingest/911a7613-44ba-43a9-92c1-5f0fb37aadca',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'main.jsx:157',message:'Rendering app',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion

  // Add error boundary
  class ErrorBoundary extends React.Component {
    constructor(props) {
      super(props);
      this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
      // #region agent log
      try {
        fetch('http://127.0.0.1:7244/ingest/911a7613-44ba-43a9-92c1-5f0fb37aadca',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'main.jsx:ErrorBoundary',message:'React error caught',data:{error:error.message,stack:error.stack},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
      } catch(e) {}
      // #endregion
      return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
      // #region agent log
      try {
        fetch('http://127.0.0.1:7244/ingest/911a7613-44ba-43a9-92c1-5f0fb37aadca',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'main.jsx:componentDidCatch',message:'Error details',data:{error:error.message,componentStack:errorInfo.componentStack},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
      } catch(e) {}
      // #endregion
      console.error('ErrorBoundary caught error:', error, errorInfo);
    }

    render() {
      if (this.state.hasError) {
        return (
          <div style={{ padding: '20px', textAlign: 'center' }}>
            <h1>Something went wrong</h1>
            <p>{this.state.error?.message}</p>
            <button onClick={() => this.setState({ hasError: false, error: null })}>
              Try again
            </button>
          </div>
        );
      }
      return this.props.children;
    }
  }

  root.render(
    <React.StrictMode>
      <ErrorBoundary>
        <ThemeProvider>
          <AuthProvider>
            <WebSocketProvider>
              <MessagesProvider>
                <RouterProvider router={router} />
              </MessagesProvider>
            </WebSocketProvider>
            <Toaster position="top-right" />
          </AuthProvider>
        </ThemeProvider>
      </ErrorBoundary>
    </React.StrictMode>
  );

  // #region agent log
  fetch('http://127.0.0.1:7244/ingest/911a7613-44ba-43a9-92c1-5f0fb37aadca',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'main.jsx:171',message:'Render completed',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion
} catch (error) {
  // #region agent log
  fetch('http://127.0.0.1:7244/ingest/911a7613-44ba-43a9-92c1-5f0fb37aadca',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'main.jsx:174',message:'Render error',data:{error:error.message,stack:error.stack},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion
  console.error('Failed to render app:', error);
}
