'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  ShieldCheck,
  Users,
  LogOut,
  Settings
} from 'lucide-react';
import { useAuthStore, useHasHydrated } from '@/lib/store';
import { cn } from '@/lib/utils';

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout, user } = useAuthStore();
  const hasHydrated = useHasHydrated();

  useEffect(() => {
    if (!hasHydrated) return;

    if (!user || user.role !== 'SUPER_ADMIN') {
      logout();
      router.replace('/login');
    }
  }, [hasHydrated, logout, router, user]);

  if (!hasHydrated) {
    return (
      <div className="flex h-screen w-screen bg-slate-50 items-center justify-center">
        <div className="w-12 h-12 border-4 border-rose-600/20 border-t-rose-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const menuItems = [
    { name: 'Access Control', icon: Users, href: '/super-admin' },
  ];

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-950 text-white flex flex-col">
        <div className="p-6 flex items-center gap-3 border-b border-white/5">
          <div className="w-10 h-10 bg-rose-600 rounded-lg flex items-center justify-center">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <div>
            <span className="font-bold text-lg tracking-tight block">CivicFlow</span>
            <span className="text-[9px] uppercase tracking-widest text-rose-500 font-bold block">Super Admin</span>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link 
                key={item.name} 
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-colors group",
                  isActive 
                    ? "bg-rose-600 text-white shadow-lg shadow-rose-900/20" 
                    : "text-slate-400 hover:bg-slate-900 hover:text-white"
                )}
              >
                <item.icon className={cn(
                  "w-5 h-5",
                  isActive ? "text-white" : "text-slate-400 group-hover:text-white"
                )} />
                <span className="font-semibold text-sm">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-900">
          <div className="flex items-center gap-3 px-4 py-3 mb-4">
            <div className="w-8 h-8 bg-rose-900 text-rose-200 rounded-full flex items-center justify-center font-bold text-xs">
              SA
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold text-slate-200 truncate">{user?.name || 'Super Admin'}</span>
              <span className="text-[10px] text-slate-500 truncate">{user?.email || 'sa@civicflow.gov.in'}</span>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold text-rose-400 hover:bg-rose-950/20 rounded-xl transition-all border border-rose-900/20"
          >
            <LogOut className="w-4 h-4" /> Log Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
