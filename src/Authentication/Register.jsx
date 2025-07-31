import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import regImage from '../Images/LoginRegistration.png';
import GoogleImage from '../Images/Google.png';
import { AuthContext } from './AuthProvider';


const Register = () => {
  const { createUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const user = userCredential.user;


  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'client',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (form.password !== form.confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    // Send data to backend API for MongoDB storage

    await axios.post("http://localhost:5000/api/users", {
  uid: user.uid,
  firstName: form.firstName,
  lastName: form.lastName,
  phone: form.phone,
  email: form.email,
  role: form.role
});

    try {
    const userCredential = await signup(form.email, form.password);
    const user = userCredential.user;

    // ✅ Save user info in Firestore
    await setDoc(doc(db, "users", user.uid), {
      uid: user.uid,
      firstName: form.firstName,
      lastName: form.lastName,
      phone: form.phone,
      email: form.email,
      role: form.role,
      createdAt: new Date()
    });
       alert("Registration successful!");
    navigate('/dashboard');
  } catch (error) {
    console.error("Signup error:", error.message);
    alert(error.message);
  
};
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

            <div className="space-y-3 text-white">
              <button className="w-full py-2 border mt-3 rounded flex items-center justify-center gap-2">
                <img src={GoogleImage} alt="Google" className="w-5 h-5" />
                Continue with Google
              </button>
            </div>

            <div className="mt-6">
              <div className="mt-3 md:flex md:items-center md:-mx-2">
                <h3 className="justify-center px-6 py-3 mt-4 text-green-500 border">Client</h3>
              </div>
            </div>

            <form
              onSubmit={handleSubmit}
              className="grid grid-cols-1 gap-6 mt-8 md:grid-cols-2"
            >
              {/* Inputs */}
              {['firstName','lastName','phone','email','password','confirmPassword'].map((field, index) => (
                <div key={index} className={index > 3 ? 'md:col-span-1' : ''}>
                  <label className="block mb-2 text-sm text-gray-600 dark:text-gray-200">
                    {field.replace(/([A-Z])/g, ' $1')}
                  </label>
                  <input
                    type={field.includes('password') ? 'password' : 'text'}
                    name={field}
                    value={form[field]}
                    onChange={handleChange}
                    placeholder={field}
                    className="block w-full px-5 py-3 mt-2 border rounded-lg dark:bg-gray-900 dark:text-gray-300"
                    required
                  />
                </div>
              ))}

              <div className="col-span-2">
                <button
                  type="submit"
                  className="flex items-center justify-center w-full px-6 py-3 text-white bg-blue-500 rounded-lg hover:bg-blue-400 transition"
                >
                  <span>Sign Up</span>
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
