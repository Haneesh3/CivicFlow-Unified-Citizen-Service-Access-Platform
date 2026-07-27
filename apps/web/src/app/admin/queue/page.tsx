'use client';

import React, { useState } from 'react';
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
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, Filter, CheckCircle2, RotateCcw, MessageSquare, MapPin } from 'lucide-react';
import { format } from 'date-fns';

export default function ComplaintQueue() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const queryClient = useQueryClient();

  const { data: complaints, isLoading } = useQuery({
    queryKey: ['complaints'],
    queryFn: async () => {
      const response = await api.get('/complaints');
      return response.data;
    },
  });

  const filteredComplaints = complaints?.filter((c: any) => {
    const matchesSearch = (c.title || '').toLowerCase().includes(search.toLowerCase()) || (c.id || '').toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const updateComplaintStatus = useMutation({
    mutationFn: async ({ id, status, comment }: { id: string; status: string; comment?: string }) => {
      const response = await api.patch(`/complaints/${id}`, { status, comment });
      return response.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['complaints'] }),
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SUBMITTED': return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-none">Submitted</Badge>;
      case 'ASSIGNED': return <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100 border-none">Assigned</Badge>;
      case 'IN_PROGRESS': return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-none">In Progress</Badge>;
      case 'RESOLVED': return <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none">Resolved</Badge>;
      case 'REOPENED': return <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-100 border-none">Reopened</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Issue Resolution Queue</h1>
          <p className="text-slate-500 text-sm">Manage and track citizen reports across all departments</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          Export Report
        </Button>
      </div>

      <div className="flex gap-4 items-center bg-white p-4 rounded-lg shadow-sm border">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input 
            placeholder="Search by issue ID or title..." 
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-500" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Status Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="SUBMITTED">Submitted</SelectItem>
              <SelectItem value="ASSIGNED">Assigned</SelectItem>
              <SelectItem value="RESOLVED">Resolved</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead className="w-[120px]">Issue ID</TableHead>
              <TableHead>Title & Category</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Reported On</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10">Loading complaints...</TableCell>
              </TableRow>
            ) : filteredComplaints?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10 text-slate-500">No issues found matching filters.</TableCell>
              </TableRow>
            ) : (
              filteredComplaints?.map((c: any) => (
                <TableRow key={c.id} className="hover:bg-slate-50">
                  <TableCell className="font-mono text-xs text-slate-500">
                    {c.id.substring(0, 8)}...
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium text-slate-900">{c.title}</span>
                      <span className="text-xs text-slate-500">{c.category}</span>
                      {c.status === 'REOPENED' && (() => {
                        const reopenUpdate = c.updates?.find((u: any) => u.status === 'REOPENED');
                        const reopenComment = reopenUpdate?.comment || 'Citizen reopened the ticket.';
                        return (
                          <div className="mt-1.5 text-xs text-rose-700 bg-rose-50 border border-rose-100 rounded-lg p-2 font-medium max-w-[320px]">
                            <strong>Reopen Reason:</strong> &quot;{reopenComment}&quot;
                          </div>
                        );
                      })()}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm text-slate-600">
                      <MapPin className="w-3 h-3" />
                      {c.address || 'Unknown Location'}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-slate-600">
                    {format(new Date(c.createdAt), 'MMM dd, HH:mm')}
                  </TableCell>
                  <TableCell>{getStatusBadge(c.status)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" className="h-8 px-3" onClick={() => updateComplaintStatus.mutate({ id: c.id, status: 'IN_PROGRESS', comment: 'Assigned to government team' })}>
                        <MessageSquare className="mr-2 h-4 w-4" /> Work
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 px-3" onClick={() => updateComplaintStatus.mutate({ id: c.id, status: 'RESOLVED', comment: 'Issue cleared by government team' })}>
                        <CheckCircle2 className="mr-2 h-4 w-4" /> Close
                      </Button>
                      {c.status === 'RESOLVED' && (
                        <Button variant="ghost" size="sm" className="h-8 px-3" onClick={() => updateComplaintStatus.mutate({ id: c.id, status: 'REOPENED', comment: 'Reopened by government review' })}>
                          <RotateCcw className="mr-2 h-4 w-4" /> Reopen
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
