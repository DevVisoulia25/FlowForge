import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import StatCard from '../components/StatCard';
import OrderCard from '../components/OrderCard';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import {
  Boxes,
  Clock,
  CheckCircle,
  AlertTriangle,
  Plus,
  Building2,
  FileSpreadsheet,
  History,
  RefreshCw,
  Search,
  Filter
} from 'lucide-react';

const OwnerDashboard = () => {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [metricsRes, ordersRes] = await Promise.all([
        api.get('/reports/dashboard'),
        api.get(`/orders?search=${encodeURIComponent(searchQuery)}&status=${statusFilter}`)
      ]);
      setMetrics(metricsRes.data);
      setOrders(ordersRes.data);
    } catch (error) {
      console.error('Failed to fetch owner dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [statusFilter]);

  const handleSearch = (term) => {
    setSearchQuery(term);
    fetchData();
  };

  const handleCompleteStage = async (orderId, remarks) => {
    try {
      await api.post(`/orders/${orderId}/complete-stage`, { remarks });
      fetchData();
    } catch (error) {
      alert(error.message);
    }
  };

  const handleExportCSV = async () => {
    try {
      const response = await api.get('/reports/export', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'FlowForge_Orders_Report.csv');
      document.body.appendChild(link);
      link.click();
    } catch (error) {
      alert('CSV Export failed');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar onSearch={handleSearch} />

      <div className="flex flex-1">
        <Sidebar />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-8">
          {/* Header & Quick Action Buttons */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-extrabold text-white tracking-tight">Owner Control Center</h1>
              <p className="text-xs text-slate-400 mt-1">Real-time overview of manufacturing workflow & department loads</p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => navigate('/orders/create')}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-xs flex items-center space-x-1.5 shadow-lg shadow-indigo-600/20 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Create Order</span>
              </button>

              <button
                onClick={handleExportCSV}
                className="px-3.5 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Export CSV</span>
              </button>

              <button
                onClick={fetchData}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors border border-slate-700"
                title="Refresh Dashboard"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Metric Summary Cards */}
          {metrics && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="Total Orders"
                value={metrics.summary.totalOrders}
                icon={Boxes}
                color="indigo"
                subtitle={`${metrics.summary.todayOrders} created today`}
              />
              <StatCard
                title="In Progress"
                value={metrics.summary.inProgress}
                icon={Clock}
                color="amber"
                subtitle="Active on floor"
              />
              <StatCard
                title="Completed"
                value={metrics.summary.completed}
                icon={CheckCircle}
                color="emerald"
                subtitle="Finished orders"
              />
              <StatCard
                title="Delayed"
                value={metrics.summary.delayed}
                icon={AlertTriangle}
                color="rose"
                subtitle="Passed due date"
              />
            </div>
          )}

          {/* Department Workload Breakdown & Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Department Load Progress Cards */}
            <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Building2 className="w-5 h-5 text-indigo-400" />
                  <h3 className="font-bold text-sm text-white">Department Active Workloads</h3>
                </div>
                <button
                  onClick={() => navigate('/departments')}
                  className="text-xs text-indigo-400 font-semibold hover:underline"
                >
                  Manage Depts &rarr;
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {metrics?.departmentLoads.map((dept) => (
                  <div key={dept._id} className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-slate-200">{dept.name}</p>
                      <p className="text-[11px] text-slate-400">Active Work In Progress</p>
                    </div>
                    <span className="text-xl font-extrabold text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-lg border border-indigo-500/20">
                      {dept.activeOrders}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Activity Audit Feed */}
            <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <History className="w-5 h-5 text-amber-400" />
                  <h3 className="font-bold text-sm text-white">Recent Floor Activity</h3>
                </div>
                <button
                  onClick={() => navigate('/activity-logs')}
                  className="text-xs text-indigo-400 font-semibold hover:underline"
                >
                  Full Log &rarr;
                </button>
              </div>

              <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                {metrics?.recentActivity.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-4">No recent activity recorded.</p>
                ) : (
                  metrics?.recentActivity.map((log) => (
                    <div key={log._id} className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/80 text-xs">
                      <div className="flex items-center justify-between text-[10px] text-slate-400">
                        <span className="font-semibold text-indigo-300">{log.userName || 'User'}</span>
                        <span>{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <p className="text-slate-300 mt-1 text-[11px] font-medium line-clamp-2">{log.details}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Orders Tracking Section */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/40 p-4 rounded-2xl border border-slate-800">
              <div className="flex items-center space-x-2">
                <Boxes className="w-5 h-5 text-indigo-400" />
                <h2 className="font-extrabold text-base text-white">Live Production Orders</h2>
                <span className="text-xs text-slate-400">({orders.length})</span>
              </div>

              {/* Status Filter Buttons */}
              <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0">
                {['', 'In Progress', 'Completed', 'Delayed'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                      statusFilter === st
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {st === '' ? 'All Orders' : st}
                  </button>
                ))}
              </div>
            </div>

            {/* Orders Cards Grid */}
            {loading ? (
              <div className="py-12 text-center text-slate-400 text-xs font-medium animate-pulse">
                Refreshing production floor data...
              </div>
            ) : orders.length === 0 ? (
              <div className="glass-panel p-12 text-center rounded-2xl border border-slate-800 space-y-3">
                <Boxes className="w-12 h-12 text-slate-600 mx-auto" />
                <p className="text-sm font-semibold text-slate-300">No Orders Found</p>
                <p className="text-xs text-slate-500">Create a new order to start tracking production stages.</p>
                <button
                  onClick={() => navigate('/orders/create')}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs inline-flex items-center space-x-1.5 shadow-lg shadow-indigo-600/20 mt-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create First Order</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {orders.map((ord) => (
                  <OrderCard
                    key={ord._id}
                    order={ord}
                    onCompleteStage={handleCompleteStage}
                  />
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default OwnerDashboard;
