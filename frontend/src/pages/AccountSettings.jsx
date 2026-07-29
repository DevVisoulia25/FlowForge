import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { UserCog, Lock, User, Key, Building2, Save, CheckCircle, RefreshCw } from 'lucide-react';

const AccountSettings = () => {
  const { user, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState('owner');

  // Owner Form State
  const [ownerData, setOwnerData] = useState({
    name: user?.name || '',
    username: user?.username || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [ownerMsg, setOwnerMsg] = useState('');
  const [ownerErr, setOwnerErr] = useState('');
  const [ownerLoading, setOwnerLoading] = useState(false);

  // Dept Accounts State
  const [deptAccounts, setDeptAccounts] = useState([]);
  const [deptLoading, setDeptLoading] = useState(true);
  const [deptEditData, setDeptEditData] = useState({});
  const [deptMsg, setDeptMsg] = useState('');
  const [deptErr, setDeptErr] = useState('');

  const fetchDeptAccounts = async () => {
    setDeptLoading(true);
    try {
      const res = await api.get('/account/departments');
      setDeptAccounts(res.data);

      // Initialize edit fields
      const initialMap = {};
      res.data.forEach((u) => {
        initialMap[u._id] = {
          username: u.username,
          newPassword: '',
          departmentName: u.departmentId?.name || ''
        };
      });
      setDeptEditData(initialMap);
    } catch (err) {
      console.error(err);
    } finally {
      setDeptLoading(false);
    }
  };

  useEffect(() => {
    fetchDeptAccounts();
  }, []);

  const handleOwnerSubmit = async (e) => {
    e.preventDefault();
    setOwnerMsg('');
    setOwnerErr('');
    setOwnerLoading(true);

    try {
      const res = await api.put('/account/owner', ownerData);
      await refreshUser();
      setOwnerMsg(res.data.message || 'Owner settings updated!');
      setOwnerData((prev) => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
    } catch (err) {
      setOwnerErr(err.message || 'Failed to update owner account.');
    } finally {
      setOwnerLoading(false);
    }
  };

  const handleDeptUpdate = async (userId) => {
    setDeptMsg('');
    setDeptErr('');
    const payload = deptEditData[userId];
    if (!payload) return;

    try {
      await api.put(`/account/department/${userId}`, payload);
      setDeptMsg(`Account updated for department user!`);
      // Reset password field in local state
      setDeptEditData((prev) => ({
        ...prev,
        [userId]: { ...prev[userId], newPassword: '' }
      }));
      fetchDeptAccounts();
    } catch (err) {
      setDeptErr(err.message || 'Failed to update department account.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar />

      <div className="flex flex-1">
        <Sidebar />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto w-full space-y-6">
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">Account Management</h1>
            <p className="text-xs text-slate-400">Manage owner login security and department accounts</p>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center space-x-2 border-b border-slate-800 pb-1">
            <button
              onClick={() => setActiveTab('owner')}
              className={`px-4 py-2 text-xs font-bold rounded-t-xl transition-all ${
                activeTab === 'owner'
                  ? 'bg-slate-900 text-indigo-400 border-t-2 border-indigo-500'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Owner Account & Security
            </button>
            <button
              onClick={() => setActiveTab('departments')}
              className={`px-4 py-2 text-xs font-bold rounded-t-xl transition-all ${
                activeTab === 'departments'
                  ? 'bg-slate-900 text-indigo-400 border-t-2 border-indigo-500'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Department Logins ({deptAccounts.length})
            </button>
          </div>

          {/* TAB 1: Owner Settings */}
          {activeTab === 'owner' && (
            <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-6">
              <h2 className="text-sm font-bold text-white flex items-center space-x-2">
                <UserCog className="w-4 h-4 text-indigo-400" />
                <span>Company Owner Profile & Security</span>
              </h2>

              {ownerMsg && (
                <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-xl text-xs flex items-center space-x-2 font-medium">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <span>{ownerMsg}</span>
                </div>
              )}

              {ownerErr && (
                <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-xl text-xs font-medium">
                  {ownerErr}
                </div>
              )}

              <form onSubmit={handleOwnerSubmit} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1.5">Owner Full Name</label>
                    <input
                      type="text"
                      required
                      value={ownerData.name}
                      onChange={(e) => setOwnerData({ ...ownerData, name: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-300 mb-1.5">Username (Must be unique globally)</label>
                    <input
                      type="text"
                      required
                      value={ownerData.username}
                      onChange={(e) => setOwnerData({ ...ownerData, username: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white"
                    />
                  </div>
                </div>

                <div className="border-t border-slate-800 pt-4 space-y-3">
                  <h3 className="font-bold text-slate-300 text-xs flex items-center space-x-1.5">
                    <Key className="w-4 h-4 text-amber-400" />
                    <span>Change Password</span>
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block font-medium text-slate-400 mb-1">Current Password</label>
                      <input
                        type="password"
                        value={ownerData.currentPassword}
                        onChange={(e) => setOwnerData({ ...ownerData, currentPassword: e.target.value })}
                        placeholder="Current password"
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white"
                      />
                    </div>
                    <div>
                      <label className="block font-medium text-slate-400 mb-1">New Password</label>
                      <input
                        type="password"
                        value={ownerData.newPassword}
                        onChange={(e) => setOwnerData({ ...ownerData, newPassword: e.target.value })}
                        placeholder="New password"
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white"
                      />
                    </div>
                    <div>
                      <label className="block font-medium text-slate-400 mb-1">Confirm New Password</label>
                      <input
                        type="password"
                        value={ownerData.confirmPassword}
                        onChange={(e) => setOwnerData({ ...ownerData, confirmPassword: e.target.value })}
                        placeholder="Confirm password"
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={ownerLoading}
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs flex items-center space-x-1.5 shadow-lg shadow-indigo-600/20 disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    <span>{ownerLoading ? 'Saving...' : 'Update Owner Account'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 2: Department Logins */}
          {activeTab === 'departments' && (
            <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-white flex items-center space-x-2">
                  <Building2 className="w-4 h-4 text-indigo-400" />
                  <span>Department Account Credentials & Reset</span>
                </h2>
                <button
                  onClick={fetchDeptAccounts}
                  className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors border border-slate-700"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>

              {deptMsg && (
                <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-xl text-xs flex items-center space-x-2 font-medium">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <span>{deptMsg}</span>
                </div>
              )}

              {deptErr && (
                <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-xl text-xs font-medium">
                  {deptErr}
                </div>
              )}

              {deptLoading ? (
                <p className="text-xs text-slate-400 text-center py-6 animate-pulse">Loading department logins...</p>
              ) : (
                <div className="space-y-4">
                  {deptAccounts.map((u) => {
                    const data = deptEditData[u._id] || { username: u.username, newPassword: '', departmentName: u.departmentId?.name || '' };
                    return (
                      <div key={u._id} className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 space-y-3 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-indigo-400 text-sm">
                            {u.departmentId?.name || u.name}
                          </span>
                          <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded">
                            Department Login
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <label className="block text-slate-400 mb-1">Username</label>
                            <input
                              type="text"
                              value={data.username}
                              onChange={(e) =>
                                setDeptEditData({
                                  ...deptEditData,
                                  [u._id]: { ...data, username: e.target.value }
                                })
                              }
                              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-white"
                            />
                          </div>

                          <div>
                            <label className="block text-slate-400 mb-1">Reset Password (Enter New)</label>
                            <input
                              type="password"
                              value={data.newPassword}
                              onChange={(e) =>
                                setDeptEditData({
                                  ...deptEditData,
                                  [u._id]: { ...data, newPassword: e.target.value }
                                })
                              }
                              placeholder="Type new password"
                              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-white"
                            />
                          </div>

                          <div>
                            <label className="block text-slate-400 mb-1">Department Name</label>
                            <input
                              type="text"
                              value={data.departmentName}
                              onChange={(e) =>
                                setDeptEditData({
                                  ...deptEditData,
                                  [u._id]: { ...data, departmentName: e.target.value }
                                })
                              }
                              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-white"
                            />
                          </div>
                        </div>

                        <div className="flex justify-end pt-1">
                          <button
                            type="button"
                            onClick={() => handleDeptUpdate(u._id)}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs shadow-md shadow-indigo-600/20 flex items-center space-x-1"
                          >
                            <Save className="w-3.5 h-3.5" />
                            <span>Save Changes</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default AccountSettings;
