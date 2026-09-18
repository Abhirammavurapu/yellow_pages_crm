import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layers, Lock, Mail, Phone, User, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';
import api from '../../services/api';

export default function Signup() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm((current) => ({ ...current, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (form.password !== form.confirmPassword) {
      setErrorMsg('Passwords do not match');
      return;
    }

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
      setLoading(false);
    }
  };

  return (
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
              <span>{errorMsg}</span>
            </div>
          )}

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
        </div>
      </div>
    </div>
  );
}

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
