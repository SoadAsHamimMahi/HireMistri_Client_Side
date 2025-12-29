import React, { useState, useContext } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import loginImage from '../Images/LoginRegistration.png';
import GoogleImage from '../Images/Google.png';
import { AuthContext } from '../Authentication/AuthProvider';

const Login = () => {
  const { signIn, signInWithGoogle } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({ email: '', password: '' });
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleGoogleSignIn = async () => {
    if (submitting) return;

    try {
      setSubmitting(true);
      await signInWithGoogle();
      alert("Login successful!");
      // ✅ Redirect back to last attempted page or default to dashboard
      const redirectPath = location.state?.from?.pathname || '/';
      navigate(redirectPath, { replace: true });
    } catch (error) {
      console.error("Google login error:", error.message);
      alert(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    try {
      setSubmitting(true);
      await signIn(form.email, form.password);
      alert("Login successful!");
      // ✅ Redirect back to last attempted page or default to dashboard
      const redirectPath = location.state?.from?.pathname || '/';
      navigate(redirectPath, { replace: true });
    } catch (error) {
      console.error("Login error:", error.message);
      alert(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="bg-white dark:bg-gray-900">
      <div className="flex justify-center min-h-screen">
        <div
          className="hidden bg-cover lg:block lg:w-2/5"
          style={{ backgroundImage: `url(${loginImage})` }}
        />
        <div className="flex items-center w-full max-w-3xl p-8 mx-auto lg:px-12 lg:w-3/5">
          <div className="w-full">
            <h1 className="text-2xl font-semibold tracking-wider text-base-content">
              Log in to your account
            </h1>
            <p className="text-sm text-base-content opacity-60 mt-6">
              Don’t have an account?{' '}
              <Link to="/registration" className="text-blue-500 hover:underline">
                Register
              </Link>
            </p>

            <div className="space-y-3">
              <button 
                type="button"
                onClick={handleGoogleSignIn}
                disabled={submitting}
                className="w-full py-2 border mt-3 rounded flex items-center justify-center gap-2 hover:bg-gray-50 transition disabled:opacity-60"
              >
                <img src={GoogleImage} alt="Google" className="w-5 h-5" />
                {submitting ? 'Signing in...' : 'Continue with Google'}
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="grid grid-cols-1 gap-6 mt-8"
            >
              <div>
                <label className="block mb-2 text-sm text-base-content opacity-80">Email</label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="example@email.com"
                  className="input input-bordered w-full"
                  required
                />
              </div>

              <div>
                <label className="block mb-2 text-sm text-base-content opacity-80">Password</label>
                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  className="input input-bordered w-full"
                  required
                />
              </div>

              <div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center justify-center w-full px-6 py-3 text-white bg-blue-500 rounded-lg hover:bg-blue-400 transition disabled:opacity-60"
                >
                  {submitting ? 'Signing in...' : 'Log In'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Login;
