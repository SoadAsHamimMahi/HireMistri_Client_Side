import React, { useState, useContext } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import loginImage from '../Images/LoginRegistration.png';
import GoogleImage from '../Images/Google.png';
import { AuthContext } from '../Authentication/AuthProvider';

const Login = () => {
  const { signIn } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({ email: '', password: '' });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await signIn(form.email, form.password);
      alert("Login successful!");
      // ✅ Redirect back to last attempted page or default to dashboard
      const redirectPath = location.state?.from?.pathname || '/dashboard';
      navigate(redirectPath, { replace: true });
    } catch (error) {
      console.error("Login error:", error.message);
      alert(error.message);
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
            <h1 className="text-2xl font-semibold tracking-wider text-gray-800 dark:text-white">
              Log in to your account
            </h1>
            <p className="text-sm text-gray-500 mt-6">
              Don’t have an account?{' '}
              <Link to="/registration" className="text-blue-500 hover:underline">
                Register
              </Link>
            </p>

            <div className="space-y-3 text-white">
              <button className="w-full py-2 border mt-3 rounded flex items-center justify-center gap-2">
                <img src={GoogleImage} alt="Google" className="w-5 h-5" />
                Continue with Google
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="grid grid-cols-1 gap-6 mt-8"
            >
              <div>
                <label className="block mb-2 text-sm text-gray-600 dark:text-gray-200">Email</label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="example@email.com"
                  className="block w-full px-5 py-3 mt-2 border rounded-lg dark:bg-gray-900 dark:text-gray-300"
                  required
                />
              </div>

              <div>
                <label className="block mb-2 text-sm text-gray-600 dark:text-gray-200">Password</label>
                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  className="block w-full px-5 py-3 mt-2 border rounded-lg dark:bg-gray-900 dark:text-gray-300"
                  required
                />
              </div>

              <div>
                <button
                  type="submit"
                  className="flex items-center justify-center w-full px-6 py-3 text-white bg-blue-500 rounded-lg hover:bg-blue-400 transition"
                >
                  Log In
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
