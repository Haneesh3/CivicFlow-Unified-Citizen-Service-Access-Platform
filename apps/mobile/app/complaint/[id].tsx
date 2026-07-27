import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, TextInput, SafeAreaView, Platform, ActivityIndicator, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, CheckCircle2, Clock, MapPin, Star, RotateCcw, AlertTriangle } from 'lucide-react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';

export default function ComplaintDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [rating, setRating] = useState(5);
  const [ratingComment, setRatingComment] = useState('');
  const [showReopenForm, setShowReopenForm] = useState(false);
  const [reopenComment, setReopenComment] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const { data: complaint, isLoading, refetch } = useQuery({
    queryKey: ['complaint', id],
    queryFn: async () => {
      const response = await api.get(`/complaints/${id}`);
      return response.data;
    },
    enabled: !!id
  });

  const submitFeedback = useMutation({
    mutationFn: async () => {
      const response = await api.patch(`/complaints/${id}`, {
        status: complaint.status,
        rating,
        ratingComment,
        comment: 'Citizen submitted feedback for completed work.'
      });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['complaint', id], data);
      Alert.alert('Success', 'Thank you for your feedback!');
    },
    onError: (err: any) => {
      Alert.alert('Error', err.response?.data?.message || err.message || 'Unable to submit feedback.');
    }
  });

  const submitReopen = useMutation({
    mutationFn: async () => {
      const response = await api.patch(`/complaints/${id}/reopen`, {
        comment: reopenComment
      });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['complaint', id], data);
      setShowReopenForm(false);
      setReopenComment('');
      Alert.alert('Ticket Reopened', 'The ticket has been sent back to the ward office.');
    },
    onError: (err: any) => {
      Alert.alert('Error', err.response?.data?.message || err.message || 'Unable to reopen ticket.');
    }
  });

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: '#F8FAFC' }]}>
        <ActivityIndicator size="large" color="#050A44" />
      </View>
    );
  }

  if (!complaint) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Complaint not found</Text>
      </View>
    );
  }

  const updates = complaint.updates || [];

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'SUBMITTED': return '#F97316';
      case 'IN_PROGRESS': return '#3B82F6';
      case 'RESOLVED': return '#10B981';
      case 'REOPENED': return '#EF4444';
      default: return '#64748B';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft color="#050A44" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Issue Progress</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Ticket Summary */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <View style={styles.summaryInfo}>
              <Text style={styles.label}>Ticket Details</Text>
              <Text style={styles.titleText}>{complaint.title}</Text>
              <Text style={styles.categoryText}>{complaint.category} • Reported on {new Date(complaint.createdAt).toLocaleDateString()}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(complaint.status)}15` }]}>
              <Text style={[styles.statusText, { color: getStatusColor(complaint.status) }]}>{complaint.status}</Text>
            </View>
          </View>

          {complaint.address && (
            <View style={styles.addressRow}>
              <MapPin size={16} color="#94A3B8" style={{ marginRight: 6 }} />
              <Text style={styles.addressText}>{complaint.address}</Text>
            </View>
          )}
        </View>

        {/* Timeline updates */}
        <Text style={styles.timelineTitle}>Resolution Progress</Text>
        <View style={styles.timelineContainer}>
          {updates.map((update: any, index: number) => (
            <View key={update.id} style={styles.timelineItem}>
              <View style={styles.timelineLeft}>
                <View style={[styles.timelineDot, index === 0 && styles.activeDot]} />
                {index < updates.length - 1 && <View style={styles.timelineLine} />}
              </View>
              <View style={styles.timelineRight}>
                <View style={styles.updateHeader}>
                  <Text style={[styles.updateStatus, index === 0 && styles.activeStatus]}>{update.status}</Text>
                  <Text style={styles.updateTime}>
                    {new Date(update.createdAt).toLocaleDateString()} {new Date(update.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
                <Text style={styles.updateMessage}>{update.comment}</Text>
              </View>
            </View>
          ))}

          {/* Seed initial timeline node if no updates exist */}
          {updates.length === 0 && (
            <View style={styles.timelineItem}>
              <View style={styles.timelineLeft}>
                <View style={[styles.timelineDot, styles.activeDot]} />
              </View>
              <View style={styles.timelineRight}>
                <View style={styles.updateHeader}>
                  <Text style={[styles.updateStatus, styles.activeStatus]}>SUBMITTED</Text>
                  <Text style={styles.updateTime}>{new Date(complaint.createdAt).toLocaleDateString()}</Text>
                </View>
                <Text style={styles.updateMessage}>Citizen reported the complaint.</Text>
              </View>
            </View>
          )}
        </View>

        {/* Reopen Form Comment Trigger */}
        {complaint.status === 'RESOLVED' && (
          <View style={styles.feedbackCard}>
            {showReopenForm ? (
              <View style={styles.reopenForm}>
                <Text style={styles.feedbackTitle}>Reopen Ticket</Text>
                <Text style={styles.feedbackSub}>Explain why this issue is not fully resolved.</Text>
                <TextInput
                  style={[styles.textarea, { borderColor: '#EF4444' }]}
                  multiline
                  numberOfLines={4}
                  value={reopenComment}
                  onChangeText={setReopenComment}
                  placeholder="Tell us what remains unresolved (e.g. Garbage only partially cleared)..."
                  placeholderTextColor="#94A3B8"
                />
                <View style={styles.btnGroup}>
                  <TouchableOpacity 
                    style={[styles.btn, styles.reopenBtnConfirm]}
                    disabled={submitReopen.isPending}
                    onPress={() => submitReopen.mutate()}
                  >
                    {submitReopen.isPending ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.btnTextConfirm}>Confirm Reopen</Text>}
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.btn, styles.reopenBtnCancel]}
                    onPress={() => { setShowReopenForm(false); setReopenComment(''); }}
                  >
                    <Text style={styles.btnTextCancel}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : complaint.rating ? (
              <View style={styles.reopenForm}>
                <View style={styles.headerRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.feedbackTitle}>Feedback Submitted</Text>
                    <Text style={styles.feedbackSub}>Thank you for helping us verify our work.</Text>
                  </View>
                  <TouchableOpacity style={styles.reopenBtn} onPress={() => setShowReopenForm(true)}>
                    <RotateCcw size={16} color="#EF4444" style={{ marginRight: 6 }} />
                    <Text style={styles.reopenBtnText}>Reopen</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.starRow}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} size={20} fill={star <= complaint.rating ? '#F59E0B' : 'transparent'} color={star <= complaint.rating ? '#F59E0B' : '#CBD5E1'} />
                  ))}
                </View>
                {complaint.ratingComment ? (
                  <View style={styles.ratingCommentBox}>
                    <Text style={styles.ratingCommentText}>&quot;{complaint.ratingComment}&quot;</Text>
                  </View>
                ) : null}
              </View>
            ) : (
              <View style={styles.reopenForm}>
                <View style={styles.headerRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.feedbackTitle}>Citizen Feedback</Text>
                    <Text style={styles.feedbackSub}>Rate the resolution and share a short note.</Text>
                  </View>
                  <TouchableOpacity style={styles.reopenBtn} onPress={() => setShowReopenForm(true)}>
                    <RotateCcw size={16} color="#EF4444" style={{ marginRight: 6 }} />
                    <Text style={styles.reopenBtnText}>Reopen</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.starRow}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <TouchableOpacity key={star} onPress={() => setRating(star)}>
                      <Star size={24} fill={star <= rating ? '#F59E0B' : 'transparent'} color={star <= rating ? '#F59E0B' : '#CBD5E1'} />
                    </TouchableOpacity>
                  ))}
                </View>
                <TextInput
                  style={styles.textarea}
                  multiline
                  numberOfLines={3}
                  value={ratingComment}
                  onChangeText={setRatingComment}
                  placeholder="Share your experience with the completed work..."
                  placeholderTextColor="#94A3B8"
                />
                <TouchableOpacity 
                  style={styles.submitBtn} 
                  disabled={submitFeedback.isPending}
                  onPress={() => submitFeedback.mutate()}
                >
                  {submitFeedback.isPending ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.submitBtnText}>Submit Feedback</Text>}
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { fontSize: 16, color: '#64748B', fontWeight: 'bold' },
  header: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 12 : 52,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#050A44' },
  content: { padding: 20 },
  summaryCard: { backgroundColor: '#fff', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: '#F1F5F9', marginBottom: 24 },
  summaryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  summaryInfo: { flex: 1, marginRight: 16 },
  label: { fontSize: 10, fontWeight: 'bold', color: '#F97316', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  titleText: { fontSize: 18, fontWeight: 'bold', color: '#050A44' },
  categoryText: { fontSize: 12, color: '#94A3B8', marginTop: 4 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  statusText: { fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' },
  addressRow: { flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 12 },
  addressText: { fontSize: 13, color: '#64748B', flex: 1 },
  timelineTitle: { fontSize: 12, fontWeight: 'bold', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16, marginLeft: 4 },
  timelineContainer: { paddingLeft: 12, marginBottom: 24 },
  timelineItem: { flexDirection: 'row', marginBottom: 24 },
  timelineLeft: { alignItems: 'center', marginRight: 16 },
  timelineDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#CBD5E1', zIndex: 1, marginTop: 4 },
  activeDot: { backgroundColor: '#10B981' },
  timelineLine: { position: 'absolute', top: 12, bottom: -28, width: 2, backgroundColor: '#E2E8F0' },
  timelineRight: { flex: 1 },
  updateHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  updateStatus: { fontSize: 13, fontWeight: 'bold', color: '#94A3B8' },
  activeStatus: { color: '#050A44' },
  updateTime: { fontSize: 11, color: '#94A3B8' },
  updateMessage: { fontSize: 13, color: '#64748B', lineHeight: 18 },
  feedbackCard: { backgroundColor: '#fff', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: '#F1F5F9', marginBottom: 40 },
  reopenForm: {},
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  feedbackTitle: { fontSize: 14, fontWeight: 'bold', color: '#050A44', textTransform: 'uppercase', letterSpacing: 0.5 },
  feedbackSub: { fontSize: 11, color: '#94A3B8', marginTop: 2 },
  reopenBtn: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#FECDD3', backgroundColor: '#FFF5F5', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  reopenBtnText: { fontSize: 12, color: '#EF4444', fontWeight: 'bold' },
  starRow: { flexDirection: 'row', gap: 6, marginBottom: 16 },
  textarea: { minHeight: 80, backgroundColor: '#F8FAFC', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', padding: 12, fontSize: 14, color: '#0F172A', textAlignVertical: 'top', marginBottom: 16 },
  submitBtn: { backgroundColor: '#050A44', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  submitBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  ratingCommentBox: { backgroundColor: '#F8FAFC', borderLeftWidth: 3, borderLeftColor: '#F59E0B', padding: 12, borderRadius: 8 },
  ratingCommentText: { fontSize: 13, color: '#64748B', fontStyle: 'italic' },
  btnGroup: { flexDirection: 'row', gap: 12 },
  btn: { flex: 1, borderRadius: 12, paddingVertical: 14, alignItems: 'center', justifyContent: 'center' },
  reopenBtnConfirm: { backgroundColor: '#EF4444' },
  reopenBtnCancel: { borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#fff' },
  btnTextConfirm: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  btnTextCancel: { color: '#64748B', fontWeight: 'bold', fontSize: 14 }
});
