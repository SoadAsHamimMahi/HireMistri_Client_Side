import React from 'react';
import ErrorBoundary from './components/ErrorBoundary';
import { createRoot } from 'react-dom/client';
import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import './index.css';

import Root, { loader as rootLoader, action as rootAction } from './routes/Root';
import ErrorPage from './routes/ErrorPage';
import Home from './routes/Home/Home';
import PostJob from './routes/PostJob';
import Dashboard from './routes/Dashboard';
import Applications from './routes/Applications';
import WorkerProfile from './routes/WorkerProfile';
import PostedJobs from './routes/PostedJobs/PostedJobsList';
import PostJobWizard from './routes/PostJobForm/PostJobWizard';
import Register from './Authentication/Register';
import Login from './Authentication/Login';
import ProtectedRoute from './Authentication/ProtectedRoute';

import '@fortawesome/fontawesome-free/css/all.min.css';
import AuthProvider from './Authentication/AuthProvider';
import PublicRoute from './Authentication/PublicRoute';
import ThemeProvider from './contexts/ThemeContext';
import { MessagesProvider } from './contexts/MessagesContext';
import { WebSocketProvider } from './contexts/WebSocketContext';
import PostedJobDetails from './routes/PostedJobs/PostedJobDetails';
import MyProfile from './routes/MyProfile';
import EditJob from './routes/EditJob';
import MessagesPaused from './routes/Messages/MessagesPaused';
import MessagesInbox from './routes/Messages/MessagesInbox';
import SupportInbox from './routes/Support/SupportInbox';
import ApplicationDetail from './routes/ApplicationDetail';

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
      {
        path: 'messages',
        element: (
          <ProtectedRoute>
            <MessagesPaused />
          </ProtectedRoute>
        )
      },
      {
        path: 'messages/:conversationId',
        element: (
          <ProtectedRoute>
            <MessagesPaused />
          </ProtectedRoute>
        )
      },
      {
        path: 'chats',
        element: (
          <ProtectedRoute>
            <MessagesInbox basePath="chats" />
          </ProtectedRoute>
        )
      },
      {
        path: 'chats/:conversationId',
        element: (
          <ProtectedRoute>
            <MessagesInbox basePath="chats" />
          </ProtectedRoute>
        )
      },
      {
        path: 'support',
        element: (
          <ProtectedRoute>
            <SupportInbox />
          </ProtectedRoute>
        )
      },
      {
        path: 'support/:ticketId',
        element: (
          <ProtectedRoute>
            <SupportInbox />
          </ProtectedRoute>
        )
      },
      {
        path: 'application-detail/:applicationId',
        element: (
          <ProtectedRoute>
            <ApplicationDetail />
          </ProtectedRoute>
        )
      },
    ],
  },
]);

try {
  const rootElement = document.getElementById('root');

  if (!rootElement) {
    throw new Error('Root element not found');
  }

  const root = createRoot(rootElement);

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

} catch (error) {
  console.error('Failed to render app:', error);
}
