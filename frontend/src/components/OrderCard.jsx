import React, { useState } from 'react';
import { Clock, User, Package, CheckCircle, Eye, AlertTriangle, RotateCcw, ShieldAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const OrderCard = ({ order, onCompleteStage, onRequestRevert, isDepartmentView = false }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isOwner = user?.role === 'owner';

  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
  const [isRevertModalOpen, setIsRevertModalOpen] = useState(false);
  const [remarks, setRemarks] = useState('');
  const [revertReason, setRevertReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Calculate deadline badge status
  const getDeadlineInfo = () => {
    if (order.status === 'Completed') {
      return { badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30', label: 'Completed' };
    }
    if (!order.dueDate) return { badge: 'bg-slate-500/20 text-slate-300', label: 'On Schedule' };

    const now = new Date();
    const due = new Date(order.dueDate);
    const diffMs = due.getTime() - now.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

    if (diffHours < 0 || order.status === 'Delayed') {
      return { badge: 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse', label: 'Overdue' };
    }
    if (diffHours <= 48) {
      return { badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30', label: 'Due Soon' };
    }
    return { badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30', label: 'On Schedule' };
  };

  const getPriorityBadge = (p) => {
    switch (p) {
      case 'High':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
      case 'Medium':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      default:
        return 'bg-slate-500/20 text-slate-300 border-slate-500/30';
    }
  };

  const deadline = getDeadlineInfo();

  const handleConfirmComplete = async () => {
    setSubmitting(true);
    try {
      await onCompleteStage(order._id, remarks);
      setIsCompleteModalOpen(false);
      setRemarks('');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmRevert = async (e) => {
    e.preventDefault();
    if (!revertReason.trim()) {
      setError('Reason for revert is required');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      if (onRequestRevert) {
        await onRequestRevert(order._id, revertReason);
      } else {
        await api.post('/revert-requests', { orderId: order._id, reason: revertReason });
      }
      setIsRevertModalOpen(false);
      setRevertReason('');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="glass-card rounded-2xl p-5 border border-slate-800 flex flex-col justify-between space-y-4">
        {/* Header: Order #, Priority, Deadline Badge */}
        <div className="flex items-start justify-between">
          <div>
            <span className="text-xs font-mono font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
              #{order.orderNumber}
            </span>
            <h3 className="text-base font-bold text-white mt-1.5 line-clamp-1">{order.productName}</h3>
          </div>

          <div className="flex flex-col items-end space-y-1">
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getPriorityBadge(order.priority)}`}>
              {order.priority} Priority
            </span>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${deadline.badge}`}>
              {deadline.label}
            </span>
          </div>
        </div>

        {/* Pending Revert Status Warning */}
        {order.status === 'Pending Revert Approval' && (
          <div className="bg-amber-500/10 border border-amber-500/30 p-2 rounded-xl text-xs text-amber-300 font-semibold flex items-center space-x-1.5">
            <RotateCcw className="w-3.5 h-3.5 animate-spin" />
            <span>Pending Revert Approval</span>
          </div>
        )}

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800/80 text-xs">
          <div className="flex items-center space-x-2 text-slate-300">
            <User className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            <span className="truncate">{order.customerName}</span>
          </div>
          <div className="flex items-center space-x-2 text-slate-300">
            <Package className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            <span>Qty: <strong className="text-white">{order.quantity}</strong></span>
          </div>
          <div className="flex items-center space-x-2 text-slate-300 col-span-2">
            <Clock className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            <span className="text-[11px] text-slate-400">
              Due: {new Date(order.dueDate).toLocaleDateString([], { dateStyle: 'medium' })}
            </span>
          </div>
        </div>

        {/* Current Stage */}
        <div className="bg-indigo-950/30 p-2.5 rounded-xl border border-indigo-500/20 flex items-center justify-between text-xs">
          <span className="text-slate-400 font-medium">Current Stage:</span>
          <span className="font-bold text-indigo-300">
            {order.currentStageId?.name || 'Processing'}
          </span>
        </div>

        {/* Actions */}
        <div className="pt-2 flex items-center space-x-2">
          <button
            onClick={() => navigate(`/orders/${order._id}`)}
            className="flex-1 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors border border-slate-700"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Details</span>
          </button>

          {/* Department Action Buttons */}
          {order.status !== 'Completed' && order.status !== 'Pending Revert Approval' && (
            <>
              {isDepartmentView && (
                <button
                  onClick={() => setIsRevertModalOpen(true)}
                  className="py-2 px-2.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-semibold flex items-center justify-center space-x-1 transition-colors"
                  title="Request Revert to Previous Stage"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Revert</span>
                </button>
              )}

              <button
                onClick={() => setIsCompleteModalOpen(true)}
                className="flex-1 py-2 px-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors shadow-md shadow-indigo-600/20"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Complete Stage</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Complete Stage Modal */}
      {isCompleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-md rounded-2xl p-6 border border-slate-700 shadow-2xl space-y-4">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/30">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Complete Stage</h3>
                <p className="text-xs text-slate-400">Advance Order #{order.orderNumber} to next stage</p>
              </div>
            </div>

            {error && <p className="text-xs text-rose-400">{error}</p>}

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Department Remarks (Optional)</label>
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Stage completion notes..."
                rows={3}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white focus:border-indigo-500"
              ></textarea>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setIsCompleteModalOpen(false)}
                className="px-4 py-2 bg-slate-800 text-slate-300 hover:bg-slate-700 rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmComplete}
                disabled={submitting}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold disabled:opacity-50"
              >
                {submitting ? 'Updating...' : 'Confirm Completion'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Request Revert Modal */}
      {isRevertModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-md rounded-2xl p-6 border border-amber-500/30 shadow-2xl space-y-4">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30">
                <RotateCcw className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Request Order Revert</h3>
                <p className="text-xs text-slate-400">Request owner approval to return Order #{order.orderNumber} to previous stage</p>
              </div>
            </div>

            {error && <p className="text-xs text-rose-400">{error}</p>}

            <form onSubmit={handleConfirmRevert} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Reason for Revert (Required) *
                </label>
                <textarea
                  required
                  value={revertReason}
                  onChange={(e) => setRevertReason(e.target.value)}
                  placeholder="Explain why this order needs to be returned to the previous department..."
                  rows={3}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white focus:border-amber-500"
                ></textarea>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsRevertModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 hover:bg-slate-700 rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Submit Revert Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default OrderCard;
