import React, { useState, useEffect } from 'react';
import { ShieldAlert, Search, Filter, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../../services/api';
import { TableSkeleton } from '../../components/SkeletonLoader';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [entityFilter, setEntityFilter] = useState('');

  const fetchAuditLogs = async () => {
    setLoading(true);
    try {
      const res = await api.get('/audit', {
        params: { page, limit: 25, entity: entityFilter || undefined }
      });
      if (res.success) {
        setLogs(res.data);
        setTotal(res.meta?.total || 0);
        setTotalPages(res.meta?.totalPages || 1);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, [page, entityFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Immutable Audit Logs
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Security audit log recording all administrative modifications, lead reallocations, and employee transfers
          </p>
        </div>

        <div>
          <select
            value={entityFilter}
            onChange={(e) => {
              setEntityFilter(e.target.value);
              setPage(1);
            }}
            className="p-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:border-amber-500"
          >
            <option value="">All Audited Entities</option>
            <option value="EMPLOYEE">Employee Changes</option>
            <option value="LEAD">Lead Actions</option>
            <option value="AUTH">Authentication / Logins</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Actor</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Entity</th>
                <th className="py-3 px-4">Details / Metadata</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan="5" className="p-0">
                    <TableSkeleton rows={8} cols={5} />
                  </td>
                </tr>
              ) : logs.length > 0 ? (
                logs.map((log) => (
                  <tr key={log._id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800">{log.actorName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{log.actorRole}</div>
                    </td>

                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-900 border border-amber-200">
                        {log.action}
                      </span>
                    </td>

                    <td className="py-3 px-4 font-semibold text-slate-700">{log.entity}</td>

                    <td className="py-3 px-4 max-w-md">
                      <pre className="text-[10px] font-mono bg-slate-50 p-1.5 rounded border border-slate-200 overflow-x-auto text-slate-700">
                        {JSON.stringify(log.newValue || log.metadata || {}, null, 1)}
                      </pre>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-slate-400">
                    No audit records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <div>
            Showing {logs.length} of {total} audit records (Page {page} of {totalPages})
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
