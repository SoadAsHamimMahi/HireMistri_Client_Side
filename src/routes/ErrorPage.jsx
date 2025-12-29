// src/routes/ErrorPage.jsx
import { useRouteError } from "react-router-dom";

export default function ErrorPage() {
  const error = useRouteError();
  console.error(error);

  return (
    <div className="flex items-center justify-center min-h-screen bg-base-200">
      <div className="text-center">
        <h1 className="text-5xl font-bold text-error mb-4">Oops!</h1>
        <p className="text-lg mb-2">Sorry, an unexpected error has occurred.</p>
        <p className="text-sm text-base-content opacity-60 mb-4">
          <i>{error.statusText || error.message}</i>
        </p>
        <a href="/" className="btn btn-primary">
          Back to Home
        </a>
      </div>
    </div>
  );
}
