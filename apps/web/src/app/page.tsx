'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { supabase } from '@/lib/supabase';
import { 
  AlertCircle, 
  FileText, 
  MapPin, 
  ChevronRight, 
  User, 
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
  BellRing
} from 'lucide-react';

export default function Dashboard() {
  const { user, token, logout } = useAuthStore();
  const router = useRouter();
  
  const [complaints, setComplaints] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, resolved: 0, apps: 0 });

  useEffect(() => {
    if (!token && !user) {
      router.replace('/login');
      return;
    }

    async function syncAndFetch() {
      try {
        if (user) {
          // 1. Sync user
          await supabase.from('User').upsert({
            id: user.id, email: user.email, name: user.name, password: 'supabase-auth', role: user.role, updatedAt: new Date().toISOString()
          });

          // 2. Fetch Data
          const [
            { data: allComplaints }, 
            { data: allApps },
            { data: existingNotifs }
          ] = await Promise.all([
            supabase.from('Complaint').select('*').eq('userId', user.id).order('createdAt', { ascending: false }),
            supabase.from('ServiceApplication').select('*').eq('userId', user.id).order('createdAt', { ascending: false }),
            supabase.from('Notification').select('*').eq('userId', user.id).order('createdAt', { ascending: false })
          ]);
          
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
        setLoading(false);
      }
    }
    syncAndFetch();
  }, [token, user, router]);

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
      <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#000080]/20 border-t-[#000080] rounded-full animate-spin"></div>
      </div>
    );
  }

  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'C';
  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="min-h-screen bg-[#f8f9fa] font-sans pb-20">
      
      {/* Navigation */}
      <nav className="bg-white border-b border-zinc-200 px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#FF9933] rounded-xl flex items-center justify-center shadow-lg shadow-orange-100">
            <Navigation className="text-white" size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#000080] tracking-tight leading-none">CivicFlow</h1>
            <p className="text-[8px] uppercase tracking-[0.2em] text-[#FF9933] font-bold mt-1">Government of India</p>
          </div>
        </div>
        
        <div className="hidden md:flex items-center gap-8">
          <Link href="/" className="text-sm font-bold text-[#000080] border-b-2 border-[#FF9933] pb-1">Dashboard</Link>
          <Link href="/services" className="text-sm font-bold text-zinc-400 hover:text-[#000080] transition-colors">Services</Link>
          <Link href="/complaints" className="text-sm font-bold text-zinc-400 hover:text-[#000080] transition-colors">Issues</Link>
          <Link href="/track" className="text-sm font-bold text-zinc-400 hover:text-[#000080] transition-colors">Tracking</Link>
        </div>

        <div className="flex items-center gap-4 relative">
          <button 
            onClick={() => setShowNotifs(!showNotifs)}
            className={`p-2 rounded-xl transition-all relative ${showNotifs ? 'bg-zinc-100 text-[#000080]' : 'text-zinc-400 hover:text-[#000080]'}`}
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 w-2 h-2 bg-[#FF9933] rounded-full border-2 border-white animate-pulse"></span>
            )}
          </button>

          {/* Smart Notifications Dropdown */}
          {showNotifs && (
            <div className="absolute top-14 right-0 w-96 bg-white rounded-[2rem] shadow-2xl border border-zinc-100 py-6 z-[100] animate-scale-up">
              <div className="px-6 pb-4 border-b border-zinc-50 flex justify-between items-center">
                <div>
                  <h4 className="text-xs font-black uppercase tracking-widest text-[#000080]">Notifications</h4>
                  <p className="text-[8px] text-zinc-400 font-bold uppercase tracking-widest">National & Service Alerts</p>
                </div>
                <button onClick={() => setShowNotifs(false)} className="text-zinc-300 hover:text-zinc-500"><X size={14} /></button>
              </div>
              <div className="max-h-96 overflow-y-auto custom-scrollbar">
                {notifications.length > 0 ? (
                  notifications.map(n => (
                    <div 
                      key={n.id} 
                      onClick={() => markNotifRead(n.id)}
                      className={`p-6 hover:bg-zinc-50 flex items-start gap-4 group border-b border-zinc-50 last:border-0 cursor-pointer transition-colors ${!n.isRead ? 'bg-blue-50/30' : ''}`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        n.type === 'SERVICE' ? 'bg-orange-50 text-orange-600' : 'bg-blue-50 text-blue-600'
                      }`}>
                        {n.type === 'SERVICE' ? <BellRing size={18} /> : <Globe size={18} />}
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                           <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                             {n.type === 'SERVICE' ? 'Appointment' : 'National Update'}
                           </p>
                           {!n.isRead && <span className="w-1.5 h-1.5 bg-[#FF9933] rounded-full"></span>}
                        </div>
                        <p className="text-sm font-bold text-[#000080]">{n.title}</p>
                        <p className="text-xs text-zinc-500 leading-relaxed">{n.body}</p>
                        <p className="text-[8px] font-bold text-zinc-300 uppercase pt-1">Just Now</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-20 text-center space-y-4">
                    <div className="w-16 h-16 bg-zinc-50 rounded-full flex items-center justify-center mx-auto text-zinc-200">
                       <Bell size={24} />
                    </div>
                    <p className="text-[10px] text-zinc-300 font-black uppercase tracking-[0.2em]">All caught up!</p>
                  </div>
                )}
              </div>
              <div className="px-6 pt-4 border-t border-zinc-50">
                <button className="w-full py-3 text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-[#000080] transition-colors">Clear All Notifications</button>
              </div>
            </div>
          )}

          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 bg-zinc-50 hover:bg-red-50 hover:text-red-600 px-4 py-2 rounded-xl text-sm font-bold text-zinc-500 transition-all border border-zinc-100"
          >
            <LogOut size={16} /> <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 pt-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          
          {/* Welcome Banner */}
          <div className="lg:col-span-2 bg-[#000080] rounded-[2.5rem] p-10 text-white shadow-2xl shadow-navy/20 relative overflow-hidden group">
            <div className="relative z-10 flex flex-col h-full justify-between">
              <div>
                <span className="inline-block bg-white/10 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest mb-6 border border-white/10">Digital India Initiative</span>
                <h2 className="text-4xl font-black mb-4 leading-tight">Welcome back, <span className="text-[#FF9933]">{user?.name?.split(' ')[0] || 'Citizen'}</span></h2>
                <p className="text-white/60 max-w-md text-lg leading-relaxed mb-10">Your voice matters. Report civic issues directly to your municipal corporation and track resolution in real-time.</p>
              </div>
              
              <div className="flex flex-wrap gap-4 mt-auto">
                <Link href="/report" className="bg-[#FF9933] text-white px-8 py-4 rounded-2xl font-black hover:scale-105 active:scale-95 transition-all shadow-xl shadow-orange-100/20">Report an Issue</Link>
                <Link href="/services" className="bg-white/10 border border-white/20 backdrop-blur-md px-8 py-4 rounded-2xl font-black flex items-center gap-2 hover:bg-white/20 transition-all">
                  <Plus size={20} /> New Application
                </Link>
              </div>
            </div>
            <div className="absolute top-0 right-0 w-96 h-96 bg-[#FF9933]/10 rounded-full blur-[100px] -mr-48 -mt-48"></div>
          </div>

          {/* Profile Card */}
          <div className="bg-white rounded-[2.5rem] p-10 shadow-xl border border-zinc-50 flex flex-col items-center justify-center text-center group">
            <div className="w-24 h-24 bg-[#000080] rounded-full flex items-center justify-center mb-6 shadow-2xl ring-4 ring-[#000080]/10 group-hover:scale-110 transition-transform">
              <span className="text-3xl font-black text-white">{initials}</span>
            </div>
            <h3 className="text-2xl font-bold text-[#000080] mb-1">{user?.name || 'Citizen User'}</h3>
            <p className="text-zinc-400 text-sm font-medium mb-8">Verified Citizen</p>

            <div className="grid grid-cols-2 gap-12 w-full border-t border-zinc-50 pt-8">
              <div>
                <p className="text-3xl font-black text-[#000080]">{stats.total}</p>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-300">Reports</p>
              </div>
              <div>
                <p className="text-3xl font-black text-[#138808]">{stats.resolved}</p>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-300">Fixed</p>
              </div>
            </div>

            <button onClick={() => router.push('/settings')} className="w-full mt-10 bg-[#000080] text-white py-4 rounded-2xl font-black flex items-center justify-center gap-3 hover:bg-[#000060] transition-all shadow-lg shadow-navy/10">
              <Settings size={18} /> Edit Profile
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <Link href="/complaints" className="bg-white border border-zinc-200 p-6 rounded-2xl flex flex-col gap-4 group hover:border-[#FF9933]/50 transition-all shadow-sm">
              <div className="w-12 h-12 bg-[#FF9933]/10 text-[#FF9933] rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <AlertCircle size={24} />
              </div>
              <div>
                <h3 className="font-bold text-[#000080]">Your Reports</h3>
                <p className="text-sm text-zinc-500">{stats.total} total submissions</p>
              </div>
            </Link>
            <Link href="/services" className="bg-white border border-zinc-200 p-6 rounded-2xl flex flex-col gap-4 group hover:border-[#138808]/50 transition-all shadow-sm">
              <div className="w-12 h-12 bg-[#138808]/10 text-[#138808] rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <Briefcase size={24} />
              </div>
              <div>
                <h3 className="font-bold text-[#000080]">Service Applications</h3>
                <p className="text-sm text-zinc-500">{stats.apps} active bookings</p>
              </div>
            </Link>
            <Link href="/complaints?status=RESOLVED" className="bg-white border border-zinc-200 p-6 rounded-2xl flex flex-col gap-4 group hover:border-[#000080]/50 transition-all shadow-sm">
              <div className="w-12 h-12 bg-[#000080]/10 text-[#000080] rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <CheckCircle2 size={24} />
              </div>
              <div>
                <h3 className="font-bold text-[#000080]">Resolved</h3>
                <p className="text-sm text-zinc-500">{stats.resolved} complaints fixed</p>
              </div>
            </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          
          <div className="lg:col-span-2 space-y-12">
            {/* Recent Issues */}
            <div className="bg-white border border-zinc-200 rounded-[2.5rem] overflow-hidden shadow-sm">
              <div className="p-8 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-[#000080] rounded-lg flex items-center justify-center text-white">
                    <Navigation size={16} />
                  </div>
                  <h3 className="text-xl font-bold text-[#000080]">Recent Civic Issues</h3>
                </div>
                <Link href="/complaints" className="text-[#FF9933] text-sm font-bold flex items-center gap-1 hover:gap-2 transition-all">
                  View All <ChevronRight size={16} />
                </Link>
              </div>
              <div className="divide-y divide-zinc-100">
                {complaints.length > 0 ? (
                  complaints.map((issue) => (
                    <div key={issue.id} onClick={() => router.push(`/track?id=${issue.id}`)} className="p-8 hover:bg-zinc-50 transition-colors flex items-center justify-between cursor-pointer group">
                      <div className="flex gap-6">
                        <div className="w-14 h-14 bg-zinc-100 rounded-2xl flex items-center justify-center text-[#000080] group-hover:scale-110 transition-transform overflow-hidden relative">
                          {issue.imageUrl ? (
                            <img src={issue.imageUrl} className="w-full h-full object-cover" />
                          ) : (
                            <MapPin size={28} />
                          )}
                        </div>
                        <div>
                          <h4 className="text-lg font-bold text-[#000080] mb-1">{issue.title}</h4>
                          <p className="text-sm text-zinc-500 font-medium">{issue.category} • {issue.address || 'Location Shared'}</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-3">
                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                          issue.status === 'RESOLVED' ? 'bg-[#138808]/10 text-[#138808]' : 'bg-[#FF9933]/10 text-[#FF9933]'
                        }`}>
                          {issue.status}
                        </span>
                        <p className="text-[10px] text-zinc-400 font-bold">{new Date(issue.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-20 text-center text-zinc-400">
                    <p>No recent complaints found.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Applications */}
            <div className="bg-white border border-zinc-200 rounded-[2.5rem] overflow-hidden shadow-sm">
              <div className="p-8 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-[#FF9933] rounded-lg flex items-center justify-center text-white">
                    <Briefcase size={16} />
                  </div>
                  <h3 className="text-xl font-bold text-[#000080]">Active Service Applications</h3>
                </div>
                <Link href="/services" className="text-[#FF9933] text-sm font-bold flex items-center gap-1 hover:gap-2 transition-all">
                  New Booking <Plus size={16} />
                </Link>
              </div>
              <div className="divide-y divide-zinc-100">
                {applications.length > 0 ? (
                  applications.map((app) => (
                    <div key={app.id} className="p-8 hover:bg-zinc-50 transition-colors flex items-center justify-between group">
                      <div className="flex gap-6">
                        <div className="w-14 h-14 bg-white border border-zinc-100 rounded-2xl flex items-center justify-center text-[#000080] group-hover:scale-110 transition-transform shadow-sm">
                          <FileText size={28} />
                        </div>
                        <div>
                          <h4 className="text-lg font-bold text-[#000080] mb-1">{app.data?.serviceTitle || 'Government Service'}</h4>
                          <p className="text-sm text-zinc-500 font-mono tracking-tighter">REF: {app.referenceId}</p>
                          {app.appointmentDate && (
                             <p className="text-[10px] text-blue-600 font-black mt-1 flex items-center gap-1">
                                <Calendar size={10} /> Appt: {new Date(app.appointmentDate).toLocaleDateString()} @ {app.appointmentSlot}
                             </p>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-3">
                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                          app.status === 'COMPLETED' ? 'bg-[#138808]/10 text-[#138808]' : 
                          app.status === 'REJECTED' ? 'bg-red-50 text-red-600' : 'bg-[#FF9933]/10 text-[#FF9933]'
                        }`}>
                          {app.status.replace('_', ' ')}
                        </span>
                        <p className="text-[10px] text-zinc-400 font-bold">{new Date(app.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-20 text-center text-zinc-400">
                    <p>No active service bookings found.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-8">
            {/* Notices */}
            <div className="bg-gradient-to-br from-[#FF9933] to-[#FF7700] rounded-[2.5rem] p-10 text-white shadow-xl relative overflow-hidden group">
              <div className="relative z-10 space-y-6">
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                  <Info size={24} />
                </div>
                <h4 className="text-2xl font-black">Important Notice</h4>
                <p className="text-white/80 text-sm leading-relaxed font-medium">The Municipal Corporation will be conducting road repairs in South Delhi starting from next Monday. Some centers may experience delays.</p>
                <a href="https://mcdonline.nic.in/" target="_blank" className="inline-flex items-center gap-2 text-sm font-black bg-white text-[#FF9933] px-6 py-3 rounded-xl hover:scale-105 transition-all">
                  Read Circular <ExternalLink size={16} />
                </a>
              </div>
              <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
            </div>

            {/* Quick Support */}
            <div className="bg-white border border-zinc-200 rounded-[2.5rem] p-10 space-y-8 shadow-sm">
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Quick Support</h4>
                <div className="space-y-6">
                  <button onClick={() => window.open('tel:1031')} className="w-full flex items-center justify-between p-4 bg-zinc-50 rounded-2xl hover:bg-zinc-100 transition-all border border-zinc-100">
                    <div className="flex items-center gap-4 text-left">
                       <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-blue-600 shadow-sm">
                         <ShieldCheck size={20} />
                       </div>
                       <div>
                         <p className="font-bold text-[#000080] text-sm">Helpline 1031</p>
                         <p className="text-[10px] text-zinc-400 font-bold uppercase">24/7 Citizen Support</p>
                       </div>
                    </div>
                    <ChevronRight size={18} className="text-zinc-300" />
                  </button>
                  <button onClick={() => router.push('/track')} className="w-full flex items-center justify-between p-4 bg-zinc-50 rounded-2xl hover:bg-zinc-100 transition-all border border-zinc-100">
                    <div className="flex items-center gap-4 text-left">
                       <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-orange-600 shadow-sm">
                         <Clock size={20} />
                       </div>
                       <div>
                         <p className="font-bold text-[#000080] text-sm">Quick Track</p>
                         <p className="text-[10px] text-zinc-400 font-bold uppercase">Instant Status Check</p>
                       </div>
                    </div>
                    <ChevronRight size={18} className="text-zinc-300" />
                  </button>
                </div>
            </div>
          </div>

        </div>
      </main>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #fff; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #f0f0f0; border-radius: 10px; }
      `}</style>
    </div>
  );
}
