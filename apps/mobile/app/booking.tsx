import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, SafeAreaView, Dimensions, ActivityIndicator, Alert, TextInput } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, Calendar as CalendarIcon, Clock, MapPin, FileText, CheckCircle2, ChevronRight } from 'lucide-react-native';
import { api } from '../lib/api';
import { useAuthStore } from '../lib/store';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

export default function BookingScreen() {
  const { serviceId } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuthStore();
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [service, setService] = useState<any>(null);
  const [holidays, setHolidays] = useState<any[]>([]);
  
  // Form State
  const [selectedSubService, setSelectedSubService] = useState<any>(null);
  const [selectedCenter, setSelectedCenter] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  useEffect(() => {
    fetchServiceDetails();
  }, [serviceId]);

  const fetchServiceDetails = async () => {
    try {
      setLoading(true);
      const [detailsRes, holidaysRes] = await Promise.all([
        api.get(`/booking/details/${serviceId}`),
        api.get('/booking/holidays')
      ]);
      setService(detailsRes.data);
      setHolidays(holidaysRes.data);
    } catch (error) {
      console.error('Error fetching service details:', error);
      Alert.alert('Error', 'Failed to load service details');
    } finally {
      setLoading(false);
    }
  };

  const fetchSlots = async (date: string) => {
    if (!selectedCenter) return;
    try {
      setLoadingSlots(true);
      const res = await api.get(`/booking/slots`, {
        params: {
          serviceId,
          serviceCenterId: selectedCenter.id,
          date
        }
      });
      setAvailableSlots(res.data.slots);
    } catch (error) {
      console.error('Error fetching slots:', error);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    setSelectedSlot('');
    fetchSlots(date);
  };

  const handleBooking = async () => {
    try {
      setLoading(true);
      const response = await api.post('/services/applications', {
        serviceId,
        subServiceId: selectedSubService.id,
        serviceCenterId: selectedCenter.id,
        applicantName: user?.name,
        applicantPhone: user?.phone || '9999999999',
        appointmentDate: selectedDate,
        appointmentSlot: selectedSlot,
        data: {
          serviceTitle: service.title,
          subService: selectedSubService.name,
          centerName: selectedCenter.name
        }
      });
      
      Alert.alert(
        'Success!',
        `Your appointment is booked successfully.\nReference ID: ${response.data.referenceId}`,
        [{ text: 'View Status', onPress: () => router.replace('/(tabs)/tracking') }]
      );
    } catch (error: any) {
      Alert.alert('Booking Failed', error.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const getNextDays = () => {
    const days = [];
    for (let i = 1; i <= 14; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      
      // Check if it's a holiday
      const isHoliday = holidays.find(h => h.date.startsWith(dateStr));
      if (!isHoliday) {
        days.push({
          date: dateStr,
          day: d.toLocaleDateString('en-US', { weekday: 'short' }),
          num: d.getDate(),
          month: d.toLocaleDateString('en-US', { month: 'short' })
        });
      }
    }
    return days;
  };

  if (loading && step === 1) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#050A44" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => step > 1 ? setStep(step - 1) : router.back()}>
          <ChevronLeft color="#050A44" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{service?.title || 'Book Service'}</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Progress Bar */}
      <View style={styles.progressLine}>
        <View style={[styles.progressFill, { width: `${(step / 4) * 100}%` }]} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {step === 1 && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Select Type of Service</Text>
            <Text style={styles.stepSub}>Choose the specific service you need assistance with</Text>
            
            {service?.subServices.map((sub: any) => (
              <TouchableOpacity 
                key={sub.id} 
                style={[styles.optionCard, selectedSubService?.id === sub.id && styles.selectedCard]}
                onPress={() => setSelectedSubService(sub)}
              >
                <View style={styles.optionHeader}>
                  <Text style={styles.optionName}>{sub.name}</Text>
                  {selectedSubService?.id === sub.id && <CheckCircle2 color="#050A44" size={20} />}
                </View>
                <Text style={styles.optionDesc}>{sub.description}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {step === 2 && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Mandatory Documents</Text>
            <Text style={styles.stepSub}>Ensure you carry these original documents to the center</Text>
            
            <View style={styles.docList}>
              {selectedSubService?.requiredDocuments.map((doc: string, index: number) => (
                <View key={index} style={styles.docItem}>
                  <FileText color="#F97316" size={16} />
                  <Text style={styles.docText}>{doc}</Text>
                </View>
              ))}
            </View>

            <Text style={[styles.stepTitle, { marginTop: 24 }]}>Select Service Center</Text>
            <Text style={styles.stepSub}>Choose the center nearest to your location</Text>
            
            {service?.serviceCenters.map((center: any) => (
              <TouchableOpacity 
                key={center.id} 
                style={[styles.optionCard, selectedCenter?.id === center.id && styles.selectedCard]}
                onPress={() => setSelectedCenter(center)}
              >
                <View style={styles.optionHeader}>
                  <Text style={styles.optionName}>{center.name}</Text>
                  {selectedCenter?.id === center.id && <CheckCircle2 color="#050A44" size={20} />}
                </View>
                <View style={styles.locationInfo}>
                  <MapPin color="#94A3B8" size={14} />
                  <Text style={styles.locationText}>{center.address}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {step === 3 && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Select Date & Time</Text>
            <Text style={styles.stepSub}>Bookings must be made at least 24h in advance</Text>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateList}>
              {getNextDays().map((d) => (
                <TouchableOpacity 
                  key={d.date} 
                  style={[styles.dateCard, selectedDate === d.date && styles.selectedDateCard]}
                  onPress={() => handleDateSelect(d.date)}
                >
                  <Text style={[styles.dateDay, selectedDate === d.date && styles.selectedDateText]}>{d.day}</Text>
                  <Text style={[styles.dateNum, selectedDate === d.date && styles.selectedDateText]}>{d.num}</Text>
                  <Text style={[styles.dateMonth, selectedDate === d.date && styles.selectedDateText]}>{d.month}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={[styles.stepTitle, { marginTop: 24 }]}>Available Slots</Text>
            <Text style={styles.stepSub}>9:00 AM - 5:00 PM</Text>
            
            {loadingSlots ? (
              <ActivityIndicator style={{ marginTop: 20 }} color="#050A44" />
            ) : selectedDate ? (
              <View style={styles.slotGrid}>
                {availableSlots.length > 0 ? availableSlots.map(slot => (
                  <TouchableOpacity 
                    key={slot} 
                    style={[styles.slotItem, selectedSlot === slot && styles.selectedSlot]}
                    onPress={() => setSelectedSlot(slot)}
                  >
                    <Text style={[styles.slotText, selectedSlot === slot && styles.selectedSlotText]}>{slot}</Text>
                  </TouchableOpacity>
                )) : (
                  <Text style={styles.noSlotsText}>No slots available for this date</Text>
                )}
              </View>
            ) : (
              <Text style={styles.noSlotsText}>Please select a date first</Text>
            )}
          </View>
        )}

        {step === 4 && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Review & Confirm</Text>
            <Text style={styles.stepSub}>Please verify your appointment details</Text>
            
            <View style={styles.reviewCard}>
              <View style={styles.reviewItem}>
                <Text style={styles.reviewLabel}>Service</Text>
                <Text style={styles.reviewValue}>{service.title}</Text>
              </View>
              <View style={styles.reviewItem}>
                <Text style={styles.reviewLabel}>Type</Text>
                <Text style={styles.reviewValue}>{selectedSubService.name}</Text>
              </View>
              <View style={styles.reviewItem}>
                <Text style={styles.reviewLabel}>Center</Text>
                <Text style={styles.reviewValue}>{selectedCenter.name}</Text>
              </View>
              <View style={styles.reviewItem}>
                <Text style={styles.reviewLabel}>Date</Text>
                <Text style={styles.reviewValue}>{new Date(selectedDate).toLocaleDateString('en-US', { dateStyle: 'long' })}</Text>
              </View>
              <View style={styles.reviewItem}>
                <Text style={styles.reviewLabel}>Time</Text>
                <Text style={styles.reviewValue}>{selectedSlot}</Text>
              </View>
            </View>

            <View style={styles.reminderInfo}>
              <Clock color="#050A44" size={20} />
              <Text style={styles.reminderText}>We will notify you with reminders 24h, 2h, and 1h before the slot.</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Footer Button */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.nextBtn, !canProceed() && styles.disabledBtn]} 
          onPress={handleNext}
          disabled={!canProceed()}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.nextBtnText}>{step === 4 ? 'Confirm Booking' : 'Continue'}</Text>
              {step < 4 && <ChevronRight color="#fff" size={20} />}
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );

  function canProceed() {
    if (step === 1) return selectedSubService !== null;
    if (step === 2) return selectedCenter !== null;
    if (step === 3) return selectedDate !== '' && selectedSlot !== '';
    return true;
  }

  function handleNext() {
    if (step < 4) {
      setStep(step + 1);
    } else {
      handleBooking();
    }
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 10,
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#050A44' },
  progressLine: { height: 4, backgroundColor: '#F1F5F9', width: '100%' },
  progressFill: { height: '100%', backgroundColor: '#050A44' },
  scrollContent: { padding: 20 },
  stepContainer: { flex: 1 },
  stepTitle: { fontSize: 24, fontWeight: 'bold', color: '#050A44' },
  stepSub: { fontSize: 14, color: '#94A3B8', marginTop: 4, marginBottom: 24 },
  optionCard: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: 12,
  },
  selectedCard: {
    backgroundColor: '#F0F7FF',
    borderColor: '#050A44',
  },
  optionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  optionName: { fontSize: 16, fontWeight: 'bold', color: '#050A44' },
  optionDesc: { fontSize: 13, color: '#64748B', marginTop: 4 },
  docList: { gap: 10 },
  docItem: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#FFF7ED', padding: 12, borderRadius: 10 },
  docText: { fontSize: 14, color: '#050A44', fontWeight: '500' },
  locationInfo: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  locationText: { fontSize: 12, color: '#94A3B8' },
  dateList: { marginHorizontal: -20, paddingHorizontal: 20 },
  dateCard: {
    width: 65,
    height: 90,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  selectedDateCard: { backgroundColor: '#050A44', borderColor: '#050A44' },
  dateDay: { fontSize: 11, fontWeight: 'bold', color: '#94A3B8' },
  dateNum: { fontSize: 20, fontWeight: 'bold', color: '#050A44', marginVertical: 4 },
  dateMonth: { fontSize: 11, fontWeight: 'bold', color: '#94A3B8' },
  selectedDateText: { color: '#fff' },
  slotGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  slotItem: {
    width: (width - 60) / 3,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  selectedSlot: { backgroundColor: '#050A44', borderColor: '#050A44' },
  slotText: { fontSize: 13, fontWeight: 'bold', color: '#64748B' },
  selectedSlotText: { color: '#fff' },
  noSlotsText: { textAlign: 'center', color: '#94A3B8', marginTop: 20, fontStyle: 'italic' },
  reviewCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    padding: 20,
    gap: 16,
  },
  reviewItem: { flexDirection: 'row', justifyContent: 'space-between' },
  reviewLabel: { fontSize: 14, color: '#94A3B8' },
  reviewValue: { fontSize: 14, fontWeight: 'bold', color: '#050A44', textAlign: 'right', flex: 1, marginLeft: 20 },
  reminderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#F0F7FF',
    padding: 16,
    borderRadius: 16,
    marginTop: 24,
  },
  reminderText: { flex: 1, fontSize: 13, color: '#050A44', lineHeight: 20 },
  footer: { padding: 20, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  nextBtn: {
    backgroundColor: '#050A44',
    padding: 16,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  disabledBtn: { opacity: 0.5 },
  nextBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
