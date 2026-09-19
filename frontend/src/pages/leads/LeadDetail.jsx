import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Phone,
  Mail,
  MapPin,
  Building,
  User,
  Calendar,
  Lock,
  Unlock,
  AlertTriangle,
  Clock,
  CheckCircle,
  Play,
  Square as StopIcon,
  Send,
  History,
  ShieldAlert,
  CreditCard,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import StatusBadge from '../../components/StatusBadge';
import PriorityBadge from '../../components/PriorityBadge';
import Modal from '../../components/Modal';

export default function LeadDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isSuperAdmin, isAdmin } = useAuth();

  const [lead, setLead] = useState(null);
  const [calls, setCalls] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  // Concurrency Locking State
  const [lockStatus, setLockStatus] = useState({
    isLockedByMe: false,
    isLockedByOther: false,
    lockedByName: '',
    lockExpiresAt: null,
    message: ''
  });

  // Calling Drawer & Timer
  const [isCalling, setIsCalling] = useState(false);
  const [callSeconds, setCallSeconds] = useState(0);
  const [callStartTime, setCallStartTime] = useState(null);
  const timerRef = useRef(null);

  // Form Dispositions
  const [selectedPhone, setSelectedPhone] = useState('');
  const [callDisposition, setCallDisposition] = useState('INTERESTED');
  const [callNotes, setCallNotes] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [followUpTime, setFollowUpTime] = useState('10:00 AM');
  const [submittingCall, setSubmittingCall] = useState(false);

  // Payment modal state
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('10000');
  const [paymentPlan, setPaymentPlan] = useState('GOLD');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [processingPayment, setProcessingPayment] = useState(false);

  // Fetch Lead, Calls, and Activities
  const fetchLeadData = async () => {
    try {
      const [leadRes, callsRes, actRes] = await Promise.all([
        api.get(`/leads/${id}`),
        api.get(`/calls/lead/${id}`),
        api.get(`/audit/leads/${id}`)
      ]);

      if (leadRes.success) {
        setLead(leadRes.data);
        if (leadRes.data.phoneNumbers?.length > 0) {
          setSelectedPhone(leadRes.data.phoneNumbers[0]);
        }
      }
      if (callsRes.success) setCalls(callsRes.data);
      if (actRes.success) setActivities(actRes.data);
    } catch (err) {
      console.error('Failed to load lead details:', err);
    } finally {
      setLoading(false);
    }
  };

  // Attempt to acquire atomic lock when entering lead
  const handleAcquireLock = async () => {
    try {
      const res = await api.post(`/leads/${id}/lock`);
      if (res.success) {
        setLockStatus({
          isLockedByMe: true,
          isLockedByOther: false,
          lockedByName: user.name,
          lockExpiresAt: res.data.lockExpiresAt,
          message: 'You have actively locked this lead for calling.'
        });
      }
    } catch (err) {
      if (err.status === 423 || err.errorCode === 'LEAD_LOCKED') {
        setLockStatus({
          isLockedByMe: false,
          isLockedByOther: true,
          lockedByName: err.data?.lockedBy?.name || 'Another caller',
          lockExpiresAt: err.data?.lockExpiresAt,
          message: err.message
        });
      }
    }
  };

  const handleReleaseLock = async () => {
    try {
      await api.post(`/leads/${id}/unlock`);
      setLockStatus({
        isLockedByMe: false,
        isLockedByOther: false,
        lockedByName: '',
        lockExpiresAt: null,
        message: ''
      });
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchLeadData();
    handleAcquireLock();

    // Heartbeat every 2 minutes if locked by me
    const heartbeatTimer = setInterval(() => {
      if (lockStatus.isLockedByMe) {
        api.post(`/leads/${id}/heartbeat`).catch(console.error);
      }
    }, 120000);

    // Release on unmount
    return () => {
      clearInterval(heartbeatTimer);
      if (isCalling) clearInterval(timerRef.current);
    };
  }, [id]);

  // Call timer controls
  const startCall = () => {
    if (lockStatus.isLockedByOther) return;
    setIsCalling(true);
    setCallSeconds(0);
    setCallStartTime(new Date());
    timerRef.current = setInterval(() => {
      setCallSeconds((s) => s + 1);
    }, 1000);
  };

  const endCall = () => {
    setIsCalling(false);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`;
  };

  // Submit Call Disposition
  const handleSaveCall = async (e) => {
    e.preventDefault();
    if (!selectedPhone) return alert('Please select a phone number');

    setSubmittingCall(true);
    try {
      const res = await api.post(`/calls/lead/${id}`, {
        phoneNumber: selectedPhone,
        callStatus: callDisposition,
        duration: callSeconds,
        callStartTime: callStartTime || new Date(),
        callEndTime: new Date(),
        notes: callNotes,
        followUpDate: followUpDate || null,
        followUpTime: followUpTime || '10:00 AM',
        releaseLockAfterCall: true
      });

      if (res.success) {
        endCall();
        setCallNotes('');
        setFollowUpDate('');
        setLockStatus((prev) => ({ ...prev, isLockedByMe: false }));
        fetchLeadData();
      }
    } catch (err) {
      alert(err.message || 'Failed to save call');
    } finally {
      setSubmittingCall(false);
    }
  };

  // Process CRM Payment
  const handleProcessPayment = async (e) => {
    e.preventDefault();
    setProcessingPayment(true);
    try {
      const res = await api.post('/payments', {
        leadId: lead._id,
        amount: parseFloat(paymentAmount),
        plan: paymentPlan,
        notes: paymentNotes,
        createEnrollment: true
      });

      if (res.success) {
        setPaymentModalOpen(false);
        fetchLeadData();
        alert('Payment confirmed! Business enrolled into Yellow Pages directory.');
      }
    } catch (err) {
      alert(err.message || 'Payment recording failed');
    } finally {
      setProcessingPayment(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 bg-slate-200 rounded w-1/3"></div>
        <div className="h-48 bg-slate-200 rounded-2xl"></div>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="py-12 text-center text-slate-500 text-sm">
        Lead not found or access denied.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Concurrency Lock Banner */}
      {lockStatus.isLockedByOther && (
        <div className="p-4 bg-rose-50 border-l-4 border-rose-500 rounded-xl flex items-start gap-3.5 shadow-xs animate-in fade-in">
          <ShieldAlert className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs">
            <h4 className="font-bold text-rose-900">Lead Concurrency Lock Active</h4>
            <p className="text-rose-700 mt-0.5 leading-relaxed">{lockStatus.message}</p>
            <p className="text-[11px] text-rose-500 mt-1">
              Simultaneous calling is blocked to protect against duplicate outreach and customer confusion.
            </p>
          </div>
        </div>
      )}

      {lockStatus.isLockedByMe && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-800">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-emerald-600" />
            <span className="font-semibold">You have locked this lead for an active calling session.</span>
          </div>
          <button
            onClick={handleReleaseLock}
            className="px-2.5 py-1 bg-white border border-emerald-300 text-emerald-700 hover:bg-emerald-100 rounded-lg font-medium transition"
          >
            Release Lock
          </button>
        </div>
      )}

      {/* Header Info */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <span className="font-mono text-xs font-bold px-2 py-0.5 bg-amber-100 text-amber-900 rounded-md">
              {lead.leadId}
            </span>
            <h1 className="text-xl font-bold text-slate-900">{lead.businessName}</h1>
            <StatusBadge status={lead.currentStatus} />
            <PriorityBadge priority={lead.priority} />
          </div>
          <p className="text-xs text-slate-500 flex items-center gap-2">
            <span>{lead.category}</span>
            <span>•</span>
            <span>Source: {lead.source}</span>
            <span>•</span>
            <span>Created: {new Date(lead.createdAt).toLocaleDateString()}</span>
          </p>
        </div>

        <div className="flex items-center gap-2.5">
<<<<<<< HEAD
          {/* Quick Lead Status Selector */}
          <select
            value={lead.currentStatus}
            onChange={async (e) => {
              const newStatus = e.target.value;
              try {
                const res = await api.patch(`/leads/${lead._id}/status`, { status: newStatus });
                if (res.success) {
                  setLead((prev) => ({ ...prev, currentStatus: newStatus }));
                  fetchLeadData();
                }
              } catch (err) {
                alert(err.message || 'Failed to update status');
              }
            }}
            className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:border-amber-500 focus:outline-none"
          >
            <option value="NEW">Status: New</option>
            <option value="CONTACTED">Status: Contacted</option>
            <option value="INTERESTED">Status: Interested</option>
            <option value="READY_FOR_PAYMENT">Status: Ready For Payment</option>
            <option value="ENROLLED">Status: Enrolled</option>
            <option value="CALL_ME_LATER">Status: Call Me Later</option>
            <option value="BUSY">Status: Busy</option>
            <option value="NOT_INTERESTED">Status: Not Interested</option>
            <option value="WRONG_NUMBER">Status: Wrong Number</option>
          </select>

=======
>>>>>>> 04adb2bc717f7dc5bf8e0f4c700c4184cf76c6ef
          {['INTERESTED', 'READY_FOR_PAYMENT'].includes(lead.currentStatus) && (
            <button
              onClick={() => setPaymentModalOpen(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition shadow-xs flex items-center gap-1.5"
            >
              <CreditCard className="w-4 h-4" />
              <span>Collect Payment & Enroll</span>
            </button>
          )}
        </div>
      </div>

      {/* Main 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Calling Station & Contact Cards */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Call Station */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Calling Operations Workspace</h3>
                  <p className="text-[11px] text-slate-400">Record call disposition, duration, notes & next follow-up</p>
                </div>
              </div>

              {/* Call Timer Display */}
              <div className="flex items-center gap-3">
                <div className="font-mono text-base font-bold text-slate-800 bg-slate-100 px-3 py-1 rounded-lg border border-slate-200">
                  {formatTime(callSeconds)}
                </div>

                {!isCalling ? (
                  <button
                    type="button"
                    disabled={lockStatus.isLockedByOther}
                    onClick={startCall}
                    className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow-xs"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Start Call</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={endCall}
                    className="px-3 py-1.5 bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow-xs animate-pulse"
                  >
                    <StopIcon className="w-3.5 h-3.5 fill-current" />
                    <span>End Call</span>
                  </button>
                )}
              </div>
            </div>

            <form onSubmit={handleSaveCall} className="space-y-4 text-xs">
              {/* Phone Selector */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select Dialing Number</label>
                <div className="flex flex-wrap gap-2">
                  {lead.phoneNumbers?.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setSelectedPhone(p)}
                      className={`px-3 py-1.5 rounded-lg font-mono font-medium border transition ${
                        selectedPhone === p
                          ? 'bg-amber-50 border-amber-400 text-amber-900 font-bold'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                  {lead.alternatePhoneNumbers?.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setSelectedPhone(p)}
                      className={`px-3 py-1.5 rounded-lg font-mono border transition ${
                        selectedPhone === p
                          ? 'bg-amber-50 border-amber-400 text-amber-900 font-bold'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {p} (Alt)
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Status Disposition Buttons */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">Call Disposition / Outcome *</label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'INTERESTED',
                    'READY_FOR_PAYMENT',
                    'CALL_ME_LATER',
                    'FOLLOW_UP_REQUIRED',
                    'PHONE_NOT_LIFTED',
                    'BUSY',
                    'NOT_INTERESTED',
                    'WRONG_NUMBER',
                    'CLOSED'
                  ].map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setCallDisposition(st)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition ${
                        callDisposition === st
                          ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {st.replace(/_/g, ' ')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Call Notes */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Call Notes & Discussion Summary</label>
                <textarea
                  rows={3}
                  required
                  value={callNotes}
                  onChange={(e) => setCallNotes(e.target.value)}
                  placeholder="Summarize customer feedback, requirements, objections, or commitment details..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-amber-500 focus:outline-none text-xs"
                />
              </div>

              {/* Next Follow-up Scheduler */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>Schedule Next Follow-Up (Optional)</span>
                  </label>
                  <input
                    type="date"
                    value={followUpDate}
                    onChange={(e) => setFollowUpDate(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Follow-Up Time</span>
                  </label>
                  <input
                    type="text"
                    value={followUpTime}
                    onChange={(e) => setFollowUpTime(e.target.value)}
                    placeholder="e.g. 11:30 AM"
                    className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="submit"
                  disabled={submittingCall || lockStatus.isLockedByOther}
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-xl transition shadow-sm flex items-center gap-2"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{submittingCall ? 'Saving Call Record...' : 'Submit Call & Save'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Chronological Activity & Call Timeline (Immutable History) */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <History className="w-4 h-4 text-amber-500" />
                <span>Call History & Activity Timeline</span>
              </h3>
              <span className="text-[11px] text-slate-400 font-medium">Immutable Audit Trail</span>
            </div>

            {/* Timeline Stream */}
            <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
              {calls.length > 0 ? (
                calls.map((call) => (
                  <div
                    key={call._id}
                    className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <StatusBadge status={call.callStatus} />
                        <span className="font-semibold text-slate-800">
                          {call.employeeNameSnapshot}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          ({call.employeeRoleSnapshot || 'Agent'})
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {new Date(call.createdAt).toLocaleString()}
                      </span>
                    </div>

                    <p className="text-slate-700 leading-relaxed pl-1">{call.notes}</p>

                    <div className="flex items-center gap-4 text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                      <span>Duration: {formatTime(call.duration)}</span>
                      <span>Dialed: {call.phoneNumber}</span>
                      {call.followUpDate && (
                        <span className="text-amber-700 font-medium">
                          Next Follow-up: {new Date(call.followUpDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-6 text-center text-xs text-slate-400">
                  No calls recorded yet for this lead.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Business Profile & Assignment Details */}
        <div className="space-y-6">
          {/* Current Responsibility Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Current Responsibility
            </h3>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Assigned Caller:</span>
                <span className="font-bold text-slate-800">
                  {lead.assignedTo ? lead.assignedTo.name : 'Unassigned'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Team:</span>
                <span className="font-medium text-slate-700">
                  {lead.assignedTeam ? lead.assignedTeam.name : 'None'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Assigned Date:</span>
                <span className="text-slate-700">
                  {lead.assignmentDate ? new Date(lead.assignmentDate).toLocaleDateString() : '—'}
                </span>
              </div>
            </div>

            {/* Historical Previous Owners */}
            {lead.previousOwners?.length > 0 && (
              <div className="pt-2 border-t border-slate-100 text-xs">
                <span className="font-semibold text-slate-700">Previous Owners:</span>
                <div className="mt-1 flex flex-wrap gap-1">
                  {lead.previousOwners.map((prev) => (
                    <span
                      key={prev._id}
                      className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[11px]"
                    >
                      {prev.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Business Details Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3 text-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Business Information
            </h3>

            <div className="space-y-2.5">
              <div className="flex items-start gap-2.5">
                <Building className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-slate-400 text-[10px]">Business Name</div>
                  <div className="font-semibold text-slate-800">{lead.businessName}</div>
                </div>
              </div>

              {lead.ownerName && (
                <div className="flex items-start gap-2.5">
                  <User className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="text-slate-400 text-[10px]">Contact Person</div>
                    <div className="font-medium text-slate-800">{lead.ownerName}</div>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-2.5">
                <Phone className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-slate-400 text-[10px]">Phone Numbers</div>
                  <div className="font-medium text-slate-800 font-mono">
                    {lead.phoneNumbers?.join(', ')}
                  </div>
                </div>
              </div>

              {lead.email && (
                <div className="flex items-start gap-2.5">
                  <Mail className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="text-slate-400 text-[10px]">Email</div>
                    <div className="font-medium text-slate-800">{lead.email}</div>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-slate-400 text-[10px]">Address & Region</div>
                  <div className="font-medium text-slate-800 leading-relaxed">
                    {lead.address && `${lead.address}, `}
                    {lead.city}, {lead.district ? `${lead.district}, ` : ''}
                    {lead.state} {lead.pincode}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Collect Payment Modal */}
      <Modal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        title="Collect Payment & Create Directory Listing"
      >
        <form onSubmit={handleProcessPayment} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Payment Amount (INR) *</label>
            <input
              type="number"
              required
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-amber-500 focus:outline-none font-bold"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Listing Plan</label>
            <select
              value={paymentPlan}
              onChange={(e) => setPaymentPlan(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-amber-500 focus:outline-none"
            >
              <option value="SILVER">Silver (₹5,000 / year)</option>
              <option value="GOLD">Gold (₹10,000 / year)</option>
              <option value="PLATINUM">Platinum (₹15,000 / year)</option>
              <option value="DIAMOND">Diamond (₹25,000 / year)</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Transaction / Reference Note</label>
            <textarea
              rows={2}
              value={paymentNotes}
              onChange={(e) => setPaymentNotes(e.target.value)}
              placeholder="e.g. Paid via UPI / Cheque No / Bank Transfer"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-amber-500 focus:outline-none text-xs"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setPaymentModalOpen(false)}
              className="px-4 py-2 border border-slate-300 rounded-lg font-semibold hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={processingPayment}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition"
            >
              {processingPayment ? 'Processing...' : 'Confirm & Enroll'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
