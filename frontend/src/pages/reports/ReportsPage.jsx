import React, { useState, useEffect } from 'react';
import { BarChart3, Download, Calendar, Users, MapPin, TrendingUp } from 'lucide-react';
import api from '../../services/api';

export default function ReportsPage() {
  const [reports, setReports] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const res = await api.get('/reports');
        if (res.success) setReports(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  const downloadStateReportCSV = () => {
    if (!reports?.stateStats?.length) return;
    const headers = ['State', 'Total Leads', 'Interested Count', 'Enrolled Count'];
    const rows = reports.stateStats.map((s) => [s._id, s.totalLeads, s.interested, s.enrolled]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'state_performance_report.csv';
    a.click();
  };

  if (loading) {
    return <div className="py-12 text-center text-xs text-slate-400">Compiling CRM analytics...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Reports & Analytics
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Geographic performance, telecaller productivity, and conversion pipelines
          </p>
        </div>

        <button
          onClick={downloadStateReportCSV}
          className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition shadow-xs flex items-center gap-1.5"
        >
          <Download className="w-3.5 h-3.5 text-slate-500" />
          <span>Export State Report (CSV)</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* State Performance Breakdown */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-amber-500" />
            <span>State-wise Lead & Enrollment Conversion</span>
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-semibold pb-2">
                  <th className="pb-2">State</th>
                  <th className="pb-2">Total Leads</th>
                  <th className="pb-2">Interested</th>
                  <th className="pb-2">Enrolled</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {reports?.stateStats?.map((st) => (
                  <tr key={st._id} className="py-2.5">
                    <td className="py-2.5 font-semibold text-slate-900">{st._id}</td>
                    <td className="py-2.5">{st.totalLeads}</td>
                    <td className="py-2.5 text-emerald-600 font-semibold">{st.interested}</td>
                    <td className="py-2.5 text-amber-700 font-bold">{st.enrolled}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Employee Calling Productivity */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-500" />
            <span>Employee Calling Productivity</span>
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-semibold pb-2">
                  <th className="pb-2">Caller Name</th>
                  <th className="pb-2">Total Calls</th>
                  <th className="pb-2">Interested Outcomes</th>
                  <th className="pb-2">Avg Duration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {reports?.employeeCallStats?.map((emp) => (
                  <tr key={emp._id} className="py-2.5">
                    <td className="py-2.5 font-semibold text-slate-900">{emp._id}</td>
                    <td className="py-2.5">{emp.totalCalls}</td>
                    <td className="py-2.5 text-emerald-600 font-semibold">{emp.interested}</td>
                    <td className="py-2.5 font-mono text-slate-500">
                      {Math.round(emp.totalDurationSec / (emp.totalCalls || 1))}s
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
