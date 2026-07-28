'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { api } from '@/lib/api';
import Link from 'next/link';
import { Navigation, LogIn, Mail, Lock, AlertCircle, UserRound, ChevronDown } from 'lucide-react';

const ROLE_REDIRECTS: Record<string, string> = {
  SUPER_ADMIN: '/super-admin',
  ADMIN: '/admin/dashboard',
  STAFF: '/admin/dashboard',
  OFFICER: '/admin/dashboard',
  CITIZEN: '/',
};

const getLoginErrorMessage = (err: unknown) => {
  const responseMessage = (err as { response?: { data?: { message?: string } } }).response?.data?.message;
  if (responseMessage) return responseMessage;
  return err instanceof Error ? err.message : 'Login failed. Please check your credentials.';
};

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { setUser, setToken } = useAuthStore();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.post('/auth/login', {
        email,
        password,
      });

      const { access_token, user: apiUser } = response.data;

      if (access_token && apiUser) {
        setToken(access_token);
        setUser(apiUser);
        const destination = ROLE_REDIRECTS[apiUser.role] || '/';
        router.push(destination);
      }

    } catch (err: unknown) {
      setError(getLoginErrorMessage(err));
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
            <h2 className="text-4xl font-bold leading-tight mb-6">Empowering Citizens, Improving Governance.</h2>
            <p className="text-white/70 text-lg leading-relaxed">Join thousands of citizens making their city better. Report issues, access services, and track progress all in one place.</p>
          </div>

          <div className="relative z-10 pt-12 border-t border-white/10">
            <p className="text-sm font-medium text-white/50 italic">&quot;Digital technology is a great leveller and a great catalyst.&quot;</p>
          </div>

          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#FF9933]/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#138808]/10 rounded-full blur-3xl -ml-20 -mb-20"></div>
        </div>

        {/* Right Side: Login Form */}
        <div className="p-12 md:p-16 flex flex-col justify-center">
          <div className="mb-10">
            <h3 className="text-3xl font-bold text-[#000080] mb-2">Welcome Back</h3>
            <p className="text-zinc-500">Please enter your details to sign in.</p>
          </div>

          <form className="space-y-6" onSubmit={handleLogin}>
            {error && (
              <div className="bg-red-50 border border-red-100 p-4 rounded-xl flex items-center gap-3 text-red-600 text-sm animate-fade-in">
                <AlertCircle size={18} />
                {error}
              </div>
            )}



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
              <div className="flex justify-between items-center ml-1">
                <label className="text-sm font-bold text-[#000080]/60 uppercase tracking-wider">Password</label>
                <Link href="/forgot-password" className="text-xs font-bold text-[#FF9933] hover:underline">Forgot Password?</Link>
              </div>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-[#FF9933] transition-colors" size={20} />
                <input
                  type="password"
                  required
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl py-4 pl-12 pr-4 text-[#000080] focus:bg-white focus:ring-4 focus:ring-[#FF9933]/10 focus:border-[#FF9933] outline-none transition-all"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#000080] text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-[#000060] hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-navy/20 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <LogIn size={20} /> Sign In
                </>
              )}
            </button>
          </form>

          <div className="mt-10 text-center">
            <p className="text-zinc-500 text-sm">
              Don&apos;t have an account yet?{' '}
              <Link href="/register" className="text-[#FF9933] font-bold hover:underline">Create Account</Link>
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
