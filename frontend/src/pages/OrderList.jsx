import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import OrderCard from '../components/OrderCard';
import api from '../services/api';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Boxes, Plus, Search, Filter, Eye, CheckCircle } from 'lucide-react';

const OrderList = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialSearch = searchParams.get('search') || '';

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [statusFilter, setStatusFilter] = useState('');

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/orders?search=${encodeURIComponent(searchQuery)}&status=${statusFilter}`);
      setOrders(res.data);
    } catch (error) {
      console.error('Fetch orders error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter, searchQuery]);

  const handleCompleteStage = async (orderId, remarks) => {
    try {
      await api.post(`/orders/${orderId}/complete-stage`, { remarks });
      fetchOrders();
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar onSearch={(term) => setSearchQuery(term)} />

      <div className="flex flex-1">
        <Sidebar />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-extrabold text-white tracking-tight">Order Directory</h1>
              <p className="text-xs text-slate-400">Search and track production orders across all company stages</p>
            </div>

            <button
              onClick={() => navigate('/orders/create')}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs flex items-center space-x-1.5 shadow-lg shadow-indigo-600/20"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Order</span>
            </button>
          </div>

          {/* Search & Filter Bar */}
          <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="w-full md:w-80 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Order #, Customer, Product..."
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center space-x-1.5 w-full md:w-auto overflow-x-auto">
              {['', 'In Progress', 'Completed', 'Delayed'].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    statusFilter === st
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {st === '' ? 'All Orders' : st}
                </button>
              ))}
            </div>
          </div>

          {/* Grid View */}
          {loading ? (
            <div className="py-12 text-center text-slate-400 text-xs font-medium animate-pulse">
              Loading orders directory...
            </div>
          ) : orders.length === 0 ? (
            <div className="glass-panel p-12 text-center rounded-2xl border border-slate-800 space-y-3">
              <Boxes className="w-12 h-12 text-slate-600 mx-auto" />
              <h3 className="text-sm font-bold text-white">No Matching Orders</h3>
              <p className="text-xs text-slate-400">Try adjusting your search term or status filter.</p>
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
        </main>
      </div>
    </div>
  );
};

export default OrderList;
