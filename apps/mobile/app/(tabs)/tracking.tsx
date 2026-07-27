import React, { useState, useCallback } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, SafeAreaView, Dimensions, RefreshControl, ActivityIndicator } from 'react-native';
import { Activity, ClipboardList, Clock, ChevronRight, Search, FileText, CheckCircle2, AlertCircle } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useRouter, useFocusEffect } from 'expo-router';

const { width } = Dimensions.get('window');

export default function TrackingScreen() {
  const router = useRouter();
  
  const { data: applications, isLoading, refetch } = useQuery({
    queryKey: ['applications'],
    queryFn: async () => {
      const response = await api.get('/services/applications/me');
      return response.data;
    },
  });

  // Refetch when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [])
  );

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'SUBMITTED': return '#F97316';
      case 'UNDER_REVIEW': return '#3B82F6';
      case 'APPROVED': return '#10B981';
      case 'COMPLETED': return '#10B981';
      case 'REJECTED': return '#EF4444';
      default: return '#64748B';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Application Tracking</Text>
          <Text style={styles.headerSub}>Monitor your service status</Text>
        </View>
        <TouchableOpacity style={styles.newBookingBtn} onPress={() => router.push('/(tabs)/explore')}>
          <Text style={styles.newBookingText}>New Booking +</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
      >
        {/* Notice Card */}
        <LinearGradient colors={['#F97316', '#FB923C']} style={styles.noticeCard}>
          <View style={styles.noticeIcon}>
            <Clock color="#F97316" size={20} />
          </View>
          <View style={styles.noticeContent}>
            <Text style={styles.noticeTitle}>Recent Update</Text>
            <Text style={styles.noticeSub}>Ensure you carry original documents to the center for verification.</Text>
          </View>
        </LinearGradient>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statVal}>{applications?.filter((a: any) => a.status !== 'COMPLETED' && a.status !== 'REJECTED').length || 0}</Text>
            <Text style={styles.statLabel}>ACTIVE</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statVal}>{applications?.filter((a: any) => a.status === 'COMPLETED').length || 0}</Text>
            <Text style={styles.statLabel}>COMPLETED</Text>
          </View>
        </View>

        {/* List Section */}
        <View style={styles.listSection}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <View style={styles.sectionIcon}>
                <ClipboardList color="#fff" size={16} />
              </View>
              <Text style={styles.sectionTitle}>My Applications</Text>
            </View>
          </View>

          {isLoading ? (
            <ActivityIndicator color="#050A44" style={{ marginTop: 40 }} />
          ) : applications && applications.length > 0 ? (
            applications.map((app: any) => (
              <TouchableOpacity 
                key={app.id} 
                style={styles.appCard}
                onPress={() => router.push(`/tracking/${app.id}`)}
              >
                <View style={styles.appCardMain}>
                  <View style={styles.appIconBox}>
                    <FileText color="#050A44" size={20} />
                  </View>
                  <View style={styles.appInfo}>
                    <Text style={styles.appTitle}>{app.data?.subService || 'Service Application'}</Text>
                    <Text style={styles.appSub}>{app.referenceId}</Text>
                    
                    <View style={styles.appMeta}>
                      <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(app.status)}15` }]}>
                        <View style={[styles.statusDot, { backgroundColor: getStatusColor(app.status) }]} />
                        <Text style={[styles.statusText, { color: getStatusColor(app.status) }]}>{app.status}</Text>
                      </View>
                      <Text style={styles.dateText}>
                        {app.appointmentDate ? new Date(app.appointmentDate).toLocaleDateString() : 'N/A'}
                      </Text>
                    </View>
                  </View>
                  <ChevronRight color="#CBD5E1" size={20} />
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIcon}>
                <FileText color="#CBD5E1" size={48} />
              </View>
              <Text style={styles.emptyTitle}>No Active Applications</Text>
              <Text style={styles.emptySub}>You haven't submitted any service applications yet. Visit the Services tab to start.</Text>
              
              <TouchableOpacity style={styles.exploreBtn} onPress={() => router.push('/(tabs)/explore')}>
                <Search color="#050A44" size={18} style={{ marginRight: 8 }} />
                <Text style={styles.exploreBtnText}>Explore Services</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Quick Support */}
        <View style={styles.supportCard}>
          <View style={styles.supportLeft}>
            <View style={styles.supportIcon}>
              <CheckCircle2 color="#050A44" size={20} />
            </View>
            <View>
              <Text style={styles.supportTitle}>Tracking Help</Text>
              <Text style={styles.supportSub}>NEED ASSISTANCE? CALL 1031</Text>
            </View>
          </View>
          <ChevronRight color="#CBD5E1" size={20} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    padding: 24,
    paddingTop: 40,
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#050A44' },
  headerSub: { fontSize: 13, color: '#94A3B8', marginTop: 2 },
  newBookingBtn: { backgroundColor: '#F0F7FF', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  newBookingText: { color: '#050A44', fontSize: 12, fontWeight: 'bold' },
  scrollContent: { padding: 20, gap: 20 },
  noticeCard: { padding: 16, borderRadius: 20, flexDirection: 'row', gap: 16, alignItems: 'center' },
  noticeIcon: { width: 40, height: 40, backgroundColor: '#fff', borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  noticeContent: { flex: 1 },
  noticeTitle: { fontSize: 16, fontWeight: 'bold', color: '#fff' },
  noticeSub: { fontSize: 12, color: 'rgba(255,255,255,0.9)', marginTop: 2, lineHeight: 18 },
  statsRow: { flexDirection: 'row', gap: 16 },
  statCard: { flex: 1, backgroundColor: '#fff', borderRadius: 20, padding: 20, alignItems: 'center', borderWidth: 1, borderColor: '#F1F5F9' },
  statVal: { fontSize: 24, fontWeight: 'bold', color: '#050A44' },
  statLabel: { fontSize: 10, fontWeight: 'bold', color: '#94A3B8', letterSpacing: 1, marginTop: 4 },
  listSection: { backgroundColor: '#fff', borderRadius: 24, padding: 20, minHeight: 300, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 3 },
  sectionHeader: { marginBottom: 20 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sectionIcon: { width: 28, height: 28, backgroundColor: '#050A44', borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#050A44' },
  appCard: { paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  appCardMain: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  appIconBox: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center' },
  appInfo: { flex: 1 },
  appTitle: { fontSize: 15, fontWeight: 'bold', color: '#050A44' },
  appSub: { fontSize: 11, color: '#94A3B8', marginTop: 2 },
  appMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, gap: 6 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 10, fontWeight: 'bold', letterSpacing: 0.5 },
  dateText: { fontSize: 11, color: '#64748B' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 40 },
  emptyIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#050A44' },
  emptySub: { fontSize: 14, color: '#94A3B8', textAlign: 'center', marginTop: 8, lineHeight: 22, marginBottom: 24 },
  exploreBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0F7FF', paddingHorizontal: 24, paddingVertical: 14, borderRadius: 14 },
  exploreBtnText: { color: '#050A44', fontWeight: 'bold', fontSize: 15 },
  supportCard: { backgroundColor: '#fff', borderRadius: 20, padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#F1F5F9' },
  supportLeft: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  supportIcon: { width: 44, height: 44, backgroundColor: '#F0F7FF', borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  supportTitle: { fontSize: 15, fontWeight: 'bold', color: '#050A44' },
  supportSub: { fontSize: 11, color: '#94A3B8', fontWeight: '700', marginTop: 2 },
});
