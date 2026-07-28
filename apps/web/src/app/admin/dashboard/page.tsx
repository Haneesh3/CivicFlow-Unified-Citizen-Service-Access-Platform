'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { AlertCircle, CheckCircle2, Clock, Users, BarChart3, MapPin } from 'lucide-react';

export default function AdminDashboard() {
  const { user } = useAuthStore();
  
  const { data: stats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      // In a real app, you'd have a specific stats endpoint
      // For MVP, we'll fetch all complaints and calculate
      const response = await api.get('/complaints');
      const complaints = response.data;
      
      return {
        total: complaints.length,
        pending: complaints.filter((c: any) => c.status === 'SUBMITTED' || c.status === 'ASSIGNED').length,
        resolved: complaints.filter((c: any) => c.status === 'RESOLVED').length,
        citizens: 1240, // Mocked
      };
    },
  });

  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-slate-900">Municipal Operations Control</h1>
        <div className="flex gap-4">
          <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm border">
            <MapPin className="w-4 h-4 text-slate-500" />
            <span className="text-sm font-medium">Region: {user?.city || 'Delhi Central'}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-blue-600">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Total Complaints</CardTitle>
            <AlertCircle className="w-4 h-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total || 0}</div>
            <p className="text-xs text-slate-500 mt-1">+12% from last week</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Pending Actions</CardTitle>
            <Clock className="w-4 h-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.pending || 0}</div>
            <p className="text-xs text-slate-500 mt-1">Requires immediate attention</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-600">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Resolved Today</CardTitle>
            <CheckCircle2 className="w-4 h-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.resolved || 0}</div>
            <p className="text-xs text-slate-500 mt-1">Goal: 10 per day</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-600">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Registered Citizens</CardTitle>
            <Users className="w-4 h-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.citizens || 0}</div>
            <p className="text-xs text-slate-500 mt-1">Across all 50 wards</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-slate-700" />
              Complaints by Category
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[300px] flex items-end gap-4 px-8 pb-8">
            <div className="flex-1 bg-blue-100 rounded-t-lg h-[80%] relative group">
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 bg-slate-800 text-white text-xs p-1 rounded">45</div>
              <div className="absolute bottom-[-24px] left-1/2 -translate-x-1/2 text-[10px] text-slate-500 whitespace-nowrap">Roads</div>
            </div>
            <div className="flex-1 bg-blue-200 rounded-t-lg h-[60%] relative group">
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 bg-slate-800 text-white text-xs p-1 rounded">32</div>
              <div className="absolute bottom-[-24px] left-1/2 -translate-x-1/2 text-[10px] text-slate-500 whitespace-nowrap">Garbage</div>
            </div>
            <div className="flex-1 bg-blue-300 rounded-t-lg h-[40%] relative group">
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 bg-slate-800 text-white text-xs p-1 rounded">18</div>
              <div className="absolute bottom-[-24px] left-1/2 -translate-x-1/2 text-[10px] text-slate-500 whitespace-nowrap">Water</div>
            </div>
            <div className="flex-1 bg-blue-400 rounded-t-lg h-[90%] relative group">
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 bg-slate-800 text-white text-xs p-1 rounded">56</div>
              <div className="absolute bottom-[-24px] left-1/2 -translate-x-1/2 text-[10px] text-slate-500 whitespace-nowrap">Lighting</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity Log</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-start gap-3 pb-4 border-b last:border-0 last:pb-0">
                  <div className="w-2 h-2 rounded-full bg-blue-600 mt-2" />
                  <div>
                    <p className="text-sm font-medium">New complaint #CF-102{i} reported</p>
                    <p className="text-xs text-slate-500">Lajpat Nagar • 2 mins ago</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
