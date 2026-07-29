import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import api from '../services/api';
import { GitCommit, Plus, Trash2, Edit2, MoveUp, MoveDown, Check, Building2 } from 'lucide-react';

const StageManagement = () => {
  const [stages, setStages] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  const [newStageName, setNewStageName] = useState('');
  const [selectedDeptId, setSelectedDeptId] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [editingDeptId, setEditingDeptId] = useState('');
  const [error, setError] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [stagesRes, deptsRes] = await Promise.all([
        api.get('/stages'),
        api.get('/departments')
      ]);
      setStages(stagesRes.data);
      setDepartments(deptsRes.data);
      if (deptsRes.data.length > 0) {
        setSelectedDeptId(deptsRes.data[0]._id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newStageName.trim() || !selectedDeptId) return;
    setError('');
    try {
      await api.post('/stages', {
        name: newStageName,
        departmentId: selectedDeptId
      });
      setNewStageName('');
      fetchData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleUpdate = async (id) => {
    if (!editingName.trim() || !editingDeptId) return;
    setError('');
    try {
      await api.put(`/stages/${id}`, {
        name: editingName,
        departmentId: editingDeptId
      });
      setEditingId(null);
      fetchData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete production stage '${name}'?`)) return;
    setError('');
    try {
      await api.delete(`/stages/${id}`);
      fetchData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleReorder = async (index, direction) => {
    const updated = [...stages];
    const temp = updated[index];
    updated[index] = updated[index + direction];
    updated[index + direction] = temp;
    setStages(updated);

    try {
      await api.put('/stages/reorder', {
        stageIds: updated.map((s) => s._id)
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
            <h1 className="text-2xl font-extrabold text-white tracking-tight">Production Workflow Stages</h1>
            <p className="text-xs text-slate-400">Define the sequential stages through which orders move from start to finish</p>
          </div>

          {error && (
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-xl text-xs font-medium">
              {error}
            </div>
          )}

          {/* Create Stage Form */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-800">
            <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <input
                type="text"
                value={newStageName}
                onChange={(e) => setNewStageName(e.target.value)}
                placeholder="New Stage Name (e.g. Quality Inspection)"
                className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />

              <select
                value={selectedDeptId}
                onChange={(e) => setSelectedDeptId(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-indigo-500"
              >
                {departments.map((d) => (
                  <option key={d._id} value={d._id}>
                    Assign to: {d.name}
                  </option>
                ))}
              </select>

              <button
                type="submit"
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl flex items-center justify-center space-x-1.5 shadow-lg shadow-indigo-600/20"
              >
                <Plus className="w-4 h-4" />
                <span>Add Stage</span>
              </button>
            </form>
          </div>

          {/* Stage List */}
          <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-3">
            <h2 className="text-sm font-bold text-white flex items-center space-x-2">
              <GitCommit className="w-4 h-4 text-indigo-400" />
              <span>Production Stage Sequence ({stages.length})</span>
            </h2>

            {loading ? (
              <div className="py-8 text-center text-slate-400 text-xs animate-pulse">Loading stages...</div>
            ) : stages.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-4">No stages defined yet.</p>
            ) : (
              <div className="space-y-2">
                {stages.map((stg, idx) => (
                  <div key={stg._id} className="flex items-center justify-between bg-slate-900/70 p-3 rounded-xl border border-slate-800 text-xs">
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
                          disabled={idx === stages.length - 1}
                          className="text-slate-400 hover:text-white disabled:opacity-20"
                        >
                          <MoveDown className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <span className="font-mono font-bold text-indigo-400 text-xs">Stage #{idx + 1}</span>

                      {editingId === stg._id ? (
                        <div className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            className="bg-slate-950 border border-indigo-500 rounded-lg px-2.5 py-1 text-xs text-white"
                          />
                          <select
                            value={editingDeptId}
                            onChange={(e) => setEditingDeptId(e.target.value)}
                            className="bg-slate-950 border border-indigo-500 rounded-lg px-2 py-1 text-xs text-white"
                          >
                            {departments.map((d) => (
                              <option key={d._id} value={d._id}>
                                {d.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      ) : (
                        <div>
                          <span className="font-semibold text-slate-200">{stg.name}</span>
                          <span className="ml-2 text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded">
                            {stg.departmentId?.name || 'Department'}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center space-x-2">
                      {editingId === stg._id ? (
                        <button
                          onClick={() => handleUpdate(stg._id)}
                          className="p-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setEditingId(stg._id);
                            setEditingName(stg.name);
                            setEditingDeptId(stg.departmentId?._id || stg.departmentId);
                          }}
                          className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded-lg"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      )}

                      <button
                        onClick={() => handleDelete(stg._id, stg.name)}
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

export default StageManagement;
