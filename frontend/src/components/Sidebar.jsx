import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  PackagePlus,
  Boxes,
  Building2,
  GitCommit,
  BarChart3,
  History,
  Settings,
  Workflow
} from 'lucide-react';

const Sidebar = () => {
  const { user } = useAuth();
  const isOwner = user?.role === 'owner';

  const ownerLinks = [
    { to: '/owner-dashboard', label: 'Owner Overview', icon: LayoutDashboard },
    { to: '/orders/create', label: 'Create Order', icon: PackagePlus },
    { to: '/orders', label: 'All Orders', icon: Boxes },
    { to: '/departments', label: 'Departments', icon: Building2 },
    { to: '/stages', label: 'Production Stages', icon: GitCommit },
    { to: '/reports', label: 'Reports & CSV', icon: BarChart3 },
    { to: '/activity-logs', label: 'Activity Logs', icon: History },
    { to: '/company-profile', label: 'Company Profile', icon: Settings }
  ];

  const deptLinks = [
    { to: '/department-dashboard', label: 'Department View', icon: Workflow },
    { to: '/orders', label: 'Department Orders', icon: Boxes }
  ];

  const links = isOwner ? ownerLinks : deptLinks;

  return (
    <aside className="w-64 bg-slate-900/60 border-r border-slate-800 flex-shrink-0 flex flex-col justify-between hidden md:flex min-h-[calc(100vh-4rem)] p-4">
      <div className="space-y-6">
        <div className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Main Navigation
        </div>
        <nav className="space-y-1">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`
                }
              >
                <Icon className="w-4 h-4" />
                <span>{link.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      <div className="glass-panel p-3.5 rounded-xl border border-slate-800 text-xs">
        <p className="text-slate-400 text-[10px]">FlowForge Tracking Engine</p>
        <p className="text-slate-300 font-medium mt-0.5">Localhost v1.0.0</p>
      </div>
    </aside>
  );
};

export default Sidebar;
