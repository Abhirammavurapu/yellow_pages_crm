import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CalendarClock,
  Clock,
  AlertTriangle,
  CheckCircle,
  Phone,
  ArrowRight,
  Filter
} from 'lucide-react';
import api from '../../services/api';
import StatusBadge from '../../components/StatusBadge';
import Modal from '../../components/Modal';
import { TableSkeleton } from '../../components/SkeletonLoader';

export default function FollowUpsList() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('today'); // 'today', 'overdue', 'upcoming', 'all'
  const [followUps, setFollowUps] = useState([]);
  const [counts, setCounts] = useState({ today: 0, overdue: 0, upcoming: 0 });
  const [loading, setLoading] = useState(true);

  // Complete modal
  const [completeModalOpen, setCompleteModalOpen] = useState(false);
  const [selectedFollowUp, setSelectedFollowUp] = useState(null);
  const [completionNotes, setCompletionNotes] = useState('');
  const [completing, setCompleting] = useState(false);

  const fetchFollowUps = async () => {
    setLoading(true);
    try {
      const res = await api.get('/followups', {
        params: { type: activeTab, limit: 50 }
      });
      if (res.success) {
        setFollowUps(res.data);
        if (res.meta?.counts) {
          setCounts(res.meta.counts);
        }
      }
    } catch (err) {
      console.error('Failed to load follow-ups:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFollowUps();
  }, [activeTab]);

  const handleMarkComplete = async (e) => {
    e.preventDefault();
    if (!selectedFollowUp) return;
    setCompleting(true);
    try {
      const res = await api.patch(`/followups/${selectedFollowUp._id}/complete`, {
        notes: completionNotes
      });
      if (res.success) {
        setCompleteModalOpen(false);
        setSelectedFollowUp(null);
        setCompletionNotes('');
        fetchFollowUps();
      }
    } catch (err) {
      alert(err.message || 'Failed to complete follow-up');
    } finally {
      setCompleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Follow-Up Manager
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Track scheduled call commitments, upcoming callbacks, and overdue reminders
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 text-xs font-semibold pb-1">
        <button
          onClick={() => setActiveTab('today')}
          className={`px-4 py-2 rounded-xl transition flex items-center gap-2 ${
            activeTab === 'today'
              ? 'bg-amber-500 text-slate-950 shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <CalendarClock className="w-4 h-4" />
          <span>Today's Follow-ups</span>
          <span className="px-1.5 py-0.5 rounded-full bg-slate-900/10 text-[10px]">
            {counts.today}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('overdue')}
          className={`px-4 py-2 rounded-xl transition flex items-center gap-2 ${
            activeTab === 'overdue'
              ? 'bg-rose-500 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>Overdue Follow-ups</span>
          <span className="px-1.5 py-0.5 rounded-full bg-rose-200 text-rose-900 text-[10px] font-bold">
            {counts.overdue}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('upcoming')}
          className={`px-4 py-2 rounded-xl transition flex items-center gap-2 ${
            activeTab === 'upcoming'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Upcoming</span>
          <span className="px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px]">
            {counts.upcoming}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 rounded-xl transition ${
            activeTab === 'all'
              ? 'bg-slate-200 text-slate-900'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          All Records
        </button>
      </div>

      {/* Follow-ups List Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4">Business / Lead</th>
                <th className="py-3 px-4">Phone</th>
                <th className="py-3 px-4">Notes / Purpose</th>
                <th className="py-3 px-4">Scheduled By</th>
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
              ) : followUps.length > 0 ? (
                followUps.map((fu) => {
                  const isOverdue =
                    fu.status === 'PENDING' && new Date(fu.followUpDate) < new Date();

                  return (
                    <tr
                      key={fu._id}
                      className={`hover:bg-slate-50/70 transition ${
                        isOverdue ? 'bg-rose-50/20' : ''
                      }`}
                    >
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">
                          {new Date(fu.followUpDate).toLocaleDateString()}
                        </div>
                        <div className="text-[11px] text-slate-500">{fu.followUpTime}</div>
                      </td>

                      <td className="py-3 px-4">
                        <div
                          onClick={() => navigate(`/leads/${fu.leadId?._id}`)}
                          className="font-bold text-slate-900 hover:text-amber-600 cursor-pointer"
                        >
                          {fu.leadId?.businessName || 'Business Record'}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {fu.leadId?.city}, {fu.leadId?.state}
                        </div>
                      </td>

                      <td className="py-3 px-4 font-mono font-medium text-slate-800">
                        {fu.leadId?.phoneNumbers?.[0] || '—'}
                      </td>

                      <td className="py-3 px-4 max-w-xs">
                        <p className="text-slate-600 truncate">{fu.notes || 'Routine follow-up'}</p>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-800">
                          {fu.createdByNameSnapshot || 'Agent'}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <StatusBadge status={fu.status} />
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {fu.status === 'PENDING' && (
                            <button
                              onClick={() => {
                                setSelectedFollowUp(fu);
                                setCompleteModalOpen(true);
                              }}
                              className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold rounded-lg text-xs transition border border-emerald-200"
                            >
                              Complete
                            </button>
                          )}
                          <button
                            onClick={() => navigate(`/leads/${fu.leadId?._id}`)}
                            className="px-2.5 py-1 bg-slate-900 hover:bg-amber-500 hover:text-slate-950 text-white font-semibold rounded-lg text-xs transition flex items-center gap-1"
                          >
                            <Phone className="w-3 h-3" />
                            <span>Call</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    No follow-ups found in this view.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Complete Follow-up Modal */}
      <Modal
        isOpen={completeModalOpen}
        onClose={() => setCompleteModalOpen(false)}
        title="Complete Follow-Up"
      >
        <form onSubmit={handleMarkComplete} className="space-y-4 text-xs">
          <p className="text-slate-600">
            Mark this follow-up as completed for{' '}
            <span className="font-semibold text-slate-800">
              {selectedFollowUp?.leadId?.businessName}
            </span>
            .
          </p>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Completion Notes / Next Steps
            </label>
            <textarea
              rows={3}
              value={completionNotes}
              onChange={(e) => setCompletionNotes(e.target.value)}
              placeholder="e.g. Call completed successfully. Customer promised payment tomorrow."
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-amber-500 focus:outline-none text-xs"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setCompleteModalOpen(false)}
              className="px-4 py-2 border border-slate-300 rounded-lg font-semibold hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={completing}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition"
            >
              {completing ? 'Saving...' : 'Mark Completed'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
