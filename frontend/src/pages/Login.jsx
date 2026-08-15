import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../hooks/useAuth';
import { 
  ShieldCheck, 
  Compass, 
  AlertCircle, 
  Loader2, 
  Eye, 
  EyeOff, 
  Lock, 
  User
} from 'lucide-react';

const extractErrorMessage = (err) => {
  const detail = err.response?.data?.detail;
  if (!detail) {
    return err.message || 'An unexpected error occurred.';
  }
  if (typeof detail === 'string') {
    return detail;
  }
  if (Array.isArray(detail)) {
    return detail.map(d => {
      const field = d.loc && d.loc.length > 1 ? d.loc.slice(1).join('.') : '';
      return `${field ? field + ': ' : ''}${d.msg}`;
    }).join(', ');
  }
  if (typeof detail === 'object') {
    return JSON.stringify(detail);
  }
  return 'Authentication failed.';
};

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [tempGoogleToken, setTempGoogleToken] = useState('');
  const [selectedGoogleRole, setSelectedGoogleRole] = useState('Wildlife Researcher');
  
  const { login, googleLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  const handleGoogleSuccess = async (credentialResponse) => {
    setError('');
    setLoading(true);
    try {
      const res = await googleLogin(credentialResponse.credential);
      if (res && res.registration_incomplete) {
        setTempGoogleToken(credentialResponse.credential);
        setShowRoleModal(true);
      } else {
        navigate(from, { replace: true });
      }
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleRoleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await googleLogin(tempGoogleToken, selectedGoogleRole);
      setShowRoleModal(false);
      navigate(from, { replace: true });
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    setError('Google Sign-In failed.');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (demoUser, demoPassword) => {
    setError('');
    setLoading(true);
    try {
      await login(demoUser, demoPassword);
      navigate(from, { replace: true });
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-white">

      {/* Left: Wildlife Hero Section */}
      <div className="relative hidden w-1/2 lg:flex flex-col justify-between p-12 overflow-hidden bg-cover bg-center select-none"
           style={{ backgroundImage: "url('/assets/images/login_deer_hero.png')" }}>
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-2xs bg-gradient-to-tr from-slate-950 via-slate-950/80 to-emerald-950/20" />
        
        {/* Top Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400">
            <Compass className="h-6 w-6 animate-pulse" />
          </div>
          <span className="text-xl font-bold tracking-wider text-slate-100 uppercase">WPIS</span>
        </div>

        {/* Center Captions */}
        <div className="relative z-10 space-y-6 max-w-lg my-auto">
          <h1 className="text-4xl font-extrabold tracking-tight text-white leading-tight">
            Wildlife Population <br/>
            <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              Intelligence System
            </span>
          </h1>
          <p className="text-sm font-semibold text-emerald-400 uppercase tracking-widest">
            AI-Powered Biodiversity Monitoring & Conservation Platform
          </p>
          <p className="text-slate-300 text-base leading-relaxed">
            Protect wildlife through Artificial Intelligence, Computer Vision, Bioacoustic Analysis, and Data Analytics. Audit live surveys, sensor arrays, and species patterns in real-time.
          </p>
        </div>

        {/* Bottom Credits */}
        <div className="relative z-10 flex items-center justify-between text-xs text-slate-500 font-medium">
          <span>© 2026 WPIS Core. All Rights Reserved.</span>
          <span>Milestone 1 Production Suite</span>
        </div>
      </div>

      {/* Right: Login Form Column */}
      <div className="flex w-full lg:w-1/2 flex-col justify-center px-6 py-12 sm:px-12 lg:px-20 z-10">
        <div className="mx-auto w-full max-w-md space-y-8 animate-fade-in">
          {/* Header on mobile */}
          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Welcome Back
            </h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Sign in to manage your biodiversity monitoring node.
            </p>
          </div>

          {/* Form Card */}
          <div className="glass-card p-8 bg-slate-50/50 dark:bg-slate-900/40">
            <form className="space-y-5" onSubmit={handleSubmit}>
              {error && (
                <div className="flex items-center gap-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/30 p-4 text-sm text-rose-600 dark:text-rose-450">
                  <AlertCircle className="h-5 w-5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-4">
                {/* Username field */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                    Username or Email
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="block w-full rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 pl-11 pr-4 py-3 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:border-emerald-500 dark:focus:border-emerald-500 outline-none transition-all text-sm"
                      placeholder="Enter username"
                    />
                  </div>
                </div>

                {/* Password field */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Password
                    </label>
                    <a href="#forgot" className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline">
                      Forgot Password?
                    </a>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="block w-full rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 pl-11 pr-11 py-3 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:border-emerald-500 dark:focus:border-emerald-500 outline-none transition-all text-sm"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-3.5 text-slate-400 hover:text-slate-200"
                    >
                      {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Remember me */}
              <div className="flex items-center">
                <input
                  id="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="remember-me" className="ml-2 text-sm text-slate-600 dark:text-slate-400 font-semibold select-none">
                  Remember my session
                </label>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="flex w-full justify-center items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 dark:bg-emerald-600 dark:hover:bg-emerald-500 py-3 text-sm font-semibold text-white shadow-lg transition-all duration-200 hover:scale-101"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <span>Sign In</span>
                )}
              </button>
            </form>

            <div className="relative mt-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200 dark:border-slate-800"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-slate-50 dark:bg-slate-900/40 px-2 text-slate-500 font-bold uppercase tracking-widest">
                  OR
                </span>
              </div>
            </div>

            <div className="mt-6 flex justify-center">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                useOneTap
                theme="outline"
                shape="pill"
                size="large"
              />
            </div>

            <div className="mt-5 text-center text-xs text-slate-500 dark:text-slate-400">
              Need to register a node?{' '}
              <Link to="/register" className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline">
                Create an account
              </Link>
            </div>

            {/* Quick Demo Logins */}
            <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800">
              <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4 text-center">
                Quick Demo Logins
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleQuickLogin('admin', 'Admin@123')}
                  disabled={loading}
                  className="flex flex-col items-center justify-center p-3.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500/50 hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-all group"
                >
                  <ShieldCheck className="h-5 w-5 text-emerald-500 mb-1.5 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Administrator</span>
                  <span className="text-3xs text-slate-400 dark:text-slate-500">admin / Admin@123</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickLogin('researcher', 'Admin@123')}
                  disabled={loading}
                  className="flex flex-col items-center justify-center p-3.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-teal-500 dark:hover:border-teal-500/50 hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-all group"
                >
                  <Compass className="h-5 w-5 text-teal-500 mb-1.5 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Researcher</span>
                  <span className="text-3xs text-slate-400 dark:text-slate-500">researcher / Admin@123</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Role Selection Modal for Google OAuth */}
      {showRoleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="glass-card w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 flex flex-col space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-emerald-500" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Complete Registration</h3>
              </div>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Welcome! Please select your target role to complete your WPIS profile setup.
            </p>

            <form onSubmit={handleRoleSubmit} className="space-y-6">
              <div className="space-y-3">
                <label className="block text-2xs font-bold text-slate-550 dark:text-slate-400 uppercase tracking-wider">
                  Select System Role
                </label>
                <select
                  value={selectedGoogleRole}
                  onChange={(e) => setSelectedGoogleRole(e.target.value)}
                  className="block w-full rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-4 py-2.5 text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-500 transition-all text-xs"
                >
                  <option value="Wildlife Researcher">Wildlife Researcher</option>
                  <option value="Conservation Officer">Conservation Officer</option>
                  <option value="Forest Department Officer">Forest Department Officer</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-205 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => { setShowRoleModal(false); setError(''); }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 shadow-lg transition-colors flex items-center gap-1.5"
                >
                  {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>Confirm & Access</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
