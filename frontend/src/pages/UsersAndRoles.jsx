import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';
import ConfirmModal from '../components/common/ConfirmModal';
import { TableSkeleton } from '../components/common/Skeletons';
import { 
  Users, 
  ShieldCheck, 
  Trash2, 
  Edit3, 
  Info,
  UserCheck,
  X,
  Plus,
  Shield,
  Clock,
  Calendar,
  CheckCircle,
  AlertTriangle
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
  return 'Operation failed.';
};

const UsersAndRoles = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userRoles, setUserRoles] = useState([]);
  const [userStatus, setUserStatus] = useState('Active');
  const [apiSaving, setApiSaving] = useState(false);

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');

  // Custom Toast Notifications
  const [toastMessage, setToastMessage] = useState(null);
  const [toastType, setToastType] = useState('success');

  // Reusable Delete Modal states
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingUser, setDeletingUser] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    fetchUsersAndRoles();
  }, []);

  const fetchUsersAndRoles = async () => {
    try {
      const [usersRes, rolesRes] = await Promise.all([
        api.get('/api/users'),
        api.get('/api/users/roles')
      ]);
      setUsers(usersRes.data);
      setRoles(rolesRes.data);
    } catch (err) {
      setError('Failed to fetch user accounts and security roles list.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEdit = (user) => {
    setSelectedUser(user);
    setUserRoles(user.roles.map(r => r.name));
    setUserStatus(user.status || 'Active');
    setError('');
    setShowModal(true);
  };

  const handleRoleToggle = (roleName) => {
    if (userRoles.includes(roleName)) {
      // Must keep at least one role
      if (userRoles.length === 1) return;
      setUserRoles(userRoles.filter(r => r !== roleName));
    } else {
      setUserRoles([...userRoles, roleName]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setApiSaving(true);

    try {
      await api.put(`/api/users/${selectedUser.id}`, {
        roles: userRoles,
        status: userStatus
      });
      setToastType('success');
      setToastMessage(`Account for user '${selectedUser.username}' updated successfully`);
      setTimeout(() => setToastMessage(null), 4000);
      setShowModal(false);
      fetchUsersAndRoles();
    } catch (err) {
      const msg = extractErrorMessage(err);
      setError(msg);
      setToastType('error');
      setToastMessage(msg);
      setTimeout(() => setToastMessage(null), 6000);
    } finally {
      setApiSaving(false);
    }
  };

  const handleDeleteTrigger = (userToDelete) => {
    if (userToDelete.id === currentUser.id) {
      setToastType('error');
      setToastMessage('You cannot delete your own administrative session account.');
      setTimeout(() => setToastMessage(null), 5000);
      return;
    }
    setDeletingUser(userToDelete);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    setDeleteLoading(true);
    try {
      await api.delete(`/api/users/${deletingUser.id}`);
      setToastType('success');
      setToastMessage(`Account for user '${deletingUser.username}' deleted successfully`);
      setTimeout(() => setToastMessage(null), 4000);
      setDeleteModalOpen(false);
      fetchUsersAndRoles();
    } catch (err) {
      const msg = extractErrorMessage(err);
      setError(msg);
      setToastType('error');
      setToastMessage(msg);
      setTimeout(() => setToastMessage(null), 5000);
    } finally {
      setDeleteLoading(false);
    }
  };

  const getRoleBadgeClass = (roleName) => {
    switch (roleName) {
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

  // Filter users list
  const filteredUsers = users.filter((u) => {
    const matchesSearch = 
      (u.username || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = 
      roleFilter === 'All' || 
      u.roles.some(r => r.name === roleFilter);

    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6 animate-fade-in text-slate-800 dark:text-slate-100 font-sans">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Users & Role Assignments</h1>
        <p className="text-slate-600 dark:text-slate-400 text-sm mt-1 font-semibold">Audit platform accounts and adjust Role-Based Access Control (RBAC) privileges.</p>
      </div>

      {error && (
        <div className="flex items-center gap-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/35 p-4 text-sm text-rose-600 dark:text-rose-455 font-semibold">
          <Info className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Controls */}
      <div className="glass-card p-4 flex flex-col md:flex-row gap-4 items-center justify-between shadow-sm">
        {/* Search */}
        <div className="relative w-full md:w-64">
          <Users className="absolute left-3 top-2.5 h-4.5 w-4.5 text-slate-405" />
          <input
            type="text"
            placeholder="Search accounts or emails..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 pl-11 pr-4 py-2 text-slate-900 dark:text-slate-100 placeholder-slate-450 focus:border-emerald-500 dark:focus:border-emerald-500 outline-none transition-all text-xs font-semibold"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="rounded-xl bg-white dark:bg-slate-950 border border-slate-202 dark:border-slate-800 px-3.5 py-2 text-2xs font-bold text-slate-705 dark:text-slate-300 outline-none focus:border-emerald-500"
          >
            <option value="All">All Roles</option>
            {roles.map(r => (
              <option key={r.id} value={r.name}>{r.name}</option>
            ))}
          </select>
          
          {(searchTerm !== '' || roleFilter !== 'All') && (
            <button
              onClick={() => { setSearchTerm(''); setRoleFilter('All'); }}
              className="flex items-center gap-1.5 px-3 py-1.8 text-2xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl transition-colors"
            >
              <X className="h-3.5 w-3.5" />
              <span>Clear Filter</span>
            </button>
          )}
        </div>
      </div>

      {/* Users Table */}
      {loading ? (
        <TableSkeleton rows={5} cols={8} />
      ) : filteredUsers.length > 0 ? (
        <div className="glass-card overflow-hidden shadow-sm border-slate-205 dark:border-slate-800/80">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-950 text-slate-650 dark:text-slate-400 font-bold uppercase border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-5 py-3.5">Account User</th>
                  <th className="px-5 py-3.5">Email Address</th>
                  <th className="px-5 py-3.5">Auth Method</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Assigned Security Roles</th>
                  <th className="px-5 py-3.5">Creation Date</th>
                  <th className="px-5 py-3.5">Last Login</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/50 dark:divide-slate-800/60 font-semibold">
                {filteredUsers.map((user) => {
                  const mainRole = user.roles?.[0]?.name || 'Researcher';
                  return (
                    <tr key={user.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/10 transition-colors">
                      <td className="px-5 py-4 text-slate-900 dark:text-white flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 font-extrabold text-xs uppercase border border-emerald-200 dark:border-emerald-900/40 shrink-0">
                          {user.username.substring(0, 2)}
                        </div>
                        <div className="flex flex-col gap-1 items-start">
                          <span className="font-extrabold text-slate-900 dark:text-white text-xs">{user.username}</span>
                          {user.id === currentUser.id && (
                            <span className="inline-block whitespace-nowrap text-4xs text-emerald-700 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-250 font-black tracking-widest uppercase">
                              Current Session
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-slate-700 dark:text-slate-350 text-xs truncate max-w-[160px]" title={user.email}>
                        {user.email}
                      </td>
                      <td className="px-5 py-4">
                        {user.oauth_provider === 'Google' ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-900/30 text-3xs font-bold uppercase tracking-wider">
                            Google Sign-in
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-3xs font-bold uppercase tracking-wider">
                            Credentials
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex px-1.5 py-0.2 rounded text-5xs font-bold border uppercase tracking-wider ${
                          user.status === 'Active' 
                            ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border-emerald-202' 
                            : 'bg-slate-100 dark:bg-slate-950 text-slate-500 border-slate-300 dark:border-slate-800'
                        }`}>
                          {user.status || 'Active'}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-1.5">
                          {user.roles.map((role) => (
                            <span key={role.id} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-3xs font-bold ${getRoleBadgeClass(role.name)}`}>
                              <ShieldCheck className="h-3 w-3 shrink-0 text-emerald-505" />
                              {role.name}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-5 py-4 font-mono text-2xs text-slate-600 dark:text-slate-400">
                        {user.created_at ? new Date(user.created_at).toLocaleDateString('en-IN') : 'N/A'}
                      </td>
                      <td className="px-5 py-4 font-mono text-2xs text-slate-600 dark:text-slate-400" title={user.last_login}>
                        {user.last_login ? new Date(user.last_login).toLocaleDateString('en-IN') : 'Never'}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(user)}
                            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-105 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            title="Edit Roles & Status"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteTrigger(user)}
                            disabled={user.id === currentUser.id}
                            className={`p-1.5 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-rose-500 ${
                              user.id === currentUser.id
                                ? 'text-slate-300 dark:text-slate-700 cursor-not-allowed opacity-40'
                                : 'text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 hover:text-rose-600'
                            }`}
                            title="Delete User Account"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 bg-slate-50/50 dark:bg-slate-900/10 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
          <Users className="h-12 w-12 text-slate-400 dark:text-slate-650 mb-3" />
          <p className="text-sm font-bold text-slate-900 dark:text-slate-350">No users found</p>
          <p className="text-xs text-slate-550 dark:text-slate-500 mt-1 text-center max-w-xs leading-normal">
            Try adjusting your search filters to find registered user credentials.
          </p>
        </div>
      )}

      {/* Edit Roles Modal */}
      {showModal && (
        <div className="enterprise-modal-overlay">
          <div className="enterprise-modal-card animate-fade-in shadow-2xl">
            <div className="enterprise-modal-header">
              <div className="flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-emerald-500 shrink-0" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Adjust Roles & Account Status</h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
              <div className="enterprise-modal-body">
                <div className="p-3.5 rounded-xl border border-slate-150 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <span className="block text-4xs uppercase tracking-wider text-slate-500 font-bold mb-0.5">Username</span>
                  <span className="text-slate-900 dark:text-white font-extrabold text-sm">{selectedUser?.username}</span>
                  <span className="block text-4xs text-slate-500 font-mono mt-1">Email: {selectedUser?.email}</span>
                </div>

                <div className="space-y-1.5">
                  <label className="enterprise-label">Account Status *</label>
                  <select
                    value={userStatus}
                    onChange={(e) => setUserStatus(e.target.value)}
                    className="enterprise-select"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>

                <div className="space-y-3">
                  <label className="enterprise-label">Check Security Roles to Grant *</label>
                  <div className="grid grid-cols-1 gap-2">
                    {roles.map((role) => {
                      const isChecked = userRoles.includes(role.name);
                      return (
                        <div
                          key={role.id}
                          onClick={() => handleRoleToggle(role.name)}
                          className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer select-none transition-all ${
                            isChecked 
                              ? 'bg-emerald-50/40 dark:bg-emerald-950/30 border-emerald-500/30 text-slate-900 dark:text-white' 
                              : 'bg-white hover:bg-slate-50 dark:bg-slate-950 dark:hover:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-650 dark:text-slate-400'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {}} // handled by parent click handler
                            className="h-4 w-4 rounded border-slate-300 dark:border-slate-800 text-emerald-600 focus:ring-emerald-500 pointer-events-none mt-0.5"
                          />
                          <div>
                            <p className="text-xs font-bold">{role.name}</p>
                            <p className="text-3xs text-slate-500 dark:text-slate-500 mt-0.5 leading-normal">{role.description}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="enterprise-modal-footer">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  disabled={apiSaving}
                  className="enterprise-btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={apiSaving}
                  className="enterprise-btn-primary flex items-center gap-2"
                >
                  {apiSaving && <span className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>}
                  <span>Save User Details</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete User Account?"
        message={`Are you sure you want to permanently delete user account '${deletingUser?.username}'? This action cannot be undone.`}
        confirmText="Delete Account"
        loading={deleteLoading}
      />

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

export default UsersAndRoles;
