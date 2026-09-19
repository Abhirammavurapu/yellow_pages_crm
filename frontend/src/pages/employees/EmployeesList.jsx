import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  ArrowRightLeft,
  Shield,
  Briefcase,
  AlertTriangle,
  CheckCircle2,
  Lock,
  GitBranch,
  Search,
  ChevronRight
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import StatusBadge from '../../components/StatusBadge';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import { TableSkeleton } from '../../components/SkeletonLoader';

export default function EmployeesList() {
  const { user, isSuperAdmin, isHRAdmin, isAdmin } = useAuth();

  const [employees, setEmployees] = useState([]);
  const [hierarchy, setHierarchy] = useState(null);
  const [activeView, setActiveView] = useState('list');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Add Employee Modal
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newEmployee, setNewEmployee] = useState({
    employeeId: '',
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'TELECALLER',
    department: 'Inside Sales'
  });
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState('');

  // Workload Transfer Modal State
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [sourceEmployee, setSourceEmployee] = useState(null);
  const [transferPreview, setTransferPreview] = useState(null);
  const [targetEmployeeId, setTargetEmployeeId] = useState('');
  const [transferReason, setTransferReason] = useState(
    'Employee Resignation / Workload Transfer'
  );
  const [deactivateSource, setDeactivateSource] = useState(true);
  const [transferring, setTransferring] = useState(false);

  // Status Change State
  const [statusConfirmOpen, setStatusConfirmOpen] = useState(false);
  const [statusTarget, setStatusTarget] = useState(null);
  const [newStatusValue, setNewStatusValue] = useState('');

  const fetchEmployees = async () => {
    setLoading(true);

    try {
      const [empRes, hierRes] = await Promise.all([
        api.get('/employees', {
          params: {
            limit: 100,
            search: search || undefined
          }
        }),
        api.get('/employees/hierarchy')
      ]);

      if (empRes.success) setEmployees(empRes.data);
      if (hierRes.success) setHierarchy(hierRes.data);
    } catch (err) {
      console.error('Failed to fetch employees:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [search]);

  // Open Workload Transfer Modal
  const handleOpenTransfer = async (emp) => {
    setSourceEmployee(emp);
    setTransferPreview(null);
    setTargetEmployeeId('');
    setTransferModalOpen(true);

    try {
      const res = await api.get(`/transfers/preview/${emp._id}`);

      if (res.success) {
        setTransferPreview(res.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Execute Workload Transfer
  const handleExecuteTransfer = async () => {
    if (!targetEmployeeId || !sourceEmployee) return;

    setTransferring(true);

    try {
      const res = await api.post('/transfers/execute', {
        fromEmployeeId: sourceEmployee._id,
        toEmployeeId: targetEmployeeId,
        reason: transferReason,
        deactivateSourceEmployee: deactivateSource
      });

      if (res.success) {
        setTransferModalOpen(false);
        fetchEmployees();
        alert(res.message || 'Workload transferred successfully!');
      }
    } catch (err) {
      alert(err.message || 'Transfer failed');
    } finally {
      setTransferring(false);
    }
  };

  // Create Employee
  const handleCreateEmployee = async (e) => {
    e.preventDefault();
    setAddError('');
    setAdding(true);

    try {
      const res = await api.post('/employees', newEmployee);

      if (res.success) {
        setAddModalOpen(false);

        setNewEmployee({
          employeeId: '',
          name: '',
          email: '',
          phone: '',
          password: '',
          role: 'TELECALLER',
          department: 'Inside Sales'
        });

        fetchEmployees();
      }
    } catch (err) {
      setAddError(err.message || 'Failed to create employee');
    } finally {
      setAdding(false);
    }
  };

  // Change Status
  const handleConfirmStatusChange = async () => {
    if (!statusTarget || !newStatusValue) return;

    try {
      const res = await api.patch(
        `/employees/${statusTarget._id}/status`,
        {
          status: newStatusValue
        }
      );

      if (res.success) {
        setStatusConfirmOpen(false);
        fetchEmployees();
      }
    } catch (err) {
      alert(err.message || 'Failed to update status');
    }
  };

  const activeTargetEmployees = employees.filter(
    (e) => e.status === 'ACTIVE' && e._id !== sourceEmployee?._id
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Employees & Hierarchy Management
          </h1>

          <p className="text-xs text-slate-500 mt-0.5">
            Manage organizational structure, telecallers, BDEs, and seamless lead transfers
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setActiveView('list')}
              className={`px-3 py-1.5 rounded-lg transition ${
                activeView === 'list'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500'
              }`}
            >
              List View
            </button>

            <button
              onClick={() => setActiveView('hierarchy')}
              className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                activeView === 'hierarchy'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500'
              }`}
            >
              <GitBranch className="w-3.5 h-3.5" />
              <span>Hierarchy</span>
            </button>
          </div>

          {(isSuperAdmin || isAdmin) && (
            <button
              onClick={() => {
                setNewEmployee({
                  employeeId: '',
                  name: '',
                  email: '',
                  phone: '',
                  password: '',
                  role: 'ADMIN',
                  department: 'Operations & Administration'
                });

                setAddModalOpen(true);
              }}
              className="px-3.5 py-2 bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs rounded-xl transition shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <Shield className="w-4 h-4" />
              <span>Create Admin</span>
            </button>
          )}

          {(isSuperAdmin || isAdmin || isHRAdmin) && (
            <button
              onClick={() => {
                setNewEmployee({
                  employeeId: '',
                  name: '',
                  email: '',
                  phone: '',
                  password: '',
                  role: 'TELECALLER',
                  department: 'Inside Sales'
                });

                setAddModalOpen(true);
              }}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs rounded-xl transition shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add Employee</span>
            </button>
          )}
        </div>
      </div>

      {activeView === 'list' ? (
        <>
          {/* Search bar */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="relative max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />

              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, ID, email, role..."
                className="w-full pl-10 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Employees Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                    <th className="py-3 px-4">Employee ID</th>
                    <th className="py-3 px-4">Name & Email</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Department & Team</th>
                    <th className="py-3 px-4">Assigned Leads</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {loading ? (
                    <tr>
                      <td colSpan="7" className="p-0">
                        <TableSkeleton rows={6} cols={6} />
                      </td>
                    </tr>
                  ) : employees.length > 0 ? (
                    employees.map((emp) => (
                      <tr
                        key={emp._id}
                        className="hover:bg-slate-50/70 transition"
                      >
                        <td className="py-3 px-4 font-mono font-bold text-slate-800">
                          {emp.employeeId}
                        </td>

                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900">
                            {emp.name}
                          </div>

                          <div className="text-[11px] text-slate-400">
                            {emp.email}
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-800 border border-slate-200">
                            {emp.role}
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          <div className="font-medium text-slate-800">
                            {emp.department}
                          </div>

                          <div className="text-[11px] text-slate-400">
                            {emp.teamId?.name || 'No Team'}
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <span className="font-semibold text-slate-800">
                            {emp.assignedLeadsCount || 0} leads
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          <StatusBadge status={emp.status} />
                        </td>

                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {/* Super Admin Transfer Leads button */}
                            {isSuperAdmin && emp.status === 'ACTIVE' && (
                              <button
                                onClick={() => handleOpenTransfer(emp)}
                                className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 font-semibold rounded-lg text-xs transition border border-amber-200 flex items-center gap-1"
                              >
                                <ArrowRightLeft className="w-3 h-3" />
                                <span>Transfer Workload</span>
                              </button>
                            )}

                            {/* Super Admin Deactivate button */}
                            {isSuperAdmin && emp.role !== 'SUPER_ADMIN' && (
                              <button
                                onClick={() => {
                                  setStatusTarget(emp);

                                  setNewStatusValue(
                                    emp.status === 'ACTIVE'
                                      ? 'DEACTIVATED'
                                      : 'ACTIVE'
                                  );

                                  setStatusConfirmOpen(true);
                                }}
                                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition ${
                                  emp.status === 'ACTIVE'
                                    ? 'text-rose-700 bg-rose-50 hover:bg-rose-100'
                                    : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                                }`}
                              >
                                {emp.status === 'ACTIVE'
                                  ? 'Deactivate'
                                  : 'Reactivate'}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan="7"
                        className="py-12 text-center text-slate-400"
                      >
                        No employees found matching query.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* Hierarchy Tree View */
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-amber-500" />
            <span>Organizational Hierarchy Structure</span>
          </h3>

          {hierarchy && (
            <div className="space-y-6 text-xs">
              {/* Level 1: Super Admin */}
              <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200">
                <div className="font-bold text-amber-900 mb-2">
                  Executive Super Admins
                </div>

                <div className="flex flex-wrap gap-2">
                  {hierarchy.superAdmins?.map((sa) => (
                    <div
                      key={sa._id}
                      className="px-3 py-1.5 bg-white border border-amber-200 rounded-lg shadow-2xs"
                    >
                      <span className="font-bold text-slate-900">
                        {sa.name}
                      </span>{' '}
                      <span className="text-slate-400">
                        ({sa.employeeId})
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Level 2: Admins */}
              <div className="p-4 rounded-xl bg-sky-50/60 border border-sky-200">
                <div className="font-bold text-sky-900 mb-2">
                  Operations Admins & HR
                </div>

                <div className="flex flex-wrap gap-2">
                  {[...(hierarchy.admins || []), ...(hierarchy.hrAdmins || [])].map(
                    (ad) => (
                      <div
                        key={ad._id}
                        className="px-3 py-1.5 bg-white border border-sky-200 rounded-lg shadow-2xs"
                      >
                        <span className="font-bold text-slate-900">
                          {ad.name}
                        </span>{' '}
                        <span className="text-slate-500">
                          [{ad.role}]
                        </span>
                      </div>
                    )
                  )}
                </div>
              </div>

              {/* Level 3: Team Leads */}
              <div className="p-4 rounded-xl bg-indigo-50/60 border border-indigo-200">
                <div className="font-bold text-indigo-900 mb-2">
                  Team Leaders
                </div>

                <div className="flex flex-wrap gap-2">
                  {hierarchy.teamLeads?.map((tl) => (
                    <div
                      key={tl._id}
                      className="px-3 py-1.5 bg-white border border-indigo-200 rounded-lg shadow-2xs"
                    >
                      <span className="font-bold text-slate-900">
                        {tl.name}
                      </span>{' '}
                      <span className="text-slate-400 font-mono">
                        ({tl.department})
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Level 4: Callers and BDEs */}
              <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200">
                <div className="font-bold text-emerald-900 mb-2">
                  Calling Agents & Field BDEs (
                  {hierarchy.callers?.length || 0})
                </div>

                <div className="flex flex-wrap gap-2">
                  {hierarchy.callers?.map((c) => (
                    <div
                      key={c._id}
                      className="px-3 py-1.5 bg-white border border-emerald-200 rounded-lg shadow-2xs"
                    >
                      <span className="font-semibold text-slate-900">
                        {c.name}
                      </span>{' '}
                      <span className="text-[10px] text-emerald-700">
                        [{c.role}]
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Critical Workflow: Lead Workload Transfer & Resignation Modal */}
      <Modal
        isOpen={transferModalOpen}
        onClose={() => setTransferModalOpen(false)}
        title="Transfer Employee Workload & Responsibilities"
        maxWidth="max-w-xl"
      >
        <div className="space-y-4 text-xs">
          {sourceEmployee && (
            <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">
                  Source Employee:
                </span>

                <span className="font-bold text-slate-900">
                  {sourceEmployee.name} ({sourceEmployee.employeeId})
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-500">
                  Active Leads to Transfer:
                </span>

                <span className="font-bold text-amber-900">
                  {transferPreview?.leadsCount || 0} leads
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-500">
                  Pending Follow-ups:
                </span>

                <span className="font-bold text-slate-800">
                  {transferPreview?.followUpsCount || 0} follow-ups
                </span>
              </div>
            </div>
          )}

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-600 leading-relaxed">
            <span className="font-bold text-slate-800">
              Historical Preservation Guarantee:
            </span>{' '}
            All past call logs, notes, and activity created by{' '}
            {sourceEmployee?.name} will remain permanently authored by{' '}
            {sourceEmployee?.name}. Only future active responsibility shifts
            to the target employee.
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Select Target Employee to Receive Leads *
            </label>

            <select
              value={targetEmployeeId}
              onChange={(e) => setTargetEmployeeId(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:border-amber-500 focus:outline-none"
            >
              <option value="">-- Choose Active Employee --</option>

              {activeTargetEmployees.map((emp) => (
                <option key={emp._id} value={emp._id}>
                  {emp.name} — {emp.role} ({emp.employeeId})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Reason for Transfer
            </label>

            <input
              type="text"
              value={transferReason}
              onChange={(e) => setTransferReason(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-amber-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="deactCheckbox"
              checked={deactivateSource}
              onChange={(e) => setDeactivateSource(e.target.checked)}
              className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
            />

            <label
              htmlFor="deactCheckbox"
              className="font-medium text-slate-700"
            >
              Mark {sourceEmployee?.name} as RESIGNED / DEACTIVATED after
              transfer
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setTransferModalOpen(false)}
              className="px-4 py-2 border border-slate-300 rounded-xl font-semibold hover:bg-slate-50"
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={!targetEmployeeId || transferring}
              onClick={handleExecuteTransfer}
              className="px-5 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold rounded-xl transition shadow-xs"
            >
              {transferring
                ? 'Transferring Responsibilities...'
                : 'Confirm Workload Transfer'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Add Employee Modal */}
      <Modal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="Add New Employee Record"
        maxWidth="max-w-lg"
      >
        <form
          onSubmit={handleCreateEmployee}
          className="space-y-4 text-xs"
        >
          {addError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{addError}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Employee ID{' '}
                <span className="text-slate-400 font-normal">
                  (Optional)
                </span>
              </label>

              <input
                type="text"
                value={newEmployee.employeeId}
                onChange={(e) =>
                  setNewEmployee({
                    ...newEmployee,
                    employeeId: e.target.value
                  })
                }
                placeholder="Auto-generated if empty"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Full Name *
              </label>

              <input
                type="text"
                required
                value={newEmployee.name}
                onChange={(e) =>
                  setNewEmployee({
                    ...newEmployee,
                    name: e.target.value
                  })
                }
                placeholder="e.g. Rajesh Kumar"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Email Address *
              </label>

              <input
                type="email"
                required
                value={newEmployee.email}
                onChange={(e) =>
                  setNewEmployee({
                    ...newEmployee,
                    email: e.target.value
                  })
                }
                placeholder="rajesh@company.com"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Phone Number *
              </label>

              <input
                type="text"
                required
                value={newEmployee.phone}
                onChange={(e) =>
                  setNewEmployee({
                    ...newEmployee,
                    phone: e.target.value
                  })
                }
                placeholder="9876543210"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                System Role *
              </label>

              <select
                value={newEmployee.role}
                onChange={(e) => {
                  const role = e.target.value;
                  let dept = newEmployee.department;

                  if (role === 'ADMIN') {
                    dept = 'Operations & Administration';
                  } else if (role === 'BDE') {
                    dept = 'Field Sales';
                  } else if (role === 'TELECALLER') {
                    dept = 'Inside Sales';
                  }

                  setNewEmployee({
                    ...newEmployee,
                    role,
                    department: dept
                  });
                }}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-amber-500 focus:outline-none font-medium"
              >
                <option value="TELECALLER">Telecaller</option>
                <option value="BDE">BDE (Business Dev Exec)</option>
                <option value="EMPLOYEE">General Employee</option>
                <option value="TEAM_LEAD">Team Lead</option>

                {(isSuperAdmin || isAdmin) && (
                  <option value="ADMIN">Admin (Manager)</option>
                )}

                {(isSuperAdmin || isHRAdmin) && (
                  <option value="HR_ADMIN">HR Admin</option>
                )}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Department
              </label>

              <input
                type="text"
                value={newEmployee.department}
                onChange={(e) =>
                  setNewEmployee({
                    ...newEmployee,
                    department: e.target.value
                  })
                }
                placeholder="Inside Sales"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Initial Password *
            </label>

            <input
              type="password"
              required
              value={newEmployee.password}
              onChange={(e) =>
                setNewEmployee({
                  ...newEmployee,
                  password: e.target.value
                })
              }
              placeholder="Minimum 6 characters"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-amber-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setAddModalOpen(false)}
              className="px-4 py-2 border border-slate-300 rounded-xl font-semibold hover:bg-slate-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={adding}
              className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl transition shadow-xs"
            >
              {adding ? 'Saving...' : 'Create Employee'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Confirm Status Change Dialog */}
      <ConfirmDialog
        isOpen={statusConfirmOpen}
        onClose={() => setStatusConfirmOpen(false)}
        onConfirm={handleConfirmStatusChange}
        title="Confirm Status Change"
        message={`Are you sure you want to change ${statusTarget?.name}'s status to ${newStatusValue}?`}
        isDestructive={newStatusValue === 'DEACTIVATED'}
        confirmText={`Set to ${newStatusValue}`}
      />
    </div>
  );
}