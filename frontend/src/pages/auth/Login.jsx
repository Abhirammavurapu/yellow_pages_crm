<<<<<<< HEAD
import React, { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Layers, Lock, Mail, AlertCircle, ArrowRight, ShieldCheck, UserPlus, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import ThreeDCanvas from '../../components/ThreeDCanvas';
=======
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layers, Lock, Mail, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
>>>>>>> 04adb2bc717f7dc5bf8e0f4c700c4184cf76c6ef

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

<<<<<<< HEAD
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

=======
>>>>>>> 04adb2bc717f7dc5bf8e0f4c700c4184cf76c6ef
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      const user = await login(email, password);
<<<<<<< HEAD
      navigate('/dashboard');
=======
      // Role-based redirection
      if (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN') {
        navigate('/dashboard');
      } else {
        navigate('/dashboard');
      }
>>>>>>> 04adb2bc717f7dc5bf8e0f4c700c4184cf76c6ef
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
<<<<<<< HEAD
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
            transition: cardTilt.x === 0 ? 'transform 0.5s ease-out' : 'transform 0.08s ease-out',
            transformStyle: 'preserve-3d'
          }}
          className="bg-slate-900/80 backdrop-blur-xl py-7 px-6 sm:px-9 rounded-3xl border border-slate-700/60 shadow-2xl shadow-slate-950/80"
        >
          {/* Navigation Pill: Sign In vs Sign Up */}
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

          {errorMsg && (
            <div className="mb-5 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs flex items-center gap-2.5 animate-shake">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
=======
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
>>>>>>> 04adb2bc717f7dc5bf8e0f4c700c4184cf76c6ef
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
<<<<<<< HEAD
                  placeholder="agent@company.com"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-950/70 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 transition shadow-inner"
=======
                  placeholder="name@company.com"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-900/60 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition"
>>>>>>> 04adb2bc717f7dc5bf8e0f4c700c4184cf76c6ef
                />
              </div>
            </div>

            <div>
<<<<<<< HEAD
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-300">
                  Password
                </label>
              </div>
=======
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Password
              </label>
>>>>>>> 04adb2bc717f7dc5bf8e0f4c700c4184cf76c6ef
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
<<<<<<< HEAD
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-950/70 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 transition shadow-inner"
=======
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-900/60 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition"
>>>>>>> 04adb2bc717f7dc5bf8e0f4c700c4184cf76c6ef
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
<<<<<<< HEAD
              className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 disabled:opacity-50 text-slate-950 font-bold text-sm rounded-xl transition shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 cursor-pointer"
=======
              className="w-full mt-2 py-2.5 px-4 bg-amber-500 hover:bg-amber-400 disabled:bg-amber-600 text-slate-950 font-semibold text-sm rounded-xl transition shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
>>>>>>> 04adb2bc717f7dc5bf8e0f4c700c4184cf76c6ef
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

<<<<<<< HEAD
          {/* Quick links to Create Account & Create Admin */}
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

          {/* Quick Demo Credentials Switcher */}
          <div className="mt-6 pt-5 border-t border-slate-800/80">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 mb-2.5">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>Quick Demo Accounts</span>
=======
          {/* Quick Demo Switcher */}
          <div className="mt-8 pt-6 border-t border-slate-700/60">
            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400 mb-3">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>Quick Demo Credentials</span>
>>>>>>> 04adb2bc717f7dc5bf8e0f4c700c4184cf76c6ef
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleQuickLogin('admin@example.com', 'ChangeMe123!')}
<<<<<<< HEAD
                className="px-2.5 py-2 bg-slate-950/60 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-300 hover:text-white transition text-left"
              >
                <div className="font-bold text-amber-400 text-[11px]">Super Admin</div>
                <div className="text-[10px] text-slate-500 truncate">admin@example.com</div>
=======
                className="px-2.5 py-2 bg-slate-900/50 hover:bg-slate-700/50 border border-slate-700/60 rounded-lg text-slate-300 hover:text-white transition text-left"
              >
                <div className="font-semibold text-amber-400">Super Admin</div>
                <div className="text-[10px] text-slate-400 truncate">admin@example.com</div>
>>>>>>> 04adb2bc717f7dc5bf8e0f4c700c4184cf76c6ef
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('admin.rajesh@example.com', 'AdminPass123!')}
<<<<<<< HEAD
                className="px-2.5 py-2 bg-slate-950/60 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-300 hover:text-white transition text-left"
              >
                <div className="font-bold text-sky-400 text-[11px]">Admin</div>
                <div className="text-[10px] text-slate-500 truncate">admin.rajesh@example.com</div>
=======
                className="px-2.5 py-2 bg-slate-900/50 hover:bg-slate-700/50 border border-slate-700/60 rounded-lg text-slate-300 hover:text-white transition text-left"
              >
                <div className="font-semibold text-sky-400">Admin</div>
                <div className="text-[10px] text-slate-400 truncate">admin.rajesh@example.com</div>
>>>>>>> 04adb2bc717f7dc5bf8e0f4c700c4184cf76c6ef
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('tl.priya@example.com', 'LeaderPass123!')}
<<<<<<< HEAD
                className="px-2.5 py-2 bg-slate-950/60 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-300 hover:text-white transition text-left"
              >
                <div className="font-bold text-indigo-400 text-[11px]">Team Lead</div>
=======
                className="px-2.5 py-2 bg-slate-900/50 hover:bg-slate-700/50 border border-slate-700/60 rounded-lg text-slate-300 hover:text-white transition text-left"
              >
                <div className="font-semibold text-indigo-400">Team Lead</div>
>>>>>>> 04adb2bc717f7dc5bf8e0f4c700c4184cf76c6ef
                <div className="text-[10px] text-slate-400 truncate">tl.priya@example.com</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('caller.anita@example.com', 'AgentPass123!')}
<<<<<<< HEAD
                className="px-2.5 py-2 bg-slate-950/60 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-300 hover:text-white transition text-left"
              >
                <div className="font-bold text-emerald-400 text-[11px]">Telecaller</div>
=======
                className="px-2.5 py-2 bg-slate-900/50 hover:bg-slate-700/50 border border-slate-700/60 rounded-lg text-slate-300 hover:text-white transition text-left"
              >
                <div className="font-semibold text-emerald-400">Telecaller</div>
>>>>>>> 04adb2bc717f7dc5bf8e0f4c700c4184cf76c6ef
                <div className="text-[10px] text-slate-400 truncate">caller.anita@example.com</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
