import React, { useState } from 'react';
<<<<<<< HEAD
import { Link } from 'react-router-dom';
import { Menu, Search, Bell, LogOut, Shield, Plus } from 'lucide-react';
=======
import { Menu, Search, Bell, LogOut, Shield } from 'lucide-react';
>>>>>>> 04adb2bc717f7dc5bf8e0f4c700c4184cf76c6ef
import { useAuth } from '../context/AuthContext';
import GlobalSearchModal from './GlobalSearchModal';

export default function Navbar({ onMenuToggle }) {
  const { user, logout } = useAuth();
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <>
      <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-20 px-4 sm:px-6 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuToggle}
            className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 lg:hidden"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Quick Search Bar */}
          <button
            onClick={() => setSearchOpen(true)}
            className="flex items-center gap-3 px-3.5 py-1.5 bg-slate-100/80 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-xl text-sm border border-slate-200 transition sm:w-72 justify-between"
          >
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-slate-400" />
              <span className="text-xs">Quick Search...</span>
            </div>
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-semibold text-slate-500 bg-white border border-slate-200 rounded shadow-xs">
              Search
            </kbd>
          </button>
        </div>

        <div className="flex items-center gap-3 sm:gap-4">
<<<<<<< HEAD
          {/* Quick Action Shortcuts */}
          <div className="hidden md:flex items-center gap-2">
            {(user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN') && (
              <Link
                to="/employees"
                className="px-2.5 py-1.5 bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-800 rounded-xl text-xs font-semibold transition flex items-center gap-1 shadow-2xs"
              >
                <Shield className="w-3.5 h-3.5 text-sky-600" />
                <span>+ New Admin</span>
              </Link>
            )}

            <Link
              to="/leads"
              className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 rounded-xl text-xs font-semibold transition flex items-center gap-1 shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5 text-amber-600" />
              <span>+ New Lead</span>
            </Link>
          </div>

=======
>>>>>>> 04adb2bc717f7dc5bf8e0f4c700c4184cf76c6ef
          {/* Active Employee Role Pill */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs font-medium text-slate-700">
            <Shield className="w-3.5 h-3.5 text-amber-600" />
            <span>{user?.role}</span>
          </div>

          {/* Profile & Logout */}
          <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-semibold text-slate-800 leading-tight">{user?.name}</p>
              <p className="text-[10px] text-slate-500">{user?.department || 'Operations'}</p>
            </div>
            <button
              onClick={logout}
              title="Sign Out"
              className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <GlobalSearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
