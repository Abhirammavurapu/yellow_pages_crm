import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Filter,
  Plus,
  Download,
  Users,
  Lock,
  Phone,
  MapPin,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  CheckSquare,
  Square,
  AlertCircle
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import StatusBadge from '../../components/StatusBadge';
import PriorityBadge from '../../components/PriorityBadge';
import Modal from '../../components/Modal';
import { TableSkeleton } from '../../components/SkeletonLoader';

export default function LeadsList() {
  const { user, isAdmin, isSuperAdmin, isTeamLead } = useAuth();
  const navigate = useNavigate();

  // Data & Pagination
  const [leads, setLeads] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [stateFilter, setStateFilter] = useState('All India');
  const [districtFilter, setDistrictFilter] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [assignedFilter, setAssignedFilter] = useState('');

  // Location Hierarchy dropdown data
  const [states, setStates] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [cities, setCities] = useState([]);

  // Employees for assignment dropdowns
  const [employees, setEmployees] = useState([]);

  // Bulk Selection & Modal
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkAssignModalOpen, setBulkAssignModalOpen] = useState(false);
  const [targetEmployeeId, setTargetEmployeeId] = useState('');
  const [assigning, setAssigning] = useState(false);

  // Add Lead Modal
  const [addLeadModalOpen, setAddLeadModalOpen] = useState(false);
  const [newLeadForm, setNewLeadForm] = useState({
    businessName: '',
    ownerName: '',
    phone: '',
    alternatePhone: '',
    email: '',
    category: 'Restaurants & Food',
    state: 'Telangana',
    district: 'Hyderabad',
    city: 'Hyderabad',
    pincode: '',
    address: '',
    source: 'YELLOW_PAGES',
    priority: 'MEDIUM',
    assignedTo: '',
    notes: ''
  });
  const [addError, setAddError] = useState('');
  const [addSuccess, setAddSuccess] = useState('');
  const [submittingLead, setSubmittingLead] = useState(false);

  // Fetch initial location states and employee list
  useEffect(() => {
    const fetchMeta = async () => {
      try {
        const stateRes = await api.get('/locations/states');
        if (stateRes.success) setStates(stateRes.data);

        if (isAdmin || isSuperAdmin || isTeamLead) {
          const empRes = await api.get('/employees', { params: { limit: 100, status: 'ACTIVE' } });
          if (empRes.success) setEmployees(empRes.data);
        }
      } catch (err) {
        console.error('Failed to load metadata:', err);
      }
    };
    fetchMeta();
  }, [isAdmin, isSuperAdmin, isTeamLead]);

  // Update cascading districts when state changes
  useEffect(() => {
    const fetchDistricts = async () => {
      try {
        const res = await api.get('/locations/districts', { params: { state: stateFilter } });
        if (res.success) {
          setDistricts(res.data);
          setDistrictFilter('');
          setCityFilter('');
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchDistricts();
  }, [stateFilter]);

  // Update cascading cities when district changes
  useEffect(() => {
    const fetchCities = async () => {
      try {
        const res = await api.get('/locations/cities', {
          params: { state: stateFilter, district: districtFilter }
        });
        if (res.success) {
          setCities(res.data);
          setCityFilter('');
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchCities();
  }, [stateFilter, districtFilter]);

  // Fetch Leads on filter/page change
  const fetchLeads = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: 20,
        search: search.trim() || undefined,
        state: stateFilter !== 'All India' ? stateFilter : undefined,
        district: districtFilter || undefined,
        city: cityFilter || undefined,
        status: statusFilter || undefined,
        priority: priorityFilter || undefined,
        assignedTo: assignedFilter || undefined
      };

      const res = await api.get('/leads', { params });
      if (res.success) {
        setLeads(res.data);
        setTotal(res.meta?.total || 0);
        setTotalPages(res.meta?.totalPages || 1);
      }
    } catch (err) {
      console.error('Failed to fetch leads:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [page, stateFilter, districtFilter, cityFilter, statusFilter, priorityFilter, assignedFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchLeads();
  };

  // Bulk selection helpers
  const handleSelectAll = () => {
    if (selectedIds.length === leads.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(leads.map((l) => l._id));
    }
  };

  const toggleSelectLead = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Execute Bulk Assignment
  const handleBulkAssign = async () => {
    if (!targetEmployeeId || selectedIds.length === 0) return;
    setAssigning(true);
    try {
      const res = await api.post('/leads/bulk-assign', {
        leadIds: selectedIds,
        assignedTo: targetEmployeeId,
        reason: 'Bulk UI Reassignment'
      });
      if (res.success) {
        setBulkAssignModalOpen(false);
        setSelectedIds([]);
        fetchLeads();
      }
    } catch (err) {
      alert(err.message || 'Bulk assignment failed');
    } finally {
      setAssigning(false);
    }
  };

  // Create New Lead Handler
  const handleCreateLead = async (e) => {
    e.preventDefault();
    setAddError('');
    setAddSuccess('');
    setSubmittingLead(true);
    try {
      const payload = {
        ...newLeadForm,
        assignedTo: newLeadForm.assignedTo || undefined
      };
      const res = await api.post('/leads', payload);
      if (res.success) {
        setAddSuccess('Lead created successfully!');
        setTimeout(() => {
          setAddLeadModalOpen(false);
          setAddSuccess('');
          setNewLeadForm({
            businessName: '',
            ownerName: '',
            phone: '',
            alternatePhone: '',
            email: '',
            category: 'Restaurants & Food',
            state: 'Telangana',
            district: 'Hyderabad',
            city: 'Hyderabad',
            pincode: '',
            address: '',
            source: 'YELLOW_PAGES',
            priority: 'MEDIUM',
            assignedTo: '',
            notes: ''
          });
          fetchLeads();
        }, 700);
      }
    } catch (err) {
      setAddError(err.message || 'Failed to create lead');
    } finally {
      setSubmittingLead(false);
    }
  };

  // Export filtered leads to CSV
  const handleExportCSV = () => {
    if (leads.length === 0) return;
    const headers = ['Lead ID', 'Business Name', 'Owner', 'Phone', 'Email', 'City', 'State', 'Status', 'Priority', 'Assigned To'];
    const rows = leads.map((l) => [
      l.leadId,
      `"${l.businessName.replace(/"/g, '""')}"`,
      `"${(l.ownerName || '').replace(/"/g, '""')}"`,
      l.phoneNumbers?.[0] || '',
      l.email || '',
      l.city || '',
      l.state || '',
      l.currentStatus,
      l.priority,
      l.assignedTo?.name || 'Unassigned'
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `yellow_pages_leads_page_${page}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Yellow Pages Business Leads
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {total.toLocaleString()} total verified leads in All-India database
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition shadow-xs flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => setAddLeadModalOpen(true)}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs rounded-xl transition shadow-sm flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>New Lead</span>
          </button>
        </div>
      </div>

      {/* Multi-Level Filtering Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row gap-3 items-center justify-between">
          {/* Search Box */}
          <form onSubmit={handleSearchSubmit} className="relative w-full lg:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by business, phone, email, lead ID..."
              className="w-full pl-10 pr-20 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition"
            />
            <button
              type="submit"
              className="absolute right-1.5 top-1.5 px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs rounded-lg transition"
            >
              Search
            </button>
          </form>

          {/* Quick Refresh */}
          <div className="flex items-center gap-2 self-end lg:self-auto">
            <button
              onClick={fetchLeads}
              title="Refresh Data"
              className="p-2 text-slate-500 hover:bg-slate-100 rounded-xl transition border border-slate-200"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Cascading Location & Status Filters */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-2 border-t border-slate-100 text-xs">
          {/* State Filter */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">State</label>
            <select
              value={stateFilter}
              onChange={(e) => {
                setStateFilter(e.target.value);
                setPage(1);
              }}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-amber-500"
            >
              {states.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* District Filter */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">District</label>
            <select
              value={districtFilter}
              onChange={(e) => {
                setDistrictFilter(e.target.value);
                setPage(1);
              }}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-amber-500"
            >
              <option value="">All Districts</option>
              {districts.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          {/* City Filter */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">City</label>
            <select
              value={cityFilter}
              onChange={(e) => {
                setCityFilter(e.target.value);
                setPage(1);
              }}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-amber-500"
            >
              <option value="">All Cities</option>
              {cities.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-amber-500"
            >
              <option value="">All Statuses</option>
              <option value="NEW">New</option>
              <option value="INTERESTED">Interested</option>
              <option value="READY_FOR_PAYMENT">Ready For Payment</option>
              <option value="PAYMENT_COMPLETED">Payment Completed</option>
              <option value="ENROLLED">Enrolled</option>
              <option value="FOLLOW_UP_REQUIRED">Follow-Up Required</option>
              <option value="CALL_ME_LATER">Call Me Later</option>
              <option value="NOT_INTERESTED">Not Interested</option>
              <option value="PHONE_NOT_LIFTED">Phone Not Lifted</option>
            </select>
          </div>

          {/* Priority Filter */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Priority</label>
            <select
              value={priorityFilter}
              onChange={(e) => {
                setPriorityFilter(e.target.value);
                setPage(1);
              }}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-amber-500"
            >
              <option value="">All Priorities</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>
          </div>

          {/* Assigned Employee (for Admin/TL) */}
          {(isAdmin || isSuperAdmin || isTeamLead) && (
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Caller</label>
              <select
                value={assignedFilter}
                onChange={(e) => {
                  setAssignedFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-amber-500"
              >
                <option value="">All Callers</option>
                {employees.map((emp) => (
                  <option key={emp._id} value={emp._id}>
                    {emp.name} ({emp.employeeId})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Bulk Action Toolbar */}
      {selectedIds.length > 0 && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between text-xs animate-in fade-in">
          <span className="font-semibold text-amber-900">
            {selectedIds.length} lead{selectedIds.length > 1 ? 's' : ''} selected
          </span>
          <div className="flex items-center gap-2">
            {(isAdmin || isSuperAdmin || isTeamLead) && (
              <button
                onClick={() => setBulkAssignModalOpen(true)}
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg transition"
              >
                Assign Selected
              </button>
            )}
            <button
              onClick={() => setSelectedIds([])}
              className="px-3 py-1.5 bg-white border border-slate-300 text-slate-600 rounded-lg hover:bg-slate-50"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Leads Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold">
                <th className="py-3 px-4 w-10">
                  <button onClick={handleSelectAll} className="p-0.5">
                    {selectedIds.length > 0 && selectedIds.length === leads.length ? (
                      <CheckSquare className="w-4 h-4 text-amber-600" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400" />
                    )}
                  </button>
                </th>
                <th className="py-3 px-4">Lead ID</th>
                <th className="py-3 px-4">Business Name & Category</th>
                <th className="py-3 px-4">Contact Details</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Assigned Caller</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan="9" className="p-0">
                    <TableSkeleton rows={8} cols={7} />
                  </td>
                </tr>
              ) : leads.length > 0 ? (
                leads.map((lead) => {
                  const isLocked = lead.lock?.isLocked && new Date(lead.lock.lockExpiresAt) > new Date();
                  const isSelected = selectedIds.includes(lead._id);

                  return (
                    <tr
                      key={lead._id}
                      className={`hover:bg-slate-50/70 transition-colors ${
                        isSelected ? 'bg-amber-50/40' : ''
                      }`}
                    >
                      <td className="py-3 px-4">
                        <button onClick={() => toggleSelectLead(lead._id)} className="p-0.5">
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-amber-600" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-300 hover:text-slate-400" />
                          )}
                        </button>
                      </td>

                      <td className="py-3 px-4 font-mono font-medium text-slate-900">
                        {lead.leadId}
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900 hover:text-amber-600 cursor-pointer" onClick={() => navigate(`/leads/${lead._id}`)}>
                          {lead.businessName}
                        </div>
                        <div className="text-[11px] text-slate-400">{lead.category}</div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-800 flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{lead.phoneNumbers?.[0] || 'No Phone'}</span>
                        </div>
                        {lead.ownerName && (
                          <div className="text-[11px] text-slate-400">Owner: {lead.ownerName}</div>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <div className="text-slate-700 font-medium">{lead.city || '—'}</div>
                        <div className="text-[11px] text-slate-400">{lead.state || 'India'}</div>
                      </td>

                      <td className="py-3 px-4">
                        <StatusBadge status={lead.currentStatus} />
                      </td>

                      <td className="py-3 px-4">
                        <PriorityBadge priority={lead.priority} />
                      </td>

                      <td className="py-3 px-4">
                        {lead.assignedTo ? (
                          <div className="font-medium text-slate-800 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                            <span>{lead.assignedTo.name}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Unassigned</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {isLocked && (
                            <span
                              title={`Currently locked by ${lead.lock?.lockedBy?.name || 'an agent'}`}
                              className="p-1 text-amber-600 bg-amber-50 rounded"
                            >
                              <Lock className="w-3.5 h-3.5" />
                            </span>
                          )}
                          <button
                            onClick={() => navigate(`/leads/${lead._id}`)}
                            className="px-2.5 py-1 bg-slate-900 hover:bg-amber-500 hover:text-slate-950 text-white font-medium rounded-lg text-xs transition"
                          >
                            Open Lead
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="9" className="py-12 text-center text-slate-400">
                    No leads found matching current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <div>
            Showing <span className="font-semibold text-slate-700">{leads.length}</span> of{' '}
            <span className="font-semibold text-slate-700">{total}</span> records (Page {page} of{' '}
            {totalPages})
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-medium text-slate-700 px-2">{page}</span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Bulk Assign Modal */}
      <Modal
        isOpen={bulkAssignModalOpen}
        onClose={() => setBulkAssignModalOpen(false)}
        title={`Assign ${selectedIds.length} Selected Leads`}
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600">
            Select a target employee or caller to reassign these {selectedIds.length} leads. Previous
            ownership and activities will be preserved immutably.
          </p>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Target Employee
            </label>
            <select
              value={targetEmployeeId}
              onChange={(e) => setTargetEmployeeId(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-amber-500"
            >
              <option value="">Select Employee...</option>
              {employees.map((emp) => (
                <option key={emp._id} value={emp._id}>
                  {emp.name} — {emp.role} ({emp.employeeId})
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setBulkAssignModalOpen(false)}
              className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!targetEmployeeId || assigning}
              onClick={handleBulkAssign}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-bold rounded-lg text-xs transition"
            >
              {assigning ? 'Assigning...' : 'Confirm Assignment'}
            </button>
          </div>
        </div>
      </Modal>

      {/* New Lead Modal */}
      <Modal
        isOpen={addLeadModalOpen}
        onClose={() => setAddLeadModalOpen(false)}
        title="Add New Yellow Pages Lead"
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleCreateLead} className="space-y-4 text-xs">
          {addError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{addError}</span>
            </div>
          )}

          {addSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-2 font-medium">
              <CheckSquare className="w-4 h-4 flex-shrink-0 text-emerald-600" />
              <span>{addSuccess}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Business Name *</label>
              <input
                type="text"
                required
                value={newLeadForm.businessName}
                onChange={(e) => setNewLeadForm({ ...newLeadForm, businessName: e.target.value })}
                placeholder="e.g. Radhe Krishna Sweets & Bakery"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-amber-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Owner / Contact Name</label>
              <input
                type="text"
                value={newLeadForm.ownerName}
                onChange={(e) => setNewLeadForm({ ...newLeadForm, ownerName: e.target.value })}
                placeholder="e.g. Ramesh Kumar"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Primary Phone *</label>
              <input
                type="text"
                required
                value={newLeadForm.phone}
                onChange={(e) => setNewLeadForm({ ...newLeadForm, phone: e.target.value })}
                placeholder="9876543210 or +91..."
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-amber-500 focus:outline-none font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Alternate Phone</label>
              <input
                type="text"
                value={newLeadForm.alternatePhone}
                onChange={(e) => setNewLeadForm({ ...newLeadForm, alternatePhone: e.target.value })}
                placeholder="Optional secondary phone"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-amber-500 focus:outline-none font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                value={newLeadForm.email}
                onChange={(e) => setNewLeadForm({ ...newLeadForm, email: e.target.value })}
                placeholder="info@business.com"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Category</label>
              <select
                value={newLeadForm.category}
                onChange={(e) => setNewLeadForm({ ...newLeadForm, category: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-amber-500 focus:outline-none"
              >
                <option value="Restaurants & Food">Restaurants & Food</option>
                <option value="Healthcare & Hospitals">Healthcare & Hospitals</option>
                <option value="IT & Software">IT & Software</option>
                <option value="Apparel & Retail">Apparel & Retail</option>
                <option value="Automobiles & Services">Automobiles & Services</option>
                <option value="Real Estate">Real Estate</option>
                <option value="Education">Education</option>
                <option value="General">General</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">State</label>
              <input
                type="text"
                value={newLeadForm.state}
                onChange={(e) => setNewLeadForm({ ...newLeadForm, state: e.target.value })}
                placeholder="Telangana"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-amber-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">City / Hub</label>
              <input
                type="text"
                value={newLeadForm.city}
                onChange={(e) => setNewLeadForm({ ...newLeadForm, city: e.target.value })}
                placeholder="Hyderabad"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">District</label>
              <input
                type="text"
                value={newLeadForm.district}
                onChange={(e) => setNewLeadForm({ ...newLeadForm, district: e.target.value })}
                placeholder="District name"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-amber-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Pincode</label>
              <input
                type="text"
                value={newLeadForm.pincode}
                onChange={(e) => setNewLeadForm({ ...newLeadForm, pincode: e.target.value })}
                placeholder="e.g. 500001"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Lead Source</label>
              <select
                value={newLeadForm.source}
                onChange={(e) => setNewLeadForm({ ...newLeadForm, source: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-amber-500 focus:outline-none"
              >
                <option value="YELLOW_PAGES">Yellow Pages Directory</option>
                <option value="WEBSITE">Website Lead Form</option>
                <option value="EXCEL_IMPORT">Excel/Data Import</option>
                <option value="INBOUND_CALL">Inbound Call</option>
                <option value="MANUAL_ENTRY">Direct Inquiry / Walk-in</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Initial Priority</label>
              <select
                value={newLeadForm.priority}
                onChange={(e) => setNewLeadForm({ ...newLeadForm, priority: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-amber-500 focus:outline-none"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Assigned Agent</label>
              {isAdmin || isSuperAdmin || isTeamLead ? (
                <select
                  value={newLeadForm.assignedTo}
                  onChange={(e) => setNewLeadForm({ ...newLeadForm, assignedTo: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-amber-500 focus:outline-none font-medium"
                >
                  <option value="">-- Unassigned (General Queue) --</option>
                  <option value={user?._id}>Assign to Me ({user?.name})</option>
                  {employees.map((emp) => (
                    <option key={emp._id} value={emp._id}>
                      {emp.name} — {emp.role} ({emp.employeeId})
                    </option>
                  ))}
                </select>
              ) : (
                <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 font-semibold truncate">
                  Auto-assigned to You ({user?.name})
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Street Address</label>
            <input
              type="text"
              value={newLeadForm.address}
              onChange={(e) => setNewLeadForm({ ...newLeadForm, address: e.target.value })}
              placeholder="Shop No, Street, Landmark"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-amber-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Initial Inquiry / Calling Notes</label>
            <textarea
              rows={2}
              value={newLeadForm.notes}
              onChange={(e) => setNewLeadForm({ ...newLeadForm, notes: e.target.value })}
              placeholder="Enter any initial background, inquiry source or customer requirement..."
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-amber-500 focus:outline-none resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setAddLeadModalOpen(false)}
              className="px-4 py-2 border border-slate-300 rounded-xl font-semibold hover:bg-slate-50 text-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submittingLead}
              className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl transition shadow-sm flex items-center gap-1.5"
            >
              {submittingLead ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>Creating Lead...</span>
                </>
              ) : (
                <span>Create Lead</span>
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
