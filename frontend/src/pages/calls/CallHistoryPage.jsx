import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PhoneCall, Search, Filter, Phone, Clock, User, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../../services/api';
import StatusBadge from '../../components/StatusBadge';
import { TableSkeleton } from '../../components/SkeletonLoader';

export default function CallHistoryPage() {
  const navigate = useNavigate();
  const [calls, setCalls] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  const fetchCalls = async () => {
    setLoading(true);
    try {
      const res = await api.get('/calls', {
        params: { page, limit: 25, callStatus: statusFilter || undefined }
      });
      if (res.success) {
        setCalls(res.data);
        setTotal(res.meta?.total || 0);
        setTotalPages(res.meta?.totalPages || 1);
      }
    } catch (err) {
      console.error('Failed to load calls:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalls();
  }, [page, statusFilter]);

  const formatSecs = (s) => {
    const mins = Math.floor(s / 60);
    const remainder = s % 60;
    return `${mins}m ${remainder}s`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Global Call History
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Immutable communication log with call durations, caller snapshots, and customer notes
          </p>
        </div>

        {/* Filter by call disposition */}
        <div>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="p-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:border-amber-500"
          >
            <option value="">All Call Dispositions</option>
            <option value="INTERESTED">Interested</option>
            <option value="READY_FOR_PAYMENT">Ready For Payment</option>
            <option value="CALL_ME_LATER">Call Me Later</option>
            <option value="PHONE_NOT_LIFTED">Phone Not Lifted</option>
            <option value="BUSY">Busy</option>
            <option value="NOT_INTERESTED">Not Interested</option>
            <option value="WRONG_NUMBER">Wrong Number</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4">Business / Lead</th>
                <th className="py-3 px-4">Dialed Number</th>
                <th className="py-3 px-4">Caller (Snapshot)</th>
                <th className="py-3 px-4">Outcome</th>
                <th className="py-3 px-4">Duration</th>
                <th className="py-3 px-4">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan="7" className="p-0">
                    <TableSkeleton rows={8} cols={7} />
                  </td>
                </tr>
              ) : calls.length > 0 ? (
                calls.map((call) => (
                  <tr key={call._id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800">
                        {new Date(call.createdAt).toLocaleDateString()}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {new Date(call.createdAt).toLocaleTimeString()}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div
                        onClick={() => navigate(`/leads/${call.leadId?._id}`)}
                        className="font-bold text-slate-900 hover:text-amber-600 cursor-pointer"
                      >
                        {call.leadId?.businessName || 'Business Record'}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {call.leadId?.city}, {call.leadId?.state}
                      </div>
                    </td>

                    <td className="py-3 px-4 font-mono font-medium text-slate-800">
                      {call.phoneNumber}
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800">
                        {call.employeeNameSnapshot}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {call.employeeRoleSnapshot || 'Agent'}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <StatusBadge status={call.callStatus} />
                    </td>

                    <td className="py-3 px-4 font-mono text-slate-600">
                      {formatSecs(call.duration || 0)}
                    </td>

                    <td className="py-3 px-4 max-w-sm">
                      <p className="text-slate-600 truncate">{call.notes || '—'}</p>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    No calls recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <div>
            Showing {calls.length} of {total} calls (Page {page} of {totalPages})
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
    </div>
  );
}
