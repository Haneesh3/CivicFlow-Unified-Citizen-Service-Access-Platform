'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore, useHasHydrated } from '@/lib/store';
import { supabase } from '@/lib/supabase';
import { api } from '@/lib/api';
import {
  AlertCircle,
  FileText,
  MapPin,
  ChevronRight,
  Settings,
  Bell,
  Navigation,
  CheckCircle2,
  Clock,
  Plus,
  LogOut,
  Briefcase,
  ShieldCheck,
  ExternalLink,
  Info,
  Calendar,
  X,
  Globe,
  BellRing,
  Sparkles,
  Building2,
  Smartphone,
  ClipboardList,
} from 'lucide-react';

export default function Dashboard() {
  const { user, token, logout } = useAuthStore();
  const router = useRouter();
  const hasHydrated = useHasHydrated();
  
  const [complaints, setComplaints] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const [loading, setLoading] = useState(true); // tracks hydration & auth
  const [dataLoading, setDataLoading] = useState(true); // tracks DB fetch
  const [stats, setStats] = useState({ total: 0, resolved: 0, apps: 0 });

  useEffect(() => {
    if (!hasHydrated) return;

    if (!token && !user) {
      router.replace('/login');
      return;
    }

    setLoading(false); // hydration and auth checked, render page shell

    async function syncAndFetch() {
      try {
        if (user) {
          const [
            complaintsRes, 
            appsRes,
            notifsRes
          ] = await Promise.all([
            api.get('/complaints/me'),
            api.get('/services/applications/me'),
            supabase.from('Notification').select('*').eq('userId', user.id).order('createdAt', { ascending: false })
          ]);
          
          const allComplaints: any[] = complaintsRes.data;
          const allApps: any[] = appsRes.data;
          const existingNotifs = notifsRes.data;
          
          if (allComplaints) {
            setComplaints(allComplaints.slice(0, 4));
            setStats(prev => ({
              ...prev, total: allComplaints.length, resolved: allComplaints.filter(c => c.status === 'RESOLVED').length
            }));
          }

          // 3. Smart Notification Logic
          let dynamicNotifs: any[] = existingNotifs || [];
          
          if (allApps) {
            setApplications(allApps);
            setStats(prev => ({ ...prev, apps: allApps.length }));

            // Generate Reminders
            allApps.forEach(app => {
              if (app.appointmentDate && app.status !== 'COMPLETED') {
                const apptDate = new Date(app.appointmentDate);
                const now = new Date();
                const diffMs = apptDate.getTime() - now.getTime();
                const diffHours = diffMs / (1000 * 60 * 60);

                const serviceName = app.data?.serviceTitle || 'Government Service';

                // 24 Hour Reminder
                if (diffHours > 0 && diffHours <= 24 && !dynamicNotifs.some(n => n.title.includes('24h') && n.title.includes(app.id))) {
                  dynamicNotifs.unshift({
                    id: `rem-24-${app.id}`,
                    title: `Reminder (24h): ${serviceName}`,
                    body: `Your appointment is tomorrow! Please ensure you have all original documents ready.`,
                    type: 'SERVICE',
                    createdAt: new Date().toISOString(),
                    isRead: false
                  });
                }
                // 2 Hour Reminder
                if (diffHours > 0 && diffHours <= 2 && !dynamicNotifs.some(n => n.id === `rem-2-${app.id}`)) {
                  dynamicNotifs.unshift({
                    id: `rem-2-${app.id}`,
                    title: `Urgent (2h): ${serviceName}`,
                    body: `Your appointment is in 2 hours. Start moving to the center soon!`,
                    type: 'SERVICE',
                    createdAt: new Date().toISOString(),
                    isRead: false
                  });
                }
                // 1 Hour Final Call
                if (diffHours > 0 && diffHours <= 1 && !dynamicNotifs.some(n => n.id === `rem-1-${app.id}`)) {
                  dynamicNotifs.unshift({
                    id: `rem-1-${app.id}`,
                    title: `Final Call (1h): ${serviceName}`,
                    body: `Your appointment is in 60 minutes. Don't forget your documents!`,
                    type: 'SERVICE',
                    createdAt: new Date().toISOString(),
                    isRead: false
                  });
                }

              }
            });
          }

          // 4. Mock National Updates if none exist
          if (!dynamicNotifs.some(n => n.type === 'NATIONAL')) {
            dynamicNotifs.push({
              id: 'nat-1',
              title: 'National Update: Digital India 2.0',
              body: 'New portal launched for student scholarships nationwide.',
              type: 'NATIONAL',
              createdAt: new Date().toISOString(),
              isRead: false
            });
          }

          setNotifications(dynamicNotifs);
        }
      } catch (err) {
        console.error('Sync error:', err);
      } finally {
        setDataLoading(false);
      }
    }
    syncAndFetch();
  }, [hasHydrated, token, user, router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    logout();
    window.location.href = '/login';
  };

  const markNotifRead = (id: string) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--ash)] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[var(--accent)]/20 border-t-[var(--accent)] rounded-full animate-spin"></div>
      </div>
    );
  }

  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'C';
  const unreadCount = notifications.filter(n => !n.isRead).length;


  return (
    <div className="min-h-screen bg-[var(--ash)] font-sans pb-20">
      <nav className="bg-white/90 backdrop-blur border-b border-zinc-200 px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[var(--primary)] rounded-xl flex items-center justify-center shadow-lg shadow-orange-100">
            <Navigation className="text-white" size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[var(--accent)] tracking-tight leading-none">CivicFlow</h1>
            <p className="text-[8px] uppercase tracking-[0.2em] text-[var(--primary)] font-bold mt-1">Government of India</p>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-8">
          <Link href="/" className="text-sm font-bold text-[var(--accent)] border-b-2 border-[var(--primary)] pb-1">Home</Link>
          <Link href="/services" className="text-sm font-bold text-zinc-500 hover:text-[var(--accent)] transition-colors">Services</Link>
          <Link href="/complaints" className="text-sm font-bold text-zinc-500 hover:text-[var(--accent)] transition-colors">Issues</Link>
          <Link href="/track" className="text-sm font-bold text-zinc-500 hover:text-[var(--accent)] transition-colors">Tracking</Link>
        </div>

        <div className="flex items-center gap-4 relative">
          <button onClick={() => setShowNotifs(!showNotifs)} className={`p-2 rounded-xl transition-all relative ${showNotifs ? 'bg-zinc-100 text-[var(--accent)]' : 'text-zinc-400 hover:text-[var(--accent)]'}`}>
            <Bell size={20} />
            {unreadCount > 0 && <span className="absolute top-2 right-2 w-2 h-2 bg-[var(--primary)] rounded-full border-2 border-white animate-pulse"></span>}
          </button>

          {showNotifs && (
            <div className="absolute top-14 right-0 w-96 bg-white rounded-[2rem] shadow-2xl border border-zinc-100 py-6 z-[100] animate-scale-up">
              <div className="px-6 pb-4 border-b border-zinc-50 flex justify-between items-center">
                <div>
                  <h4 className="text-xs font-black uppercase tracking-widest text-[var(--accent)]">Updates</h4>
                  <p className="text-[8px] text-zinc-400 font-bold uppercase tracking-widest">Citizen & service alerts</p>
                </div>
                <button onClick={() => setShowNotifs(false)} className="text-zinc-300 hover:text-zinc-500"><X size={14} /></button>
              </div>
              <div className="max-h-96 overflow-y-auto">
                {notifications.length > 0 ? notifications.map((n) => (
                  <div key={n.id} onClick={() => markNotifRead(n.id)} className={`p-6 hover:bg-zinc-50 flex items-start gap-4 group border-b border-zinc-50 last:border-0 cursor-pointer transition-colors ${!n.isRead ? 'bg-blue-50/40' : ''}`}>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${n.type === 'SERVICE' ? 'bg-orange-50 text-orange-600' : 'bg-blue-50 text-blue-600'}`}>
                      {n.type === 'SERVICE' ? <BellRing size={18} /> : <Globe size={18} />}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">{n.type === 'SERVICE' ? 'Service' : 'National'}</p>
                        {!n.isRead && <span className="w-1.5 h-1.5 bg-[var(--primary)] rounded-full"></span>}
                      </div>
                      <p className="text-sm font-bold text-[var(--accent)]">{n.title}</p>
                      <p className="text-xs text-zinc-500 leading-relaxed">{n.body}</p>
                    </div>
                  </div>
                )) : <div className="p-16 text-center text-zinc-400">All caught up.</div>}
              </div>
            </div>
          )}

          <button onClick={handleLogout} className="flex items-center gap-2 bg-zinc-50 hover:bg-red-50 hover:text-red-600 px-4 py-2 rounded-xl text-sm font-bold text-zinc-500 transition-all border border-zinc-100">
            <LogOut size={16} /> <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 pt-8 pb-8 space-y-8">
        <section className="grid grid-cols-1 lg:grid-cols-[1.6fr_0.9fr] gap-8">
          <div className="rounded-[2rem] bg-[var(--accent)] text-white p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-[var(--primary)]/20 blur-3xl"></div>
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] mb-4">
                <Sparkles size={14} /> Unified civic experience
              </div>
              <h2 className="text-3xl md:text-4xl font-black leading-tight mb-4">Hello {user?.name?.split(' ')[0] || 'citizen'}, report issues and access services in one place.</h2>
              <p className="text-white/70 max-w-2xl">CivicFlow brings together issue reporting, service access, and transparent tracking under one account for citizens and staff.</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href="/report" className="rounded-2xl bg-[var(--primary)] px-5 py-3 font-black hover:scale-[1.01] transition-transform">Report an issue</Link>
                <Link href="/services" className="rounded-2xl border border-white/20 bg-white/10 px-5 py-3 font-black hover:bg-white/20 transition-colors">Open services hub</Link>
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] bg-white border border-zinc-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Your profile</p>
                <h3 className="text-xl font-bold text-[var(--accent)]">{user?.name || 'Citizen User'}</h3>
              </div>
              <div className="w-12 h-12 rounded-full bg-[var(--accent)] text-white flex items-center justify-center font-black">{initials}</div>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="rounded-2xl bg-zinc-50 p-4">
                <div className="text-2xl font-black text-[var(--accent)]">
                  {dataLoading ? (
                    <div className="w-12 h-8 bg-zinc-200 animate-pulse rounded-lg"></div>
                  ) : (
                    stats.total
                  )}
                </div>
                <div className="text-[10px] uppercase tracking-[0.2em] text-zinc-400">Reports</div>
              </div>
              <div className="rounded-2xl bg-zinc-50 p-4">
                <div className="text-2xl font-black text-[var(--secondary)]">
                  {dataLoading ? (
                    <div className="w-12 h-8 bg-zinc-200 animate-pulse rounded-lg"></div>
                  ) : (
                    stats.resolved
                  )}
                </div>
                <div className="text-[10px] uppercase tracking-[0.2em] text-zinc-400">Resolved</div>
              </div>
            </div>
            <button onClick={() => router.push('/settings')} className="w-full rounded-2xl bg-[var(--accent)] text-white py-3 font-bold flex items-center justify-center gap-2">
              <Settings size={18} /> Edit profile
            </button>
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link href="/report" className="rounded-[1.75rem] bg-white border border-zinc-200 p-6 shadow-sm hover:border-[var(--primary)]/50 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-orange-50 text-[var(--primary)] flex items-center justify-center mb-4"><MapPin size={22} /></div>
            <h3 className="font-bold text-[var(--accent)]">Report a civic issue</h3>
            <p className="text-sm text-zinc-500 mt-2">Capture the location, category, and evidence in a guided flow.</p>
          </Link>
          <Link href="/services" className="rounded-[1.75rem] bg-white border border-zinc-200 p-6 shadow-sm hover:border-[var(--secondary)]/50 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-green-50 text-[var(--secondary)] flex items-center justify-center mb-4"><Briefcase size={22} /></div>
            <h3 className="font-bold text-[var(--accent)]">Government services</h3>
            <p className="text-sm text-zinc-500 mt-2">Browse PAN, Aadhaar, Passport, and local civic services from one hub.</p>
          </Link>
          <Link href="/track" className="rounded-[1.75rem] bg-white border border-zinc-200 p-6 shadow-sm hover:border-blue-500/50 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4"><ClipboardList size={22} /></div>
            <h3 className="font-bold text-[var(--accent)]">Track requests</h3>
            <p className="text-sm text-zinc-500 mt-2">Follow complaint progress and service appointment status in one view.</p>
          </Link>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-8">
          <div className="rounded-[2rem] bg-white border border-zinc-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-zinc-100 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Recent activity</p>
                <h3 className="text-xl font-bold text-[var(--accent)]">Your latest civic reports</h3>
              </div>
              <Link href="/complaints" className="text-sm font-bold text-[var(--primary)]">View all</Link>
            </div>
            <div className="divide-y divide-zinc-100">
              {dataLoading ? (
                [1, 2].map((i) => (
                  <div key={i} className="p-6 flex items-center justify-between animate-pulse">
                    <div className="space-y-2 flex-1">
                      <div className="h-4 bg-zinc-200 rounded w-1/3"></div>
                      <div className="h-3 bg-zinc-100 rounded w-1/2"></div>
                    </div>
                    <div className="h-6 bg-zinc-200 rounded-full w-16"></div>
                  </div>
                ))
              ) : complaints.length > 0 ? (
                complaints.map((issue) => (
                  <div key={issue.id} onClick={() => router.push(`/track?id=${issue.id}`)} className="p-6 flex items-center justify-between hover:bg-zinc-50 cursor-pointer">
                    <div>
                      <div className="font-bold text-[var(--accent)]">{issue.title}</div>
                      <div className="text-sm text-zinc-500">{issue.category} • {issue.address || 'Location shared'}</div>
                    </div>
                    <div className="text-right">
                      <div className={`inline-flex rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] ${issue.status === 'RESOLVED' ? 'bg-green-50 text-green-700' : 'bg-orange-50 text-orange-700'}`}>{issue.status}</div>
                      <div className="text-[10px] text-zinc-400 mt-2">{new Date(issue.createdAt).toLocaleDateString()}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-10 text-center text-zinc-400">No reports yet. Start with the button above.</div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-[2rem] bg-gradient-to-br from-[var(--primary)] to-[#ff7b1a] p-8 text-white shadow-lg">
              <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center mb-4"><Info size={24} /></div>
              <h3 className="text-xl font-black">Important notice</h3>
              <p className="text-sm text-white/80 mt-2">Road repairs and sanitation drives will be active in your ward this week. Check for any service disruptions.</p>
              <a href="https://mcdonline.nic.in/" target="_blank" className="inline-flex items-center gap-2 mt-4 rounded-xl bg-white text-[var(--primary)] px-4 py-2 font-bold">Read circular <ExternalLink size={16} /></a>
            </div>
            <div className="rounded-[2rem] bg-white border border-zinc-200 p-6 shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Quick support</p>
              <button onClick={() => window.open('tel:1031')} className="mt-4 flex items-center justify-between w-full rounded-2xl bg-zinc-50 px-4 py-4 border border-zinc-100">
                <div>
                  <div className="font-bold text-[var(--accent)]">Citizen helpline 1031</div>
                  <div className="text-sm text-zinc-500">24/7 support for civic concerns</div>
                </div>
                <ChevronRight size={18} className="text-zinc-400" />
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
