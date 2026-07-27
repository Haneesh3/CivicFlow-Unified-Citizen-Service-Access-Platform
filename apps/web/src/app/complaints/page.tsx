'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuthStore, useHasHydrated } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { 
  MapPin, 
  ChevronLeft, 
  Search, 
  Filter, 
  Plus, 
  Navigation 
} from 'lucide-react';

export default function IssuesPage() {
  const router = useRouter();
  const { user, token } = useAuthStore();
  const hasHydrated = useHasHydrated();

  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!hasHydrated) return;
    if (!token && !user) {
      router.replace('/login');
    }
  }, [hasHydrated, token, user, router]);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await api.get('/complaints');
        setComplaints(response.data || []);
      } catch (err) {
        console.error('Fetch complaints error:', err);
      } finally {
        setLoading(false);
      }
    }
    if (user) {
      fetchData();
    }
  }, [user]);

  const filteredComplaints = complaints.filter(c => 
    c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!hasHydrated || !user) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#000080]/20 border-t-[#000080] rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa] font-sans">
      <nav className="bg-white border-b border-zinc-200 px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <Link href="/" className="p-2 hover:bg-zinc-100 rounded-full transition-colors">
            <ChevronLeft size={24} className="text-[#000080]" />
          </Link>
          <h1 className="text-xl font-bold text-[#000080]">Civic Issues</h1>
        </div>
        <Link href="/report" className="bg-[#FF9933] text-white px-5 py-2.5 rounded-full font-bold flex items-center gap-2 hover:scale-105 transition-all text-sm">
          <Plus size={18} /> Report New Issue
        </Link>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-10">
        {/* Search & Filter Bar */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-1 relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-[#FF9933] transition-colors" size={20} />
            <input 
              type="text" 
              placeholder="Search by title or category..."
              className="w-full bg-white border border-zinc-200 rounded-2xl py-3.5 pl-12 pr-4 focus:ring-4 focus:ring-[#FF9933]/10 focus:border-[#FF9933] outline-none transition-all shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="flex items-center justify-center gap-2 bg-white border border-zinc-200 px-6 py-3.5 rounded-2xl font-bold text-[#000080] hover:bg-zinc-50 transition-all shadow-sm">
            <Filter size={20} /> Filters
          </button>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <div className="w-10 h-10 border-4 border-[#FF9933]/20 border-t-[#FF9933] rounded-full animate-spin mx-auto"></div>
            <p className="mt-4 text-zinc-500 font-medium tracking-wide">Fetching city issues...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredComplaints.map((issue) => (
              <div key={issue.id} className="bg-white border border-zinc-100 rounded-2xl p-6 hover:shadow-xl hover:border-[#FF9933]/30 transition-all group flex flex-col md:flex-row justify-between md:items-center gap-6 shadow-sm">
                <div className="flex gap-5">
                  <div className="w-14 h-14 bg-[#f0f4f8] rounded-2xl flex items-center justify-center text-[#000080] group-hover:bg-[#FF9933]/10 group-hover:text-[#FF9933] transition-colors">
                    <MapPin size={28} />
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">{issue.category}</span>
                      <span className="w-1 h-1 bg-zinc-300 rounded-full"></span>
                      <span className="text-xs font-bold text-zinc-400">{new Date(issue.createdAt).toLocaleDateString()}</span>
                    </div>
                    <h3 className="text-lg font-bold text-[#000080] mb-2">{issue.title}</h3>
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                      <div className="flex items-center gap-1.5 text-zinc-500">
                        <MapPin size={14} />
                        <p className="text-sm font-medium">{issue.address || 'Location data unavailable'}</p>
                      </div>
                      <div className="flex items-center gap-1.5 text-zinc-400">
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-zinc-100 rounded uppercase">ID: {issue.id.substring(0, 8)}...</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4 border-t md:border-t-0 pt-4 md:pt-0">
                  <div className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest ${
                    issue.status === 'RESOLVED' ? 'bg-[#138808]/10 text-[#138808]' : 
                    issue.status === 'IN_PROGRESS' ? 'bg-blue-50 text-blue-600' : 'bg-[#FF9933]/10 text-[#FF9933]'
                  }`}>
                    {issue.status}
                  </div>
                  <Link 
                    href={`/track?id=${issue.id}`}
                    className="p-3 bg-zinc-50 hover:bg-[#000080] hover:text-white rounded-xl transition-all group/btn"
                  >
                    <Navigation size={18} className="group-hover/btn:scale-110 transition-transform" />
                  </Link>
                </div>
              </div>

            ))}

            {filteredComplaints.length === 0 && (
              <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-zinc-200">
                <p className="text-zinc-400 font-medium italic">No issues found matching your search.</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
