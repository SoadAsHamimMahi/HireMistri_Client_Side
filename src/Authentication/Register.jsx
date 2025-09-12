import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import regImage from '../Images/LoginRegistration.png';
import GoogleImage from '../Images/Google.png';
import { AuthContext } from './AuthProvider';

const Register = () => {
  const { createUser, signInWithGoogle } = useContext(AuthContext); // make sure AuthProvider exports this
  const navigate = useNavigate();

  const base = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '');

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'client',
  });

  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleGoogleSignUp = async () => {
    if (submitting) return;

    try {
      setSubmitting(true);

      // 1) Sign in with Google (Firebase)
      const result = await signInWithGoogle();
      const user = result?.user;
      if (!user) throw new Error('Google signup succeeded but no user returned');

      // 2) Save the user profile to your backend (Mongo)
      await axios.post(`${base}/api/users`, {
        uid: user.uid,
        firstName: user.displayName?.split(' ')[0] || 'Google',
        lastName: user.displayName?.split(' ').slice(1).join(' ') || 'User',
        phone: user.phoneNumber || '',
        email: user.email,
        role: 'client',
        createdAt: new Date().toISOString(),
      });

      alert('Registration successful!');
      navigate('/dashboard');
    } catch (error) {
      console.error('Google signup error:', error);
      alert(error?.message || 'Google registration failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    if (form.password !== form.confirmPassword) {
      alert('Passwords do not match.');
      return;
    }

    try {
      setSubmitting(true);

      // 1) Create the auth user (Firebase)
      // If your context uses a different fn name, replace createUser with signup/register/etc.
      const userCredential = await createUser(form.email, form.password);
      const user = userCredential?.user;
      if (!user) throw new Error('Signup succeeded but no user returned');

      // 2) Save the user profile to your backend (Mongo)
      await axios.post(`${base}/api/users`, {
        uid: user.uid,
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone,
        email: form.email,
        role: form.role,
        createdAt: new Date().toISOString(),
      });

      alert('Registration successful!');
      navigate('/dashboard');
    } catch (error) {
      console.error('Signup error:', error);
      alert(error?.message || 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="bg-white dark:bg-gray-900">
      <div className="flex justify-center min-h-screen">
        <div
          className="hidden bg-cover lg:block lg:w-2/5"
          style={{ backgroundImage: `url(${regImage})` }}
        />
        <div className="flex items-center w-full max-w-3xl p-8 mx-auto lg:px-12 lg:w-3/5">
          <div className="w-full">
            <h1 className="text-2xl font-semibold tracking-wider text-gray-800 dark:text-white">
              Create a new account
            </h1>

            <p className="text-sm text-gray-500 mt-6">
              Already have an account?{' '}
              <Link to="/login" className="text-blue-500 hover:underline">
                Log in
              </Link>
            </p>

            <div className="space-y-3">
              <button 
                type="button" 
                onClick={handleGoogleSignUp}
                disabled={submitting}
                className="w-full py-2 border mt-3 rounded flex items-center justify-center gap-2 hover:bg-gray-50 transition disabled:opacity-60"
              >
                <img src={GoogleImage} alt="Google" className="w-5 h-5" />
                {submitting ? 'Signing up...' : 'Continue with Google'}
              </button>
            </div>

            <div className="mt-6">
              <div className="mt-3 md:flex md:items-center md:-mx-2">
                <h3 className="justify-center px-6 py-3 mt-4 text-green-500 border">Client</h3>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 mt-8 md:grid-cols-2">
              {/* First Name */}
              <div>
                <label className="block mb-2 text-sm text-gray-600 dark:text-gray-200">First Name</label>
                <input
                  type="text"
                  name="firstName"
                  value={form.firstName}
                  onChange={handleChange}
                  placeholder="First Name"
                  className="block w-full px-5 py-3 mt-2 border rounded-lg dark:bg-gray-900 dark:text-gray-300"
                  required
                />
              </div>

              {/* Last Name */}
              <div>
                <label className="block mb-2 text-sm text-gray-600 dark:text-gray-200">Last Name</label>
                <input
                  type="text"
                  name="lastName"
                  value={form.lastName}
                  onChange={handleChange}
                  placeholder="Last Name"
                  className="block w-full px-5 py-3 mt-2 border rounded-lg dark:bg-gray-900 dark:text-gray-300"
                  required
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block mb-2 text-sm text-gray-600 dark:text-gray-200">Phone</label>
                <input
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="01XXXXXXXXX"
                  className="block w-full px-5 py-3 mt-2 border rounded-lg dark:bg-gray-900 dark:text-gray-300"
                  required
                />
              </div>

              {/* Email */}
              <div>
                <label className="block mb-2 text-sm text-gray-600 dark:text-gray-200">Email</label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  className="block w-full px-5 py-3 mt-2 border rounded-lg dark:bg-gray-900 dark:text-gray-300"
                  required
                />
              </div>

              {/* Password */}
              <div>
                <label className="block mb-2 text-sm text-gray-600 dark:text-gray-200">Password</label>
                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Password"
                  className="block w-full px-5 py-3 mt-2 border rounded-lg dark:bg-gray-900 dark:text-gray-300"
                  required
                />
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block mb-2 text-sm text-gray-600 dark:text-gray-200">Confirm Password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm Password"
                  className="block w-full px-5 py-3 mt-2 border rounded-lg dark:bg-gray-900 dark:text-gray-300"
                  required
                />
              </div>

              {/* Submit */}
              <div className="col-span-1 md:col-span-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center justify-center w-full px-6 py-3 text-white bg-blue-500 rounded-lg hover:bg-blue-400 transition disabled:opacity-60"
                >
                  <span>{submitting ? 'Signing up…' : 'Sign Up'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Register;
