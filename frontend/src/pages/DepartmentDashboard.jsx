import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import OrderCard from '../components/OrderCard';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Workflow, RefreshCw, CheckCircle2, Boxes, Clock, AlertTriangle, ShieldAlert } from 'lucide-react';

const DepartmentDashboard = () => {
  const { user, company } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchDepartmentOrders = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/orders?search=${encodeURIComponent(searchQuery)}`);
      setOrders(res.data);
    } catch (error) {
      console.error('Failed to load department orders:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartmentOrders();
  }, []);

  const handleSearch = (term) => {
    setSearchQuery(term);
    fetchDepartmentOrders();
  };

  const handleCompleteStage = async (orderId, remarks) => {
    try {
      await api.post(`/orders/${orderId}/complete-stage`, { remarks });
      fetchDepartmentOrders();
    } catch (error) {
      alert(error.message);
    }
  };

  const handleRequestRevert = async (orderId, reason) => {
    try {
      await api.post('/revert-requests', { orderId, reason });
      fetchDepartmentOrders();
    } catch (error) {
      alert(error.message);
    }
  };

  const deptName = user?.department?.name || user?.name || 'Department';

  // Urgent Orders filter (High priority or near deadline/overdue)
  const urgentOrders = orders.filter((o) => {
    if (o.priority === 'High' || o.status === 'Delayed') return true;
    if (o.dueDate) {
      const diffMs = new Date(o.dueDate).getTime() - Date.now();
      return diffMs <= 48 * 60 * 60 * 1000;
    }
    return false;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar onSearch={handleSearch} />

      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
        {/* Department Banner Header */}
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-indigo-500/20 bg-gradient-to-r from-indigo-950/40 via-slate-900 to-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <Workflow className="w-8 h-8 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] uppercase font-bold bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded border border-indigo-500/30">
                  {company?.name}
                </span>
                <span className="text-[10px] uppercase font-bold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30">
                  Active Station
                </span>
              </div>
              <h1 className="text-2xl font-extrabold text-white mt-1">{deptName} Workstation</h1>
              <p className="text-xs text-slate-400">
                Displaying orders currently assigned to {deptName}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="bg-slate-900/90 px-4 py-2 rounded-2xl border border-slate-800 flex items-center space-x-2">
              <Boxes className="w-5 h-5 text-indigo-400" />
              <div>
                <p className="text-[10px] text-slate-400 font-semibold">Station Load</p>
                <p className="text-base font-extrabold text-white">{orders.length} Orders</p>
              </div>
            </div>

            <button
              onClick={fetchDepartmentOrders}
              className="p-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-2xl transition-colors border border-slate-700"
              title="Refresh Department Orders"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* My Urgent Orders Section (if any) */}
        {urgentOrders.length > 0 && (
          <div className="glass-panel p-6 rounded-3xl border border-rose-500/30 bg-rose-950/10 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <ShieldAlert className="w-5 h-5 text-rose-400" />
                <h2 className="text-sm font-extrabold text-white">My Urgent Orders ({urgentOrders.length})</h2>
              </div>
              <span className="text-xs text-rose-300 font-semibold">High Priority or Due Soon</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {urgentOrders.map((ord) => (
                <OrderCard
                  key={ord._id}
                  order={ord}
                  onCompleteStage={handleCompleteStage}
                  onRequestRevert={handleRequestRevert}
                  isDepartmentView={true}
                />
              ))}
            </div>
          </div>
        )}

        {/* Workstation Queue */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center space-x-2">
              <Clock className="w-5 h-5 text-indigo-400" />
              <span>Assigned Station Queue</span>
            </h2>
            <span className="text-xs text-slate-400">
              Orders move automatically when completed or reverted
            </span>
          </div>

          {loading ? (
            <div className="py-16 text-center text-slate-400 text-xs font-medium animate-pulse">
              Loading workstation queue...
            </div>
          ) : orders.length === 0 ? (
            <div className="glass-panel p-12 text-center rounded-3xl border border-slate-800 space-y-3">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
              <h3 className="text-base font-bold text-white">Queue Empty!</h3>
              <p className="text-xs text-slate-400">
                No orders are currently waiting in {deptName}. New orders will automatically appear here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {orders.map((ord) => (
                <OrderCard
                  key={ord._id}
                  order={ord}
                  onCompleteStage={handleCompleteStage}
                  onRequestRevert={handleRequestRevert}
                  isDepartmentView={true}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default DepartmentDashboard;
