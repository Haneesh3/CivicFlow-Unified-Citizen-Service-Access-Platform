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
import { 
  Briefcase, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Calendar, 
  User, 
  FileText,
  XCircle
} from 'lucide-react';

export default function AdminServicesQueue() {
  const queryClient = useQueryClient();

  const { data: applications, isLoading } = useQuery({
    queryKey: ['admin-services-applications'],
    queryFn: async () => {
      const response = await api.get('/services/applications/all');
      return response.data || [];
    }
  });

  const updateApplicationStatus = useMutation({
    mutationFn: async ({ id, status, comment }: { id: string; status: string; comment?: string }) => {
      const response = await api.patch(`/services/applications/${id}`, { status, comment });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-services-applications'] });
    }
  });

  // Calculate statistics
  const total = applications?.length || 0;
  const pending = applications?.filter((a: any) => a.status === 'SUBMITTED' || a.status === 'UNDER_REVIEW').length || 0;
  const ready = applications?.filter((a: any) => a.status === 'APPROVED').length || 0;
  const completed = applications?.filter((a: any) => a.status === 'COMPLETED').length || 0;
  const rejected = applications?.filter((a: any) => a.status === 'REJECTED').length || 0;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SUBMITTED':
      case 'UNDER_REVIEW':
        return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-none font-semibold">Verification Pending</Badge>;
      case 'APPROVED':
        return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-none font-semibold">Proceed Approved</Badge>;
      case 'COMPLETED':
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none font-semibold">Completed</Badge>;
      case 'REJECTED':
        return <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-100 border-none font-semibold">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Municipal & Digital Services Queue</h1>
        <p className="text-sm text-slate-500 mt-1">Review scheduled citizen appointments, verify documents, and update application processing states.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-amber-500 shadow-sm bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Verification Pending</CardTitle>
            <Clock className="w-4 h-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-slate-900">{pending}</div>
            <p className="text-xs text-slate-500 mt-1">Awaiting document checks</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-600 shadow-sm bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Ready for Pickup</CardTitle>
            <Briefcase className="w-4 h-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-slate-900">{ready}</div>
            <p className="text-xs text-slate-500 mt-1">Awaiting physical slot/delivery</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-600 shadow-sm bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Completed Services</CardTitle>
            <CheckCircle2 className="w-4 h-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-slate-900">{completed}</div>
            <p className="text-xs text-slate-500 mt-1">Certificates/Documents issued</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-rose-600 shadow-sm bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Rejected Applications</CardTitle>
            <AlertCircle className="w-4 h-4 text-rose-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-slate-900">{rejected}</div>
            <p className="text-xs text-slate-500 mt-1">Discrepancy in proof papers</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Applications Table Queue */}
      <Card className="shadow-sm border border-slate-100 bg-white">
        <CardHeader>
          <CardTitle className="text-lg font-bold">Active Applications Log</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead>Reference ID</TableHead>
                <TableHead>Citizen Name</TableHead>
                <TableHead>Service Title</TableHead>
                <TableHead>Appointment Date/Slot</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10">Loading service applications...</TableCell>
                </TableRow>
              ) : !applications || applications.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-slate-400">No service applications registered in queue.</TableCell>
                </TableRow>
              ) : (
                applications.map((app: any) => {
                  const clientName = app.user?.name || 'Supabase User';
                  const clientMail = app.user?.email || '';
                  const serviceName = app.data?.serviceTitle || app.service?.title || 'Public Service';
                  const subServiceName = app.data?.subService || '';

                  return (
                    <TableRow key={app.id} className="hover:bg-slate-50">
                      <TableCell className="font-semibold text-slate-900 font-mono text-sm">{app.referenceId}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium text-slate-800 flex items-center gap-1">
                            <User className="w-3.5 h-3.5 text-slate-400" />
                            {clientName}
                          </span>
                          <span className="text-xs text-slate-500">{clientMail}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium text-slate-800">{serviceName}</span>
                          {subServiceName && <span className="text-xs text-slate-500 font-medium">{subServiceName}</span>}
                        </div>
                      </TableCell>
                      <TableCell>
                        {app.appointmentDate ? (
                          <div className="flex flex-col text-sm text-slate-700">
                            <span className="flex items-center gap-1 font-medium">
                              <Calendar className="w-3.5 h-3.5 text-slate-400" />
                              {new Date(app.appointmentDate).toLocaleDateString()}
                            </span>
                            <span className="text-xs text-slate-500 font-semibold">{app.appointmentSlot || 'All Day'}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic">Online Self-Service</span>
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(app.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {(app.status === 'SUBMITTED' || app.status === 'UNDER_REVIEW') && (
                            <>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 px-2.5 text-blue-600 hover:text-blue-700 font-bold text-xs" 
                                onClick={() => updateApplicationStatus.mutate({ id: app.id, status: 'APPROVED', comment: 'Documents verified. Application approved to proceed.' })}
                              >
                                <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> Approve
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 px-2.5 text-rose-600 hover:text-rose-700 font-bold text-xs" 
                                onClick={() => updateApplicationStatus.mutate({ id: app.id, status: 'REJECTED', comment: 'Incorrect supporting papers uploaded.' })}
                              >
                                <XCircle className="mr-1 h-3.5 w-3.5" /> Reject
                              </Button>
                            </>
                          )}
                          {app.status === 'APPROVED' && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 px-2.5 text-green-600 hover:text-green-700 font-bold text-xs" 
                              onClick={() => updateApplicationStatus.mutate({ id: app.id, status: 'COMPLETED', comment: 'Service process finished. Certificates issued.' })}
                            >
                              <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> Complete
                            </Button>
                          )}
                          {(app.status === 'COMPLETED' || app.status === 'REJECTED') && (
                            <span className="text-xs text-slate-400 italic font-medium pr-4">Processed</span>
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
