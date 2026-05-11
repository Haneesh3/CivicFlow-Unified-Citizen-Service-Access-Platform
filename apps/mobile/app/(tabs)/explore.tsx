import React from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, ActivityIndicator, Linking } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { Search, ExternalLink, Shield, CreditCard, Plane, Building2 } from 'lucide-react-native';

const getIcon = (category: string) => {
  switch (category.toLowerCase()) {
    case 'identity': return <Shield color="#003366" size={24} />;
    case 'finance': return <CreditCard color="#003366" size={24} />;
    case 'travel': return <Plane color="#003366" size={24} />;
    default: return <Building2 color="#003366" size={24} />;
  }
};

export default function ServicesScreen() {
  const { data: services, isLoading, error } = useQuery({
    queryKey: ['services'],
    queryFn: async () => {
      const response = await api.get('/services');
      return response.data;
    },
  });

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#003366" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Government Services</Text>
        <Text style={styles.subtitle}>Official portals & applications</Text>
      </View>

      <FlatList
        data={services}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.card}
            onPress={() => item.applyUrl && Linking.openURL(item.applyUrl)}
          >
            <View style={styles.iconContainer}>
              {getIcon(item.category)}
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.serviceTitle}>{item.title}</Text>
              <Text style={styles.serviceCategory}>{item.category} • {item.ministry}</Text>
              <Text style={styles.serviceDesc} numberOfLines={2}>{item.description}</Text>
            </View>
            <ExternalLink color="#999" size={20} />
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingTop: 60,
  },
  header: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#003366',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  list: {
    padding: 20,
    paddingTop: 0,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#e6f0ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  cardContent: {
    flex: 1,
  },
  serviceTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  serviceCategory: {
    fontSize: 12,
    color: '#FF9933',
    fontWeight: '600',
    marginTop: 2,
  },
  serviceDesc: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
