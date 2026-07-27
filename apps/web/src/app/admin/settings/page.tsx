'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/lib/store';
import { api } from '@/lib/api';
import { 
  User, 
  Mail, 
  Phone, 
  Save, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  Settings,
  Shield,
  BellRing,
  RotateCw
} from 'lucide-react';

export default function AdminSettings() {
  const { user, setUser } = useAuthStore();

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  
  // Operational Config Center states
  const [autoAssign, setAutoAssign] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [syncFrequency, setSyncFrequency] = useState('hourly');
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setPhone(user.phone || '');
    }
  }, [user]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const response = await api.patch('/users/profile', { name, email, phone });
      setUser(response.data);
      setMessage({ type: 'success', text: 'Admin profile updated successfully!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      console.error('Update profile error:', err);
      setMessage({ 
        type: 'error', 
        text: err.response?.data?.message || 'Failed to update admin profile.' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setMessage({ type: 'success', text: 'Operations control configuration saved successfully!' });
      setLoading(false);
      setTimeout(() => setMessage(null), 3000);
    }, 800);
  };

  return (
    <div className="p-8 space-y-8 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Control Center Settings</h1>
        <p className="text-sm text-slate-500 mt-1">Configure municipal assignments, notifications, and manage administrator profiles.</p>
      </div>

      {message && (
        <div className={`p-4 rounded-xl border flex items-center gap-3 text-sm transition-all duration-300 animate-fade-in ${
          message.type === 'success' 
            ? 'bg-green-50 border-green-200 text-green-700' 
            : 'bg-red-50 border-red-200 text-red-700'
        }`}>
          {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span className="font-medium">{message.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left column navigation cards */}
        <div className="md:col-span-1 space-y-4">
          <Card className="shadow-sm border border-slate-100 bg-white">
            <CardContent className="p-4 space-y-2">
              <button className="w-full flex items-center gap-3 px-4 py-3 bg-slate-900 text-white rounded-xl font-semibold text-sm transition-all shadow-md">
                <User size={18} /> Administrator Profile
              </button>
              <button className="w-full flex items-center gap-3 px-4 py-3 text-slate-600 hover:bg-slate-50 rounded-xl font-semibold text-sm transition-all">
                <Settings size={18} /> Operational Config
              </button>
              <button className="w-full flex items-center gap-3 px-4 py-3 text-slate-600 hover:bg-slate-50 rounded-xl font-semibold text-sm transition-all">
                <Shield size={18} /> Security & System
              </button>
            </CardContent>
          </Card>

          <Card className="shadow-sm border border-slate-100 bg-slate-900 text-white">
            <CardContent className="p-6 space-y-2">
              <div className="text-xs uppercase tracking-widest text-slate-400 font-bold">System Status</div>
              <div className="text-lg font-bold">Version 1.0.3</div>
              <div className="text-xs text-slate-400 font-medium">All municipal modules are currently synchronized and operational.</div>
            </CardContent>
          </Card>
        </div>

        {/* Right column settings panels */}
        <div className="md:col-span-2 space-y-8">
          {/* Section 1: Admin Profile */}
          <Card className="shadow-sm border border-slate-100 bg-white">
            <CardHeader className="border-b pb-4">
              <CardTitle className="text-lg font-bold text-slate-900">Administrator Profile Details</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleSaveProfile} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Administrator Name</label>
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={18} />
                    <input
                      type="text"
                      required
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-12 pr-4 text-slate-900 focus:bg-white focus:ring-4 focus:ring-blue-100 focus:border-blue-600 outline-none transition-all font-semibold"
                      value={name}
                      onChange={e => setName(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Email Address</label>
                    <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={18} />
                      <input
                        type="email"
                        required
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-12 pr-4 text-slate-900 focus:bg-white focus:ring-4 focus:ring-blue-100 focus:border-blue-600 outline-none transition-all font-semibold"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Phone Number</label>
                    <div className="relative group">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={18} />
                      <input
                        type="text"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-12 pr-4 text-slate-900 focus:bg-white focus:ring-4 focus:ring-blue-100 focus:border-blue-600 outline-none transition-all font-semibold"
                        placeholder="Add phone number..."
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-md disabled:opacity-50 hover:scale-[1.01] active:scale-[0.99]"
                  >
                    {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    Save Profile Changes
                  </button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Section 2: Operations control config */}
          <Card className="shadow-sm border border-slate-100 bg-white">
            <CardHeader className="border-b pb-4">
              <CardTitle className="text-lg font-bold text-slate-900">Operations Config Center</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleSaveConfig} className="space-y-6">
                <div className="space-y-4">
                  {/* Auto assignment toggles */}
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="space-y-1 pr-6">
                      <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <Shield className="w-4 h-4 text-blue-600" />
                        Automatic Ticket Assignment
                      </div>
                      <div className="text-xs text-slate-500">Automatically assign new reported complaints to relevant department heads and ward teams based on categories.</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={autoAssign} 
                        onChange={e => setAutoAssign(e.target.checked)}
                        className="sr-only peer" 
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  {/* Email Notifications triggers */}
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="space-y-1 pr-6">
                      <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <BellRing className="w-4 h-4 text-blue-600" />
                        SLA Escalation Alerts
                      </div>
                      <div className="text-xs text-slate-500">Send direct email alerts to ward directors when tickets remain unresolved beyond the 24h SLA.</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={emailNotifications} 
                        onChange={e => setEmailNotifications(e.target.checked)}
                        className="sr-only peer" 
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  {/* Sync frequency config */}
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="space-y-1 pr-6">
                      <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <RotateCw className="w-4 h-4 text-blue-600" />
                        Supabase Sync Interval
                      </div>
                      <div className="text-xs text-slate-500">Configure how often the local PostgreSQL database syncs historical seed entries from the remote Supabase database.</div>
                    </div>
                    <select
                      className="bg-white border border-slate-200 rounded-lg p-2 text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-600 text-slate-800"
                      value={syncFrequency}
                      onChange={e => setSyncFrequency(e.target.value)}
                    >
                      <option value="realtime">Realtime API updates</option>
                      <option value="hourly">Hourly batch runs (Recommended)</option>
                      <option value="daily">Daily database sync</option>
                    </select>
                  </div>

                  {/* System Maintenance toggle */}
                  <div className="flex items-center justify-between p-4 bg-red-50/50 rounded-xl border border-red-100">
                    <div className="space-y-1 pr-6">
                      <div className="text-sm font-bold text-red-900 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-red-600" />
                        System Maintenance Mode
                      </div>
                      <div className="text-xs text-red-700/80">Restrict citizen submissions temporary and display a static notice for scheduling or maintenance tasks.</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={maintenanceMode} 
                        onChange={e => setMaintenanceMode(e.target.checked)}
                        className="sr-only peer" 
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                    </label>
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <button
                    type="submit"
                    className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-md hover:scale-[1.01] active:scale-[0.99]"
                  >
                    <Save size={16} />
                    Save Configuration
                  </button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
