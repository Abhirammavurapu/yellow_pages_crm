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
    {
      to: '/dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      color: 'emerald'
    },
    {
      to: '/leads',
      label: 'Leads',
      icon: Users,
      color: 'blue'
    },
    {
      to: '/followups',
      label: 'Follow-ups',
      icon: CalendarClock,
      color: 'purple'
    },
    {
      to: '/calls',
      label: 'Call History',
      icon: PhoneCall,
      color: 'violet'
    },

    // Admin / Super Admin import
    ...((isAdmin || isSuperAdmin)
      ? [
          {
            to: '/import',
            label: 'Import Excel/CSV',
            icon: FileSpreadsheet,
            color: 'slate'
          }
        ]
      : []),

    // Employee management
    ...((isAdmin || isSuperAdmin || isHRAdmin || isTeamLead)
      ? [
          {
            to: '/employees',
            label: 'Employees & Teams',
            icon: UserCheck,
            color: 'amber'
          }
        ]
      : []),

    {
      to: '/payments',
      label: 'Payments & Plans',
      icon: CreditCard,
      color: 'cyan'
    },

    {
      to: '/listings',
      label: 'Yellow Pages Directory',
      icon: BookOpen,
      color: 'indigo'
    },

    // Reports
    ...((isAdmin || isSuperAdmin || isTeamLead)
      ? [
          {
            to: '/reports',
            label: 'Reports & Analytics',
            icon: BarChart3,
            color: 'red'
          }
        ]
      : []),

    // Audit logs
    ...((isAdmin || isSuperAdmin)
      ? [
          {
            to: '/audit',
            label: 'Audit Logs',
            icon: ShieldAlert,
            color: 'orange'
          }
        ]
      : [])
  ];

  /*
   * Each navigation item gets:
   * 1. Its own icon background
   * 2. Its own icon color
   * 3. Its own active background
   * 4. Its own active left border
   */

  const colorClasses = {
    emerald: {
      icon: 'bg-emerald-500/15 text-emerald-400',
      active: 'bg-emerald-500/15 text-emerald-300',
      border: 'bg-emerald-400'
    },

    blue: {
      icon: 'bg-blue-500/15 text-blue-400',
      active: 'bg-blue-500/15 text-blue-300',
      border: 'bg-blue-400'
    },

    purple: {
      icon: 'bg-purple-500/15 text-purple-400',
      active: 'bg-purple-500/15 text-purple-300',
      border: 'bg-purple-400'
    },

    violet: {
      icon: 'bg-violet-500/15 text-violet-400',
      active: 'bg-violet-500/15 text-violet-300',
      border: 'bg-violet-400'
    },

    slate: {
      icon: 'bg-slate-500/20 text-slate-300',
      active: 'bg-slate-500/15 text-slate-200',
      border: 'bg-slate-300'
    },

    amber: {
      icon: 'bg-amber-500/15 text-amber-400',
      active: 'bg-amber-500/15 text-amber-300',
      border: 'bg-amber-400'
    },

    cyan: {
      icon: 'bg-cyan-500/15 text-cyan-400',
      active: 'bg-cyan-500/15 text-cyan-300',
      border: 'bg-cyan-400'
    },

    indigo: {
      icon: 'bg-indigo-500/15 text-indigo-400',
      active: 'bg-indigo-500/15 text-indigo-300',
      border: 'bg-indigo-400'
    },

    red: {
      icon: 'bg-red-500/15 text-red-400',
      active: 'bg-red-500/15 text-red-300',
      border: 'bg-red-400'
    },

    orange: {
      icon: 'bg-orange-500/15 text-orange-400',
      active: 'bg-orange-500/15 text-orange-300',
      border: 'bg-orange-400'
    }
  };

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
          isOpen
            ? 'translate-x-0'
            : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 px-6 flex items-center gap-3 border-b border-slate-800 bg-slate-950/40">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-400 flex items-center justify-center shadow-md shadow-amber-500/20">
            <Layers className="w-5 h-5 text-slate-950 font-bold" />
          </div>

          <div>
            <h1 className="font-bold text-base tracking-tight text-white flex items-center gap-1.5">
              Yellow Pages

              <span className="text-amber-400 text-xs uppercase px-1.5 py-0.5 bg-amber-400/10 rounded border border-amber-400/20">
                CRM
              </span>
            </h1>

            <p className="text-[11px] text-slate-400 tracking-wide font-medium">
              Enterprise Calling Portal
            </p>
          </div>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">

          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Navigation
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const colors = colorClasses[item.color];

            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => onClose && onClose()}
                className={({ isActive }) =>
                  `group relative flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? `${colors.active}`
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {/* Active left color line */}
                    {isActive && (
                      <span
                        className={`absolute left-0 top-2 bottom-2 w-1 rounded-r-full ${colors.border}`}
                      />
                    )}

                    {/* Colored icon box */}
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
                        isActive
                          ? `${colors.icon} shadow-sm`
                          : `${colors.icon} group-hover:scale-105 group-hover:shadow-md`
                      }`}
                    >
                      <Icon className="w-4.5 h-4.5" />
                    </div>

                    {/* Menu text */}
                    <span className="truncate">
                      {item.label}
                    </span>
                  </>
                )}
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
              <p className="text-xs font-semibold text-white truncate">
                {user?.name}
              </p>

              <p className="text-[10px] text-amber-400 font-medium truncate">
                {user?.role?.replace('_', ' ')}
              </p>
            </div>

          </div>
        </div>
      </aside>
    </>
  );
}