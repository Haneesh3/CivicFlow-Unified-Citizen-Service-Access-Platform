'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { 
  ChevronLeft, 
  Search,
  Navigation,
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

function TrackingContent() {
  const searchParams = useSearchParams();
  const [ticketId, setTicketId] = useState(searchParams.get('id') || '');
  const [complaint, setComplaint] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleTrack = async (idToTrack?: string) => {
    const id = idToTrack || ticketId;
    if (!id) return;
    setLoading(true);
    setError('');
    setComplaint(null);

    try {
      const { data, error } = await supabase
        .from('Complaint')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !data) throw new Error('Ticket ID not found. Please check and try again.');
      setComplaint(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const id = searchParams.get('id');
    if (id) {
      handleTrack(id);
    }
  }, []);

  return (
    <>
      <div className="w-20 h-20 bg-[#FF9933]/10 text-[#FF9933] rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-inner">
        <Navigation size={40} />
      </div>
      <h2 className="text-4xl font-black text-[#000080] mb-4">Track Your Complaint</h2>
      <p className="text-zinc-500 mb-12 max-w-md mx-auto">Enter your unique Ticket ID to see the latest status and updates from the municipal corporation.</p>

      <div className="flex gap-4 max-w-lg mx-auto mb-16">
        <div className="flex-1 relative group">
          <input 
            type="text" 
            placeholder="Enter Ticket ID (e.g. 550e8400...)"
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
          <h1 className="text-xl font-bold text-[#000080]">Track Issue</h1>
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
