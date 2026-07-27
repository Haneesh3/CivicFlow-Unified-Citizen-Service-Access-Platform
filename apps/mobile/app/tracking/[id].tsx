import React from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, SafeAreaView, Platform, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, CheckCircle2, Clock, MapPin, FileText, Download, Bell } from 'lucide-react-native';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { LinearGradient } from 'expo-linear-gradient';

export default function TrackingDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const { data: applications, isLoading } = useQuery({
    queryKey: ['applications'],
    queryFn: async () => {
      const response = await api.get('/services/applications/me');
      return response.data;
    },
  });

  const app = applications?.find((a: any) => a.id === id);

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: '#F8FAFC' }]}>
        <ActivityIndicator size="large" color="#050A44" />
      </View>
    );
  }

  if (!app) {
    return (
      <View style={styles.center}>
        <Text>Application not found</Text>
      </View>
    );
  }

  const updates = app.updates || [];

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#050A44', '#0A1A7F']} style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft color="#fff" size={24} />
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>Tracking Details</Text>
          <Text style={styles.headerSub}>Ref: {app.referenceId}</Text>
        </View>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <View style={styles.iconBox}>
              <FileText color="#050A44" size={24} />
            </View>
            <View style={styles.summaryInfo}>
              <Text style={styles.serviceName}>{app.data?.subService || 'Service'}</Text>
              <Text style={styles.serviceCategory}>{app.data?.serviceTitle}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: '#10B98115' }]}>
              <Text style={[styles.statusText, { color: '#10B981' }]}>{app.status}</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Center</Text>
              <Text style={styles.detailValue}>{app.data?.centerName || 'Main Center'}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Appointment</Text>
              <Text style={styles.detailValue}>{app.appointmentDate ? new Date(app.appointmentDate).toLocaleDateString() : 'N/A'}</Text>
            </View>
          </View>
        </View>

        <Text style={styles.timelineTitle}>Application Timeline</Text>

        {/* Timeline */}
        <View style={styles.timelineContainer}>
          {updates.map((update: any, index: number) => (
            <View key={update.id} style={styles.timelineItem}>
              <View style={styles.timelineLeft}>
                <View style={[styles.timelineDot, index === 0 && styles.activeDot]}>
                  {index === 0 && <View style={styles.dotPulse} />}
                </View>
                {index < updates.length - 1 && <View style={styles.timelineLine} />}
              </View>
              
              <View style={styles.timelineRight}>
                <View style={styles.updateHeader}>
                  <Text style={[styles.updateStatus, index === 0 && styles.activeStatus]}>{update.status}</Text>
                  <Text style={styles.updateTime}>{new Date(update.createdAt).toLocaleDateString()} {new Date(update.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                </View>
                <Text style={styles.updateMessage}>{update.message}</Text>
                
                {update.status === 'COMPLETED' && (
                  <TouchableOpacity style={styles.downloadBtn}>
                    <Download color="#fff" size={16} style={{ marginRight: 8 }} />
                    <Text style={styles.downloadText}>Download Digital Copy</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))}
        </View>

        {/* Support Section */}
        <TouchableOpacity style={styles.supportCard}>
          <Bell color="#F97316" size={20} />
          <Text style={styles.supportText}>Get notifications for next updates</Text>
          <ChevronLeft color="#CBD5E1" size={20} style={{ transform: [{ rotate: '180deg' }] }} />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    padding: 24,
    paddingTop: Platform.OS === 'ios' ? 20 : 60,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  headerTitleWrap: { flex: 1 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  content: { padding: 20 },
  summaryCard: { backgroundColor: '#fff', borderRadius: 24, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 3, marginBottom: 24 },
  summaryHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  iconBox: { width: 56, height: 56, borderRadius: 16, backgroundColor: '#F0F7FF', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  summaryInfo: { flex: 1 },
  serviceName: { fontSize: 18, fontWeight: 'bold', color: '#050A44' },
  serviceCategory: { fontSize: 12, color: '#94A3B8', marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  statusText: { fontSize: 10, fontWeight: 'bold' },
  detailRow: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 16 },
  detailItem: { flex: 1 },
  detailLabel: { fontSize: 11, color: '#94A3B8', fontWeight: 'bold', marginBottom: 4 },
  detailValue: { fontSize: 13, color: '#050A44', fontWeight: '600' },
  timelineTitle: { fontSize: 16, fontWeight: 'bold', color: '#050A44', marginBottom: 20 },
  timelineContainer: { paddingLeft: 10 },
  timelineItem: { flexDirection: 'row', marginBottom: 30 },
  timelineLeft: { alignItems: 'center', marginRight: 20 },
  timelineDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#CBD5E1', zIndex: 1 },
  activeDot: { backgroundColor: '#10B981' },
  dotPulse: { position: 'absolute', width: 20, height: 20, borderRadius: 10, backgroundColor: '#10B981', opacity: 0.2, top: -4, left: -4 },
  timelineLine: { position: 'absolute', top: 12, bottom: -30, width: 2, backgroundColor: '#F1F5F9' },
  timelineRight: { flex: 1 },
  updateHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  updateStatus: { fontSize: 14, fontWeight: 'bold', color: '#64748B' },
  activeStatus: { color: '#050A44' },
  updateTime: { fontSize: 11, color: '#94A3B8' },
  updateMessage: { fontSize: 13, color: '#64748B', lineHeight: 20 },
  downloadBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#050A44', alignSelf: 'flex-start', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, marginTop: 12 },
  downloadText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  supportCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF7ED', padding: 16, borderRadius: 16, marginTop: 10, gap: 12 },
  supportText: { flex: 1, fontSize: 13, color: '#050A44', fontWeight: '600' },
});
