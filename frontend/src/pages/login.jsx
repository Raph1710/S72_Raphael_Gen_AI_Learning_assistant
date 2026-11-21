import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLogo, CheckIcon, CrossIcon, GoogleIcon } from '../components/BrutalistIcons.jsx';

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const API_BASE_URL = 'http://localhost:5000/api';

  const handleLogin = async () => {
    setLoading(true); setError(''); setSuccess('');
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Login failed');
      setSuccess('Login successful!');
      if (data.token) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user || {}));
      }
      setTimeout(() => navigate('/'), 1000);
    } catch (err) {
      setError(err.message || 'An error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async () => {
    setLoading(true); setError(''); setSuccess('');
    try {
      const response = await fetch(`${API_BASE_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Signup failed');
      setSuccess('Account created! Please login.');
      setTimeout(() => { setIsLogin(true); setSuccess(''); }, 2000);
    } catch (err) {
      setError(err.message || 'An error occurred during signup');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true); setError(''); setSuccess('');
    try {
      const response = await fetch(`${API_BASE_URL}/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'google.user@gmail.com',
          username: 'Google User',
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Google login failed');
      setSuccess('Google login successful!');
      if (data.token) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user || {}));
      }
      setTimeout(() => navigate('/'), 800);
    } catch (err) {
      setError(err.message || 'An error occurred during Google login');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = () => isLogin ? handleLogin() : handleSignup();
  const handleKeyDown = (e) => { if (e.key === 'Enter') handleSubmit(); };

  const inputClass = "w-full p-4 text-lg font-bold text-black bg-white border-4 border-black outline-none transition-all duration-300 shadow-[5px_5px_0_#4f46e5] placeholder:text-gray-400 focus:border-indigo-600";

  return (
    <div className="min-h-screen text-black flex flex-col" style={{ background: "#faf7f2" }}>

      {/* Header */}
      <div className="border-b-4 border-black px-6 py-5 flex items-center justify-between" style={{ background: "#fff" }}>
        <div className="flex items-center gap-3.5">
          <AppLogo size={38} />
          <div className="relative">
            <h1 className="text-3xl font-black tracking-tight uppercase">Gen AI Assistant</h1>
            <div className="absolute -bottom-1 left-0 w-24 h-1" style={{ background: "#f59e0b" }}></div>
          </div>
        </div>
        <button
          onClick={() => navigate('/')}
          className="group relative inline-block border-2 border-black bg-transparent font-bold text-[13px] tracking-[0.05em] px-8 py-4 transition-all duration-300 hover:bg-black hover:text-white text-black uppercase cursor-pointer overflow-visible"
        >
          <span className="absolute top-1/2 left-6 h-[2px] w-6 bg-black -translate-y-1/2 transition-all duration-300 group-hover:w-4 group-hover:bg-white"></span>
          <span className="block pl-8 text-left text-[15px] transition-all duration-300 group-hover:pl-6">Back</span>
        </button>
      </div>

      {/* Main */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">

          {/* Tab switcher */}
          <div className="flex border-2 border-black">
            <button
              onClick={() => { setIsLogin(true); setError(''); setSuccess(''); }}
              className="flex-1 py-4 font-black uppercase text-sm tracking-wide transition-all duration-200 text-white"
              style={isLogin ? { background: "#4f46e5" } : { background: "#e0e4ff", color: "#1e1b4b" }}
              onMouseEnter={(e) => { if (!isLogin) e.target.style.background = "#c7d2fe"; }}
              onMouseLeave={(e) => { if (!isLogin) e.target.style.background = "#e0e4ff"; }}
            >
              Login
            </button>
            <div className="w-[2px] bg-black"></div>
            <button
              onClick={() => { setIsLogin(false); setError(''); setSuccess(''); }}
              className="flex-1 py-4 font-black uppercase text-sm tracking-wide transition-all duration-200"
              style={!isLogin ? { background: "#4f46e5", color: "#fff" } : { background: "#e0e4ff", color: "#1e1b4b" }}
              onMouseEnter={(e) => { if (isLogin) e.target.style.background = "#c7d2fe"; }}
              onMouseLeave={(e) => { if (isLogin) e.target.style.background = "#e0e4ff"; }}
            >
              Sign Up
            </button>
          </div>

          {/* Card */}
          <div className="border-2 border-t-0 border-black p-8" style={{ background: "#eef0ff" }}>

            {error && (
              <div className="mb-6 p-4 border-2 font-bold text-sm uppercase tracking-wide flex items-center gap-2"
                style={{ borderColor: "#ef4444", background: "#fef2f2", color: "#b91c1c" }}>
                <CrossIcon size={14} />
                <span>{error}</span>
              </div>
            )}
            {success && (
              <div className="mb-6 p-4 border-2 font-bold text-sm uppercase tracking-wide flex items-center gap-2"
                style={{ borderColor: "#10b981", background: "#f0fdf4", color: "#065f46" }}>
                <CheckIcon size={14} />
                <span>{success}</span>
              </div>
            )}

            <div onKeyDown={handleKeyDown}>
              {!isLogin && (
                <div className="relative font-mono mb-8">
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your username"
                    className={inputClass}
                  />
                  <label className="absolute -left-1 -top-9 text-sm font-bold text-white px-3 py-1 -rotate-1" style={{ background: "#4f46e5" }}>
                    USERNAME
                  </label>
                </div>
              )}

              <div className="relative font-mono mb-8">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className={inputClass}
                />
                <label className="absolute -left-1 -top-9 text-sm font-bold text-white px-3 py-1 -rotate-1" style={{ background: "#4f46e5" }}>
                  EMAIL
                </label>
              </div>

              <div className="relative font-mono mb-8">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className={inputClass}
                />
                <label className="absolute -left-1 -top-9 text-sm font-bold text-white px-3 py-1 -rotate-1" style={{ background: "#4f46e5" }}>
                  PASSWORD
                </label>
              </div>

              <button
                onClick={handleSubmit}
                disabled={loading}
                className={`w-full py-4 border-2 border-black font-black uppercase text-sm tracking-widest transition-all duration-200 text-white
                  ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:opacity-90'}`}
                style={{ background: loading ? "#a5b4fc" : "#4f46e5" }}
              >
                {loading ? 'Processing...' : isLogin ? 'Login' : 'Create Account'}
              </button>
            </div>

            {/* Divider */}
            <div className="my-6 flex items-center gap-4">
              <div className="flex-1 h-[2px] bg-black"></div>
              <span className="font-bold text-sm uppercase tracking-widest">or</span>
              <div className="flex-1 h-[2px] bg-black"></div>
            </div>

            {/* Google */}
            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              type="button"
              className="w-full py-4 border-2 border-black bg-white font-bold uppercase text-sm tracking-wide hover:bg-indigo-50 transition-all duration-200 flex items-center justify-center gap-3 cursor-pointer shadow-[3px_3px_0_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
            >
              <GoogleIcon size={20} />
              <span>Continue with Google</span>
            </button>
          </div>

          <p className="text-center mt-4 text-xs font-bold uppercase tracking-wide" style={{ color: "#6b7280" }}>
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
}
