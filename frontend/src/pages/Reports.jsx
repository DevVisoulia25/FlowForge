import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import StatCard from '../components/StatCard';
import api from '../services/api';
import { BarChart3, FileSpreadsheet, Boxes, Clock, CheckCircle, AlertTriangle, Download } from 'lucide-react';

const Reports = () => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await api.get('/reports/dashboard');
      setMetrics(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

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
      <Navbar />

      <div className="flex flex-1">
        <Sidebar />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto w-full space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-extrabold text-white tracking-tight">Production Analytics & Reports</h1>
              <p className="text-xs text-slate-400">Generate report summaries and export raw manufacturing CSV files</p>
            </div>

            <button
              onClick={handleExportCSV}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center space-x-2 shadow-lg shadow-emerald-600/20"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Export CSV Report</span>
            </button>
          </div>

          {metrics && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard title="Total Orders" value={metrics.summary.totalOrders} icon={Boxes} color="indigo" />
              <StatCard title="Orders In Progress" value={metrics.summary.inProgress} icon={Clock} color="amber" />
              <StatCard title="Completed Orders" value={metrics.summary.completed} icon={CheckCircle} color="emerald" />
              <StatCard title="Delayed Orders" value={metrics.summary.delayed} icon={AlertTriangle} color="rose" />
            </div>
          )}

          {/* Department Performance Table */}
          <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
            <h2 className="text-sm font-bold text-white flex items-center space-x-2">
              <BarChart3 className="w-4 h-4 text-indigo-400" />
              <span>Department Workload Performance</span>
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="py-3 px-4 font-semibold">Department Name</th>
                    <th className="py-3 px-4 font-semibold">Active Workload</th>
                    <th className="py-3 px-4 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {metrics?.departmentLoads.map((dept) => (
                    <tr key={dept._id} className="hover:bg-slate-900/40">
                      <td className="py-3 px-4 font-bold text-white">{dept.name}</td>
                      <td className="py-3 px-4 text-indigo-400 font-extrabold">{dept.activeOrders} orders</td>
                      <td className="py-3 px-4">
                        <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full font-semibold">
                          Operational
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Reports;
