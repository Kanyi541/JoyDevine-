import React, { useState, useEffect } from 'react';
import { 
  People as Users, 
  PersonPlus as UserPlus, 
  ShieldCheck, 
  Person as User, 
  Key, 
  Trash3 as Trash2, 
  CheckCircleFill as CheckCircle2, 
  XCircleFill as XCircle, 
  ExclamationTriangleFill as AlertTriangle, 
  Lock, 
  Eye, 
  EyeSlash as EyeOff, 
  XLg as X,
  Shield,
  Clock,
  Stars as Sparkles
} from 'react-bootstrap-icons';
import { POSUser, UserRole } from '../types';
import { 
  subscribeToPOSUsers, 
  createPOSUser, 
  updatePOSUser, 
  deletePOSUser 
} from '../services/authService';

interface POSUserManagementProps {
  currentUser: POSUser;
}

export const POSUserManagement: React.FC<POSUserManagementProps> = ({ currentUser }) => {
  const [users, setUsers] = useState<POSUser[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showResetPassModal, setShowResetPassModal] = useState<POSUser | null>(null);

  // New User Form State
  const [newDisplayName, setNewDisplayName] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('cashier');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset Password State
  const [resetPasswordVal, setResetPasswordVal] = useState('');
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');

  // Subscribe to real-time users from Firestore
  useEffect(() => {
    const unsub = subscribeToPOSUsers((userList) => {
      setUsers(userList);
    });
    return () => unsub();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!newUsername.trim()) {
      setFormError('Please provide a username.');
      return;
    }
    if (!newPassword || newPassword.length < 4) {
      setFormError('Password must be at least 4 characters long.');
      return;
    }

    setIsSubmitting(true);
    const result = await createPOSUser({
      username: newUsername.trim(),
      displayName: newDisplayName.trim() || newUsername.trim(),
      password: newPassword.trim(),
      role: newRole,
      createdBy: currentUser.username,
    });
    setIsSubmitting(false);

    if (result.success) {
      setFormSuccess(`User "${result.user?.username}" created successfully in Firebase!`);
      setNewDisplayName('');
      setNewUsername('');
      setNewPassword('');
      setNewRole('cashier');
      setTimeout(() => {
        setFormSuccess('');
        setShowAddModal(false);
      }, 1500);
    } else {
      setFormError(result.message || 'Failed to create user.');
    }
  };

  const handleToggleActive = async (user: POSUser) => {
    if (user.username.toLowerCase() === 'devine2026') {
      alert('The primary Admin account cannot be deactivated.');
      return;
    }
    const nextStatus = !user.isActive;
    await updatePOSUser(user.id, { isActive: nextStatus });
  };

  const handleDelete = async (user: POSUser) => {
    if (user.username.toLowerCase() === 'devine2026') {
      alert('The primary Admin account cannot be deleted.');
      return;
    }
    if (confirm(`Are you sure you want to permanently delete user "${user.displayName} (${user.username})"?`)) {
      await deletePOSUser(user.id);
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showResetPassModal) return;
    if (!resetPasswordVal || resetPasswordVal.length < 4) {
      setResetError('New password must be at least 4 characters.');
      return;
    }

    const res = await updatePOSUser(showResetPassModal.id, { password: resetPasswordVal.trim() });
    if (res.success) {
      setResetSuccess(`Password for ${showResetPassModal.username} updated successfully!`);
      setTimeout(() => {
        setResetSuccess('');
        setShowResetPassModal(null);
        setResetPasswordVal('');
      }, 1500);
    } else {
      setResetError('Could not update password.');
    }
  };

  const totalUsers = users.length;
  const adminUsers = users.filter((u) => u.role === 'admin').length;
  const cashierUsers = users.filter((u) => u.role === 'cashier').length;

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Action Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-[#0A192F] text-blue-400">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base font-black text-[#0A192F] font-['Chivo'] uppercase tracking-tight">
                POS Staff & User Management
              </h2>
              <p className="text-xs text-slate-500">
                Kirinyaga Crescent Counter Staff Access • Synced in Real-Time to Google Cloud Firestore
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="bg-[#0A192F] hover:bg-[#132A4D] text-white px-4 py-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-colors shadow-xs cursor-pointer"
        >
          <UserPlus className="w-4 h-4 text-blue-400" />
          <span>Add New Staff User</span>
        </button>
      </div>

      {/* Role Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Staff</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2 font-mono">{totalUsers}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Registered counter operators</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Administrators</span>
            <Shield className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-2xl font-black text-indigo-900 mt-2 font-mono">{adminUsers}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Full POS & inventory authority</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Counter Cashiers</span>
            <User className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-emerald-900 mt-2 font-mono">{cashierUsers}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Sales tickets & receipt processing</p>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
            <Users className="w-4 h-4 text-[#0A192F]" />
            Authorized Counter Staff Accounts
          </h3>
          <span className="text-xs text-slate-500 font-mono">
            Collection: <span className="font-bold text-slate-700">posUsers</span>
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <th className="py-3 px-4">Staff Member</th>
                <th className="py-3 px-4">Username</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Last Activity</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {users.map((u) => {
                const isPrimaryAdmin = u.username.toLowerCase() === 'devine2026';
                return (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                    
                    {/* Display Name */}
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                          u.role === 'admin' 
                            ? 'bg-[#0A192F] text-white' 
                            : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {u.displayName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span>{u.displayName}</span>
                            {isPrimaryAdmin && (
                              <span className="bg-amber-100 text-amber-800 text-[9px] font-black px-1.5 py-0.2 rounded uppercase">
                                Root Owner
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400 block">
                            Created by: {u.createdBy || 'Devine2026'}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Username */}
                    <td className="py-3.5 px-4">
                      <span className="font-mono font-bold text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                        {u.username}
                      </span>
                    </td>

                    {/* Role */}
                    <td className="py-3.5 px-4">
                      {u.role === 'admin' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#0A192F] text-white">
                          <ShieldCheck className="w-3 h-3 text-blue-400" />
                          Admin (Full Access)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <User className="w-3 h-3 text-emerald-600" />
                          Cashier (Counter Only)
                        </span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => handleToggleActive(u)}
                        disabled={isPrimaryAdmin}
                        title={isPrimaryAdmin ? 'Primary Admin cannot be deactivated' : 'Click to toggle status'}
                        className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-bold cursor-pointer transition-colors ${
                          u.isActive !== false
                            ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                            : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                        } ${isPrimaryAdmin ? 'cursor-default' : ''}`}
                      >
                        {u.isActive !== false ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Active</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3.5 h-3.5 text-rose-600" />
                            <span>Disabled</span>
                          </>
                        )}
                      </button>
                    </td>

                    {/* Last Activity */}
                    <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                      {u.lastLoginAt ? (
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>{new Date(u.lastLoginAt).toLocaleString('en-KE', { dateStyle: 'short', timeStyle: 'short' })}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Never logged in</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setShowResetPassModal(u);
                            setResetPasswordVal('');
                            setResetError('');
                            setResetSuccess('');
                          }}
                          className="p-1.5 rounded hover:bg-slate-100 text-slate-600 hover:text-[#0A192F] transition-colors"
                          title="Change Password"
                        >
                          <Key className="w-4 h-4" />
                        </button>

                        {!isPrimaryAdmin && (
                          <button
                            onClick={() => handleDelete(u)}
                            className="p-1.5 rounded hover:bg-rose-50 text-rose-500 hover:text-rose-700 transition-colors"
                            title="Delete User"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

      </div>

      {/* Role Permission Guidance Card */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-600 space-y-2">
        <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
          Access Level Guidelines for Kirinyaga Crescent Counter:
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
          <div className="p-3 bg-white rounded-lg border border-slate-200">
            <span className="font-bold text-[#0A192F] block mb-1">👑 Administrator (Devine2026):</span>
            <ul className="list-disc pl-4 space-y-0.5 text-slate-600 text-[11px]">
              <li>Register new auto spare parts, update prices, buying cost, and stock counts</li>
              <li>Delete parts from database and upload photos</li>
              <li>Track all sales, filter by M-Pesa / Cash, and view profit margins</li>
              <li>Add and manage POS staff accounts and reset passwords</li>
            </ul>
          </div>
          <div className="p-3 bg-white rounded-lg border border-slate-200">
            <span className="font-bold text-emerald-800 block mb-1">💼 Cashier / Counter Sales:</span>
            <ul className="list-disc pl-4 space-y-0.5 text-slate-600 text-[11px]">
              <li>Search parts by YB No, OEM, or name to assist walk-in customers</li>
              <li>Ring up customer sales tickets and process Cash or M-PESA payments</li>
              <li>Print counter receipts</li>
              <li>View inventory stock levels (cannot delete or change pricing)</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Modal: Add New Staff Member */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl shadow-xl w-full max-w-md p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#0A192F] text-blue-400 flex items-center justify-center">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#0A192F]">Add Counter Staff User</h3>
                  <p className="text-[11px] text-slate-500">Create access credential for POS terminal</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4">
              
              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Full Name / Attendant Name:
                </label>
                <input
                  type="text"
                  value={newDisplayName}
                  onChange={(e) => setNewDisplayName(e.target.value)}
                  placeholder="e.g. Peter Mwangi"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-blue-700"
                  required
                />
              </div>

              {/* Username */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Login Username:
                </label>
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="e.g. peterm or cashier1"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 font-mono focus:bg-white focus:outline-none focus:border-blue-700"
                  required
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Staff will use this username to sign into the POS.
                </span>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Password:
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter at least 4 characters..."
                    className="w-full pl-3 pr-10 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 font-mono focus:bg-white focus:outline-none focus:border-blue-700"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-0.5"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Role Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Assigned POS Role:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewRole('cashier')}
                    className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                      newRole === 'cashier'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-900 ring-1 ring-emerald-600'
                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs">
                      <User className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Cashier</span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1">
                      Counter sales, checkout, print receipts & stock lookup.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewRole('admin')}
                    className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                      newRole === 'admin'
                        ? 'border-[#0A192F] bg-blue-50 text-[#0A192F] ring-1 ring-[#0A192F]'
                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs">
                      <ShieldCheck className="w-3.5 h-3.5 text-blue-700" />
                      <span>Admin</span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1">
                      Full authority: inventory, delete, sales history, staff.
                    </p>
                  </button>
                </div>
              </div>

              {/* Feedback messages */}
              {formError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{formError}</span>
                </div>
              )}

              {formSuccess && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>{formSuccess}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-[#0A192F] hover:bg-[#132A4D] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Saving to Firebase...' : 'Save User to Cloud'}</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* Modal: Reset Password */}
      {showResetPassModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl shadow-xl w-full max-w-sm p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-[#0A192F]" />
                <h3 className="font-bold text-sm text-[#0A192F]">
                  Reset Password for {showResetPassModal.username}
                </h3>
              </div>
              <button
                onClick={() => setShowResetPassModal(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  New Password:
                </label>
                <input
                  type="text"
                  value={resetPasswordVal}
                  onChange={(e) => setResetPasswordVal(e.target.value)}
                  placeholder="Enter new password..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 font-mono focus:bg-white focus:outline-none focus:border-blue-700"
                  autoFocus
                  required
                />
              </div>

              {resetError && (
                <div className="p-2 bg-rose-50 text-rose-800 text-xs rounded border border-rose-200">
                  {resetError}
                </div>
              )}

              {resetSuccess && (
                <div className="p-2 bg-emerald-50 text-emerald-800 text-xs rounded border border-emerald-200">
                  {resetSuccess}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowResetPassModal(null)}
                  className="px-3 py-1.5 border border-slate-300 text-slate-700 rounded-lg text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#0A192F] text-white rounded-lg text-xs font-bold"
                >
                  Update Password
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};
