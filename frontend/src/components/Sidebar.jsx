import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  PhoneCall,
  CalendarClock,
  FileSpreadsheet,
  UserCheck,
  CreditCard,
  BookOpen,
  BarChart3,
  ShieldAlert,
  Layers
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar({ isOpen, onClose }) {
  const { user, isSuperAdmin, isAdmin, isHRAdmin, isTeamLead } = useAuth();

  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/leads', label: 'Leads', icon: Users },
    { to: '/followups', label: 'Follow-ups', icon: CalendarClock },
    { to: '/calls', label: 'Call History', icon: PhoneCall },
    // Admin / Super Admin import
    ...((isAdmin || isSuperAdmin)
      ? [{ to: '/import', label: 'Import Excel/CSV', icon: FileSpreadsheet }]
      : []),
    // Employee management
    ...((isAdmin || isSuperAdmin || isHRAdmin || isTeamLead)
      ? [{ to: '/employees', label: 'Employees & Teams', icon: UserCheck }]
      : []),
    { to: '/payments', label: 'Payments & Plans', icon: CreditCard },
    { to: '/listings', label: 'Yellow Pages Directory', icon: BookOpen },
    // Reports
    ...((isAdmin || isSuperAdmin || isTeamLead)
      ? [{ to: '/reports', label: 'Reports & Analytics', icon: BarChart3 }]
      : []),
    // Audit logs
    ...((isAdmin || isSuperAdmin)
      ? [{ to: '/audit', label: 'Audit Logs', icon: ShieldAlert }]
      : [])
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-30 lg:hidden"
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-slate-900 text-slate-300 flex flex-col transition-transform duration-200 ease-in-out border-r border-slate-800 ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 px-6 flex items-center gap-3 border-b border-slate-800 bg-slate-950/40">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-400 flex items-center justify-center shadow-md shadow-amber-500/20">
            <Layers className="w-5 h-5 text-slate-950 font-bold" />
          </div>
          <div>
            <h1 className="font-bold text-base tracking-tight text-white flex items-center gap-1.5">
              Yellow Pages <span className="text-amber-400 text-xs uppercase px-1.5 py-0.5 bg-amber-400/10 rounded border border-amber-400/20">CRM</span>
            </h1>
            <p className="text-[11px] text-slate-400 tracking-wide font-medium">Enterprise Calling Portal</p>
          </div>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Navigation
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => onClose && onClose()}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-amber-500 text-slate-950 font-semibold shadow-sm shadow-amber-500/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`
                }
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </div>

        {/* User Card */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/20">
          <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-slate-800/50">
            <div className="w-8 h-8 rounded-lg bg-amber-400/20 border border-amber-400/30 flex items-center justify-center font-bold text-amber-400 text-sm">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="overflow-hidden flex-1">
              <p className="text-xs font-semibold text-white truncate">{user?.name}</p>
              <p className="text-[10px] text-amber-400 font-medium truncate">{user?.role?.replace('_', ' ')}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
