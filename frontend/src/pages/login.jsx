import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import googleLogo from '../assets/google.png';

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  // API endpoint base URL
  //http://localhost:5000/api/
  //https://s72-raphael-gen-ai-learning-assistant.onrender.com/api
  const API_BASE_URL = `https://s72-raphael-gen-ai-learning-assistant.onrender.com/api`;

  const handleLogin = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      setSuccess('Login successful!');
      console.log('Login successful:', data);

      //Store token and redirect
      if (data.token) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user || {}));
      }

      setTimeout(() => {
        navigate('/'); //Redirect to home after short delay
      }, 1000);

    } catch (err) {
      setError(err.message || 'An error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`${API_BASE_URL}/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Signup failed');
      }

      setSuccess('Account created successfully! Please login.');
      console.log('Signup successful:', data);

      setTimeout(() => {
        setIsLogin(true);
        setSuccess('');
      }, 2000);

    } catch (err) {
      setError(err.message || 'An error occurred during signup');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = () => {
    if (isLogin) {
      handleLogin();
    } else {
      handleSignup();
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-indigo-900 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-xl sm:text-2xl font-bold text-indigo-400 whitespace-nowrap">
            🧠 Gen AI Reading Assistant
          </h1>
          <p className="text-gray-400">Your intelligent document companion</p>
        </div>

        {/* Login/Signup Card */}
        <div className="bg-gray-800 rounded-2xl shadow-2xl border border-gray-700 overflow-hidden">
          {/* Tab Switcher */}
          <div className="flex border-b border-gray-700">
            <button
              onClick={() => {
                setIsLogin(true);
                setError('');
                setSuccess('');
              }}
              className={`flex-1 py-4 text-center font-semibold transition-all duration-200 ${
                isLogin
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-750'
              }`}
            >
              Login
            </button>
            <button
              onClick={() => {
                setIsLogin(false);
                setError('');
                setSuccess('');
              }}
              className={`flex-1 py-4 text-center font-semibold transition-all duration-200 ${
                !isLogin
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-750'
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Form Content */}
          <div className="p-8">
            {error && (
              <div className="mb-6 p-4 bg-red-900 bg-opacity-50 border border-red-700 rounded-xl text-red-200 text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-6 p-4 bg-green-900 bg-opacity-50 border border-green-700 rounded-xl text-green-200 text-sm">
                {success}
              </div>
            )}

            <div onKeyPress={handleKeyPress}>
              {!isLogin && (
                <div className="mb-6">
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    Username
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-900 border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 transition-all"
                    placeholder="Enter your username"
                    required
                  />
                </div>
              )}

              <div className="mb-6">
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 transition-all"
                  placeholder="Enter your email"
                  required
                />
              </div>

              <div className="mb-6">
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 transition-all"
                  placeholder="Enter your password"
                  required
                />
              </div>

              {isLogin && (
                <div className="mb-6 text-right">
                  <button
                    type="button"
                    className="text-indigo-400 text-sm hover:text-indigo-300 transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              <button
                onClick={handleSubmit}
                disabled={loading}
                className={`w-full py-3 px-6 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-500 hover:shadow-lg transform hover:scale-105 transition-all duration-200 ${
                  loading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {loading ? 'Processing...' : isLogin ? 'Login' : 'Create Account'}
              </button>
            </div>

            {/* Divider */}
            <div className="my-6 flex items-center">
              <div className="flex-1 border-t border-gray-600"></div>
              <span className="px-4 text-gray-500 text-sm">or</span>
              <div className="flex-1 border-t border-gray-600"></div>
            </div>

            {/* Social Login Buttons */}
            <div className="space-y-3">
              <button className="w-full py-3 px-6 bg-gray-700 text-white font-medium rounded-xl hover:bg-gray-600 transition-all duration-200 flex items-center justify-center gap-2">
                <img src={googleLogo} alt="Google" className="w-5 h-5" /> Continue with Google
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-gray-500 text-sm">
          <p>By continuing, you agree to our Terms of Service and Privacy Policy</p>
        </div>
      </div>
    </div>
  );
}
