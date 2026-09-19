import React, { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Layers,
  Lock,
  Mail,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  UserPlus
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import ThreeDCanvas from '../../components/ThreeDCanvas';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  // 3D Card tilt effect
  const cardRef = useRef(null);
  const [cardTilt, setCardTilt] = useState({ x: 0, y: 0 });

  const handleCardMouseMove = (e) => {
    if (!cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const tiltX = -((y - centerY) / centerY) * 7;
    const tiltY = ((x - centerX) / centerX) * 7;

    setCardTilt({ x: tiltX, y: tiltY });
  };

  const handleCardMouseLeave = () => {
    setCardTilt({ x: 0, y: 0 });
  };

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
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-10 sm:px-6 lg:px-8 relative overflow-hidden select-none">
      {/* 3D Interactive Canvas Animation Backdrop */}
      <ThreeDCanvas />

      {/* Atmospheric Ambient Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-amber-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[400px] h-[400px] bg-sky-500/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center">
        <div className="inline-flex justify-center mb-3">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-400 flex items-center justify-center shadow-xl shadow-amber-500/25 border border-amber-300/40 transform hover:scale-105 transition duration-300">
            <Layers className="w-8 h-8 text-slate-950 font-bold" />
          </div>
        </div>

        <h2 className="text-3xl font-extrabold tracking-tight text-white flex items-center justify-center gap-2">
          <span>Yellow Pages</span>
          <span className="text-amber-400 text-sm px-2 py-0.5 rounded-lg bg-amber-400/10 border border-amber-400/30">
            CRM 3D
          </span>
        </h2>

        <p className="mt-1 text-xs text-slate-400 font-medium">
          Enterprise Business Listings, Calling & Telecaller Management
        </p>
      </div>

      {/* 3D Interactive Perspective Card Container */}
      <div
        className="mt-6 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4 sm:px-0"
        style={{ perspective: '1200px' }}
      >
        <div
          ref={cardRef}
          onMouseMove={handleCardMouseMove}
          onMouseLeave={handleCardMouseLeave}
          style={{
            transform: `rotateX(${cardTilt.x}deg) rotateY(${cardTilt.y}deg)`,
            transition:
              cardTilt.x === 0
                ? 'transform 0.5s ease-out'
                : 'transform 0.08s ease-out',
            transformStyle: 'preserve-3d'
          }}
          className="bg-slate-900/80 backdrop-blur-xl py-7 px-6 sm:px-9 rounded-3xl border border-slate-700/60 shadow-2xl shadow-slate-950/80"
        >
          {/* Navigation Pill */}
          <div className="flex bg-slate-950/70 p-1 rounded-2xl border border-slate-800 mb-6 text-xs font-semibold">
            <button
              type="button"
              className="flex-1 py-2 rounded-xl bg-amber-500 text-slate-950 shadow-md font-bold transition"
            >
              Sign In
            </button>

            <Link
              to="/signup"
              className="flex-1 py-2 text-center rounded-xl text-slate-400 hover:text-white transition flex items-center justify-center gap-1"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Create Account</span>
            </Link>
          </div>

          {/* Error */}
          {errorMsg && (
            <div className="mb-5 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Login Form */}
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
                  placeholder="agent@company.com"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-950/70 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 transition shadow-inner"
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
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-950/70 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 transition shadow-inner"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 disabled:opacity-50 text-slate-950 font-bold text-sm rounded-xl transition shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 cursor-pointer"
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

          {/* Quick links */}
          <div className="mt-5 pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>New to the CRM?</span>

            <div className="flex items-center gap-3">
              <Link
                to="/signup?role=admin"
                className="text-amber-400 hover:text-amber-300 font-semibold transition"
              >
                + Create Admin
              </Link>

              <span className="text-slate-600">|</span>

              <Link
                to="/signup"
                className="text-white hover:text-amber-400 font-bold transition flex items-center gap-1"
              >
                <span>Register</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>

          {/* Quick Demo Credentials */}
          <div className="mt-6 pt-5 border-t border-slate-800/80">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 mb-2.5">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>Quick Demo Accounts</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() =>
                  handleQuickLogin(
                    'admin@example.com',
                    'ChangeMe123!'
                  )
                }
                className="px-2.5 py-2 bg-slate-950/60 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-300 hover:text-white transition text-left"
              >
                <div className="font-bold text-amber-400 text-[11px]">
                  Super Admin
                </div>
                <div className="text-[10px] text-slate-500 truncate">
                  admin@example.com
                </div>
              </button>

              <button
                type="button"
                onClick={() =>
                  handleQuickLogin(
                    'admin.rajesh@example.com',
                    'AdminPass123!'
                  )
                }
                className="px-2.5 py-2 bg-slate-950/60 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-300 hover:text-white transition text-left"
              >
                <div className="font-bold text-sky-400 text-[11px]">
                  Admin
                </div>
                <div className="text-[10px] text-slate-500 truncate">
                  admin.rajesh@example.com
                </div>
              </button>

              <button
                type="button"
                onClick={() =>
                  handleQuickLogin(
                    'tl.priya@example.com',
                    'LeaderPass123!'
                  )
                }
                className="px-2.5 py-2 bg-slate-950/60 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-300 hover:text-white transition text-left"
              >
                <div className="font-bold text-indigo-400 text-[11px]">
                  Team Lead
                </div>
                <div className="text-[10px] text-slate-500 truncate">
                  tl.priya@example.com
                </div>
              </button>

              <button
                type="button"
                onClick={() =>
                  handleQuickLogin(
                    'caller.anita@example.com',
                    'AgentPass123!'
                  )
                }
                className="px-2.5 py-2 bg-slate-950/60 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-300 hover:text-white transition text-left"
              >
                <div className="font-bold text-emerald-400 text-[11px]">
                  Telecaller
                </div>
                <div className="text-[10px] text-slate-500 truncate">
                  caller.anita@example.com
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}