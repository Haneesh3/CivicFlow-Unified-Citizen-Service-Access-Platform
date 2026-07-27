'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { 
  Star, 
  MessageSquare, 
  ThumbsUp, 
  User, 
  Calendar,
  FileText,
  MapPin
} from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

export default function CitizenResponse() {
  const { data: responses, isLoading } = useQuery({
    queryKey: ['admin-responses'],
    queryFn: async () => {
      const response = await api.get('/complaints');
      const complaints: any[] = response.data || [];
      
      // Filter complaints with user ratings
      const ratedComplaints = complaints.filter(
        c => c.rating !== null && c.rating !== undefined
      );

      // Calculations
      const totalReviews = ratedComplaints.length;
      
      const averageRating = totalReviews > 0 
        ? parseFloat((ratedComplaints.reduce((acc, curr) => acc + curr.rating, 0) / totalReviews).toFixed(1))
        : 0;

      const positiveReviews = ratedComplaints.filter(c => c.rating >= 4).length;
      const positivePercentage = totalReviews > 0 
        ? Math.round((positiveReviews / totalReviews) * 100) 
        : 0;

      // Distribution of stars
      const starDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
      ratedComplaints.forEach(c => {
        const r = c.rating as 5 | 4 | 3 | 2 | 1;
        if (starDistribution[r] !== undefined) {
          starDistribution[r] += 1;
        }
      });

      return {
        ratedComplaints,
        totalReviews,
        averageRating,
        positivePercentage,
        starDistribution
      };
    }
  });

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[500px]">
        <div className="w-12 h-12 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Citizen Response & Feedback</h1>
        <p className="text-sm text-slate-500 mt-1">Review ratings and satisfaction notes submitted by citizens for resolved issues.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-l-4 border-l-blue-600 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Average Rating</CardTitle>
            <Star className="w-4 h-4 text-blue-600 fill-blue-600" />
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900">{responses?.averageRating || 0}</span>
              <span className="text-sm text-slate-400 font-semibold">/ 5.0</span>
            </div>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star 
                  key={star} 
                  size={16} 
                  className={star <= (responses?.averageRating || 0) ? 'text-[#FF9933] fill-[#FF9933]' : 'text-zinc-200'} 
                />
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-600 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Positive Feedback</CardTitle>
            <ThumbsUp className="w-4 h-4 text-green-600" />
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-3xl font-black text-slate-900">{responses?.positivePercentage || 0}%</div>
            <p className="text-xs text-slate-500 font-medium">Ratings graded 4 stars or higher</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-600 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Total Reviews Received</CardTitle>
            <MessageSquare className="w-4 h-4 text-purple-600" />
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-3xl font-black text-slate-900">{responses?.totalReviews || 0}</div>
            <p className="text-xs text-slate-500 font-medium">Out of all resolved tickets</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Feedback List */}
      <Card className="shadow-sm border border-slate-100 bg-white">
        <CardHeader>
          <CardTitle className="text-lg font-bold">Feedback Operations log</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ticket ID</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Citizen Comment</TableHead>
                <TableHead>Date Resolved</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {responses?.ratedComplaints && responses.ratedComplaints.length > 0 ? (
                responses.ratedComplaints.map((c: any) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-semibold text-slate-900">{c.id.substring(0, 8)}...</TableCell>
                    <TableCell>{c.category}</TableCell>
                    <TableCell className="font-medium">{c.title}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star 
                            key={star} 
                            size={12} 
                            className={star <= c.rating ? 'text-[#FF9933] fill-[#FF9933]' : 'text-zinc-200'} 
                          />
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="italic text-slate-600 font-medium max-w-[280px] truncate">
                      {c.ratingComment ? `"${c.ratingComment}"` : 'No comment provided'}
                    </TableCell>
                    <TableCell className="text-slate-500 font-medium">
                      {new Date(c.updatedAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-slate-400">No citizen feedback submitted yet.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
