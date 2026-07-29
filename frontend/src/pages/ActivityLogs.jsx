import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import api from '../services/api';
import { History, User, Clock, ShieldCheck, Search } from 'lucide-react';

const ActivityLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterText, setFilterText] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await api.get('/activity-logs');
      setLogs(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter(
    (log) =>
      log.details?.toLowerCase().includes(filterText.toLowerCase()) ||
      log.userName?.toLowerCase().includes(filterText.toLowerCase()) ||
      log.orderNumber?.toLowerCase().includes(filterText.toLowerCase()) ||
      log.action?.toLowerCase().includes(filterText.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar />

      <div className="flex flex-1">
        <Sidebar />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto w-full space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-extrabold text-white tracking-tight">Audit Trail & Activity Logs</h1>
              <p className="text-xs text-slate-400">Complete immutable record of all order actions, transitions, and user events</p>
            </div>

            <div className="w-full sm:w-72 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                placeholder="Filter logs by user, action, order..."
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
            <h2 className="text-sm font-bold text-white flex items-center space-x-2">
              <History className="w-4 h-4 text-amber-400" />
              <span>Activity Stream ({filteredLogs.length})</span>
            </h2>

            {loading ? (
              <div className="py-12 text-center text-slate-400 text-xs animate-pulse">Loading audit logs...</div>
            ) : filteredLogs.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-8">No activity logs recorded.</p>
            ) : (
              <div className="space-y-3">
                {filteredLogs.map((log) => (
                  <div key={log._id} className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20 text-[10px]">
                          {log.action}
                        </span>
                        {log.orderNumber && (
                          <span className="font-mono text-slate-300 font-bold">#{log.orderNumber}</span>
                        )}
                        <span className="text-slate-400 text-[11px]">by <strong className="text-slate-200">{log.userName || 'User'}</strong></span>
                      </div>
                      <p className="text-slate-300 text-xs">{log.details}</p>
                    </div>

                    <div className="text-slate-500 text-[10px] sm:text-right whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'medium' })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default ActivityLogs;
