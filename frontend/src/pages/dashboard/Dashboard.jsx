import React, { useState, useEffect } from 'react';
import {
  Users,
  UserCheck,
  UserMinus,
  PhoneCall,
  Calendar,
  AlertTriangle,
  CreditCard,
  Building,
  CheckCircle2,
  TrendingUp,
  Clock,
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import StatCard from '../../components/StatCard';
import StatusBadge from '../../components/StatusBadge';
import { CardSkeleton } from '../../components/SkeletonLoader';

const PIE_COLORS = ['#f59e0b', '#3b82f6', '#10b981', '#8b5cf6', '#ef4444', '#64748b'];

export default function Dashboard() {
  const { user, isCallerOrBDE, isTeamLead, isSuperAdmin } = useAuth();
  const [summary, setSummary] = useState(null);
  const [charts, setCharts] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const [sumRes, chartRes] = await Promise.all([
          api.get('/dashboard/summary'),
          api.get('/dashboard/charts')
        ]);
        if (sumRes.success) setSummary(sumRes.data);
        if (chartRes.success) setCharts(chartRes.data);
      } catch (err) {
        console.error('Failed to load dashboard:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-slate-200 rounded w-48 animate-pulse"></div>
        <CardSkeleton count={4} />
      </div>
    );
  }

  const cards = summary?.cards || {};

  return (
    <div className="space-y-8">
      {/* Top Banner / Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 to-slate-800 text-white p-6 rounded-2xl shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold tracking-tight">
              Welcome back, {user?.name}!
            </h2>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-400 text-slate-950">
              {user?.role}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {isCallerOrBDE
              ? "Here is your active calling queue and today's scheduled follow-ups."
              : 'Real-time overview of All-India Yellow Pages leads, calling pipeline, and team performance.'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/leads"
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs rounded-xl transition shadow-sm flex items-center gap-1.5"
          >
            <span>Browse Leads</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title={isCallerOrBDE ? 'My Assigned Leads' : 'Total Leads'}
          value={cards.totalLeads?.toLocaleString() || 0}
          icon={Users}
          color="amber"
          subtext={`${cards.newLeads || 0} new uncontacted`}
        />

        <StatCard
          title="Calls Made Today"
          value={cards.callsToday || 0}
          icon={PhoneCall}
          color="blue"
          subtext="Logged communication records"
        />

        <StatCard
          title="Follow-ups Today"
          value={cards.followUpsToday || 0}
          icon={Calendar}
          color="purple"
          subtext={`${cards.overdueFollowUps || 0} overdue follow-ups`}
        />

        <StatCard
          title="Interested / Payment Ready"
          value={(cards.interestedLeads || 0) + (cards.readyForPaymentLeads || 0)}
          icon={TrendingUp}
          color="emerald"
          subtext={`${cards.enrolledLeads || 0} converted to directory`}
        />

        {/* Extended cards for Admin / Super Admin */}
        {!isCallerOrBDE && (
          <>
            <StatCard
              title="Active Employees"
              value={cards.activeEmployees || 0}
              icon={UserCheck}
              color="emerald"
              subtext="Registered calling workforce"
            />

            <StatCard
              title="Resigned / Transferred"
              value={cards.resignedEmployees || 0}
              icon={UserMinus}
              color="slate"
              subtext="Workload reallocated"
            />

            <StatCard
              title="Total Enrollments"
              value={cards.enrolledLeads || 0}
              icon={Building}
              color="blue"
              subtext="Live directory listings"
            />

            <StatCard
              title="Revenue Collected"
              value={`₹${(cards.revenue || 0).toLocaleString('en-IN')}`}
              icon={CreditCard}
              color="amber"
              subtext="From verified memberships"
            />
          </>
        )}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* State Distribution Chart */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <span>Leads by State</span>
              <span className="text-xs font-normal text-slate-500">(Top States)</span>
            </h3>
          </div>
          <div className="h-64">
            {charts?.leadsByState?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.leadsByState}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="state" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No geographic data available
              </div>
            )}
          </div>
        </div>

        {/* Lead Source Breakdown */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-800">Leads by Acquisition Source</h3>
          </div>
          <div className="h-64 flex items-center justify-center">
            {charts?.leadsBySource?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={charts.leadsBySource}
                    dataKey="count"
                    nameKey="source"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    innerRadius={45}
                    paddingAngle={3}
                  >
                    {charts.leadsBySource.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-xs text-slate-400">No source breakdown available</div>
            )}
          </div>
        </div>
      </div>

      {/* Calling Trends & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calls Trend (7 Days) */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 mb-4">Daily Calling Trends (Last 7 Days)</h3>
          <div className="h-64">
            {charts?.callsTrend?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={charts.callsTrend}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="calls" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                Start making calls to view weekly activity trends
              </div>
            )}
          </div>
        </div>

        {/* Live Activity Timeline Feed */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
          <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-500" />
            <span>Recent System Activity</span>
          </h3>

          <div className="space-y-3.5 overflow-y-auto flex-1 max-h-72 pr-1">
            {summary?.recentActivities?.length > 0 ? (
              summary.recentActivities.map((act) => (
                <div key={act._id} className="text-xs border-l-2 border-amber-400 pl-3 py-0.5 space-y-0.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-800">{act.actorName}</span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-slate-600 font-medium">{act.action.replace(/_/g, ' ')}</p>
                </div>
              ))
            ) : (
              <div className="text-xs text-slate-400 py-8 text-center">
                No recent activity recorded
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
