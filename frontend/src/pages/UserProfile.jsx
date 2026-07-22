import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import { 
  User, 
  ShieldCheck, 
  Mail, 
  Key, 
  Eye, 
  EyeOff, 
  Clipboard, 
  Check, 
  Lock, 
  Settings, 
  Activity, 
  UserCheck,
  Calendar,
  Clock,
  LogOut,
  Camera,
  X,
  AlertTriangle,
  LockKeyhole,
  Upload,
  FolderOpen
} from 'lucide-react';
import { getUserAvatar } from '../utils/india';

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
  return 'Operation failed.';
};

const UserProfile = () => {
  const { user, token, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [activeSection, setActiveSection] = useState('Profile Information');
  const [showToken, setShowToken] = useState(false);
  const [copied, setCopied] = useState(false);

  // Profile Edit states
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editUsername, setEditUsername] = useState(user?.username || '');
  const [profileSaving, setProfileSaving] = useState(false);

  // Profile Image Upload states
  const [profileFile, setProfileFile] = useState(null);
  const [profilePreview, setProfilePreview] = useState(null);
  const [profileFileName, setProfileFileName] = useState('');
  const [profileFileSize, setProfileFileSize] = useState('');
  const [profileFileError, setProfileFileError] = useState('');

  // Password Edit states
  const [passwordState, setPasswordState] = useState({ current: '', new: '', confirm: '' });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);

  // Toast Notification states
  const [toastMessage, setToastMessage] = useState(null);
  const [toastType, setToastType] = useState('success');

  const roleName = user?.roles?.[0]?.name || 'Wildlife Researcher';
  const roleDesc = user?.roles?.[0]?.description || 'Granted access to system resources';
  const isGoogleUser = user?.oauth_provider === 'Google';

  const avatarSrc = getUserAvatar({ ...user, role: roleName }, api.defaults.baseURL);
  const defaultAvatar = avatarSrc;

  // Synchronize edit states when user changes
  useEffect(() => {
    if (user) {
      setEditUsername(user.username || '');
    }
  }, [user]);

  // Live password checklist checks
  const meetsMinLength = passwordState.new.length >= 8;
  const meetsUppercase = /[A-Z]/.test(passwordState.new);
  const meetsLowercase = /[a-z]/.test(passwordState.new);
  const meetsNumber = /\d/.test(passwordState.new);
  const meetsSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(passwordState.new);

  const getPasswordStrength = () => {
    if (!passwordState.new) return null;
    let score = 0;
    if (meetsMinLength) score++;
    if (meetsUppercase) score++;
    if (meetsLowercase) score++;
    if (meetsNumber) score++;
    if (meetsSpecial) score++;

    if (score <= 2) return { text: 'Weak', color: 'bg-rose-500 text-rose-100 border-rose-600', width: 'w-1/3' };
    if (score <= 4) return { text: 'Medium', color: 'bg-amber-505 text-white border-amber-600', width: 'w-2/3' };
    return { text: 'Strong', color: 'bg-emerald-600 text-emerald-50 border-emerald-700', width: 'w-full' };
  };

  const strength = getPasswordStrength();
  const passChecklistAllPassed = meetsMinLength && meetsUppercase && meetsLowercase && meetsNumber && meetsSpecial;
  const passwordMatch = passwordState.new === passwordState.confirm && passwordState.new !== '';
  const canSubmitPassword = passChecklistAllPassed && passwordMatch && passwordState.current !== '' && !passwordSaving;

  const handleCopyToken = () => {
    if (token) {
      navigator.clipboard.writeText(token);
      setCopied(true);
      setToastType('success');
      setToastMessage('Session token copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  const handleBrowseClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setProfileFileError('Invalid file type. Please upload a JPG, JPEG, PNG, or WEBP image.');
      return;
    }

    // Validate size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setProfileFileError('File size too large. Maximum size allowed is 5MB.');
      return;
    }

    setProfileFileError('');
    setProfileFile(file);
    setProfileFileName(file.name);
    setProfileFileSize((file.size / (1024 * 1024)).toFixed(2) + ' MB');

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setProfilePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setProfileSaving(true);
    setToastMessage(null);

    try {
      let finalPictureUrl = user?.picture || null;

      // Upload profile image first if selected
      if (profileFile) {
        const formData = new FormData();
        formData.append('file', profileFile);
        try {
          const uploadRes = await api.post('/api/uploads/image', formData, {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          });
          finalPictureUrl = uploadRes.data.filepath; // e.g. /uploads/images/xyz.png
        } catch (err) {
          console.error("Profile picture upload failed", err);
          setToastType('error');
          setToastMessage('Unable to update profile. Please try again.');
          setProfileSaving(false);
          return;
        }
      }

      try {
        const response = await api.put('/api/auth/profile', {
          username: editUsername.trim(),
          picture: finalPictureUrl
        });
        updateUser(response.data);
        setToastType('success');
        setToastMessage('Profile details updated successfully');
        setIsEditingProfile(false);
        setProfileFile(null);
        setProfilePreview(null);
        setTimeout(() => setToastMessage(null), 4000);
      } catch (err) {
        console.error("Profile update failed", err);
        setToastType('error');
        setToastMessage('Unable to update profile. Please try again.');
        setTimeout(() => setToastMessage(null), 5000);
      }
    } catch (err) {
      console.error("Unexpected error in profile save", err);
      setToastType('error');
      setToastMessage('Unable to update profile. Please try again.');
      setTimeout(() => setToastMessage(null), 5000);
    } finally {
      setProfileSaving(false);
    }
  };

  const handleSavePassword = async (e) => {
    e.preventDefault();
    if (!canSubmitPassword) return;

    setPasswordSaving(true);
    setToastMessage(null);

    try {
      await api.post('/api/auth/change-password', {
        current_password: passwordState.current,
        new_password: passwordState.new
      });
      
      setToastType('success');
      setToastMessage('Password changed successfully. Logging out active session...');
      
      setTimeout(() => {
        setToastMessage(null);
        logout();
        navigate('/login');
      }, 3000);
    } catch (err) {
      setToastType('error');
      setToastMessage(extractErrorMessage(err));
      setTimeout(() => setToastMessage(null), 5000);
      setPasswordSaving(false);
    }
  };

  const handleCancelEditProfile = () => {
    setEditUsername(user?.username || '');
    setProfileFile(null);
    setProfilePreview(null);
    setProfileFileError('');
    setIsEditingProfile(false);
  };

  const getRoleBadgeClass = (role) => {
    switch (role) {
      case 'Administrator':
        return 'bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900/30';
      case 'Wildlife Researcher':
        return 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/30';
      case 'Conservation Officer':
        return 'bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-900/30';
      case 'Forest Department Officer':
        return 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900/30';
      default:
        return 'bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-350 border border-slate-200 dark:border-slate-800';
    }
  };

  const formatAccountDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return dateStr;
    }
  };

  const sections = [
    { name: 'Profile Information', icon: User },
    { name: 'Role & Permissions', icon: ShieldCheck },
    { name: 'Security', icon: Lock },
    { name: 'API Token', icon: Key },
    { name: 'Recent Activity', icon: Activity },
    { name: 'Account Status', icon: UserCheck }
  ];

  const mockActivity = [
    { action: 'User authentication login', time: '10 mins ago', desc: 'Secure session token created via OAuth2.' },
    { action: 'Modified Camera Trap parameters', time: '3 hours ago', desc: 'Updated battery logs for CT-02 node.' },
    { action: 'Created survey record', time: 'Yesterday', desc: 'Logged Jim Corbett Tiger Corridor Survey – Jul 2026.' }
  ];

  return (
    <div className="space-y-6 animate-fade-in text-slate-800 dark:text-slate-100 font-sans">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
            <Settings className="h-3.5 w-3.5 animate-spin-slow text-emerald-505" />
            WPIS Profile Console
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white mt-1">
            Profile Settings
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm mt-1 font-semibold">
            Manage your credentials, verify API keys, and review authorization scopes.
          </p>
        </div>
        <button
          onClick={() => { logout(); navigate('/login'); }}
          className="flex items-center gap-2 self-start sm:self-center px-4 py-2.5 text-xs font-bold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/20 hover:bg-rose-100 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900/30 rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-rose-500"
        >
          <LogOut className="h-4 w-4" />
          <span>Logout Session</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Navigation Sidebar */}
        <div className="glass-card p-4 space-y-1 h-fit shadow-sm border-slate-205 dark:border-slate-800">
          {sections.map((sec) => {
            const Icon = sec.icon;
            const isActive = activeSection === sec.name;
            return (
              <button
                key={sec.name}
                onClick={() => { setActiveSection(sec.name); setIsEditingProfile(false); }}
                className={`flex w-full items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-700 dark:text-slate-400 hover:bg-slate-100/70 dark:hover:bg-slate-800/40 hover:text-slate-950 dark:hover:text-slate-100'
                }`}
              >
                <Icon className="h-4.5 w-4.5" />
                <span>{sec.name}</span>
              </button>
            );
          })}
        </div>

        {/* Content Panel */}
        <div className="glass-card p-6 lg:col-span-3 min-h-[380px] flex flex-col justify-between border-slate-205 dark:border-slate-800 bg-white dark:bg-slate-900/40 shadow-sm">
          
          {/* 1. Profile Information */}
          {activeSection === 'Profile Information' && (
            <div className="space-y-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-base font-extrabold text-slate-950 dark:text-white">Profile Details</h3>
                  <p className="text-2xs text-slate-550 dark:text-slate-400 mt-0.5 font-semibold">Your network identity details and contact email</p>
                </div>
                {!isEditingProfile && (
                  <button
                    onClick={() => setIsEditingProfile(true)}
                    className="flex items-center gap-1.5 px-3 py-1.8 rounded-xl text-2xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-200/60 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <Settings className="h-3.5 w-3.5" />
                    <span>Edit Profile</span>
                  </button>
                )}
              </div>

              {isEditingProfile ? (
                <form onSubmit={handleSaveProfile} className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-2xs font-bold text-slate-650 dark:text-slate-400 uppercase tracking-wider">Full Name / Display Name *</label>
                      <input
                        type="text"
                        required
                        value={editUsername}
                        onChange={(e) => setEditUsername(e.target.value)}
                        className="enterprise-input"
                        placeholder="Enter your display name"
                      />
                    </div>
                    
                    {/* Read-only email address */}
                    <div className="space-y-1.5">
                      <label className="block text-2xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Email Address (Read-only)</label>
                      <input
                        type="text"
                        disabled
                        value={user?.email || ''}
                        className="enterprise-input disabled:opacity-65 disabled:bg-slate-100 dark:disabled:bg-slate-900/50 cursor-not-allowed font-semibold text-slate-700"
                      />
                    </div>

                    {/* Image upload selector workflow */}
                    <div className="col-span-1 md:col-span-2 space-y-2">
                      <label className="block text-2xs font-bold text-slate-655 dark:text-slate-400 uppercase tracking-wider">Profile Picture Avatar</label>
                      
                      <div className="flex flex-col sm:flex-row gap-4 items-center p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 shadow-xs">
                        {/* Selected or Existing Preview */}
                        <div className="shrink-0">
                          <img 
                            src={profilePreview || avatarSrc} 
                            alt="Avatar Preview" 
                            className="h-16 w-16 rounded-xl object-cover border-2 border-emerald-555 shadow-sm"
                            onError={(e) => { e.target.src = defaultAvatar; }}
                          />
                        </div>

                        {/* Upload info details & Browse button */}
                        <div className="flex-1 space-y-1 text-center sm:text-left">
                          <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept="image/jpeg,image/png,image/webp"
                            className="hidden"
                          />
                          <button
                            type="button"
                            onClick={handleBrowseClick}
                            className="inline-flex items-center gap-1.5 px-3 py-1.8 text-2xs font-bold bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          >
                            <FolderOpen className="h-3.5 w-3.5 text-emerald-500" />
                            <span>Browse Image</span>
                          </button>
                          
                          {profileFile ? (
                            <div className="text-4xs text-slate-500 dark:text-slate-400 font-mono mt-1">
                              <span>Selected: {profileFileName} ({profileFileSize})</span>
                            </div>
                          ) : (
                            <p className="text-4xs text-slate-500 dark:text-slate-400 mt-1">
                              Select a JPG, PNG or WEBP image up to 5 MB
                            </p>
                          )}
                          {profileFileError && (
                            <p className="text-rose-500 text-4xs font-bold mt-1">{profileFileError}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-slate-150 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={handleCancelEditProfile}
                      disabled={profileSaving}
                      className="enterprise-btn-secondary"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={profileSaving}
                      className="enterprise-btn-primary flex items-center gap-2"
                    >
                      {profileSaving && <span className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>}
                      <span>Save Changes</span>
                    </button>
                  </div>
                </form>
              ) : (
                <div className="flex flex-col md:flex-row gap-6 items-start">
                  {/* Photo Avatar */}
                  <div className="relative group shrink-0 self-center md:self-start">
                    <img 
                      src={avatarSrc} 
                      alt="Avatar" 
                      className="h-24 w-24 rounded-2xl object-cover border-2 border-slate-200 dark:border-slate-800 shadow"
                      onError={(e) => { e.target.src = defaultAvatar; }}
                    />
                    <div className="absolute inset-0 bg-slate-900/40 rounded-2xl opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all cursor-pointer" onClick={() => setIsEditingProfile(true)}>
                      <Camera className="h-6 w-6 text-white" />
                    </div>
                  </div>

                  {/* Profile data grid */}
                  <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/20 text-xs font-semibold text-slate-700 dark:text-slate-350">
                      <span className="block text-4xs uppercase tracking-wider text-slate-500 dark:text-slate-500 font-bold mb-1">Display Name</span>
                      <span className="text-slate-900 dark:text-white font-extrabold">{user?.username}</span>
                    </div>

                    <div className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/20 text-xs font-semibold text-slate-700 dark:text-slate-350">
                      <span className="block text-4xs uppercase tracking-wider text-slate-500 dark:text-slate-500 font-bold mb-1">Email Address</span>
                      <span className="text-slate-900 dark:text-white font-extrabold">{user?.email}</span>
                    </div>

                    <div className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/20 text-xs font-semibold text-slate-700 dark:text-slate-350">
                      <span className="block text-4xs uppercase tracking-wider text-slate-500 dark:text-slate-500 font-bold mb-1">Assigned Role Badge</span>
                      <span className={`inline-flex px-2 py-0.5 rounded text-4xs font-bold uppercase tracking-widest mt-1 ${getRoleBadgeClass(roleName)}`}>
                        {roleName}
                      </span>
                    </div>

                    <div className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/20 text-xs font-semibold text-slate-700 dark:text-slate-350">
                      <span className="block text-4xs uppercase tracking-wider text-slate-500 dark:text-slate-500 font-bold mb-1">Auth Credentials Tier</span>
                      <span className="text-slate-900 dark:text-white font-extrabold">
                        {isGoogleUser ? 'Google OAuth2 Session' : 'Email & Password (Local)'}
                      </span>
                    </div>

                    <div className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/20 text-xs font-semibold text-slate-700 dark:text-slate-350">
                      <span className="block text-4xs uppercase tracking-wider text-slate-500 dark:text-slate-500 font-bold mb-1">Account Created Date</span>
                      <span className="text-slate-900 dark:text-white font-extrabold flex items-center gap-1.5 mt-0.5">
                        <Calendar className="h-3.5 w-3.5 text-emerald-500" />
                        {formatAccountDate(user?.created_at)}
                      </span>
                    </div>

                    <div className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/20 text-xs font-semibold text-slate-700 dark:text-slate-350">
                      <span className="block text-4xs uppercase tracking-wider text-slate-500 dark:text-slate-500 font-bold mb-1">Last Login Date</span>
                      <span className="text-slate-900 dark:text-white font-extrabold flex items-center gap-1.5 mt-0.5">
                        <Clock className="h-3.5 w-3.5 text-emerald-500" />
                        {formatAccountDate(user?.last_login)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 2. Role & Permissions */}
          {activeSection === 'Role & Permissions' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-extrabold text-slate-950 dark:text-white">Security Role Assignment</h3>
                <p className="text-2xs text-slate-550 dark:text-slate-400 mt-0.5 font-semibold">Platform action scopes and privileges</p>
              </div>

              <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/45 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
                  <span className={`inline-flex px-2 py-0.5 rounded text-4xs font-bold uppercase tracking-widest ${getRoleBadgeClass(roleName)}`}>
                    {roleName}
                  </span>
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-405 leading-relaxed font-semibold">
                  {roleDesc}. Permissions are audited at the route layer via backend middleware interceptors.
                </p>
              </div>
            </div>
          )}

          {/* 3. Security (Change Password) */}
          {activeSection === 'Security' && (
            <div className="space-y-5">
              <div>
                <h3 className="text-base font-extrabold text-slate-955 dark:text-white">Security Settings</h3>
                <p className="text-2xs text-slate-550 dark:text-slate-400 mt-0.5 font-semibold">Manage and update your account password security</p>
              </div>

              {isGoogleUser ? (
                <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-900/35 bg-amber-50/50 dark:bg-amber-950/10 flex gap-3 text-xs text-amber-800 dark:text-amber-400 font-semibold leading-relaxed">
                  <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-extrabold">External Google Authentication Mode</h4>
                    <p className="text-2xs text-amber-700 dark:text-amber-405/95 mt-1 font-bold">
                      This account uses Google Sign-In. Password changes must be performed through your Google account.
                    </p>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSavePassword} className="space-y-6 max-w-md">
                  <div className="space-y-4">
                    {/* Current password */}
                    <div className="space-y-1.5">
                      <label className="block text-2xs font-bold text-slate-655 dark:text-slate-400 uppercase tracking-wider">Current Password *</label>
                      <div className="relative">
                        <input
                          type={showCurrent ? 'text' : 'password'}
                          required
                          value={passwordState.current}
                          onChange={(e) => setPasswordState({ ...passwordState, current: e.target.value })}
                          className="enterprise-input pr-10"
                          placeholder="Verify current password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrent(!showCurrent)}
                          className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 focus:outline-none"
                        >
                          {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    {/* New password */}
                    <div className="space-y-1.5">
                      <label className="block text-2xs font-bold text-slate-655 dark:text-slate-400 uppercase tracking-wider">New Password *</label>
                      <div className="relative">
                        <input
                          type={showNew ? 'text' : 'password'}
                          required
                          value={passwordState.new}
                          onChange={(e) => setPasswordState({ ...passwordState, new: e.target.value })}
                          className="enterprise-input pr-10"
                          placeholder="Minimum 8 characters"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNew(!showNew)}
                          className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 focus:outline-none"
                        >
                          {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Confirm new password */}
                    <div className="space-y-1.5">
                      <label className="block text-2xs font-bold text-slate-655 dark:text-slate-400 uppercase tracking-wider">Confirm New Password *</label>
                      <div className="relative">
                        <input
                          type={showConfirm ? 'text' : 'password'}
                          required
                          value={passwordState.confirm}
                          onChange={(e) => setPasswordState({ ...passwordState, confirm: e.target.value })}
                          className="enterprise-input pr-10"
                          placeholder="Re-type new password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirm(!showConfirm)}
                          className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 focus:outline-none"
                        >
                          {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Password Strength Indicator */}
                  {passwordState.new && strength && (
                    <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                      <div className="flex justify-between items-center text-2xs font-bold">
                        <span className="text-slate-700 dark:text-slate-350">Password Strength:</span>
                        <span className={`px-2 py-0.5 rounded text-4xs font-black uppercase tracking-widest border ${strength.color}`}>
                          {strength.text}
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-950 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-350 ${
                            strength.text === 'Weak' ? 'w-1/3 bg-rose-500' : strength.text === 'Medium' ? 'w-2/3 bg-amber-500' : 'w-full bg-emerald-600'
                          }`}
                        />
                      </div>
                    </div>
                  )}

                  {/* Password Requirements Checklist */}
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-950/20 text-xs font-semibold space-y-2">
                    <span className="block text-4xs uppercase tracking-wider text-slate-550 dark:text-slate-500 font-bold mb-1">Security Requirements checklist</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-2xs">
                      <div className={`flex items-center gap-2 ${meetsMinLength ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-slate-550 dark:text-slate-500'}`}>
                        {meetsMinLength ? <Check className="h-4 w-4 text-emerald-500 shrink-0" /> : <LockKeyhole className="h-4 w-4 text-slate-400 shrink-0" />}
                        <span>At least 8 characters</span>
                      </div>
                      <div className={`flex items-center gap-2 ${meetsUppercase ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-slate-550 dark:text-slate-500'}`}>
                        {meetsUppercase ? <Check className="h-4 w-4 text-emerald-500 shrink-0" /> : <LockKeyhole className="h-4 w-4 text-slate-400 shrink-0" />}
                        <span>One uppercase letter</span>
                      </div>
                      <div className={`flex items-center gap-2 ${meetsLowercase ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-slate-550 dark:text-slate-500'}`}>
                        {meetsLowercase ? <Check className="h-4 w-4 text-emerald-500 shrink-0" /> : <LockKeyhole className="h-4 w-4 text-slate-400 shrink-0" />}
                        <span>One lowercase letter</span>
                      </div>
                      <div className={`flex items-center gap-2 ${meetsNumber ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-slate-550 dark:text-slate-500'}`}>
                        {meetsNumber ? <Check className="h-4 w-4 text-emerald-500 shrink-0" /> : <LockKeyhole className="h-4 w-4 text-slate-400 shrink-0" />}
                        <span>One numeric digit</span>
                      </div>
                      <div className={`flex items-center gap-2 ${meetsSpecial ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-slate-550 dark:text-slate-500'}`}>
                        {meetsSpecial ? <Check className="h-4 w-4 text-emerald-505 shrink-0" /> : <LockKeyhole className="h-4 w-4 text-slate-400 shrink-0" />}
                        <span>One special character</span>
                      </div>
                      <div className={`flex items-center gap-2 ${passwordMatch ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-slate-550 dark:text-slate-500'}`}>
                        {passwordMatch ? <Check className="h-4 w-4 text-emerald-555 shrink-0" /> : <LockKeyhole className="h-4 w-4 text-slate-400 shrink-0" />}
                        <span>Passwords match</span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={!canSubmitPassword}
                    className={`w-full py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                      canSubmitPassword 
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg' 
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-450 cursor-not-allowed border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {passwordSaving && <span className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>}
                    <span>Save Password</span>
                  </button>
                </form>
              )}
            </div>
          )}

          {/* 4. API Token */}
          {activeSection === 'API Token' && (
            <div className="space-y-5">
              <div>
                <h3 className="text-base font-extrabold text-slate-950 dark:text-white">Active Session Token</h3>
                <p className="text-2xs text-slate-550 dark:text-slate-400 mt-0.5 font-semibold">Use this token to query direct APIs via CLI</p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => setShowToken(!showToken)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-2xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {showToken ? <EyeOff className="h-3.5 w-3.5 text-slate-500" /> : <Eye className="h-3.5 w-3.5 text-slate-500" />}
                    <span>{showToken ? 'Hide' : 'Reveal'}</span>
                  </button>

                  <button
                    onClick={handleCopyToken}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-2xs font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                      copied 
                        ? 'bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' 
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {copied ? <Check className="h-3.5 w-3.5 text-emerald-555" /> : <Clipboard className="h-3.5 w-3.5 text-slate-500" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>

                <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 font-mono text-2xs text-slate-650 dark:text-slate-500 break-all select-all min-h-[64px] flex items-center font-semibold">
                  {showToken ? token : '••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••'}
                </div>
              </div>
            </div>
          )}

          {/* 5. Recent Activity */}
          {activeSection === 'Recent Activity' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-extrabold text-slate-955 dark:text-white">Recent Activity Log</h3>
                <p className="text-2xs text-slate-550 dark:text-slate-400 mt-0.5 font-semibold">Audit trail of actions taken in the current session</p>
              </div>

              <div className="space-y-3 pt-2">
                {mockActivity.map((act, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl border border-slate-205 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/45 flex justify-between items-start gap-4">
                    <div>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{act.action}</p>
                      <p className="text-3xs text-slate-600 dark:text-slate-400 mt-1 leading-normal font-semibold">{act.desc}</p>
                    </div>
                    <span className="text-4xs text-slate-500 dark:text-slate-500 font-mono shrink-0 font-bold">{act.time}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 6. Account Status */}
          {activeSection === 'Account Status' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-extrabold text-slate-955 dark:text-white">Account Status Overview</h3>
                <p className="text-2xs text-slate-550 dark:text-slate-400 mt-0.5 font-semibold">Platform standing status</p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30">
                  <span className="text-4xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Status</span>
                  <span className="text-emerald-700 dark:text-emerald-400 text-sm font-extrabold mt-1 inline-block">Active Node</span>
                </div>
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30">
                  <span className="text-4xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Security Tier</span>
                  <span className="text-slate-800 dark:text-slate-250 text-sm font-extrabold mt-1 inline-block">Tier 1 Credentials</span>
                </div>
              </div>
            </div>
          )}

          {/* Footer branding */}
          <div className="pt-6 border-t border-slate-150 dark:border-slate-800 mt-8 flex justify-between items-center text-4xs text-slate-550 font-bold uppercase tracking-wider">
            <span>WPIS Authorization Framework</span>
            <span>ID: {user?.id}</span>
          </div>

        </div>
      </div>

      {/* Toast Notification Container */}
      {toastMessage && (
        <div className={`fixed bottom-6 right-6 z-55 flex items-center gap-3 rounded-xl border p-4 text-xs font-bold shadow-2xl transition-all animate-fade-in ${
          toastType === 'success' 
            ? 'bg-emerald-50 dark:bg-emerald-950/90 border-emerald-200 dark:border-emerald-900/40 text-emerald-600 dark:text-emerald-400' 
            : 'bg-rose-50 dark:bg-rose-950/90 border-rose-200 dark:border-rose-900/40 text-rose-600 dark:text-rose-455'
        }`}>
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="p-0.5 rounded hover:bg-slate-200/50 dark:hover:bg-slate-800 text-slate-450 hover:text-slate-650 shrink-0">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};

export default UserProfile;
