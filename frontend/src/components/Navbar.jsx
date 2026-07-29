import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import NotificationDropdown from './NotificationDropdown';
import { LogOut, Search, Factory, UserCheck, ShieldCheck } from 'lucide-react';

const Navbar = ({ onSearch }) => {
  const { user, company, logout } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(searchTerm);
    } else {
      navigate(`/orders?search=${encodeURIComponent(searchTerm)}`);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="h-16 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-30 px-4 sm:px-6 flex items-center justify-between">
      {/* Brand & Company Logo */}
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center shadow-lg shadow-indigo-500/20">
          <Factory className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-base font-bold text-white tracking-tight flex items-center gap-1.5">
            FlowForge
            <span className="text-[10px] uppercase font-semibold bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded">
              {company?.industry || 'System'}
            </span>
          </h1>
          <p className="text-xs text-slate-400 font-medium truncate max-w-[150px] sm:max-w-[220px]">
            {company?.name || 'Manufacturing Client'}
          </p>
        </div>
      </div>

      {/* Global Search Bar */}
      <div className="hidden md:flex flex-1 max-w-md mx-6">
        <form onSubmit={handleSearchSubmit} className="w-full relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Global search by Order #, Customer, Product..."
            className="w-full pl-10 pr-4 py-2 bg-slate-800/80 border border-slate-700/70 rounded-xl text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
          />
        </form>
      </div>

      {/* User Actions */}
      <div className="flex items-center space-x-3 sm:space-x-4">
        {/* Role Badge */}
        <div className="hidden sm:flex items-center space-x-2 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700/60">
          {user?.role === 'owner' ? (
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          ) : (
            <UserCheck className="w-4 h-4 text-amber-400" />
          )}
          <div className="text-left leading-none">
            <p className="text-xs font-semibold text-slate-200">{user?.name}</p>
            <p className="text-[10px] text-slate-400 capitalize">{user?.role} Account</p>
          </div>
        </div>

        <NotificationDropdown />

        <button
          onClick={handleLogout}
          className="p-2 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-1.5 text-xs font-medium"
          title="Logout"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
};

export default Navbar;
