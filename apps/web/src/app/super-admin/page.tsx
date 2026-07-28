'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/lib/store';
import { 
  ShieldAlert, 
  UserCheck, 
  UserX, 
  Users, 
  Mail, 
  Phone, 
  MapPin,
  ShieldAlert as ShieldIcon,
  Plus,
  UserPlus,
  Lock,
  Building
} from 'lucide-react';

export default function SuperAdminUsersDashboard() {
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuthStore();

  // Create Admin Form State
  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminPhone, setNewAdminPhone] = useState('');
  const [newAdminCity, setNewAdminCity] = useState('');
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState(false);

  const { data: users, isLoading, refetch } = useQuery({
    queryKey: ['super-admin-users-list'],
    queryFn: async () => {
      const response = await api.get('/users/all');
      return response.data || [];
    }
  });

  const changeRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const response = await api.patch(`/users/${userId}/role`, { role });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['super-admin-users-list'] });
      refetch();
    }
  });

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);
    setCreateError(null);
    setCreateSuccess(false);

    try {
      await api.post('/users/create-admin', {
        name: newAdminName,
        email: newAdminEmail,
        phone: newAdminPhone || undefined,
        city: newAdminCity || undefined
      });

      setCreateSuccess(true);
      setNewAdminName('');
      setNewAdminEmail('');
      setNewAdminPhone('');
      setNewAdminCity('');
      queryClient.invalidateQueries({ queryKey: ['super-admin-users-list'] });
      refetch();
    } catch (err: any) {
      setCreateError(err.response?.data?.message || err.message || 'Failed to create administrator account.');
    } finally {
      setCreateLoading(false);
    }
  };

  // Calculate statistics
  const totalUsers = users?.length || 0;
  const adminCount = users?.filter((u: any) => u.role === 'ADMIN').length || 0;
  const superAdminCount = users?.filter((u: any) => u.role === 'SUPER_ADMIN').length || 0;
  const citizenCount = users?.filter((u: any) => u.role === 'CITIZEN').length || 0;

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-none font-semibold">Super Admin</Badge>;
      case 'ADMIN':
        return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-none font-semibold">Administrator</Badge>;
      case 'CITIZEN':
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none font-semibold">Citizen</Badge>;
      default:
        return <Badge variant="outline">{role}</Badge>;
    }
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Super Admin Portal: Access Control</h1>
        <p className="text-sm text-slate-500 mt-1">Delegate administrator access, revoke staff permissions, and audit registered users.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-slate-950 shadow-sm bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Total Users</CardTitle>
            <Users className="w-4 h-4 text-slate-950" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{totalUsers}</div>
            <p className="text-xs text-slate-500 mt-1">Registered accounts</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-600 shadow-sm bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Administrators</CardTitle>
            <UserCheck className="w-4 h-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{adminCount}</div>
            <p className="text-xs text-slate-500 mt-1">Authorized officers</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-rose-600 shadow-sm bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Super Admins</CardTitle>
            <ShieldIcon className="w-4 h-4 text-rose-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{superAdminCount}</div>
            <p className="text-xs text-slate-500 mt-1">Full system control</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-600 shadow-sm bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Citizens</CardTitle>
            <Users className="w-4 h-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{citizenCount}</div>
            <p className="text-xs text-slate-500 mt-1">Public profiles</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Create Administrator Card Form */}
        <Card className="lg:col-span-1 shadow-sm border border-slate-100 bg-white self-start">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-slate-900">Add Administrator</CardTitle>
            <CardDescription>Create a new officer profile. Default password will be set to <b className="text-rose-600">user123user</b>.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateAdmin} className="space-y-4">
              {createError && (
                <div className="bg-red-50 border border-red-100 p-3.5 rounded-xl text-red-600 text-xs font-semibold">
                  {createError}
                </div>
              )}
              {createSuccess && (
                <div className="bg-green-50 border border-green-100 p-3.5 rounded-xl text-green-700 text-xs font-semibold">
                  Administrator account created successfully!
                </div>
              )}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Full Name</label>
                <div className="relative">
                  <UserPlus className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="E.g., Rajesh Kumar"
                    value={newAdminName}
                    onChange={(e) => setNewAdminName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-600 focus:bg-white"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    placeholder="rajesh.kumar@gov.in"
                    value={newAdminEmail}
                    onChange={(e) => setNewAdminEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-600 focus:bg-white"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="tel"
                    placeholder="E.g., +919876543210"
                    value={newAdminPhone}
                    onChange={(e) => setNewAdminPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-600 focus:bg-white"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Assigned City</label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="E.g., New Delhi"
                    value={newAdminCity}
                    onChange={(e) => setNewAdminCity(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-600 focus:bg-white"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={createLoading}
                className="w-full bg-rose-600 text-white font-bold py-3 hover:bg-rose-700 disabled:opacity-50 mt-4 rounded-xl flex items-center justify-center gap-2"
              >
                {createLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    <Plus className="w-4 h-4" /> Create Admin
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Users Table Card */}
        <Card className="lg:col-span-2 shadow-sm border border-slate-100 bg-white">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-slate-900">User Access Control</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Current Role</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-10 text-slate-500">
                      Loading users list...
                    </TableCell>
                  </TableRow>
                ) : !users || users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-10 text-slate-500">
                      No users registered in the database.
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((item: any) => {
                    const isSelf = item.id === currentUser?.id;
                    return (
                      <TableRow key={item.id} className={isSelf ? "bg-slate-50/50" : ""}>
                        <TableCell className="font-semibold text-slate-900">
                          {item.name} {isSelf && <span className="text-[10px] text-zinc-400 font-normal">(You)</span>}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5 text-slate-600 text-sm">
                            <Mail className="w-3.5 h-3.5 text-slate-400" />
                            {item.email || '-'}
                          </div>
                        </TableCell>
                        <TableCell>{getRoleBadge(item.role)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {isSelf || item.role === 'SUPER_ADMIN' ? (
                              <span className="text-xs text-slate-400 italic pr-4">Restricted</span>
                            ) : (
                              <>
                                {item.role === 'CITIZEN' && (
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-8 px-2.5 text-blue-600 hover:text-blue-700 font-bold text-xs" 
                                    onClick={() => changeRoleMutation.mutate({ userId: item.id, role: 'ADMIN' })}
                                  >
                                    <UserCheck className="mr-1 h-3.5 w-3.5" /> Make Admin
                                  </Button>
                                )}
                                {item.role === 'ADMIN' && (
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-8 px-2.5 text-rose-600 hover:text-rose-700 font-bold text-xs" 
                                    onClick={() => changeRoleMutation.mutate({ userId: item.id, role: 'CITIZEN' })}
                                  >
                                    <UserX className="mr-1 h-3.5 w-3.5" /> Revoke Admin
                                  </Button>
                                )}
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        
      </div>
    </div>
  );
}
