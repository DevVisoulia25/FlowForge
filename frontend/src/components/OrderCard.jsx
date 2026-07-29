import React, { useState } from 'react';
import { Clock, User, Package, Hash, CheckCircle, Eye, AlertCircle, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const OrderCard = ({ order, onCompleteStage, isDepartmentView = false }) => {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);

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

  const getStatusBadge = (s) => {
    switch (s) {
      case 'Completed':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      case 'Delayed':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/30 animate-pulse';
      case 'In Progress':
        return 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30';
      default:
        return 'bg-slate-500/20 text-slate-300 border-slate-500/30';
    }
  };

  const handleConfirmComplete = async () => {
    setSubmitting(true);
    try {
      await onCompleteStage(order._id, remarks);
      setIsModalOpen(false);
      setRemarks('');
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="glass-card rounded-2xl p-5 border border-slate-800 flex flex-col justify-between space-y-4">
        {/* Header: Order #, Priority, Status */}
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
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getStatusBadge(order.status)}`}>
              {order.status}
            </span>
          </div>
        </div>

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
              Received: {new Date(order.updatedAt || order.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
            </span>
          </div>
        </div>

        {/* Current Stage */}
        <div className="bg-indigo-950/30 p-2.5 rounded-xl border border-indigo-500/20 flex items-center justify-between text-xs">
          <span className="text-slate-400 font-medium">Current Stage:</span>
          <span className="font-bold text-indigo-300">
            {order.currentStageId?.name || 'In Progress'}
          </span>
        </div>

        {/* Remarks if any */}
        {order.remarks && (
          <p className="text-xs text-slate-400 italic bg-slate-900/40 p-2 rounded-lg border border-slate-800">
            "{order.remarks}"
          </p>
        )}

        {/* Actions */}
        <div className="pt-2 flex items-center space-x-2">
          <button
            onClick={() => navigate(`/orders/${order._id}`)}
            className="flex-1 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors border border-slate-700"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Details</span>
          </button>

          {order.status !== 'Completed' && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex-1 py-2 px-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors shadow-md shadow-indigo-600/20"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Complete Stage</span>
            </button>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-md rounded-2xl p-6 border border-slate-700 shadow-2xl space-y-4">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/30">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Complete Production Stage</h3>
                <p className="text-xs text-slate-400">
                  Advance Order #{order.orderNumber} to the next department stage.
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Department Remarks (Optional)
              </label>
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="e.g. Completed quality inspection, passed batch testing."
                rows={3}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              ></textarea>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 bg-slate-800 text-slate-300 hover:bg-slate-700 rounded-xl text-xs font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmComplete}
                disabled={submitting}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition-colors disabled:opacity-50"
              >
                {submitting ? 'Updating...' : 'Confirm Stage Completion'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default OrderCard;
