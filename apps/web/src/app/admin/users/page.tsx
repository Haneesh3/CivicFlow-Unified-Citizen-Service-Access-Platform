'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  ShieldAlert as ShieldIcon
} from 'lucide-react';

export default function AdminUsersDashboard() {
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuthStore();

  const { data: users, isLoading, refetch } = useQuery({
    queryKey: ['admin-users-list'],
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
      queryClient.invalidateQueries({ queryKey: ['admin-users-list'] });
      refetch();
    }
  });

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

  if (currentUser?.role !== 'SUPER_ADMIN') {
    return (
      <div className="flex h-full items-center justify-center p-8 text-center">
        <div className="max-w-md space-y-4">
          <ShieldAlert className="w-16 h-16 text-rose-600 mx-auto" />
          <h1 className="text-2xl font-bold text-slate-900">Access Denied</h1>
          <p className="text-slate-500">Only Super Administrators have permission to manage roles and grant administrator access.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Super Admin Portal: Access Control</h1>
        <p className="text-sm text-slate-500 mt-1">Delegate administrator access, revoke staff permissions, and audit registered users.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-slate-900 shadow-sm bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Total Users</CardTitle>
            <Users className="w-4 h-4 text-slate-950" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-slate-900">{totalUsers}</div>
            <p className="text-xs text-slate-500 mt-1">Registered accounts</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-600 shadow-sm bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Administrators</CardTitle>
            <UserCheck className="w-4 h-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-slate-900">{adminCount}</div>
            <p className="text-xs text-slate-500 mt-1">Authorized officers</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-rose-600 shadow-sm bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Super Admins</CardTitle>
            <ShieldIcon className="w-4 h-4 text-rose-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-slate-900">{superAdminCount}</div>
            <p className="text-xs text-slate-500 mt-1">Full system control</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-600 shadow-sm bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Citizens</CardTitle>
            <Users className="w-4 h-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-slate-900">{citizenCount}</div>
            <p className="text-xs text-slate-500 mt-1">Public profiles</p>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card className="shadow-sm border border-slate-100 bg-white">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-slate-900">User Access Management</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>City</TableHead>
                <TableHead>Current Role</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-slate-500">
                    Loading users list...
                  </TableCell>
                </TableRow>
              ) : !users || users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-slate-500">
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
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-slate-600 text-sm">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          {item.phone || '-'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-slate-600 text-sm">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          {item.city || '-'}
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
  );
}
