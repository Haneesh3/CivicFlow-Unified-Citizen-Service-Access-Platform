import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../lib/store';
import { supabase } from '../../lib/supabase';
import { AlertCircle, FileText, MapPin, User } from 'lucide-react-native';

export default function DashboardScreen() {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchComplaints = async () => {
    try {
      const { data, error } = await supabase
        .from('Complaint')
        .select('*')
        .order('createdAt', { ascending: false })
        .limit(5);

      if (error) throw error;
      setComplaints(data || []);
    } catch (error) {
      console.error('Error fetching complaints:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchComplaints();
  };

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Namaste,</Text>
          <Text style={styles.userName}>{user?.name || 'Citizen'}</Text>
        </View>
        <TouchableOpacity onPress={logout} style={styles.profileBtn}>
          <User color="#003366" size={24} />
        </TouchableOpacity>
      </View>

      <View style={styles.quickActions}>
        <TouchableOpacity 
          style={[styles.actionCard, { backgroundColor: '#003366' }]}
          onPress={() => router.push('/report')}
        >
          <AlertCircle color="#fff" size={32} />
          <Text style={styles.actionText}>Report Issue</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.actionCard, { backgroundColor: '#FF9933' }]}
          onPress={() => router.push('/(tabs)/index')}
        >
          <FileText color="#fff" size={32} />
          <Text style={styles.actionText}>My Issues</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Civic Issues</Text>
          <TouchableOpacity>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator color="#003366" style={{ marginTop: 20 }} />
        ) : complaints.length > 0 ? (
          complaints.map((item) => (
            <View key={item.id} style={styles.issueCard}>
              <View style={styles.issueInfo}>
                <Text style={styles.issueCategory}>{item.category}</Text>
                <Text style={styles.issueTitle}>{item.title}</Text>
                <View style={styles.location}>
                  <MapPin color="#666" size={14} />
                  <Text style={styles.locationText}>{item.address || 'Unknown Location'}</Text>
                </View>
              </View>
              <View style={styles.statusBadge}>
                <Text style={styles.statusText}>{item.status}</Text>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>No recent issues reported.</Text>
        )}
      </View>

      <View style={styles.infoBanner}>
        <Text style={styles.bannerTitle}>Did you know?</Text>
        <Text style={styles.bannerText}>
          You can track your PAN and Aadhaar status directly from the Services tab.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: 24,
    paddingTop: 60,
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 16,
    color: '#666',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#003366',
  },
  profileBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f0f4f8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActions: {
    flexDirection: 'row',
    padding: 20,
    gap: 16,
  },
  actionCard: {
    flex: 1,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  actionText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  section: {
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  seeAll: {
    color: '#003366',
    fontWeight: '600',
  },
  issueCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: '#FF9933',
    marginBottom: 12,
  },
  issueInfo: {
    flex: 1,
  },
  issueCategory: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  issueTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  location: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  locationText: {
    fontSize: 12,
    color: '#666',
  },
  statusBadge: {
    backgroundColor: '#e6f0ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    color: '#003366',
    fontWeight: '600',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    color: '#666',
    fontStyle: 'italic',
  },
  infoBanner: {
    margin: 20,
    padding: 20,
    backgroundColor: '#e6f0ff',
    borderRadius: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#003366',
  },
  bannerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#003366',
    marginBottom: 4,
  },
  bannerText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
});
