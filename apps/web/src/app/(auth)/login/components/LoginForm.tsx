'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { api } from '@/lib/api';
import { LogIn, Mail, Lock, AlertCircle, UserRound, ChevronDown } from 'lucide-react';
import Link from 'next/link';

type LoginRole = 'USER' | 'ADMIN';

const DEFAULT_ROLE_REDIRECTS: Record<string, string> = {
  SUPER_ADMIN: '/admin/users',
  ADMIN: '/admin/dashboard',
  STAFF: '/admin/dashboard',
  OFFICER: '/admin/dashboard',
  CITIZEN: '/',
};

const getLoginErrorMessage = (err: unknown) => {
  const responseMessage = (err as { response?: { data?: { message?: string } } }).response?.data?.message;
  if (responseMessage) return responseMessage;
  return err instanceof Error ? err.message : 'Login failed';
};

export default function LoginForm({ roleRedirect }: { roleRedirect?: Record<string, string> }) {
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
      const { access_token, user } = response.data;

      setToken(access_token);
      setUser(user);
      const destination = roleRedirect?.[user.role] || DEFAULT_ROLE_REDIRECTS[user.role] || '/';
      router.push(destination);
    } catch (err: unknown) {
      setError(getLoginErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="space-y-6" onSubmit={handleLogin}>
      {error && (
        <div className="bg-red-50 border border-red-100 p-4 rounded-xl flex items-center gap-3 text-red-600 text-sm">
          <AlertCircle size={18} />{error}
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
            onChange={e => setEmail(e.target.value)}
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
            onChange={e => setPassword(e.target.value)}
          />
        </div>
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-[#000080] text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-[#000060] hover:scale-[1.02] active:scale-95 transition-all shadow-xl disabled:opacity-50"
      >
        {loading ? (
          <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          <>
            <LogIn size={20} /> Sign In
          </>
        )}
      </button>
    </form>
  );
}
