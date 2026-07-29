import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import {
  Building2,
  GitCommit,
  UserCheck,
  CheckCircle,
  Plus,
  Trash2,
  MoveUp,
  MoveDown,
  ArrowRight,
  ArrowLeft,
  Factory
} from 'lucide-react';

const SetupWizard = () => {
  const { company, refreshUser } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Step 1 State: Company Profile
  const [companyInfo, setCompanyInfo] = useState({
    name: company?.name || '',
    logo: company?.logo || '',
    industry: company?.industry || 'PCB Manufacturing',
    address: company?.address || '',
    phone: company?.phone || '',
    email: company?.email || '',
    workingHours: company?.workingHours || '08:00 - 17:00'
  });

  // Step 2 State: Departments
  const [departments, setDepartments] = useState([
    { name: 'Cutting' },
    { name: 'Assembly' },
    { name: 'Quality Inspection' },
    { name: 'Packaging & Dispatch' }
  ]);

  // Step 3 State: Stages
  const [stages, setStages] = useState([
    { name: 'Raw Material Cutting', departmentName: 'Cutting' },
    { name: 'Component Soldering', departmentName: 'Assembly' },
    { name: 'Optical Inspection', departmentName: 'Quality Inspection' },
    { name: 'Boxing & Dispatch', departmentName: 'Packaging & Dispatch' }
  ]);

  // Step 4 State: Department Logins
  const [departmentLogins, setDepartmentLogins] = useState([
    { departmentName: 'Cutting', username: 'dept_cutting', password: 'password123' },
    { departmentName: 'Assembly', username: 'dept_assembly', password: 'password123' },
    { departmentName: 'Quality Inspection', username: 'dept_quality', password: 'password123' },
    { departmentName: 'Packaging & Dispatch', username: 'dept_dispatch', password: 'password123' }
  ]);

  // Department Helpers
  const addDepartment = () => {
    setDepartments([...departments, { name: '' }]);
  };
  const removeDepartment = (index) => {
    const nameToRemove = departments[index].name;
    setDepartments(departments.filter((_, i) => i !== index));
    setStages(stages.filter((s) => s.departmentName !== nameToRemove));
    setDepartmentLogins(departmentLogins.filter((l) => l.departmentName !== nameToRemove));
  };
  const updateDepartment = (index, val) => {
    const updated = [...departments];
    const oldName = updated[index].name;
    updated[index].name = val;
    setDepartments(updated);

    // Sync stage and login references
    setStages(
      stages.map((s) => (s.departmentName === oldName ? { ...s, departmentName: val } : s))
    );
    setDepartmentLogins(
      departmentLogins.map((l) => (l.departmentName === oldName ? { ...l, departmentName: val } : l))
    );
  };

  // Stage Helpers
  const addStage = () => {
    const defaultDept = departments[0]?.name || '';
    setStages([...stages, { name: '', departmentName: defaultDept }]);
  };
  const removeStage = (index) => {
    setStages(stages.filter((_, i) => i !== index));
  };
  const updateStage = (index, field, val) => {
    const updated = [...stages];
    updated[index][field] = val;
    setStages(updated);
  };
  const moveStage = (index, direction) => {
    if ((direction === -1 && index === 0) || (direction === 1 && index === stages.length - 1)) return;
    const updated = [...stages];
    const temp = updated[index];
    updated[index] = updated[index + direction];
    updated[index + direction] = temp;
    setStages(updated);
  };

  // Sync Logins list whenever departments change
  const syncLogins = () => {
    const newLogins = departments
      .filter((d) => d.name.trim() !== '')
      .map((d) => {
        const existing = departmentLogins.find((l) => l.departmentName === d.name);
        const slug = d.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
        return {
          departmentName: d.name,
          username: existing?.username || `dept_${slug}`,
          password: existing?.password || 'password123'
        };
      });
    setDepartmentLogins(newLogins);
  };

  const handleNext = () => {
    setError('');
    if (step === 1) {
      if (!companyInfo.name) return setError('Company name is required');
    } else if (step === 2) {
      if (departments.some((d) => !d.name.trim())) return setError('All department names must be filled');
      if (departments.length === 0) return setError('Create at least one department');
      syncLogins();
    } else if (step === 3) {
      if (stages.some((s) => !s.name.trim() || !s.departmentName)) return setError('All stages must have a name and assigned department');
      if (stages.length === 0) return setError('Create at least one production stage');
    }
    setStep(step + 1);
  };

  const handleFinish = async () => {
    setSubmitting(true);
    setError('');

    try {
      await api.post('/company/setup', {
        companyInfo,
        departments,
        stages,
        departmentLogins
      });

      await refreshUser();
      navigate('/owner-dashboard');
    } catch (err) {
      setError(err.message || 'Setup completion failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 p-4 sm:p-8 flex flex-col items-center justify-center">
      <div className="w-full max-w-4xl glass-panel rounded-3xl p-6 sm:p-10 border border-slate-800 shadow-2xl space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Factory className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-white">FlowForge Setup Wizard</h1>
              <p className="text-xs text-slate-400">Configure your company's production workflow</p>
            </div>
          </div>

          {/* Stepper Pill Indicators */}
          <div className="flex items-center space-x-2">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  step === i
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 ring-2 ring-indigo-400/50'
                    : step > i
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-slate-800 text-slate-500'
                }`}
              >
                {step > i ? <CheckCircle className="w-4 h-4" /> : i}
              </div>
            ))}
          </div>
        </div>

        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-xl text-xs font-medium">
            {error}
          </div>
        )}

        {/* STEP 1: Company Profile */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Building2 className="w-5 h-5 text-indigo-400" />
              Step 1: Company Information
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-medium text-slate-300 mb-1">Company Name *</label>
                <input
                  type="text"
                  value={companyInfo.name}
                  onChange={(e) => setCompanyInfo({ ...companyInfo, name: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-300 mb-1">Industry</label>
                <input
                  type="text"
                  value={companyInfo.industry}
                  onChange={(e) => setCompanyInfo({ ...companyInfo, industry: e.target.value })}
                  placeholder="e.g. Textile, PCB, Electronics, Printing"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-300 mb-1">Working Hours</label>
                <input
                  type="text"
                  value={companyInfo.workingHours}
                  onChange={(e) => setCompanyInfo({ ...companyInfo, workingHours: e.target.value })}
                  placeholder="08:00 - 17:00"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-300 mb-1">Phone</label>
                <input
                  type="text"
                  value={companyInfo.phone}
                  onChange={(e) => setCompanyInfo({ ...companyInfo, phone: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block font-medium text-slate-300 mb-1">Factory Address</label>
                <input
                  type="text"
                  value={companyInfo.address}
                  onChange={(e) => setCompanyInfo({ ...companyInfo, address: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Departments */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-indigo-400" />
                Step 2: Create Production Departments
              </h2>
              <button
                type="button"
                onClick={addDepartment}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center space-x-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Department</span>
              </button>
            </div>
            <div className="space-y-2">
              {departments.map((dept, idx) => (
                <div key={idx} className="flex items-center space-x-2">
                  <span className="w-6 text-xs text-slate-400 font-mono">{idx + 1}.</span>
                  <input
                    type="text"
                    value={dept.name}
                    onChange={(e) => updateDepartment(idx, e.target.value)}
                    placeholder="Department Name (e.g. Cutting, Assembly)"
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white"
                  />
                  <button
                    type="button"
                    onClick={() => removeDepartment(idx)}
                    className="p-2.5 text-slate-400 hover:text-rose-400 rounded-xl hover:bg-slate-800"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 3: Production Stages */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <GitCommit className="w-5 h-5 text-indigo-400" />
                Step 3: Arrange Production Stages
              </h2>
              <button
                type="button"
                onClick={addStage}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center space-x-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Stage</span>
              </button>
            </div>
            <div className="space-y-2">
              {stages.map((stg, idx) => (
                <div key={idx} className="flex items-center space-x-2 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                  <div className="flex flex-col space-y-1">
                    <button
                      type="button"
                      onClick={() => moveStage(idx, -1)}
                      disabled={idx === 0}
                      className="text-slate-400 hover:text-white disabled:opacity-30"
                    >
                      <MoveUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveStage(idx, 1)}
                      disabled={idx === stages.length - 1}
                      className="text-slate-400 hover:text-white disabled:opacity-30"
                    >
                      <MoveDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <span className="w-6 text-xs text-indigo-400 font-mono font-bold text-center">
                    #{idx + 1}
                  </span>

                  <input
                    type="text"
                    value={stg.name}
                    onChange={(e) => updateStage(idx, 'name', e.target.value)}
                    placeholder="Stage Name (e.g. Solder Paste Printing)"
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-xl p-2 text-xs text-white"
                  />

                  <select
                    value={stg.departmentName}
                    onChange={(e) => updateStage(idx, 'departmentName', e.target.value)}
                    className="bg-slate-900 border border-slate-700 rounded-xl p-2 text-xs text-white"
                  >
                    {departments.map((d, dIdx) => (
                      <option key={dIdx} value={d.name}>
                        {d.name}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={() => removeStage(idx)}
                    className="p-2 text-slate-400 hover:text-rose-400 rounded-xl hover:bg-slate-800"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 4: Department Logins */}
        {step === 4 && (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-indigo-400" />
              Step 4: Department Login Credentials
            </h2>
            <div className="space-y-3">
              {departmentLogins.map((login, idx) => (
                <div key={idx} className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800 text-xs items-center">
                  <div className="font-bold text-indigo-300 truncate">
                    {login.departmentName} Dept
                  </div>
                  <div>
                    <input
                      type="text"
                      value={login.username}
                      onChange={(e) => {
                        const updated = [...departmentLogins];
                        updated[idx].username = e.target.value;
                        setDepartmentLogins(updated);
                      }}
                      placeholder="Username"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-white"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      value={login.password}
                      onChange={(e) => {
                        const updated = [...departmentLogins];
                        updated[idx].password = e.target.value;
                        setDepartmentLogins(updated);
                      }}
                      placeholder="Password"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-white"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="flex items-center justify-between pt-6 border-t border-slate-800">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold flex items-center space-x-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
          ) : <div></div>}

          {step < 4 ? (
            <button
              type="button"
              onClick={handleNext}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-lg shadow-indigo-600/20"
            >
              <span>Next Step</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinish}
              disabled={submitting}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-lg shadow-emerald-600/20 disabled:opacity-50"
            >
              <span>{submitting ? 'Finalizing Setup...' : 'Finish Setup & Open Dashboard'}</span>
              <CheckCircle className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SetupWizard;
