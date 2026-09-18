import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layers, Lock, Mail, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      const user = await login(email, password);
      // Role-based redirection
      if (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN') {
        navigate('/dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setErrorMsg('');
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Decorative Gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-amber-500/10 via-amber-500/5 to-transparent blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center">
          <div className="w-12 h-12 rounded-2xl bg-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/25">
            <Layers className="w-7 h-7 text-slate-950 font-bold" />
          </div>
        </div>
        <h2 className="mt-4 text-center text-2xl font-bold tracking-tight text-white">
          Yellow Pages CRM
        </h2>
        <p className="mt-1 text-center text-xs text-slate-400">
          Enterprise Business Listings & Calling Operations
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4 sm:px-0">
        <div className="bg-slate-800/80 backdrop-blur-md py-8 px-6 sm:px-10 rounded-2xl border border-slate-700/60 shadow-2xl">
          {errorMsg && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Corporate Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-900/60 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-900/60 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2.5 px-4 bg-amber-500 hover:bg-amber-400 disabled:bg-amber-600 text-slate-950 font-semibold text-sm rounded-xl transition shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In to CRM</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Switcher */}
          <div className="mt-8 pt-6 border-t border-slate-700/60">
            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400 mb-3">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>Quick Demo Credentials</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleQuickLogin('admin@example.com', 'ChangeMe123!')}
                className="px-2.5 py-2 bg-slate-900/50 hover:bg-slate-700/50 border border-slate-700/60 rounded-lg text-slate-300 hover:text-white transition text-left"
              >
                <div className="font-semibold text-amber-400">Super Admin</div>
                <div className="text-[10px] text-slate-400 truncate">admin@example.com</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('admin.rajesh@example.com', 'AdminPass123!')}
                className="px-2.5 py-2 bg-slate-900/50 hover:bg-slate-700/50 border border-slate-700/60 rounded-lg text-slate-300 hover:text-white transition text-left"
              >
                <div className="font-semibold text-sky-400">Admin</div>
                <div className="text-[10px] text-slate-400 truncate">admin.rajesh@example.com</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('tl.priya@example.com', 'LeaderPass123!')}
                className="px-2.5 py-2 bg-slate-900/50 hover:bg-slate-700/50 border border-slate-700/60 rounded-lg text-slate-300 hover:text-white transition text-left"
              >
                <div className="font-semibold text-indigo-400">Team Lead</div>
                <div className="text-[10px] text-slate-400 truncate">tl.priya@example.com</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('caller.anita@example.com', 'AgentPass123!')}
                className="px-2.5 py-2 bg-slate-900/50 hover:bg-slate-700/50 border border-slate-700/60 rounded-lg text-slate-300 hover:text-white transition text-left"
              >
                <div className="font-semibold text-emerald-400">Telecaller</div>
                <div className="text-[10px] text-slate-400 truncate">caller.anita@example.com</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
