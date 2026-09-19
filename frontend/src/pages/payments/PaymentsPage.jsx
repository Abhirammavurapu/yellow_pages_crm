import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, TrendingUp, CheckCircle2, User, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../../services/api';
import StatusBadge from '../../components/StatusBadge';
import { TableSkeleton } from '../../components/SkeletonLoader';

export default function PaymentsPage() {
  const navigate = useNavigate();
  const [payments, setPayments] = useState([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const res = await api.get('/payments', { params: { page, limit: 20 } });
      if (res.success) {
        setPayments(res.data);
        setTotal(res.meta?.total || 0);
        setTotalPages(res.meta?.totalPages || 1);
        setTotalRevenue(res.meta?.totalRevenue || 0);
      }
    } catch (err) {
      console.error('Failed to fetch payments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [page]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Payments & Enrolled Businesses
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            CRM payment collection tracking and verified directory listing enrollments
          </p>
        </div>

        {/* Revenue Badge */}
        <div className="flex items-center gap-3 px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-2xl shadow-2xs">
          <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-emerald-700 tracking-wider">
              Total Revenue Collected
            </div>
            <div className="text-lg font-bold text-emerald-900">
              ₹{totalRevenue.toLocaleString('en-IN')}
            </div>
          </div>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Enrolled Business</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Payment Method</th>
                <th className="py-3 px-4">Reference No</th>
                <th className="py-3 px-4">Collected By</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan="7" className="p-0">
                    <TableSkeleton rows={6} cols={6} />
                  </td>
                </tr>
              ) : payments.length > 0 ? (
                payments.map((p) => (
                  <tr key={p._id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-4 text-slate-600">
                      {new Date(p.paymentDate).toLocaleDateString()}
                    </td>

                    <td className="py-3 px-4">
                      <div
                        onClick={() => navigate(`/leads/${p.leadId?._id}`)}
                        className="font-bold text-slate-900 hover:text-amber-600 cursor-pointer"
                      >
                        {p.leadId?.businessName || 'Enrolled Business'}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {p.leadId?.city}, {p.leadId?.state}
                      </div>
                    </td>

                    <td className="py-3 px-4 font-bold text-emerald-700">
                      ₹{p.amount?.toLocaleString('en-IN')}
                    </td>

                    <td className="py-3 px-4 font-medium text-slate-800">
                      {p.paymentMethod}
                    </td>

                    <td className="py-3 px-4 font-mono text-slate-500">
                      {p.transactionReference || 'N/A'}
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800">{p.collectedByName || p.collectedBy?.name}</div>
                    </td>

                    <td className="py-3 px-4">
                      <StatusBadge status={p.paymentStatus} />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    No payments recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <div>
            Showing {payments.length} of {total} records
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
