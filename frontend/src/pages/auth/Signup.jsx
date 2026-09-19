<<<<<<< HEAD
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  Layers,
  Lock,
  Mail,
  Phone,
  User,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  KeyRound,
  Briefcase,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import ThreeDCanvas from '../../components/ThreeDCanvas';

export default function Signup() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { signup } = useAuth();

=======
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layers, Lock, Mail, Phone, User, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';
import api from '../../services/api';

export default function Signup() {
  const navigate = useNavigate();
>>>>>>> 04adb2bc717f7dc5bf8e0f4c700c4184cf76c6ef
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
<<<<<<< HEAD
    confirmPassword: '',
    role: searchParams.get('role') === 'admin' ? 'ADMIN' : 'TELECALLER',
    adminKey: ''
  });

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // 3D Card tilt effect
  const cardRef = useRef(null);
  const [cardTilt, setCardTilt] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (searchParams.get('role') === 'admin') {
      setForm((prev) => ({ ...prev, role: 'ADMIN' }));
    }
  }, [searchParams]);

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
    confirmPassword: ''
  });
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

>>>>>>> 04adb2bc717f7dc5bf8e0f4c700c4184cf76c6ef
  const handleChange = (e) => {
    setForm((current) => ({ ...current, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
<<<<<<< HEAD
    setSuccessMsg('');
=======
>>>>>>> 04adb2bc717f7dc5bf8e0f4c700c4184cf76c6ef

    if (form.password !== form.confirmPassword) {
      setErrorMsg('Passwords do not match');
      return;
    }

<<<<<<< HEAD
    if (form.password.length < 6) {
      setErrorMsg('Password must be at least 6 characters');
      return;
    }

    if (form.role === 'ADMIN' && !form.adminKey.trim()) {
      setErrorMsg('Please enter the Admin Security Key (default: ADMIN2024)');
      return;
    }

    setLoading(true);
    try {
      await signup(form);
      setSuccessMsg('Account created successfully! Redirecting to CRM...');
      setTimeout(() => {
        navigate('/dashboard');
      }, 1000);
    } catch (err) {
      setErrorMsg(err.message || 'Unable to create account');
=======
    setLoading(true);
    try {
      const res = await api.post('/auth/signup', form);
      if (res.success) {
        window.location.href = '/login?setup=complete';
      } else {
        setErrorMsg(res.message || 'Unable to create account');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Unable to create account');
    } finally {
>>>>>>> 04adb2bc717f7dc5bf8e0f4c700c4184cf76c6ef
      setLoading(false);
    }
  };

  return (
<<<<<<< HEAD
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-10 sm:px-6 lg:px-8 relative overflow-hidden select-none">
      {/* 3D Interactive Canvas Animation Backdrop */}
      <ThreeDCanvas />

      {/* Atmospheric Ambient Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-amber-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-[400px] h-[400px] bg-sky-500/10 rounded-full blur-[120px] pointer-events-none" />

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
          Create User or Administrator Account
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
          className="bg-slate-900/85 backdrop-blur-xl py-7 px-6 sm:px-9 rounded-3xl border border-slate-700/60 shadow-2xl shadow-slate-950/80"
        >
          {/* Navigation Pill: Sign In vs Sign Up */}
          <div className="flex bg-slate-950/70 p-1 rounded-2xl border border-slate-800 mb-5 text-xs font-semibold">
            <Link
              to="/login"
              className="flex-1 py-2 text-center rounded-xl text-slate-400 hover:text-white transition"
            >
              Sign In
            </Link>
            <button
              type="button"
              className="flex-1 py-2 rounded-xl bg-amber-500 text-slate-950 shadow-md font-bold transition"
            >
              Create Account
            </button>
          </div>

          {/* Account Role Selector */}
          <div className="mb-4">
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5 text-amber-400" />
              <span>Select Account Role</span>
            </label>
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-950/70 border border-slate-800 rounded-xl">
              <button
                type="button"
                onClick={() => setForm({ ...form, role: 'TELECALLER' })}
                className={`py-1.5 text-[11px] font-semibold rounded-lg transition ${
                  form.role === 'TELECALLER'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Telecaller
              </button>
              <button
                type="button"
                onClick={() => setForm({ ...form, role: 'BDE' })}
                className={`py-1.5 text-[11px] font-semibold rounded-lg transition ${
                  form.role === 'BDE'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                BDE Agent
              </button>
              <button
                type="button"
                onClick={() => setForm({ ...form, role: 'ADMIN' })}
                className={`py-1.5 text-[11px] font-semibold rounded-lg transition flex items-center justify-center gap-1 ${
                  form.role === 'ADMIN'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-amber-400 hover:text-amber-300'
                }`}
              >
                <KeyRound className="w-3 h-3" />
                <span>New Admin</span>
              </button>
            </div>
          </div>

          {form.role === 'ADMIN' && (
            <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-2 text-xs">
              <div className="flex items-center gap-1.5 text-amber-300 font-semibold">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <span>Admin Passkey Verification</span>
              </div>
              <p className="text-[11px] text-slate-400">
                To create a high-privilege Administrator account, enter the Admin Passkey (default: <span className="text-amber-400 font-mono font-bold">ADMIN2024</span>).
              </p>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-amber-400 absolute left-3 top-2.5" />
                <input
                  type="password"
                  name="adminKey"
                  required={form.role === 'ADMIN'}
                  value={form.adminKey}
                  onChange={handleChange}
                  placeholder="Enter ADMIN2024"
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-amber-500/40 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
=======
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-amber-500/10 via-amber-500/5 to-transparent blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center">
          <div className="w-12 h-12 rounded-2xl bg-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/25">
            <Layers className="w-7 h-7 text-slate-950 font-bold" />
          </div>
        </div>
        <h2 className="mt-4 text-center text-2xl font-bold tracking-tight text-white">Yellow Pages CRM</h2>
        <p className="mt-1 text-center text-xs text-slate-400">Create the first Super Admin account</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4 sm:px-0">
        <div className="bg-slate-800/80 backdrop-blur-md py-8 px-6 sm:px-10 rounded-2xl border border-slate-700/60 shadow-2xl">
          <div className="mb-5 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-xs flex items-center gap-2.5">
            <ShieldCheck className="w-4 h-4 flex-shrink-0" />
            <span>This account will be created as the Super Admin.</span>
          </div>

          {errorMsg && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
>>>>>>> 04adb2bc717f7dc5bf8e0f4c700c4184cf76c6ef
              <span>{errorMsg}</span>
            </div>
          )}

<<<<<<< HEAD
          {successMsg && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name *</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  name="name"
                  required
                  minLength={2}
                  value={form.name}
                  onChange={handleChange}
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full pl-9 pr-3 py-2 bg-slate-950/70 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition shadow-inner"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Email *</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    name="email"
                    required
                    value={form.email}
                    onChange={handleChange}
                    placeholder="agent@crm.com"
                    className="w-full pl-9 pr-2 py-2 bg-slate-950/70 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition shadow-inner"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Phone *</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="tel"
                    name="phone"
                    required
                    pattern="[0-9]{10,15}"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="9876543210"
                    className="w-full pl-9 pr-2 py-2 bg-slate-950/70 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition shadow-inner"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Password *</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    name="password"
                    required
                    minLength={6}
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Min 6 chars"
                    className="w-full pl-9 pr-2 py-2 bg-slate-950/70 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition shadow-inner"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Confirm *</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    name="confirmPassword"
                    required
                    minLength={6}
                    value={form.confirmPassword}
                    onChange={handleChange}
                    placeholder="Re-enter password"
                    className="w-full pl-9 pr-2 py-2 bg-slate-950/70 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition shadow-inner"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-3 py-3 px-4 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-xl transition shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>
                    {form.role === 'ADMIN' ? 'Create Admin Account' : 'Complete Registration'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Sign In Navigation */}
          <div className="mt-4 pt-3 border-t border-slate-800 text-center text-xs text-slate-400">
            <span>Already have an account? </span>
            <Link to="/login" className="text-amber-400 hover:text-amber-300 font-bold transition">
              Sign In here
            </Link>
          </div>
=======
          <form onSubmit={handleSubmit} className="space-y-4">
            <Field icon={User} label="Full Name">
              <input name="name" required minLength={2} value={form.name} onChange={handleChange} placeholder="Your full name" className={inputClass} />
            </Field>
            <Field icon={Mail} label="Email">
              <input type="email" name="email" required value={form.email} onChange={handleChange} placeholder="name@company.com" className={inputClass} />
            </Field>
            <Field icon={Phone} label="Phone">
              <input type="tel" name="phone" required pattern="[0-9]{10,15}" value={form.phone} onChange={handleChange} placeholder="10 digit phone number" className={inputClass} />
            </Field>
            <Field icon={Lock} label="Password">
              <input type="password" name="password" required minLength={8} value={form.password} onChange={handleChange} placeholder="At least 8 characters" className={inputClass} />
            </Field>
            <Field icon={Lock} label="Confirm Password">
              <input type="password" name="confirmPassword" required minLength={8} value={form.confirmPassword} onChange={handleChange} placeholder="Re-enter your password" className={inputClass} />
            </Field>

            <button type="submit" disabled={loading} className="w-full mt-2 py-2.5 px-4 bg-amber-500 hover:bg-amber-400 disabled:bg-amber-600 text-slate-950 font-semibold text-sm rounded-xl transition shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2">
              {loading ? (
                <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <><span>Create Super Admin</span><ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>
>>>>>>> 04adb2bc717f7dc5bf8e0f4c700c4184cf76c6ef
        </div>
      </div>
    </div>
  );
}
<<<<<<< HEAD
=======

const inputClass = 'w-full pl-3 pr-3.5 py-2.5 bg-slate-900/60 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition';

function Field({ icon: Icon, label, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-300 mb-1.5">{label}</label>
      <div className="relative">
        <Icon className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
        <div className="pl-7">{children}</div>
      </div>
    </div>
  );
}
>>>>>>> 04adb2bc717f7dc5bf8e0f4c700c4184cf76c6ef
