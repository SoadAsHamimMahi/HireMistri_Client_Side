import React from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import './index.css';

// ✅ Only import once
import Root, { loader as rootLoader, action as rootAction } from './routes/Root';
import ErrorPage from './routes/ErrorPage';
import Home from './routes/HomeSection/Home';
import PostJob from './routes/PostJob';
import Dashboard from './routes/Dashboard';
import Applications from './routes/Applications';
import WorkerProfile from './routes/WorkerProfile';
import '@fortawesome/fontawesome-free/css/all.min.css';
import PostedJobs from './routes/PostedJobs';
import PostJobWizard from './routes/PosteJobForm/PostJobWizard';



const router = createBrowserRouter([
  {
    path: '/',
    element: <Root />,
    loader: rootLoader,
    action: rootAction,
    errorElement: <ErrorPage />,
    children: [
      { path: '', element: <Home /> },
      { path: 'post-job', element: <PostJob /> },
      { path: 'dashboard', element: <Dashboard /> },
      { path: 'applications', element: <Applications /> },
      { path: 'worker/:workerId', element: <WorkerProfile /> },
      {path: 'My-Posted-Jobs', element: <PostedJobs />},
       { path: 'post-job', element: <PostJobWizard /> },
    ],
  },
]);

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
