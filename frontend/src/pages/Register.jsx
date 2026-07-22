import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { Compass, AlertCircle, CheckCircle, Loader2, Sun, Moon, Eye, EyeOff, ShieldCheck } from 'lucide-react';

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
  return 'Registration failed.';
};

const Register = () => {
  const [fullName, setFullName] = useState(''); // UI placeholder for future integration
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState('Wildlife Researcher');
  const [showPassword, setShowPassword] = useState(false);
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [tempGoogleToken, setTempGoogleToken] = useState('');
  const [selectedGoogleRole, setSelectedGoogleRole] = useState('Wildlife Researcher');

  const { register, googleLogin } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleGoogleSuccess = async (credentialResponse) => {
    setError('');
    setLoading(true);
    try {
      const res = await googleLogin(credentialResponse.credential);
      if (res && res.registration_incomplete) {
        setTempGoogleToken(credentialResponse.credential);
        setShowRoleModal(true);
      } else {
        navigate('/');
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
      navigate('/');
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
    setSuccess(false);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      // Send only the parameters the backend schema expects: username, email, password, roles
      await register(username, email, password, [selectedRole]);
      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const roles = [
    { name: 'Wildlife Researcher', desc: 'Conducts wildlife monitoring and surveys' },
    { name: 'Conservation Officer', desc: 'Manages protected areas and monitoring sites' },
    { name: 'Forest Department Officer', desc: 'Operates field traps, sensors, and observations' },
    { name: 'Administrator', desc: 'Full administrative access and user management' }
  ];

  return (
    <div className="flex min-h-screen bg-white dark:bg-slate-950 transition-colors duration-300">
      {/* Theme Toggle */}
      <div className="absolute top-6 right-6 z-30">
        <button
          onClick={toggleTheme}
          className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:scale-105 transition-all"
        >
          {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>
      </div>

      {/* Left: Wildlife Hero Section */}
      <div className="relative hidden w-1/2 lg:flex flex-col justify-between p-12 overflow-hidden bg-cover bg-center select-none"
           style={{ backgroundImage: "url('/assets/images/login_deer_hero.png')" }}>
        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-2xs bg-gradient-to-tr from-slate-950 via-slate-950/80 to-emerald-950/20" />
        
        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400">
            <Compass className="h-6 w-6" />
          </div>
          <span className="text-xl font-bold tracking-wider text-slate-100 uppercase">WPIS</span>
        </div>

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
            Create an authorized node account to start deploying tracking arrays, registering acoustic audio sensors, and auditing biodiversity index telemetry.
          </p>
        </div>

        <div className="relative z-10 flex items-center justify-between text-xs text-slate-500 font-medium">
          <span>© 2026 WPIS Core. All Rights Reserved.</span>
          <span>Milestone 1 Production Suite</span>
        </div>
      </div>

      {/* Right: Registration Column */}
      <div className="flex w-full lg:w-1/2 flex-col justify-center px-6 py-12 sm:px-12 lg:px-20 z-10">
        <div className="mx-auto w-full max-w-md space-y-6 animate-fade-in">
          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Create Account
            </h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Register a node credential to access the network.
            </p>
          </div>

          <div className="glass-card p-6 bg-slate-50/50 dark:bg-slate-900/40">
            {success ? (
              <div className="flex flex-col items-center text-center py-6">
                <CheckCircle className="h-14 w-14 text-emerald-500 mb-4 animate-bounce" />
                <h3 className="text-lg font-bold text-slate-200">Registration Successful!</h3>
                <p className="text-sm text-slate-400 mt-2">Redirecting to login portal...</p>
              </div>
            ) : (
              <form className="space-y-4" onSubmit={handleSubmit}>
                {error && (
                  <div className="flex items-center gap-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/30 p-3.5 text-sm text-rose-600 dark:text-rose-450">
                    <AlertCircle className="h-5 w-5 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="space-y-3.5">
                  {/* Full name (UI only placeholder) */}
                  <div>
                    <label className="block text-2xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                      Full Name (UI Placeholder)
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="block w-full rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-4 py-2 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:border-emerald-500 dark:focus:border-emerald-500 outline-none transition-all text-xs"
                      placeholder="Optional e.g. Dr. John Doe"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-2xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                        Username
                      </label>
                      <input
                        type="text"
                        required
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="block w-full rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-4 py-2 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:border-emerald-500 dark:focus:border-emerald-500 outline-none transition-all text-xs"
                        placeholder="johndoe"
                      />
                    </div>

                    <div>
                      <label className="block text-2xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                        Email Address
                      </label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="block w-full rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-4 py-2 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:border-emerald-500 dark:focus:border-emerald-500 outline-none transition-all text-xs"
                        placeholder="john@research.org"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-2xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                        Password
                      </label>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="block w-full rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-4 py-2 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:border-emerald-500 dark:focus:border-emerald-500 outline-none transition-all text-xs"
                        placeholder="••••••••"
                      />
                    </div>

                    <div>
                      <label className="block text-2xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                        Confirm Password
                      </label>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="block w-full rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-4 py-2 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:border-emerald-500 dark:focus:border-emerald-500 outline-none transition-all text-xs"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-2xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                      Target Access Role
                    </label>
                    <select
                      value={selectedRole}
                      onChange={(e) => setSelectedRole(e.target.value)}
                      className="block w-full rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-4 py-2 text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-500 dark:focus:border-emerald-500 transition-all text-xs"
                    >
                      {roles.map((role) => (
                        <option key={role.name} value={role.name}>
                          {role.name}
                        </option>
                      ))}
                    </select>
                    <p className="mt-1 text-3xs text-slate-500 dark:text-slate-500">
                      {roles.find((r) => r.name === selectedRole)?.desc}
                    </p>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex w-full justify-center items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 dark:bg-emerald-600 dark:hover:bg-emerald-500 py-2.5 text-sm font-semibold text-white shadow-lg transition-all duration-200 hover:scale-101"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Registering account...</span>
                      </>
                    ) : (
                      <span>Create Account</span>
                    )}
                  </button>
                </div>
              </form>
            )}

            {!success && (
              <>
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
                    theme={theme === 'dark' ? 'filled_blue' : 'outline'}
                    shape="pill"
                    size="large"
                  />
                </div>
              </>
            )}

            <div className="mt-5 text-center text-xs text-slate-500 dark:text-slate-400">
              Already have an account?{' '}
              <Link to="/login" className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline">
                Sign in here
              </Link>
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

export default Register;
