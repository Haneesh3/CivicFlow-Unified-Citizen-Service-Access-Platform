import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, Image, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import MapView, { Marker } from 'react-native-maps';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../lib/store';
import { Camera, MapPin, CheckCircle2, ChevronLeft } from 'lucide-react-native';

const CATEGORIES = ['Road / Pothole', 'Garbage', 'Streetlight', 'Water Supply', 'Drainage', 'Encroachment'];

export default function ReportScreen() {
  const { user } = useAuthStore();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [image, setImage] = useState<string | null>(null);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [mapRegion, setMapRegion] = useState({
    latitude: 28.6139,
    longitude: 77.2090,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Permission to access location was denied');
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setLocation(location);
      setMapRegion({
        ...mapRegion,
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
    })();
  }, []);

  const pickImage = async () => {
    let result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    if (!title || !description || !location || !user) {
      Alert.alert('Error', 'Please fill all required fields and ensure you are logged in');
      return;
    }

    setLoading(true);
    try {
      // In a real app, you'd upload the image to Supabase Storage first
      const { error } = await supabase.from('Complaint').insert({
        id: crypto.randomUUID(),
        title,
        description,
        category,
        userId: user.id,
        address: 'Current Location',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });


      if (error) throw error;

      Alert.alert('Success', 'Your complaint has been submitted successfully', [
        { text: 'OK', onPress: () => router.replace('/(tabs)') }
      ]);
    } catch (error: any) {
      Alert.alert('Submission Failed', error.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft color="#333" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Report Civic Issue</Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>Select Category</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity 
              key={cat} 
              style={[styles.catBadge, category === cat && styles.catBadgeActive]}
              onPress={() => setCategory(cat)}
            >
              <Text style={[styles.catText, category === cat && styles.catTextActive]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={styles.label}>Issue Title</Text>
        <TextInput
          style={styles.input}
          placeholder="Short title of the issue"
          value={title}
          onChangeText={setTitle}
        />

        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Provide more details..."
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
        />

        <Text style={styles.label}>Evidence Photo</Text>
        <TouchableOpacity style={styles.photoBtn} onPress={pickImage}>
          {image ? (
            <Image source={{ uri: image }} style={styles.preview} />
          ) : (
            <View style={styles.photoPlaceholder}>
              <Camera color="#003366" size={32} />
              <Text style={styles.photoText}>Tap to capture photo</Text>
            </View>
          )}
        </TouchableOpacity>

        <Text style={styles.label}>Location</Text>
        <View style={styles.mapContainer}>
          <MapView 
            style={styles.map} 
            region={mapRegion}
            onRegionChangeComplete={setMapRegion}
          >
            <Marker coordinate={mapRegion} />
          </MapView>
          <View style={styles.mapOverlay}>
            <MapPin color="#003366" size={20} />
            <Text style={styles.mapOverlayText}>Pin is at your current location</Text>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.submitBtn} 
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <CheckCircle2 color="#fff" size={20} style={{ marginRight: 8 }} />
              <Text style={styles.submitText}>Submit Complaint</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backBtn: {
    padding: 8,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  form: {
    padding: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
    marginTop: 20,
  },
  catScroll: {
    marginBottom: 10,
  },
  catBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f4f8',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  catBadgeActive: {
    backgroundColor: '#003366',
    borderColor: '#003366',
  },
  catText: {
    color: '#666',
    fontWeight: '600',
  },
  catTextActive: {
    color: '#fff',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fcfcfc',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  photoBtn: {
    height: 200,
    borderRadius: 12,
    backgroundColor: '#f5f7fa',
    borderWidth: 2,
    borderColor: '#e1e8ed',
    borderStyle: 'dashed',
    overflow: 'hidden',
  },
  photoPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoText: {
    color: '#003366',
    marginTop: 8,
    fontWeight: '600',
  },
  preview: {
    width: '100%',
    height: '100%',
  },
  mapContainer: {
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  mapOverlay: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    right: 10,
    backgroundColor: 'rgba(255,255,255,0.9)',
    padding: 8,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  mapOverlayText: {
    fontSize: 12,
    color: '#333',
  },
  submitBtn: {
    backgroundColor: '#003366',
    borderRadius: 12,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
    marginBottom: 40,
  },
  submitText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
