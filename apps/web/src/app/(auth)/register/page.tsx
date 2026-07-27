'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { api } from '@/lib/api';
import Link from 'next/link';
import { Navigation, UserPlus, Mail, Lock, User, AlertCircle, CheckCircle2, ShieldCheck } from 'lucide-react';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'CITIZEN' | 'ADMIN'>('CITIZEN');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const { setUser, setToken } = useAuthStore();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.post('/auth/register', {
        email,
        password,
        name,
        role: selectedRole
      });

      const { access_token, user: apiUser } = response.data;

      if (access_token && apiUser) {
        setToken(access_token);
        setUser(apiUser);
        router.push('/');
      }

    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 bg-white rounded-[2rem] overflow-hidden shadow-2xl border border-zinc-100">
        
        {/* Left Side: Brand & Message */}
        <div className="bg-[#000080] p-12 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-12">
              <div className="w-12 h-12 bg-[#FF9933] rounded-2xl flex items-center justify-center shadow-lg">
                <Navigation className="text-white" size={28} />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">CivicFlow</h1>
                <p className="text-[10px] uppercase tracking-[0.2em] text-[#FF9933] font-bold">Government of India</p>
              </div>
            </div>
            <h2 className="text-4xl font-bold leading-tight mb-6">Build a Smarter City, Together.</h2>
            <p className="text-white/70 text-lg leading-relaxed">Create an account to start reporting issues, tracking resolutions, and accessing digital government services instantly.</p>
          </div>

          <div className="relative z-10 space-y-6">
            <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/10">
              <div className="w-10 h-10 bg-[#138808] rounded-full flex items-center justify-center">
                <CheckCircle2 size={20} />
              </div>
              <p className="text-sm font-medium">Verified Citizen Identity</p>
            </div>
            <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/10">
              <div className="w-10 h-10 bg-[#FF9933] rounded-full flex items-center justify-center">
                <CheckCircle2 size={20} />
              </div>
              <p className="text-sm font-medium">Real-time Resolution Tracking</p>
            </div>
          </div>

          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#FF9933]/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
        </div>

        {/* Right Side: Register Form */}
        <div className="p-12 md:p-16 flex flex-col justify-center">
          <div className="mb-10">
            <h3 className="text-3xl font-bold text-[#000080] mb-2">Create Account</h3>
            <p className="text-zinc-500">Join the digital revolution in civic governance.</p>
          </div>

          {success ? (
            <div className="text-center space-y-6 animate-fade-in">
              <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <Mail size={40} />
              </div>
              <h4 className="text-2xl font-bold text-[#000080]">Check your email</h4>
              <p className="text-zinc-500">We've sent a confirmation link to <b>{email}</b>. Please verify your account to continue.</p>
              <button onClick={() => setSuccess(false)} className="text-[#FF9933] font-bold hover:underline">Try another email</button>
            </div>
          ) : (
            <form className="space-y-5" onSubmit={handleRegister}>
              {error && (
                <div className="bg-red-50 border border-red-100 p-4 rounded-xl flex items-center gap-3 text-red-600 text-sm animate-fade-in">
                  <AlertCircle size={18} />
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-bold text-[#000080]/60 uppercase tracking-wider ml-1">Full Name</label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-[#FF9933] transition-colors" size={20} />
                  <input
                    type="text"
                    required
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl py-4 pl-12 pr-4 text-[#000080] focus:bg-white focus:ring-4 focus:ring-[#FF9933]/10 focus:border-[#FF9933] outline-none transition-all"
                    placeholder="Enter your full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-[#000080]/60 uppercase tracking-wider ml-1">Email Address</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-[#FF9933] transition-colors" size={20} />
                  <input
                    type="email"
                    required
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl py-4 pl-12 pr-4 text-[#000080] focus:bg-white focus:ring-4 focus:ring-[#FF9933]/10 focus:border-[#FF9933] outline-none transition-all"
                    placeholder="name@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-[#000080]/60 uppercase tracking-wider ml-1">Account Type</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedRole('CITIZEN')}
                    className={`flex items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-semibold transition-all ${selectedRole === 'CITIZEN' ? 'border-[#000080] bg-[#000080] text-white' : 'border-zinc-200 bg-zinc-50 text-[#000080]'}`}
                  >
                    <User size={18} /> Citizen
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedRole('ADMIN')}
                    className={`flex items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-semibold transition-all ${selectedRole === 'ADMIN' ? 'border-[#FF9933] bg-[#FF9933] text-white' : 'border-zinc-200 bg-zinc-50 text-[#000080]'}`}
                  >
                    <ShieldCheck size={18} /> Admin
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-[#000080]/60 uppercase tracking-wider ml-1">Password</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-[#FF9933] transition-colors" size={20} />
                  <input
                    type="password"
                    required
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl py-4 pl-12 pr-4 text-[#000080] focus:bg-white focus:ring-4 focus:ring-[#FF9933]/10 focus:border-[#FF9933] outline-none transition-all"
                    placeholder="Minimum 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#000080] text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-[#000060] hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-navy/20 disabled:opacity-50 mt-4"
              >
                {loading ? (
                  <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    <UserPlus size={20} /> Create Account
                  </>
                )}
              </button>
            </form>
          )}

          <div className="mt-10 text-center">
            <p className="text-zinc-500 text-sm">
              Already have an account?{' '}
              <Link href="/login" className="text-[#FF9933] font-bold hover:underline">Sign In Instead</Link>
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
