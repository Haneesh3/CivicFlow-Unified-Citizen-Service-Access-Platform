'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import {
  ChevronLeft,
  Navigation,
  Clock,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Star,
  XCircle,
  User,
  FileText,
  MapPin,
  Calendar,
  ShieldCheck,
} from 'lucide-react';

function TrackingContent() {
  const searchParams = useSearchParams();
  const [trackType, setTrackType] = useState<'complaint' | 'service'>('complaint');
  const [ticketId, setTicketId] = useState(searchParams.get('id') || '');
  const [complaint, setComplaint] = useState<any>(null);
  const [serviceApp, setServiceApp] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [rating, setRating] = useState(5);
  const [ratingComment, setRatingComment] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [showReopenForm, setShowReopenForm] = useState(false);
  const [reopenComment, setReopenComment] = useState('');

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SUBMITTED':
        return <span className="inline-flex items-center gap-2 rounded-full bg-amber-50 text-amber-700 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em]">Submitted</span>;
      case 'UNDER_REVIEW':
        return <span className="inline-flex items-center gap-2 rounded-full bg-sky-50 text-sky-700 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em]">In Review</span>;
      case 'APPROVED':
        return <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 text-blue-700 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em]">Proceed Approved</span>;
      case 'COMPLETED':
        return <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 text-emerald-700 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em]">Completed</span>;
      case 'REJECTED':
        return <span className="inline-flex items-center gap-2 rounded-full bg-rose-50 text-rose-700 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em]">Rejected</span>;
      default:
        return <span className="inline-flex items-center gap-2 rounded-full bg-zinc-100 text-zinc-600 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em]">{status}</span>;
    }
  };

  const trackLabel = trackType === 'complaint' ? 'Complaint' : 'Digital Service';
  const placeholder = trackType === 'complaint'
    ? 'Enter Ticket ID (e.g. 550e8400...)'
    : 'Enter Service Ref ID (e.g. CF-AB12CD)';

  const resetTrackingState = () => {
    setComplaint(null);
    setServiceApp(null);
    setError('');
    setRating(5);
    setRatingComment('');
    setShowReopenForm(false);
    setReopenComment('');
  };

  const handleTrack = async (idToTrack?: string) => {
    const id = idToTrack || ticketId?.trim();
    if (!id) return;
    setLoading(true);
    setError('');
    resetTrackingState();

    try {
      if (trackType === 'complaint') {
        const response = await api.get(`/complaints/${id}`);
        const data = response.data;
        if (!data) throw new Error('Ticket ID not found. Please check and try again.');
        setComplaint(data);
        setRating(data.rating || 5);
        setRatingComment(data.ratingComment || '');
      } else {
        const response = await api.get(`/services/applications/reference/${id}`);
        const data = response.data;
        if (!data) throw new Error('Service reference not found. Please verify your reference ID.');
        setServiceApp(data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Unable to find that record.');
    } finally {
      setLoading(false);
    }
  };

  const handleRating = async () => {
    if (!complaint) return;
    setActionLoading(true);
    setError('');
    try {
      const response = await api.patch(`/complaints/${complaint.id}`, {
        status: complaint.status,
        rating,
        ratingComment,
        comment: 'Citizen submitted feedback for completed work.',
      });
      setComplaint(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Unable to submit feedback right now.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReopen = async () => {
    if (!complaint) return;
    setActionLoading(true);
    setError('');
    try {
      const response = await api.patch(`/complaints/${complaint.id}/reopen`, {
        comment: reopenComment
      });
      setComplaint(response.data);
      setShowReopenForm(false);
      setReopenComment('');
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Unable to reopen this ticket right now.');
    } finally {
      setActionLoading(false);
    }
  };

  useEffect(() => {
    const id = searchParams.get('id');
    const type = searchParams.get('type');
    if (type === 'service') {
      setTrackType('service');
    }
    if (id) {
      setTicketId(id);
      handleTrack(id);
    }
  }, []);

  return (
    <>
      <div className="w-20 h-20 bg-[#FF9933]/10 text-[#FF9933] rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-inner">
        <Navigation size={40} />
      </div>

      <div className="flex flex-col gap-4 items-center mb-10">
        <div className="inline-flex rounded-full border border-zinc-200 bg-white p-1 shadow-sm">
          {(['complaint', 'service'] as const).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => {
                setTrackType(type);
                setTicketId('');
                resetTrackingState();
              }}
              className={`px-6 py-3 text-sm font-bold rounded-full transition-all ${trackType === type ? 'bg-[#000080] text-white shadow-lg' : 'text-zinc-500 hover:bg-slate-50'}`}
            >
              {type === 'complaint' ? 'Complaint Tracker' : 'Service Tracker'}
            </button>
          ))}
        </div>

        <h2 className="text-4xl font-black text-[#000080] mb-2">Track Your {trackLabel}</h2>
        <p className="text-zinc-500 mb-12 max-w-md mx-auto">
          {trackType === 'complaint'
            ? 'Enter your unique Ticket ID to see the latest status and updates from the municipal corporation.'
            : 'Use the service reference ID issued after booking to track service application progress and document verification.'}
        </p>
      </div>

      <div className="flex gap-4 max-w-lg mx-auto mb-16">
        <div className="flex-1 relative group">
          <input
            type="text"
            placeholder={placeholder}
            className="w-full bg-white border border-zinc-200 rounded-2xl py-4 px-6 focus:ring-4 focus:ring-[#FF9933]/10 focus:border-[#FF9933] outline-none transition-all shadow-xl font-mono text-sm"
            value={ticketId}
            onChange={(e) => setTicketId(e.target.value)}
          />
        </div>
        <button
          onClick={() => handleTrack()}
          disabled={loading}
          className="bg-[#000080] text-white px-8 rounded-2xl font-bold hover:bg-[#000060] transition-all flex items-center justify-center min-w-[120px] disabled:opacity-50"
        >
          {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : 'Track'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 p-6 rounded-3xl flex items-center gap-4 text-red-600 max-w-lg mx-auto animate-fade-in mb-8">
          <AlertCircle size={24} />
          <p className="font-bold text-sm text-left">{error}</p>
        </div>
      )}

      {serviceApp && (
        <div className="bg-white border border-zinc-100 rounded-[2.5rem] p-10 text-left shadow-2xl animate-fade-in space-y-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between border-b border-zinc-100 pb-8">
            <div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#FF9933] mb-2 block">Service Application</span>
              <h3 className="text-2xl font-black text-[#000080]">{serviceApp.data?.serviceTitle || 'Digital Service Application'}</h3>
              <p className="text-zinc-500 text-sm mt-1">Reference ID {serviceApp.referenceId} • Submitted on {new Date(serviceApp.createdAt).toLocaleDateString()}</p>
            </div>
            <div className="flex flex-col items-start gap-3">
              {getStatusBadge(serviceApp.status)}
              <div className="text-right text-xs uppercase tracking-[0.2em] text-zinc-400 font-bold">{serviceApp.data?.subService || 'General Service'}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-50 rounded-[2rem] p-6">
              <p className="text-xs uppercase tracking-[0.2em] font-black text-zinc-400 mb-4">Applicant Details</p>
              <div className="space-y-3 text-sm text-slate-700">
                <div className="flex items-center gap-2"><User size={16} className="text-slate-400" /><span>{serviceApp.applicantName}</span></div>
                <div className="flex items-center gap-2"><FileText size={16} className="text-slate-400" /><span>{serviceApp.applicantPhone}</span></div>
                <div className="flex items-center gap-2"><ShieldCheck size={16} className="text-slate-400" /><span>{serviceApp.user?.email || 'No email on record'}</span></div>
              </div>
            </div>
            <div className="bg-slate-50 rounded-[2rem] p-6">
              <p className="text-xs uppercase tracking-[0.2em] font-black text-zinc-400 mb-4">Appointment & Center</p>
              <div className="space-y-3 text-sm text-slate-700">
                <div className="flex items-center gap-2"><Calendar size={16} className="text-slate-400" /><span>{serviceApp.appointmentDate ? new Date(serviceApp.appointmentDate).toLocaleDateString() : 'Online'}</span></div>
                <div className="flex items-center gap-2"><Clock size={16} className="text-slate-400" /><span>{serviceApp.appointmentSlot || 'No slot assigned'}</span></div>
                <div className="flex items-center gap-2"><MapPin size={16} className="text-slate-400" /><span>{serviceApp.data?.centerName || 'No center selected'}</span></div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.2em] font-black text-zinc-400">Service Timeline</p>
              <span className="text-xs text-zinc-500">{serviceApp.updates?.length || 0} updates</span>
            </div>
            <div className="space-y-4">
              {serviceApp.updates?.map((update: any) => (
                <div key={update.id} className="rounded-[2rem] border border-zinc-100 p-5 bg-white shadow-sm">
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <div className="text-sm font-black text-[#000080] uppercase tracking-[0.15em]">{update.status}</div>
                    <div className="text-[11px] text-zinc-400 uppercase tracking-[0.18em]">{new Date(update.createdAt).toLocaleString()}</div>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed">{update.message}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {complaint && (
        <div className="bg-white border border-zinc-100 rounded-[2.5rem] p-10 text-left shadow-2xl animate-fade-in space-y-8">
          <div className="flex justify-between items-start border-b border-zinc-100 pb-8">
            <div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#FF9933] mb-2 block">Ticket Details</span>
              <h3 className="text-2xl font-black text-[#000080]">{complaint.title}</h3>
              <p className="text-zinc-500 text-sm mt-1">{complaint.category} • Reported on {new Date(complaint.createdAt).toLocaleDateString()}</p>
            </div>
            <div className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest ${
              complaint.status === 'RESOLVED' ? 'bg-[#138808]/10 text-[#138808]' : 'bg-[#FF9933]/10 text-[#FF9933]'
            }`}>
              {complaint.status}
            </div>
          </div>

          <div className="space-y-6">
            <h4 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400">Resolution Progress</h4>
            
            <div className="relative pl-8 space-y-12">
              <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-zinc-100"></div>
              
              <div className="relative flex items-center gap-6">
                <div className="absolute -left-[30px] w-6 h-6 bg-[#138808] rounded-full border-4 border-white flex items-center justify-center shadow-md shadow-green-200">
                  <CheckCircle2 size={12} className="text-white" />
                </div>
                <div>
                  <p className="font-bold text-[#000080]">Issue Submitted</p>
                  <p className="text-xs text-zinc-400">{new Date(complaint.createdAt).toLocaleString()}</p>
                </div>
              </div>

              <div className="relative flex items-center gap-6">
                <div className={`absolute -left-[30px] w-6 h-6 rounded-full border-4 border-white flex items-center justify-center shadow-md ${
                  complaint.status !== 'SUBMITTED' ? 'bg-[#FF9933] shadow-orange-100' : 'bg-zinc-200'
                }`}>
                  <Clock size={12} className="text-white" />
                </div>
                <div className={complaint.status === 'SUBMITTED' ? 'opacity-40' : ''}>
                  <p className="font-bold text-[#000080]">Acknowledged by Ward Office</p>
                  <p className="text-xs text-zinc-400">Processing initiated</p>
                </div>
              </div>

              <div className="relative flex items-center gap-6">
                <div className={`absolute -left-[30px] w-6 h-6 rounded-full border-4 border-white flex items-center justify-center shadow-md ${
                  complaint.status === 'RESOLVED' ? 'bg-[#138808] shadow-green-100' : 'bg-zinc-200'
                }`}>
                  {complaint.status === 'RESOLVED' ? <CheckCircle2 size={12} className="text-white" /> : <Clock size={12} className="text-white" />}
                </div>
                <div className={complaint.status !== 'RESOLVED' ? 'opacity-40' : ''}>
                  <p className="font-bold text-[#000080]">Resolution Confirmed</p>
                  <p className="text-xs text-zinc-400">Work completed and verified</p>
                </div>
              </div>
            </div>
          </div>

          {complaint.status === 'RESOLVED' && (
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6 space-y-4">
              {showReopenForm ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="text-sm font-black uppercase tracking-[0.2em] text-[#000080]">Reopen Ticket</h4>
                      <p className="text-xs text-zinc-500">Explain why the issue remains unresolved.</p>
                    </div>
                  </div>
                  <textarea
                    value={reopenComment}
                    onChange={(e) => setReopenComment(e.target.value)}
                    className="min-h-24 w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none focus:border-rose-500"
                    placeholder="Provide details about what remains unresolved (e.g., pothole only partially filled)..."
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleReopen}
                      disabled={actionLoading}
                      className="rounded-2xl bg-rose-600 px-5 py-3 text-sm font-bold text-white hover:bg-rose-700 disabled:opacity-50 transition-colors"
                    >
                      {actionLoading ? 'Reopening...' : 'Confirm Reopen'}
                    </button>
                    <button
                      onClick={() => { setShowReopenForm(false); setReopenComment(''); }}
                      className="rounded-2xl border border-zinc-200 bg-white px-5 py-3 text-sm font-bold text-zinc-600 hover:bg-zinc-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : complaint.rating ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-black uppercase tracking-[0.2em] text-[#000080]">Citizen Feedback Submitted</h4>
                      <p className="text-xs text-zinc-500">Thank you for sharing your experience.</p>
                    </div>
                    <button onClick={() => setShowReopenForm(true)} className="flex items-center gap-2 rounded-full border border-rose-200 bg-white px-4 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50 transition-colors">
                      <RotateCcw size={16} /> Reopen
                    </button>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} size={20} className={star <= complaint.rating ? 'text-[#FF9933]' : 'text-zinc-300'} fill="currentColor" />
                    ))}
                  </div>
                  {complaint.ratingComment && (
                    <div className="bg-white border border-zinc-150 p-4 rounded-xl text-sm text-slate-700 italic">
                      &quot;{complaint.ratingComment}&quot;
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-black uppercase tracking-[0.2em] text-[#000080]">Citizen feedback</h4>
                      <p className="text-xs text-zinc-500">Rate the resolution and share a short note.</p>
                    </div>
                    <button onClick={() => setShowReopenForm(true)} className="flex items-center gap-2 rounded-full border border-rose-200 bg-white px-4 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50 transition-colors">
                      <RotateCcw size={16} /> Reopen
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button key={star} type="button" onClick={() => setRating(star)} className={star <= rating ? 'text-[#FF9933]' : 'text-zinc-300'}>
                        <Star size={20} fill="currentColor" />
                      </button>
                    ))}
                  </div>
                  <textarea value={ratingComment} onChange={(e) => setRatingComment(e.target.value)} className="min-h-24 w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#FF9933]" placeholder="Share your experience with the completed work..." />
                  <button onClick={handleRating} disabled={actionLoading} className="rounded-2xl bg-[#000080] px-5 py-3 text-sm font-bold text-white disabled:opacity-50">
                    {actionLoading ? 'Saving...' : 'Submit feedback'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </>
  );
}

export default function TrackingPage() {
  return (
    <div className="min-h-screen bg-[#f8f9fa] font-sans">
      <nav className="bg-white border-b border-zinc-200 px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <Link href="/" className="p-2 hover:bg-zinc-100 rounded-full transition-colors">
            <ChevronLeft size={24} className="text-[#000080]" />
          </Link>
          <h1 className="text-xl font-bold text-[#000080]">Track Requests</h1>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-20 text-center">
        <Suspense fallback={<div>Loading...</div>}>
          <TrackingContent />
        </Suspense>
      </main>
    </div>
  );
}
