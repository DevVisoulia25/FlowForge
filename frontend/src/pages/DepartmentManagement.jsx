import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import api from '../services/api';
import { Building2, Plus, Trash2, Edit2, MoveUp, MoveDown, Check } from 'lucide-react';

const DepartmentManagement = () => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newDeptName, setNewDeptName] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [error, setError] = useState('');

  const fetchDepartments = async () => {
    setLoading(true);
    try {
      const res = await api.get('/departments');
      setDepartments(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newDeptName.trim()) return;
    setError('');
    try {
      await api.post('/departments', { name: newDeptName });
      setNewDeptName('');
      fetchDepartments();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleUpdate = async (id) => {
    if (!editingName.trim()) return;
    setError('');
    try {
      await api.put(`/departments/${id}`, { name: editingName });
      setEditingId(null);
      fetchDepartments();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete department '${name}'?`)) return;
    setError('');
    try {
      await api.delete(`/departments/${id}`);
      fetchDepartments();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleReorder = async (index, direction) => {
    const updated = [...departments];
    const temp = updated[index];
    updated[index] = updated[index + direction];
    updated[index + direction] = temp;
    setDepartments(updated);

    try {
      await api.put('/departments/reorder', {
        departmentIds: updated.map((d) => d._id)
      });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar />

      <div className="flex flex-1">
        <Sidebar />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto w-full space-y-6">
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">Department Management</h1>
            <p className="text-xs text-slate-400">Configure factory departments and reorder production sequence</p>
          </div>

          {error && (
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-xl text-xs font-medium">
              {error}
            </div>
          )}

          {/* Add Department Form */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-800">
            <form onSubmit={handleCreate} className="flex gap-3">
              <input
                type="text"
                value={newDeptName}
                onChange={(e) => setNewDeptName(e.target.value)}
                placeholder="Enter new department name (e.g. Painting, CNC Machining)"
                className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
              <button
                type="submit"
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs flex items-center space-x-1.5 shadow-lg shadow-indigo-600/20"
              >
                <Plus className="w-4 h-4" />
                <span>Add Department</span>
              </button>
            </form>
          </div>

          {/* Department List */}
          <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-3">
            <h2 className="text-sm font-bold text-white flex items-center space-x-2">
              <Building2 className="w-4 h-4 text-indigo-400" />
              <span>Configured Departments ({departments.length})</span>
            </h2>

            {loading ? (
              <div className="py-8 text-center text-slate-400 text-xs animate-pulse">Loading departments...</div>
            ) : departments.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-4">No departments configured yet.</p>
            ) : (
              <div className="space-y-2">
                {departments.map((dept, idx) => (
                  <div key={dept._id} className="flex items-center justify-between bg-slate-900/70 p-3 rounded-xl border border-slate-800 text-xs">
                    <div className="flex items-center space-x-3">
                      <div className="flex flex-col space-y-1">
                        <button
                          onClick={() => handleReorder(idx, -1)}
                          disabled={idx === 0}
                          className="text-slate-400 hover:text-white disabled:opacity-20"
                        >
                          <MoveUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleReorder(idx, 1)}
                          disabled={idx === departments.length - 1}
                          className="text-slate-400 hover:text-white disabled:opacity-20"
                        >
                          <MoveDown className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <span className="font-mono font-bold text-indigo-400 text-xs">#{idx + 1}</span>

                      {editingId === dept._id ? (
                        <input
                          type="text"
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          className="bg-slate-950 border border-indigo-500 rounded-lg px-2.5 py-1 text-xs text-white"
                        />
                      ) : (
                        <span className="font-semibold text-slate-200">{dept.name}</span>
                      )}
                    </div>

                    <div className="flex items-center space-x-2">
                      {editingId === dept._id ? (
                        <button
                          onClick={() => handleUpdate(dept._id)}
                          className="p-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setEditingId(dept._id);
                            setEditingName(dept.name);
                          }}
                          className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded-lg"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      )}

                      <button
                        onClick={() => handleDelete(dept._id, dept.name)}
                        className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
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

export default DepartmentManagement;
