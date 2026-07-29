import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import api from '../services/api';
import { RotateCcw, CheckCircle2, XCircle, Clock, AlertTriangle, MessageSquare } from 'lucide-react';

const RevertRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('Pending');
  const [submittingId, setSubmittingId] = useState(null);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/revert-requests?status=${statusFilter}`);
      setRequests(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [statusFilter]);

  const handleApprove = async (id) => {
    setSubmittingId(id);
    try {
      await api.post(`/revert-requests/${id}/approve`);
      fetchRequests();
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmittingId(null);
    }
  };

  const handleReject = async (id) => {
    setSubmittingId(id);
    try {
      await api.post(`/revert-requests/${id}/reject`);
      fetchRequests();
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmittingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar />

      <div className="flex flex-1">
        <Sidebar />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto w-full space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-extrabold text-white tracking-tight">Order Revert Approvals</h1>
              <p className="text-xs text-slate-400">Review and authorize stage reversal requests submitted by departments</p>
            </div>

            <div className="flex items-center space-x-2">
              {['Pending', 'Approved', 'Rejected', ''].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    statusFilter === st
                      ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {st === '' ? 'All Requests' : st}
                </button>
              ))}
            </div>
          </div>

          <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
            <h2 className="text-sm font-bold text-white flex items-center space-x-2">
              <RotateCcw className="w-4 h-4 text-amber-400" />
              <span>Revert Requests Queue ({requests.length})</span>
            </h2>

            {loading ? (
              <div className="py-12 text-center text-slate-400 text-xs animate-pulse">Loading revert requests...</div>
            ) : requests.length === 0 ? (
              <div className="text-center py-12 space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                <p className="text-sm font-bold text-slate-300">No Revert Requests Found</p>
                <p className="text-xs text-slate-500">There are no {statusFilter.toLowerCase()} stage reversal requests.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {requests.map((req) => (
                  <div
                    key={req._id}
                    className="bg-slate-900/70 p-5 rounded-2xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs"
                  >
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                          #{req.orderNumber}
                        </span>
                        <span className="font-bold text-white">{req.departmentName} Dept</span>
                        <span className="text-[10px] text-slate-400">
                          by {req.requestedByName || 'User'}
                        </span>
                      </div>

                      <div className="flex items-center space-x-2 text-slate-300 font-medium">
                        <span>Current: <strong className="text-slate-200">{req.currentStageName}</strong></span>
                        <span>&rarr;</span>
                        <span>Request Return To: <strong className="text-amber-400">{req.requestedPreviousStageName}</strong></span>
                      </div>

                      <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 text-slate-300 flex items-start space-x-2">
                        <MessageSquare className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                        <p className="italic text-xs">"{req.reason}"</p>
                      </div>

                      <p className="text-[10px] text-slate-500">
                        Requested on: {new Date(req.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-2 flex-shrink-0">
                      {req.status === 'Pending' ? (
                        <>
                          <button
                            onClick={() => handleReject(req._id)}
                            disabled={submittingId === req._id}
                            className="px-4 py-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors disabled:opacity-50"
                          >
                            <XCircle className="w-4 h-4" />
                            <span>Reject</span>
                          </button>

                          <button
                            onClick={() => handleApprove(req._id)}
                            disabled={submittingId === req._id}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center space-x-1.5 shadow-lg shadow-emerald-600/20 transition-all disabled:opacity-50"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Approve Revert</span>
                          </button>
                        </>
                      ) : (
                        <span className={`text-xs font-bold px-3 py-1.5 rounded-xl border ${
                          req.status === 'Approved' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                        }`}>
                          {req.status}
                        </span>
                      )}
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

export default RevertRequests;
