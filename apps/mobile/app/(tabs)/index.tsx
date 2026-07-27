import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, SafeAreaView, Dimensions, Alert } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuthStore } from '../../lib/store';
import { api } from '../../lib/api';
import { AlertCircle, FileText, MapPin, User, Settings, Bell, ChevronRight, Info, CheckCircle2, Clock, Send, Phone } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as SecureStore from 'expo-secure-store';

const TRANSLATIONS = {
  en: {
    welcome: 'Welcome back,',
    heroSub: 'Your voice matters. Report civic issues directly to your municipal corporation.',
    reportBtn: 'Report an Issue',
    newAppBtn: '+ New Application',
    reports: 'REPORTS',
    resolved: 'RESOLVED',
    editProfile: 'Edit Profile',
    yourReports: 'Your Reports',
    activeBookings: 'active bookings',
    totalSubmissions: 'total submissions',
    serviceApps: 'Service Apps',
    recentCivicIssues: 'Recent Civic Issues',
    viewAll: 'View All',
    noticeTitle: 'Important Notice',
    noticeText: 'The Municipal Corporation will be conducting road repairs in South Delhi starting from next Monday.',
    readCircular: 'Read Circular',
    emergencyHelplines: '🚨 Emergency Quick Dial Helplines',
    emergencySub: 'ONE-TAP DIRECT CONNECT',
    policeDesc: 'National Emergency',
    childLineDesc: 'Child Helpline Support',
    womenDesc: 'Women Helpline Support',
    civicDesc: 'Citizen Civic Support Desk',
    logout: 'Logout',
    govText: 'GOVERNMENT OF INDIA',
    initiative: 'DIGITAL INDIA INITIATIVE',
    noRecentIssues: 'No recent issues found.'
  },
  hi: {
    welcome: 'स्वागत है,',
    heroSub: 'आपकी आवाज़ मायने रखती है। नागरिक समस्याओं की रिपोर्ट सीधे अपने नगर निगम को करें।',
    reportBtn: 'समस्या की रिपोर्ट करें',
    newAppBtn: '+ नया आवेदन',
    reports: 'रिपोर्टें',
    resolved: 'समाधान किया',
    editProfile: 'प्रोफाइल संपादित करें',
    yourReports: 'आपकी रिपोर्टें',
    activeBookings: 'सक्रिय बुकिंग',
    totalSubmissions: 'कुल सबमिशन',
    serviceApps: 'सेवा अनुप्रयोग',
    recentCivicIssues: 'हाल के नागरिक मुद्दे',
    viewAll: 'सभी देखें',
    noticeTitle: 'महत्वपूर्ण सूचना',
    noticeText: 'नगर निगम अगले सोमवार से दक्षिण दिल्ली में सड़कों की मरम्मत का काम शुरू करेगा।',
    readCircular: 'परिपत्र पढ़ें',
    emergencyHelplines: '🚨 आपातकालीन त्वरित डायल हेल्पलाइन',
    emergencySub: 'वन-टैप डायरेक्ट कनेक्ट',
    policeDesc: 'राष्ट्रीय आपातकाल',
    childLineDesc: 'चाइल्ड हेल्पलाइन सेवा',
    womenDesc: 'महिला हेल्पलाइन सेवा',
    civicDesc: 'नागरिक नागरिक सहायता डेस्क',
    logout: 'लॉगआउट',
    govText: 'भारत सरकार',
    initiative: 'डिजिटल इंडिया पहल',
    noRecentIssues: 'कोई हालिया समस्या नहीं मिली।'
  }
};

const { width } = Dimensions.get('window');

export default function DashboardScreen() {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lang, setLang] = useState<'en' | 'hi'>('en');
  const t = TRANSLATIONS[lang];

  useEffect(() => {
    // Load saved language on mount
    (async () => {
      try {
        const savedLang = await SecureStore.getItemAsync('language');
        if (savedLang === 'en' || savedLang === 'hi') {
          setLang(savedLang);
        }
      } catch (e) {
        console.error('Failed to load language setting', e);
      }
    })();
  }, []);

  const handleLangChange = async (newLang: 'en' | 'hi') => {
    setLang(newLang);
    try {
      await SecureStore.setItemAsync('language', newLang);
    } catch (e) {
      console.error('Failed to save language setting', e);
    }
  };

  const [stats, setStats] = useState({ reports: 0, applications: 0, resolved: 0 });
  const [drafts, setDrafts] = useState<any[]>([]);
  const [syncing, setSyncing] = useState(false);

  const loadDrafts = async () => {
    try {
      const draftsStr = await SecureStore.getItemAsync('offline_drafts');
      if (draftsStr) {
        setDrafts(JSON.parse(draftsStr));
      } else {
        setDrafts([]);
      }
    } catch (e) {
      console.error('Failed to load drafts:', e);
    }
  };

  useEffect(() => {
    loadDrafts();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadDrafts();
    }, [])
  );

  const handleSyncDrafts = async () => {
    if (drafts.length === 0) return;
    setSyncing(true);
    let successCount = 0;
    const remainingDrafts = [...drafts];

    try {
      for (const draft of drafts) {
        try {
          await api.post('/complaints', {
            title: draft.title,
            description: draft.description,
            category: draft.category,
            address: draft.address,
            latitude: draft.latitude,
            longitude: draft.longitude,
          });
          successCount++;
          // Remove from remaining queue
          const idx = remainingDrafts.findIndex((d) => d.id === draft.id);
          if (idx !== -1) {
            remainingDrafts.splice(idx, 1);
          }
        } catch (postErr) {
          console.error('Failed to sync draft:', postErr);
        }
      }

      await SecureStore.setItemAsync('offline_drafts', JSON.stringify(remainingDrafts));
      setDrafts(remainingDrafts);
      fetchData(); // Refresh list/stats

      if (successCount > 0) {
        Alert.alert('Sync Complete', `Successfully synced ${successCount} offline drafts to the server!`);
      } else {
        Alert.alert('Sync Failed', 'Could not sync drafts. Please check your internet connection.');
      }
    } catch (e) {
      console.error('Sync error:', e);
    } finally {
      setSyncing(false);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch Stats and Complaints
      const [reportsRes, appsRes] = await Promise.all([
        api.get('/complaints/me'),
        api.get('/services/applications/me')
      ]);

      const complaintsData = reportsRes.data;
      setComplaints(complaintsData.slice(0, 3) || []);

      setStats({
        reports: reportsRes.data.length,
        applications: appsRes.data.length,
        resolved: reportsRes.data.filter((c: any) => c.status === 'RESOLVED').length
      });

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const getInitials = (name: string) => {
    if (!name) return 'C';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <View style={styles.logoRow}>
          <View style={styles.logoIcon}>
            <Send color="#fff" size={14} />
          </View>
          <View>
            <Text style={styles.brandText}>CivicFlow</Text>
            <Text style={styles.govSubText}>{t.govText}</Text>
          </View>
        </View>
        <View style={styles.topActions}>
          <View style={styles.langPill}>
            <TouchableOpacity 
              onPress={() => handleLangChange('en')} 
              style={[styles.langBtn, lang === 'en' && styles.langBtnActive]}
            >
              <Text style={[styles.langBtnText, lang === 'en' && styles.langBtnTextActive]}>EN</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => handleLangChange('hi')} 
              style={[styles.langBtn, lang === 'hi' && styles.langBtnActive]}
            >
              <Text style={[styles.langBtnText, lang === 'hi' && styles.langBtnTextActive]}>हिंदी</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
            <Text style={styles.logoutText}>{t.logout}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {drafts.length > 0 && (
          <TouchableOpacity 
            style={styles.syncBanner} 
            onPress={handleSyncDrafts}
            disabled={syncing}
          >
            <View style={styles.syncIconWrap}>
              {syncing ? <ActivityIndicator size="small" color="#F97316" /> : <Clock color="#F97316" size={20} />}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.syncTitle}>Saved Drafts ({drafts.length})</Text>
              <Text style={styles.syncSub}>Tap to synchronize your offline complaints with the server.</Text>
            </View>
            <ChevronRight color="#F97316" size={20} style={{ transform: [{ rotate: '180deg' }] }} />
          </TouchableOpacity>
        )}

        {/* Main Section Row */}
        <View style={styles.heroRow}>
          {/* Hero Banner */}
          <LinearGradient
            colors={['#050A44', '#0A1A7F']}
            style={styles.heroCard}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{t.initiative}</Text>
            </View>
            <Text style={styles.heroTitle}>{t.welcome}{"\n"}<Text style={styles.heroName}>{user?.name?.split(' ')[0] || 'Citizen'}</Text></Text>
            <Text style={styles.heroSubtitle}>{t.heroSub}</Text>
            
            <View style={styles.heroActions}>
              <TouchableOpacity style={styles.reportBtn} onPress={() => router.push('/report')}>
                <Text style={styles.reportBtnText}>{t.reportBtn}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.appBtn} onPress={() => router.push('/explore')}>
                <Text style={styles.appBtnText}>{t.newAppBtn}</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>

          {/* Profile Card */}
          <View style={styles.profileCard}>
            <View style={styles.avatarContainer}>
              <Text style={styles.avatarText}>{getInitials(user?.name || 'Citizen')}</Text>
            </View>
            <Text style={styles.profileName}>{user?.name || 'Verified Citizen'}</Text>
            <Text style={styles.profileRole}>ID: {user?.id?.substring(0, 8).toUpperCase()}</Text>
            
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.reports}</Text>
                <Text style={styles.statLabel}>{t.reports}</Text>
              </View>
              <View style={[styles.statItem, styles.statBorder]}>
                <Text style={styles.statValue}>{stats.resolved}</Text>
                <Text style={styles.statLabel}>{t.resolved}</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.editBtn} onPress={() => router.push('/profile')}>
              <Settings color="#fff" size={16} />
              <Text style={styles.editBtnText}>{t.editProfile}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Stats Grid */}
        <View style={styles.statsGrid}>
          <TouchableOpacity style={styles.miniStatCard} onPress={() => router.push('/issues')}>
            <View style={[styles.statIconWrap, { backgroundColor: '#FFF7ED' }]}>
              <AlertCircle color="#F97316" size={20} />
            </View>
            <View>
              <Text style={styles.miniStatTitle}>{t.yourReports}</Text>
              <Text style={styles.miniStatSub}>{stats.reports} {t.totalSubmissions}</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.miniStatCard} onPress={() => router.push('/tracking')}>
            <View style={[styles.statIconWrap, { backgroundColor: '#F0FDF4' }]}>
              <FileText color="#10B981" size={20} />
            </View>
            <View>
              <Text style={styles.miniStatTitle}>{t.serviceApps}</Text>
              <Text style={styles.miniStatSub}>{stats.applications} {t.activeBookings}</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Recent Issues Section */}
        <View style={styles.sectionRow}>
          <View style={styles.issuesSection}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <View style={styles.sectionIcon}>
                  <Send color="#fff" size={14} />
                </View>
                <Text style={styles.sectionTitle}>{t.recentCivicIssues}</Text>
              </View>
              <TouchableOpacity onPress={() => router.push('/issues')}>
                <Text style={styles.viewAll}>{t.viewAll} <ChevronRight size={14} color="#F97316" /></Text>
              </TouchableOpacity>
            </View>

            {loading && complaints.length === 0 ? (
              <ActivityIndicator color="#050A44" style={{ marginVertical: 20 }} />
            ) : complaints.length > 0 ? (
              complaints.map((item) => (
                <TouchableOpacity 
                  key={item.id} 
                  style={styles.issueCard}
                  onPress={() => router.push(`/complaint/${item.id}` as any)}
                >
                  <View style={styles.issueIconBox}>
                    <MapPin color="#050A44" size={20} />
                  </View>
                  <View style={styles.issueContent}>
                    <Text style={styles.issueTitleText}>{item.title}</Text>
                    <Text style={styles.issueSubText}>{item.category} • {item.address || 'Location provided'}</Text>
                  </View>
                  <View style={styles.statusWrap}>
                    <View style={[styles.statusBadge, item.status === 'RESOLVED' && { backgroundColor: '#F0FDF4' }]}>
                      <Text style={[styles.statusText, item.status === 'RESOLVED' && { color: '#10B981' }]}>{item.status}</Text>
                    </View>
                    <Text style={styles.dateText}>{new Date(item.createdAt).toLocaleDateString()}</Text>
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyText}>{t.noRecentIssues}</Text>
              </View>
            )}
          </View>

          {/* Important Notice Card */}
          <View style={styles.noticeCard}>
            <View style={styles.noticeHeader}>
              <View style={styles.noticeIcon}>
                <Info color="#fff" size={20} />
              </View>
            </View>
            <Text style={styles.noticeTitle}>{t.noticeTitle}</Text>
            <Text style={styles.noticeText}>{t.noticeText}</Text>
            <TouchableOpacity style={styles.noticeBtn} onPress={() => Alert.alert('Information', 'Detailed circular will be available soon.')}>
              <Text style={styles.noticeBtnText}>{t.readCircular}</Text>
              <Send color="#050A44" size={14} style={{ transform: [{ rotate: '-45deg' }] }} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Emergency Quick Dial Grid */}
        <View style={styles.helplineSection}>
          <View style={styles.helplineHeader}>
            <Text style={styles.helplineTitle}>{t.emergencyHelplines}</Text>
            <Text style={styles.helplineSub}>{t.emergencySub}</Text>
          </View>

          <View style={styles.helplineGrid}>
            {/* Helpline 112 */}
            <TouchableOpacity 
              style={[styles.helpCardItem, { borderLeftColor: '#EF4444' }]} 
              onPress={() => Alert.alert('Emergency Dial', 'Dialing 112 National Emergency...')}
            >
              <View style={[styles.helpIconBox, { backgroundColor: '#FEE2E2' }]}>
                <AlertCircle color="#EF4444" size={20} />
              </View>
              <View style={styles.helpContent}>
                <Text style={styles.helpNumber}>112</Text>
                <Text style={styles.helpLabel}>{t.policeDesc}</Text>
              </View>
            </TouchableOpacity>

            {/* Child Line 1098 */}
            <TouchableOpacity 
              style={[styles.helpCardItem, { borderLeftColor: '#F97316' }]} 
              onPress={() => Alert.alert('Emergency Dial', 'Dialing 1098 Child Helpline...')}
            >
              <View style={[styles.helpIconBox, { backgroundColor: '#FFEDD5' }]}>
                <Info color="#F97316" size={20} />
              </View>
              <View style={styles.helpContent}>
                <Text style={styles.helpNumber}>1098</Text>
                <Text style={styles.helpLabel}>{t.childLineDesc}</Text>
              </View>
            </TouchableOpacity>

            {/* Women Helpline 1091 */}
            <TouchableOpacity 
              style={[styles.helpCardItem, { borderLeftColor: '#EC4899' }]} 
              onPress={() => Alert.alert('Emergency Dial', 'Dialing 1091 Women Helpline...')}
            >
              <View style={[styles.helpIconBox, { backgroundColor: '#FCE7F3' }]}>
                <User color="#EC4899" size={20} />
              </View>
              <View style={styles.helpContent}>
                <Text style={styles.helpNumber}>1091</Text>
                <Text style={styles.helpLabel}>{t.womenDesc}</Text>
              </View>
            </TouchableOpacity>

            {/* Citizen Civic Support 1031 */}
            <TouchableOpacity 
              style={[styles.helpCardItem, { borderLeftColor: '#3B82F6' }]} 
              onPress={() => Alert.alert('Helpline Dial', 'Dialing 1031 Citizen Support...')}
            >
              <View style={[styles.helpIconBox, { backgroundColor: '#DBEAFE' }]}>
                <CheckCircle2 color="#3B82F6" size={20} />
              </View>
              <View style={styles.helpContent}>
                <Text style={styles.helpNumber}>1031</Text>
                <Text style={styles.helpLabel}>{t.civicDesc}</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  topBar: {
    height: 70,
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoIcon: {
    width: 32,
    height: 32,
    backgroundColor: '#F97316',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  brandText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#050A44',
  },
  govSubText: {
    fontSize: 8,
    color: '#F97316',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  topActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
  },
  logoutText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  scrollContent: {
    padding: 20,
    gap: 20,
  },
  heroRow: {
    flexDirection: 'column',
    gap: 20,
  },
  heroCard: {
    padding: 24,
    borderRadius: 24,
    minHeight: 220,
    justifyContent: 'center',
  },
  badge: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    lineHeight: 34,
  },
  heroName: {
    color: '#F97316',
  },
  heroSubtitle: {
    color: '#94A3B8',
    fontSize: 14,
    marginTop: 12,
    lineHeight: 20,
  },
  heroActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  reportBtn: {
    backgroundColor: '#F97316',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  reportBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  appBtn: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  appBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  profileCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  avatarContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#050A44',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  profileName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#050A44',
  },
  profileRole: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    marginVertical: 20,
    width: '100%',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statBorder: {
    borderLeftWidth: 1,
    borderLeftColor: '#F1F5F9',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#050A44',
  },
  statLabel: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '700',
    marginTop: 4,
  },
  editBtn: {
    backgroundColor: '#050A44',
    width: '100%',
    paddingVertical: 14,
    borderRadius: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  editBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  statsGrid: {
    flexDirection: 'column',
    gap: 12,
  },
  miniStatCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  statIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  miniStatTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#050A44',
  },
  miniStatSub: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  sectionRow: {
    gap: 20,
  },
  issuesSection: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sectionIcon: {
    width: 28,
    height: 28,
    backgroundColor: '#050A44',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#050A44',
  },
  viewAll: {
    fontSize: 13,
    color: '#F97316',
    fontWeight: 'bold',
  },
  issueCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    gap: 16,
  },
  issueIconBox: {
    width: 44,
    height: 44,
    backgroundColor: '#F0F7FF',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  issueContent: {
    flex: 1,
  },
  issueTitleText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#050A44',
  },
  issueSubText: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 4,
  },
  statusWrap: {
    alignItems: 'flex-end',
    gap: 6,
  },
  statusBadge: {
    backgroundColor: '#FFF7ED',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#F97316',
  },
  dateText: {
    fontSize: 10,
    color: '#CBD5E1',
  },
  noticeCard: {
    backgroundColor: '#F97316',
    borderRadius: 24,
    padding: 24,
  },
  noticeHeader: {
    marginBottom: 16,
  },
  noticeIcon: {
    width: 40,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noticeTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  noticeText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 22,
    marginBottom: 20,
  },
  noticeBtn: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
  },
  noticeBtnText: {
    color: '#050A44',
    fontWeight: 'bold',
    fontSize: 14,
  },
  supportCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 40,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  supportLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  supportIcon: {
    width: 44,
    height: 44,
    backgroundColor: '#F0F7FF',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  supportTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#050A44',
  },
  supportSub: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
    marginTop: 2,
  },
  emptyBox: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    color: '#94A3B8',
    fontStyle: 'italic',
  },
  langPill: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    padding: 2,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  langBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  langBtnActive: {
    backgroundColor: '#050A44',
  },
  langBtnText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#64748B',
  },
  langBtnTextActive: {
    color: '#fff',
  },
  helplineSection: {
    marginBottom: 40,
    gap: 16,
  },
  helplineHeader: {
    flexDirection: 'column',
    gap: 4,
  },
  helplineTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#050A44',
  },
  helplineSub: {
    fontSize: 10,
    fontWeight: '700',
    color: '#F97316',
    letterSpacing: 0.5,
  },
  helplineGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  helpCardItem: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderLeftWidth: 4,
    width: (width - 52) / 2, // Dual column grid layout
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  helpIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  helpContent: {
    flex: 1,
  },
  helpNumber: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#050A44',
  },
  helpLabel: {
    fontSize: 9,
    color: '#94A3B8',
    fontWeight: '600',
    marginTop: 2,
  },
  syncBanner: {
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 10,
    backgroundColor: '#FFF7ED',
    borderColor: '#FFEDD5',
  },
  syncIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  syncTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#050A44',
  },
  syncSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
});
