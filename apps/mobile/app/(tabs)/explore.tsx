import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, ActivityIndicator, TextInput, ScrollView, SafeAreaView, Dimensions, Alert } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../lib/store';
import { api } from '../../lib/api';
import { Search, ExternalLink, Shield, CreditCard, Plane, Building2, UserCheck, FileText, Briefcase, Zap, Heart, Users, ChevronRight, MessageSquare, Globe } from 'lucide-react-native';
import * as SecureStore from 'expo-secure-store';

const { width } = Dimensions.get('window');

const CATEGORIES = [
  { id: 'all', name: 'ALL' },
  { id: 'identity', name: 'IDENTITY' },
  { id: 'certificates', name: 'CERTIFICATES' },
  { id: 'property', name: 'PROPERTY' },
  { id: 'utilities', name: 'UTILITIES' },
  { id: 'transport', name: 'TRANSPORT' },
  { id: 'healthcare', name: 'HEALTHCARE' },
  { id: 'welfare', name: 'WELFARE' },
  { id: 'business', name: 'BUSINESS' },
  { id: 'digital governance', name: 'DIGITAL GOVERNANCE' },
];

const getIcon = (category: string) => {
  const cat = (category || '').toLowerCase();
  switch (cat) {
    case 'identity': return <UserCheck color="#050A44" size={24} />;
    case 'certificates': return <FileText color="#F97316" size={24} />;
    case 'finance': return <CreditCard color="#050A44" size={24} />;
    case 'travel': return <Plane color="#050A44" size={24} />;
    case 'welfare': return <Users color="#10B981" size={24} />;
    case 'utilities': return <Zap color="#3B82F6" size={24} />;
    case 'healthcare': return <Heart color="#EF4444" size={24} />;
    case 'business': return <Briefcase color="#8B5CF6" size={24} />;
    case 'digital governance': return <Globe color="#0EA5E9" size={24} />;
    default: return <Building2 color="#64748B" size={24} />;
  }
};

export default function ServicesScreen() {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const { user } = useAuthStore();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'services' | 'engage'>('services');
  const [votedOption, setVotedOption] = useState<string | null>(null);
  const [pollVotes, setPollVotes] = useState({ option1: 142, option2: 98, option3: 65 });

  useEffect(() => {
    (async () => {
      try {
        const savedVote = await SecureStore.getItemAsync('engage_poll_vote');
        if (savedVote) {
          setVotedOption(savedVote);
        }
      } catch (e) {
        console.error('Failed to load vote state:', e);
      }
    })();
  }, []);

  const handleVote = async (option: string) => {
    if (votedOption) return;
    try {
      setVotedOption(option);
      await SecureStore.setItemAsync('engage_poll_vote', option);
      setPollVotes((prev: any) => ({
        ...prev,
        [option]: prev[option] + 1
      }));
      Alert.alert('Vote Cast!', 'Thank you for participating in municipal policy-making.');
    } catch (e) {
      console.error('Failed to save vote:', e);
    }
  };

  const renderEngageHub = () => {
    const totalVotes = pollVotes.option1 + pollVotes.option2 + pollVotes.option3;
    const getPercent = (votes: number) => {
      if (totalVotes === 0) return '0%';
      return `${Math.round((votes / totalVotes) * 100)}%`;
    };

    const campaigns = [
      { id: '1', title: 'Ward 12 Waste Management Guideline', users: 240, desc: 'Drafting new guidelines for home waste segregation rules.' },
      { id: '2', title: 'Metro Phase 4 Extension Alignment', users: 189, desc: 'Public feedback on route layout options in South Delhi.' },
      { id: '3', title: 'Clean Yamuna Volunteering Campaign', users: 94, desc: 'Community cleanliness volunteering scheduling.' }
    ];

    return (
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.engageContainer}>
        {/* Interactive Poll Card */}
        <View style={styles.pollCard}>
          <Text style={styles.pollBadge}>🗳️ ACTIVE POLL</Text>
          <Text style={styles.pollQuestion}>Which local project should municipal corporate funding prioritize this quarter?</Text>
          
          <View style={styles.pollOptions}>
            {/* Option 1 */}
            <TouchableOpacity 
              disabled={!!votedOption}
              style={[styles.pollOptionBtn, votedOption === 'option1' && styles.pollOptionBtnVoted]}
              onPress={() => handleVote('option1')}
            >
              <View style={styles.pollOptionTextRow}>
                <Text style={styles.pollOptionLabel}>🌳 Green Parks & Playgrounds</Text>
                {!!votedOption && <Text style={styles.pollOptionPercent}>{getPercent(pollVotes.option1)}</Text>}
              </View>
              {!!votedOption && (
                <View style={styles.pollProgressBg}>
                  <View style={[styles.pollProgressFill, { width: getPercent(pollVotes.option1) as any, backgroundColor: '#10B981' }]} />
                </View>
              )}
            </TouchableOpacity>

            {/* Option 2 */}
            <TouchableOpacity 
              disabled={!!votedOption}
              style={[styles.pollOptionBtn, votedOption === 'option2' && styles.pollOptionBtnVoted]}
              onPress={() => handleVote('option2')}
            >
              <View style={styles.pollOptionTextRow}>
                <Text style={styles.pollOptionLabel}>🛣️ Road Segments & Pothole Repaving</Text>
                {!!votedOption && <Text style={styles.pollOptionPercent}>{getPercent(pollVotes.option2)}</Text>}
              </View>
              {!!votedOption && (
                <View style={styles.pollProgressBg}>
                  <View style={[styles.pollProgressFill, { width: getPercent(pollVotes.option2) as any, backgroundColor: '#F97316' }]} />
                </View>
              )}
            </TouchableOpacity>

            {/* Option 3 */}
            <TouchableOpacity 
              disabled={!!votedOption}
              style={[styles.pollOptionBtn, votedOption === 'option3' && styles.pollOptionBtnVoted]}
              onPress={() => handleVote('option3')}
            >
              <View style={styles.pollOptionTextRow}>
                <Text style={styles.pollOptionLabel}>💡 Energy-Efficient Solar Lighting</Text>
                {!!votedOption && <Text style={styles.pollOptionPercent}>{getPercent(pollVotes.option3)}</Text>}
              </View>
              {!!votedOption && (
                <View style={styles.pollProgressBg}>
                  <View style={[styles.pollProgressFill, { width: getPercent(pollVotes.option3) as any, backgroundColor: '#3B82F6' }]} />
                </View>
              )}
            </TouchableOpacity>
          </View>

          <Text style={styles.pollTotal}>{totalVotes} citizens voted so far</Text>
        </View>

        {/* Forums Section */}
        <Text style={styles.sectionHeading}>💬 Active Local Discussions</Text>
        {campaigns.map((item) => (
          <View key={item.id} style={styles.campaignCard}>
            <View style={styles.campaignHeader}>
              <Text style={styles.campaignTitle}>{item.title}</Text>
              <View style={styles.campaignUsersWrap}>
                <Users color="#64748B" size={14} />
                <Text style={styles.campaignUsers}>{item.users}</Text>
              </View>
            </View>
            <Text style={styles.campaignDesc}>{item.desc}</Text>
            <TouchableOpacity 
              style={styles.joinBtn}
              onPress={() => Alert.alert('Discussion Forum', 'Successfully joined the draft guideline review discussion forum.')}
            >
              <Text style={styles.joinBtnText}>Join Discussion</Text>
              <MessageSquare color="#050A44" size={16} />
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    );
  };

  const { data: services, isLoading } = useQuery({
    queryKey: ['services'],
    queryFn: async () => {
      const response = await api.get('/services');
      return response.data;
    },
  });

  const filteredServices = (Array.isArray(services) ? services : [])?.filter((s: any) => {
    const matchesSearch = s.title?.toLowerCase().includes(search.toLowerCase()) || 
                         s.description?.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = activeCategory === 'all' || s.category?.toLowerCase() === activeCategory.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  const [selectedService, setSelectedService] = useState<any>(null);
  const [isBooking, setIsBooking] = useState(false);

  const handleBookService = (service: any) => {
    router.push({
      pathname: '/booking',
      params: { serviceId: service.id }
    });
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#050A44" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.gatewayTitle}>National <Text style={styles.highlightText}>e-Governance</Text> Gateway</Text>
        <Text style={styles.gatewaySubtitle}>Access 50+ government services through a single window. Locate centers, book slots, and track delivery.</Text>
      </View>

      {/* Tab Switcher Bar */}
      <View style={styles.tabBarContainer}>
        <TouchableOpacity 
          style={[styles.tabBtn, activeTab === 'services' && styles.tabBtnActive]} 
          onPress={() => setActiveTab('services')}
        >
          <Text style={[styles.tabBtnText, activeTab === 'services' && styles.tabBtnTextActive]}>Services (सेवाएं)</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tabBtn, activeTab === 'engage' && styles.tabBtnActive]} 
          onPress={() => setActiveTab('engage')}
        >
          <Text style={[styles.tabBtnText, activeTab === 'engage' && styles.tabBtnTextActive]}>Engage (सहभाग)</Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'engage' ? renderEngageHub() : (
        <>
          <View style={styles.searchSection}>
            <View style={styles.searchWrapper}>
              <Search color="#94A3B8" size={20} style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search Identity, Transport, Property, Health..."
                placeholderTextColor="#94A3B8"
                value={search}
                onChangeText={setSearch}
              />
            </View>
          </View>

          <View style={styles.filterSection}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity 
                  key={cat.id} 
                  style={[styles.filterPill, activeCategory === cat.id && styles.activeFilterPill]}
                  onPress={() => setActiveCategory(cat.id)}
                >
                  <Text style={[styles.filterText, activeCategory === cat.id && styles.activeFilterText]}>
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <FlatList
            data={filteredServices}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            numColumns={1}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <View style={styles.serviceCard}>
                <View style={styles.cardHeader}>
                  <View style={[styles.iconContainer, { backgroundColor: '#F8FAFC' }]}>
                    {getIcon(item.category)}
                  </View>
                  <View style={styles.verifiedBadge}>
                    <Text style={styles.verifiedText}>VERIFIED</Text>
                  </View>
                </View>
                
                <View style={styles.cardBody}>
                  <Text style={styles.cardCategory}>{item.category?.toUpperCase()}</Text>
                  <Text style={styles.cardTitle}>{item.title}</Text>
                  <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>
                </View>

                <View style={styles.cardFooter}>
                  <TouchableOpacity 
                    style={styles.bookBtn} 
                    onPress={() => handleBookService(item)}
                    disabled={isBooking}
                  >
                    <Text style={styles.bookBtnText}>
                      {isBooking ? 'PROCESSING...' : 'QUICK APPLY'}
                    </Text>
                    <ChevronRight color="#050A44" size={16} />
                  </TouchableOpacity>
                </View>
              </View>
            )}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Building2 color="#CBD5E1" size={64} />
                <Text style={styles.emptyStateTitle}>No Services Found</Text>
                <Text style={styles.emptyStateSub}>Try adjusting your search or category filters.</Text>
              </View>
            }
          />
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    padding: 30,
    paddingTop: 40,
    alignItems: 'center',
  },
  gatewayTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#050A44',
    textAlign: 'center',
    marginBottom: 12,
  },
  highlightText: {
    color: '#F97316',
  },
  gatewaySubtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 10,
  },
  searchSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 50,
    height: 60,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#0F172A',
  },
  filterSection: {
    marginBottom: 24,
  },
  filterScroll: {
    paddingHorizontal: 20,
    gap: 12,
  },
  filterPill: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  activeFilterPill: {
    backgroundColor: '#050A44',
    borderColor: '#050A44',
  },
  filterText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  activeFilterText: {
    color: '#fff',
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  serviceCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifiedBadge: {
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  verifiedText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#CBD5E1',
    letterSpacing: 1,
  },
  cardBody: {
    marginBottom: 20,
  },
  cardCategory: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#F97316',
    letterSpacing: 1,
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#050A44',
    marginBottom: 8,
  },
  cardDesc: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
  },
  cardFooter: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 16,
  },
  bookBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  bookBtnText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#050A44',
    letterSpacing: 0.5,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    padding: 60,
    alignItems: 'center',
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#050A44',
    marginTop: 20,
  },
  emptyStateSub: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 8,
  },
  tabBarContainer: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    padding: 4,
    marginHorizontal: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 10,
  },
  tabBtnActive: {
    backgroundColor: '#050A44',
  },
  tabBtnText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#64748B',
  },
  tabBtnTextActive: {
    color: '#fff',
  },
  engageContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 20,
  },
  pollCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  pollBadge: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#F97316',
    letterSpacing: 1,
    marginBottom: 12,
  },
  pollQuestion: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#050A44',
    lineHeight: 22,
    marginBottom: 20,
  },
  pollOptions: {
    gap: 12,
  },
  pollOptionBtn: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  pollOptionBtnVoted: {
    borderColor: '#E2E8F0',
  },
  pollOptionTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  pollOptionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    flex: 1,
  },
  pollOptionPercent: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#050A44',
  },
  pollProgressBg: {
    height: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  pollProgressFill: {
    height: '100%',
    borderRadius: 4,
  },
  pollTotal: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 16,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#050A44',
    marginTop: 10,
    marginBottom: 4,
  },
  campaignCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  campaignHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  campaignTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#050A44',
    flex: 1,
  },
  campaignUsersWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  campaignUsers: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  campaignDesc: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
    marginBottom: 16,
  },
  joinBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#F0F7FF',
    paddingVertical: 12,
    borderRadius: 12,
  },
  joinBtnText: {
    color: '#050A44',
    fontSize: 13,
    fontWeight: 'bold',
  },
});
