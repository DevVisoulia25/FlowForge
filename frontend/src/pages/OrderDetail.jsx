import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import StageStepper from '../components/StageStepper';
import api from '../services/api';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Boxes,
  User,
  Package,
  Clock,
  Calendar,
  AlertTriangle,
  CheckCircle,
  ArrowLeft,
  History,
  CheckCircle2,
  Trash2
} from 'lucide-react';

const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [stages, setStages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [remarks, setRemarks] = useState('');
  const [completing, setCompleting] = useState(false);

  const fetchOrderAndStages = async () => {
    setLoading(true);
    try {
      const [orderRes, stagesRes] = await Promise.all([
        api.get(`/orders/${id}`),
        api.get('/stages')
      ]);
      setOrder(orderRes.data);
      setStages(stagesRes.data);
    } catch (error) {
      console.error('Fetch order detail error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderAndStages();
  }, [id]);

  const handleCompleteStage = async () => {
    setCompleting(true);
    try {
      await api.post(`/orders/${id}/complete-stage`, { remarks });
      setRemarks('');
      fetchOrderAndStages();
    } catch (error) {
      alert(error.message);
    } finally {
      setCompleting(false);
    }
  };

  const handleDeleteOrder = async () => {
    if (!window.confirm(`Are you sure you want to delete Order #${order.orderNumber}?`)) return;
    try {
      await api.delete(`/orders/${id}`);
      navigate('/orders');
    } catch (error) {
      alert(error.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center text-slate-400 text-xs animate-pulse">
          Loading order details & workflow history...
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center text-slate-400 text-xs">
          Order not found.
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar />

      <div className="flex flex-1">
        <Sidebar />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto w-full space-y-6">
          {/* Back button & Action header */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate(-1)}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold flex items-center space-x-1 transition-colors border border-slate-700"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            <div className="flex items-center space-x-2">
              <button
                onClick={handleDeleteOrder}
                className="px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 rounded-xl text-xs font-semibold flex items-center space-x-1"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Order</span>
              </button>
            </div>
          </div>

          {/* Order Header Card */}
          <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
              <div>
                <span className="text-xs font-mono font-bold text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-lg border border-indigo-500/20">
                  Order #{order.orderNumber}
                </span>
                <h1 className="text-2xl font-extrabold text-white mt-2">{order.productName}</h1>
                <p className="text-xs text-slate-400 mt-0.5">Customer: <strong className="text-slate-200">{order.customerName}</strong></p>
              </div>

              <div className="flex flex-col items-start sm:items-end space-y-2">
                <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
                  order.status === 'Completed' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
                  order.status === 'Delayed' ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' :
                  'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                }`}>
                  Status: {order.status}
                </span>
                <p className="text-xs text-slate-400">
                  Priority: <strong className="text-amber-400">{order.priority}</strong>
                </p>
              </div>
            </div>

            {/* Metadata Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div className="bg-slate-900/60 p-3.5 rounded-2xl border border-slate-800">
                <p className="text-slate-400 text-[10px]">Quantity</p>
                <p className="text-lg font-bold text-white mt-0.5">{order.quantity} units</p>
              </div>

              <div className="bg-slate-900/60 p-3.5 rounded-2xl border border-slate-800">
                <p className="text-slate-400 text-[10px]">Current Stage</p>
                <p className="text-sm font-bold text-indigo-400 mt-0.5">{order.currentStageId?.name || 'Processing'}</p>
              </div>

              <div className="bg-slate-900/60 p-3.5 rounded-2xl border border-slate-800">
                <p className="text-slate-400 text-[10px]">Current Department</p>
                <p className="text-sm font-bold text-emerald-400 mt-0.5">{order.currentDepartmentId?.name || 'Department'}</p>
              </div>

              <div className="bg-slate-900/60 p-3.5 rounded-2xl border border-slate-800">
                <p className="text-slate-400 text-[10px]">Due Date</p>
                <p className="text-sm font-bold text-white mt-0.5">
                  {new Date(order.dueDate).toLocaleDateString([], { dateStyle: 'medium' })}
                </p>
              </div>
            </div>

            {order.remarks && (
              <div className="bg-slate-900/40 p-4 rounded-2xl border border-slate-800/80 text-xs">
                <p className="font-semibold text-slate-300">Order Notes & Instructions:</p>
                <p className="text-slate-400 mt-1 italic">{order.remarks}</p>
              </div>
            )}
          </div>

          {/* Visual Workflow Progress Stepper */}
          <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-4">
            <h2 className="text-base font-bold text-white flex items-center space-x-2">
              <Boxes className="w-5 h-5 text-indigo-400" />
              <span>Production Stage Progress</span>
            </h2>
            <StageStepper
              stages={stages}
              orderHistory={order.stageHistory}
              currentStageId={order.currentStageId}
            />
          </div>

          {/* Stage Completion Action Box (If order is active) */}
          {order.status !== 'Completed' && (
            <div className="glass-panel p-6 rounded-3xl border border-indigo-500/30 bg-gradient-to-r from-indigo-950/30 to-slate-900 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Complete Stage & Move Order</span>
              </h3>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Optional stage remarks (e.g. Quality check passed 100%)"
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
                <button
                  onClick={handleCompleteStage}
                  disabled={completing}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-indigo-600/20 transition-all disabled:opacity-50"
                >
                  {completing ? 'Advancing Stage...' : 'Complete Stage'}
                </button>
              </div>
            </div>
          )}

          {/* Stage History Timeline Log */}
          <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-4">
            <h2 className="text-base font-bold text-white flex items-center space-x-2">
              <History className="w-5 h-5 text-amber-400" />
              <span>Complete Audit Timeline</span>
            </h2>

            <div className="space-y-3">
              {order.stageHistory && order.stageHistory.length > 0 ? (
                order.stageHistory.map((item, idx) => (
                  <div key={idx} className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-indigo-400">{item.stageName}</span>
                        <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded">
                          {item.departmentName}
                        </span>
                      </div>
                      <p className="text-slate-400 text-[11px] mt-1">
                        Entered: {new Date(item.enteredAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                      </p>
                      {item.remarks && (
                        <p className="text-slate-300 italic text-[11px] mt-1 bg-slate-950/40 p-2 rounded-lg border border-slate-850">
                          "{item.remarks}"
                        </p>
                      )}
                    </div>

                    <div className="sm:text-right">
                      {item.completedAt ? (
                        <div>
                          <span className="text-emerald-400 font-semibold text-[11px] block">✓ Completed</span>
                          <span className="text-slate-400 text-[10px]">
                            By {item.completedByName || 'Dept User'} on {new Date(item.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      ) : (
                        <span className="text-amber-400 font-semibold text-[11px] animate-pulse">● Currently In Progress</span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500 text-center py-4">No stage history recorded yet.</p>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default OrderDetail;
