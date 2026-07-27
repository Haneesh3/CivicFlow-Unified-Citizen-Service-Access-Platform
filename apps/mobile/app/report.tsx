import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, Image, ActivityIndicator, Alert, SafeAreaView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import MapView, { Marker } from 'react-native-maps';
import { api } from '../lib/api';
import { useAuthStore } from '../lib/store';
import { Camera, MapPin, CheckCircle2, ChevronLeft, Send, AlertTriangle, Image as ImageIcon, Info, Mic, Square, Play, Pause, Trash2 } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as SecureStore from 'expo-secure-store';
import { getIpLocation } from '../lib/location';

const CATEGORIES = ['Road / Pothole', 'Garbage', 'Streetlight', 'Water Supply', 'Drainage', 'Encroachment'];

const CATEGORIES_DATA = [
  { name: 'Road / Pothole', label: 'Road Repair', emoji: '🛠️', colors: ['#FFF7ED', '#FFEDD5', '#F97316'] },
  { name: 'Garbage', label: 'Waste Cleanup', emoji: '🗑️', colors: ['#F0FDF4', '#DCFCE7', '#10B981'] },
  { name: 'Streetlight', label: 'Streetlight', emoji: '💡', colors: ['#FEFCE8', '#FEF9C3', '#EAB308'] },
  { name: 'Water Supply', label: 'Water Supply', emoji: '💧', colors: ['#F0F9FF', '#E0F2FE', '#0EA5E9'] },
  { name: 'Drainage', label: 'Drainage', emoji: '🕸️', colors: ['#F5F3FF', '#EDE9FE', '#8B5CF6'] },
  { name: 'Encroachment', label: 'Encroachment', emoji: '🚧', colors: ['#FFF5F5', '#FED7D7', '#EF4444'] }
];

export default function ReportScreen() {
  const { user } = useAuthStore();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [image, setImage] = useState<string | null>(null);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [mapRegion, setMapRegion] = useState({
    latitude: 28.6139,
    longitude: 77.2090,
    latitudeDelta: 0.005,
    longitudeDelta: 0.005,
  });
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const [helperMode, setHelperMode] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordedUri, setRecordedUri] = useState<string | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [timerInterval, setTimerInterval] = useState<any>(null);

  const startRecording = () => {
    setRecordedUri(null);
    setRecording(true);
    setRecordingDuration(0);
    const interval = setInterval(() => {
      setRecordingDuration((prev) => prev + 1);
    }, 1000);
    setTimerInterval(interval);
  };

  const stopRecording = () => {
    if (timerInterval) {
      clearInterval(timerInterval);
      setTimerInterval(null);
    }
    setRecording(false);
    setRecordedUri('mock_audio_description.mp3');
  };

  const deleteVoiceMemo = () => {
    setRecordedUri(null);
    setIsPlaying(false);
    setRecordingDuration(0);
  };

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
    setTimeout(() => {
      setIsPlaying(false);
    }, recordingDuration * 1000);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      const ipstackKey = process.env.EXPO_PUBLIC_IPSTACK_API_KEY;

      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'GPS is disabled. Attempting to resolve city location using IP.');
        if (ipstackKey) {
          try {
            const ipData = await getIpLocation(ipstackKey);
            setMapRegion({
              ...mapRegion,
              latitude: ipData.latitude,
              longitude: ipData.longitude,
            });
            setAddress(ipData.address);
          } catch (e) {
            console.error('IPstack fallback failed:', e);
          }
        }
        return;
      }

      try {
        let location = await Location.getCurrentPositionAsync({});
        setLocation(location);
        setMapRegion({
          ...mapRegion,
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
        if (ipstackKey) {
          try {
            const ipData = await getIpLocation(ipstackKey);
            setAddress(ipData.address);
          } catch {
            setAddress(`Coordinates: ${location.coords.latitude.toFixed(4)}, ${location.coords.longitude.toFixed(4)}`);
          }
        } else {
          setAddress(`Coordinates: ${location.coords.latitude.toFixed(4)}, ${location.coords.longitude.toFixed(4)}`);
        }
      } catch (err) {
        console.warn('GPS lookup failed, checking IPstack:', err);
        if (ipstackKey) {
          const ipData = await getIpLocation(ipstackKey);
          setMapRegion({
            ...mapRegion,
            latitude: ipData.latitude,
            longitude: ipData.longitude,
          });
          setAddress(ipData.address);
        }
      }
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

  const handleSubmit = async (force = false) => {
    if (!title || !description || !user) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    if (!location && !address.trim()) {
      Alert.alert('Error', 'Please enter an address or enable location services.');
      return;
    }

    const latitude = location ? location.coords.latitude : mapRegion.latitude;
    const longitude = location ? location.coords.longitude : mapRegion.longitude;
    const finalAddress = address.trim() || 'Detected Location';

    setLoading(true);
    try {
      if (!force) {
        // Run duplicate detection check (50m radius)
        const nearbyRes = await api.get('/complaints/nearby', {
          params: { lat: latitude, lng: longitude, radius: 50 }
        });
        const duplicate = nearbyRes.data?.find((c: any) => c.category === category);
        
        if (duplicate) {
          setLoading(false);
          Alert.alert(
            'Issue Already Reported',
            `A similar ticket ("${duplicate.title}") is already open within 50 meters of your location. Would you like to track the existing issue or submit yours anyway?`,
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Track Existing', onPress: () => router.replace('/(tabs)/issues') },
              { text: 'Submit Anyway', onPress: () => handleSubmit(true) }
            ]
          );
          return;
        }
      }

      await api.post('/complaints', {
        title,
        description,
        category,
        address: finalAddress,
        latitude,
        longitude,
        force,
      });

      Alert.alert('Success', 'Your complaint has been submitted successfully', [
        { text: 'OK', onPress: () => router.replace('/(tabs)') }
      ]);
    } catch (error: any) {
      const isNetworkError = !error.response || error.message.includes('Network Error') || error.message.includes('timeout') || error.code === 'ERR_NETWORK';
      if (isNetworkError) {
        setLoading(false);
        Alert.alert(
          'Offline State Detected',
          'Internet connection appears to be down. Would you like to save this complaint as a draft to submit later?',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Save Draft', 
              onPress: () => saveOfflineDraft({
                title,
                description,
                category,
                address: finalAddress,
                latitude,
                longitude,
              })
            }
          ]
        );
      } else {
        const message = error.response?.data?.message || error.message || 'Something went wrong';
        Alert.alert('Submission Failed', message);
      }
    } finally {
      setLoading(false);
    }
  };

  const saveOfflineDraft = async (draftData: any) => {
    try {
      const existingDraftsStr = await SecureStore.getItemAsync('offline_drafts');
      const drafts = existingDraftsStr ? JSON.parse(existingDraftsStr) : [];
      drafts.push({
        ...draftData,
        id: Math.random().toString(36).substring(2, 9),
        createdAt: new Date().toISOString()
      });
      await SecureStore.setItemAsync('offline_drafts', JSON.stringify(drafts));
      Alert.alert('Draft Saved', 'Your complaint has been saved locally. You can sync it from your dashboard once you are online.', [
        { text: 'OK', onPress: () => router.replace('/(tabs)') }
      ]);
    } catch (e) {
      console.error('Failed to save offline draft:', e);
      Alert.alert('Error', 'Failed to save draft locally.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#050A44', '#0A1A7F']} style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft color="#fff" size={24} />
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>Report Civic Issue</Text>
          <Text style={styles.headerSub}>Help us improve your neighborhood</Text>
        </View>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.formCard}>
          {/* Helper Mode Toggle */}
          <View style={styles.helperToggleRow}>
            <View style={styles.helperLabelRow}>
              <Info color="#050A44" size={16} />
              <Text style={styles.helperToggleLabel}>Simple Helper Tips</Text>
            </View>
            <TouchableOpacity 
              onPress={() => setHelperMode(!helperMode)}
              style={[styles.toggleSwitch, helperMode && styles.toggleSwitchActive]}
            >
              <View style={[styles.toggleCircle, helperMode && styles.toggleCircleActive]} />
            </TouchableOpacity>
          </View>

          {helperMode && (
            <View style={styles.helperBubble}>
              <Text style={styles.helperBubbleText}>👉 Step 1: Pick what is wrong (e.g. Garbage, Road barrier, lightbulb).</Text>
            </View>
          )}
          <Text style={styles.sectionLabel}>ISSUE CATEGORY</Text>
          <View style={styles.gridContainer}>
            {CATEGORIES_DATA.map((cat) => (
              <TouchableOpacity 
                key={cat.name} 
                style={[
                  styles.gridCard, 
                  category === cat.name ? { borderColor: cat.colors[2], borderWidth: 2, backgroundColor: cat.colors[1] } : { backgroundColor: cat.colors[0] }
                ]}
                onPress={() => setCategory(cat.name)}
              >
                <Text style={styles.gridEmoji}>{cat.emoji}</Text>
                <Text style={[styles.gridText, category === cat.name && { color: '#050A44', fontWeight: 'bold' }]}>{cat.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>ISSUE TITLE</Text>
            {helperMode && (
              <View style={styles.helperBubble}>
                <Text style={styles.helperBubbleText}>👉 Step 2: Write a very short title of what is broken.</Text>
              </View>
            )}
            <View style={styles.inputWrapper}>
              <AlertTriangle color="#94A3B8" size={18} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Short title of the issue"
                placeholderTextColor="#94A3B8"
                value={title}
                onChangeText={setTitle}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>DESCRIPTION</Text>
            {helperMode && (
              <View style={styles.helperBubble}>
                <Text style={styles.helperBubbleText}>👉 Step 3: Tell us some details so our workers can fix it fast.</Text>
              </View>
            )}
            <View style={[styles.inputWrapper, styles.textAreaWrapper]}>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Describe the issue in detail..."
                placeholderTextColor="#94A3B8"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
              />
            </View>
          </View>

          {/* Voice Memo Section */}
          <View style={styles.voiceSection}>
            <Text style={styles.label}>OR RECORD A VOICE DESCRIPTION</Text>
            {helperMode && (
              <View style={styles.helperBubble}>
                <Text style={styles.helperBubbleText}>👉 If you don't want to type, tap below and speak your problem!</Text>
              </View>
            )}
            
            <View style={styles.voiceContainer}>
              {!recording && !recordedUri ? (
                <TouchableOpacity onPress={startRecording} style={styles.recordBtn}>
                  <Mic color="#fff" size={18} style={{ marginRight: 8 }} />
                  <Text style={styles.recordBtnText}>Tap to Record Voice Note</Text>
                </TouchableOpacity>
              ) : recording ? (
                <View style={styles.activeRecordRow}>
                  <View style={styles.pulseContainer}>
                    <View style={styles.pulseDot} />
                    <Text style={styles.recordingTimer}>Recording... {formatTime(recordingDuration)}</Text>
                  </View>
                  <TouchableOpacity onPress={stopRecording} style={styles.stopBtn}>
                    <Square color="#fff" size={14} style={{ marginRight: 6 }} />
                    <Text style={styles.stopBtnText}>Stop</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.playBackRow}>
                  <TouchableOpacity onPress={togglePlay} style={styles.playBtn}>
                    {isPlaying ? <Pause color="#fff" size={14} style={{ marginRight: 6 }} /> : <Play color="#fff" size={14} style={{ marginRight: 6 }} />}
                    <Text style={styles.playBtnText}>{isPlaying ? 'Playing...' : 'Play Voice Memo'}</Text>
                  </TouchableOpacity>
                  
                  <Text style={styles.voiceDuration}>({formatTime(recordingDuration)})</Text>
                  
                  <TouchableOpacity onPress={deleteVoiceMemo} style={styles.deleteBtn}>
                    <Trash2 color="#EF4444" size={18} />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>

          <Text style={styles.sectionLabel}>VISUAL EVIDENCE</Text>
          {helperMode && (
            <View style={styles.helperBubble}>
              <Text style={styles.helperBubbleText}>👉 Step 4: Click below to snap a picture of the issue.</Text>
            </View>
          )}
          <TouchableOpacity style={styles.photoContainer} onPress={pickImage}>
            {image ? (
              <Image source={{ uri: image }} style={styles.preview} />
            ) : (
              <View style={styles.photoPlaceholder}>
                <View style={styles.photoIconCircle}>
                  <Camera color="#050A44" size={28} />
                </View>
                <Text style={styles.photoTitle}>Take a Photo</Text>
                <Text style={styles.photoSub}>Ensure the issue is clearly visible</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Manual Address Input Field */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>ADDRESS / LANDMARK</Text>
            {helperMode && (
              <View style={styles.helperBubble}>
                <Text style={styles.helperBubbleText}>👉 Step 5: Type the address or landmark so our repair team can find it.</Text>
              </View>
            )}
            <View style={styles.inputWrapper}>
              <MapPin color="#94A3B8" size={18} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="e.g. Near Metro Station, Sector 4, Vasant Kunj"
                placeholderTextColor="#94A3B8"
                value={address}
                onChangeText={setAddress}
              />
            </View>
          </View>

          <Text style={styles.sectionLabel}>LOCATION</Text>
          {helperMode && (
            <View style={styles.helperBubble}>
              <Text style={styles.helperBubbleText}>👉 Step 6: Verify the mapped location. Click Submit below to send it to the ward officer!</Text>
            </View>
          )}
          <View style={styles.mapCard}>
            <MapView 
              style={styles.map} 
              region={mapRegion}
              scrollEnabled={false}
              zoomEnabled={false}
            >
              <Marker coordinate={mapRegion}>
                <View style={styles.markerCircle}>
                  <MapPin color="#fff" size={16} />
                </View>
              </Marker>
            </MapView>
            <View style={[styles.locationInfo, !location && { backgroundColor: '#FFF7ED', borderColor: '#FFEDD5', borderWidth: 1, borderRadius: 10 }]}>
              <MapPin color={location ? "#050A44" : "#F97316"} size={16} />
              <Text style={[styles.locationText, !location && { color: '#F97316', fontWeight: 'bold' }]}>
                {location ? "Automatically detected your location" : "GPS unavailable. Using default city region."}
              </Text>
            </View>
          </View>

          <TouchableOpacity 
            style={styles.submitBtn} 
            onPress={() => handleSubmit()}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <View style={styles.submitBtnInner}>
                <Send color="#fff" size={20} style={{ marginRight: 10 }} />
                <Text style={styles.submitText}>Submit Report</Text>
              </View>
            )}
          </TouchableOpacity>
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
  header: {
    padding: 24,
    paddingTop: Platform.OS === 'ios' ? 20 : 60,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSub: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  scrollContent: {
    padding: 20,
  },
  formCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#94A3B8',
    letterSpacing: 1,
    marginBottom: 16,
    marginTop: 10,
  },
  catRow: {
    gap: 10,
    marginBottom: 24,
  },
  catBadge: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  catBadgeActive: {
    backgroundColor: '#050A44',
    borderColor: '#050A44',
  },
  catText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  catTextActive: {
    color: '#fff',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#64748B',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 56,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  textAreaWrapper: {
    height: 120,
    alignItems: 'flex-start',
    paddingTop: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#0F172A',
  },
  textArea: {
    height: '100%',
    textAlignVertical: 'top',
  },
  photoContainer: {
    height: 200,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
    borderWidth: 2,
    borderColor: '#F1F5F9',
    borderStyle: 'dashed',
    marginBottom: 24,
    overflow: 'hidden',
  },
  photoPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  photoIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F0F7FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  photoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#050A44',
  },
  photoSub: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 4,
  },
  preview: {
    width: '100%',
    height: '100%',
  },
  mapCard: {
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: 30,
  },
  map: {
    height: 150,
    width: '100%',
  },
  markerCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F97316',
    borderWidth: 3,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationInfo: {
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  locationText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  submitBtn: {
    backgroundColor: '#050A44',
    borderRadius: 16,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#050A44',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 6,
    marginBottom: 20,
  },
  submitBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  submitText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  helperToggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    marginBottom: 16,
  },
  helperLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  helperToggleLabel: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#050A44',
  },
  toggleSwitch: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#CBD5E1',
    padding: 2,
    justifyContent: 'center',
  },
  toggleSwitchActive: {
    backgroundColor: '#050A44',
  },
  toggleCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#fff',
    transform: [{ translateX: 0 }],
  },
  toggleCircleActive: {
    transform: [{ translateX: 20 }],
  },
  helperBubble: {
    backgroundColor: '#F0F7FF',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    marginBottom: 12,
  },
  helperBubbleText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E40AF',
    lineHeight: 16,
  },
  voiceSection: {
    marginBottom: 24,
  },
  voiceContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 8,
  },
  recordBtn: {
    backgroundColor: '#050A44',
    height: 50,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  activeRecordRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pulseContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  recordingTimer: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#EF4444',
  },
  stopBtn: {
    backgroundColor: '#EF4444',
    height: 38,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  stopBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  playBackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  playBtn: {
    backgroundColor: '#10B981',
    height: 40,
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  playBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  voiceDuration: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },
  deleteBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 24,
  },
  gridCard: {
    width: '48%',
    height: 100,
    borderRadius: 16,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  gridEmoji: {
    fontSize: 28,
  },
  gridText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
    textAlign: 'center',
  },
});
