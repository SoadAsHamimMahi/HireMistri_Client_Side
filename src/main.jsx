import React from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider, createBrowserRouter } from 'react-router-dom';
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
import PostedJobDetails from './routes/MyPostedJobs/PostedJobDetails';
import MyProfile from './routes/MyProfile';

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

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </ThemeProvider>
  </React.StrictMode>
);
