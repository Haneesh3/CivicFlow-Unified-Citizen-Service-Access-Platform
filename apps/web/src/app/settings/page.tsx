'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore, useHasHydrated } from '@/lib/store';
import { api } from '@/lib/api';
import { 
  ArrowLeft, 
  User, 
  Mail, 
  Phone, 
  Shield, 
  Bell, 
  Save, 
  Loader2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';

export default function SettingsPage() {
  const { user, setUser, token } = useAuthStore();
  const router = useRouter();
  const hasHydrated = useHasHydrated();

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [city, setCity] = useState(user?.city || '');
  const [language, setLanguage] = useState(user?.language || 'en');
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    if (!hasHydrated) return;
    if (!token && !user) {
      router.replace('/login');
    }
  }, [hasHydrated, token, user, router]);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setPhone(user.phone || '');
      setCity(user.city || '');
      setLanguage(user.language || 'en');
    }
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const response = await api.patch('/users/profile', { name, email, phone, city, language });
      setUser(response.data);
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      
      // Clear message after 3 seconds
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      console.error('Update error:', err);
      setMessage({ 
        type: 'error', 
        text: err.response?.data?.message || 'Failed to update profile. Please try again.' 
      });
    } finally {
      setLoading(false);
    }
  };

  if (!hasHydrated || !user) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#000080]/20 border-t-[#000080] rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa] font-sans pb-20">
      {/* Header */}
      <nav className="bg-white border-b border-zinc-200 px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <Link href="/" className="p-2 hover:bg-zinc-100 rounded-xl transition-colors text-zinc-500 hover:text-[#000080]">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-[#000080] tracking-tight leading-none">Settings</h1>
            <p className="text-[8px] uppercase tracking-[0.2em] text-[#FF9933] font-bold mt-1">Manage your account</p>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 pt-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Sidebar Tabs */}
          <div className="space-y-2">
            <button className="w-full flex items-center gap-3 px-4 py-3 bg-[#000080] text-white rounded-2xl font-bold text-sm shadow-lg shadow-navy/10 transition-all">
              <User size={18} /> Profile
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-3 text-zinc-500 hover:bg-zinc-100 rounded-2xl font-bold text-sm transition-all">
              <Shield size={18} /> Security
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-3 text-zinc-500 hover:bg-zinc-100 rounded-2xl font-bold text-sm transition-all">
              <Bell size={18} /> Notifications
            </button>
          </div>

          {/* Main Content */}
          <div className="md:col-span-3 space-y-8">
            <div className="bg-white rounded-[2.5rem] p-10 shadow-xl border border-zinc-50">
              <div className="mb-10">
                <h2 className="text-2xl font-black text-[#000080]">Edit Profile</h2>
                <p className="text-zinc-400 text-sm">Update your personal information to keep your profile current.</p>
              </div>

              {message && (
                <div className={`mb-8 p-4 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 ${
                  message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'
                }`}>
                  {message.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                  <p className="text-sm font-bold">{message.text}</p>
                </div>
              )}

              <form onSubmit={handleSave} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Full Name</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-400 group-focus-within:text-[#000080] transition-colors">
                        <User size={18} />
                      </div>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 bg-zinc-50 border border-zinc-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#000080]/10 focus:border-[#000080] transition-all font-bold text-[#000080]"
                        placeholder="John Doe"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Email Address</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-400 group-focus-within:text-[#000080] transition-colors">
                        <Mail size={18} />
                      </div>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 bg-zinc-50 border border-zinc-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#000080]/10 focus:border-[#000080] transition-all font-bold text-[#000080]"
                        placeholder="john@example.com"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Phone Number</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-400 group-focus-within:text-[#000080] transition-colors">
                        <Phone size={18} />
                      </div>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 bg-zinc-50 border border-zinc-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#000080]/10 focus:border-[#000080] transition-all font-bold text-[#000080]"
                        placeholder="+91 98765 43210"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-zinc-50 flex justify-end">
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-[#000080] text-white px-10 py-4 rounded-2xl font-black flex items-center gap-3 hover:bg-[#000060] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xl shadow-navy/20"
                  >
                    {loading ? (
                      <Loader2 size={20} className="animate-spin" />
                    ) : (
                      <Save size={20} />
                    )}
                    {loading ? 'Saving Changes...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>

            {/* Verification Badge */}
            <div className="bg-[#138808]/5 border border-[#138808]/10 rounded-[2rem] p-8 flex items-center gap-6">
              <div className="w-16 h-16 bg-[#138808] text-white rounded-2xl flex items-center justify-center shadow-lg shadow-green-100">
                <Shield size={32} />
              </div>
              <div>
                <h4 className="text-lg font-bold text-[#138808]">Identity Verified</h4>
                <p className="text-sm text-[#138808]/70 font-medium">Your account is verified with your official citizen ID. This ensures your reports are prioritized by local authorities.</p>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
