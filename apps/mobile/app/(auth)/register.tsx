import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert, SafeAreaView, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { api } from '../../lib/api';
import { useAuthStore } from '../../lib/store';
import { UserPlus, User, Mail, Phone, Lock, Send, Eye, EyeOff } from 'lucide-react-native';

export default function RegisterScreen() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    city: 'Delhi',
  });
  const [selectedRole, setSelectedRole] = useState<'CITIZEN' | 'ADMIN'>('CITIZEN');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const { setToken, setUser } = useAuthStore();

  const handleRegister = async () => {
    if (!form.name || (!form.email && !form.phone) || !form.password || !form.confirmPassword) {
      Alert.alert('Error', 'Please fill name, password and at least one of email or phone');
      return;
    }

    if (form.password !== form.confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/auth/register', {
        ...form,
        language: 'English',
        role: selectedRole,
      });

      const { access_token, user } = response.data;

      if (access_token) {
        setToken(access_token);
        setUser(user);
        Alert.alert('Success', 'Account created successfully!');
        router.replace('/(tabs)');
      }
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Something went wrong';
      Alert.alert('Registration Failed', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Header Section */}
          <View style={styles.brandContainer}>
            <View style={styles.logoRow}>
              <View style={styles.logoIcon}>
                <Send color="#fff" size={20} />
              </View>
              <View>
                <Text style={styles.brandName}>CivicFlow</Text>
                <Text style={styles.govText}>GOVERNMENT OF INDIA</Text>
              </View>
            </View>
            <Text style={styles.heroText}>Join CivicFlow,{"\n"}Build Your City.</Text>
          </View>

          {/* Form Section */}
          <View style={styles.formCard}>
            <Text style={styles.welcomeTitle}>Create Account</Text>
            <Text style={styles.welcomeSubtitle}>Join thousands of citizens today.</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>FULL NAME</Text>
              <View style={styles.inputWrapper}>
                <User color="#94A3B8" size={20} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="John Doe"
                  placeholderTextColor="#94A3B8"
                  value={form.name}
                  onChangeText={(val) => setForm({ ...form, name: val })}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>EMAIL (OPTIONAL)</Text>
              <View style={styles.inputWrapper}>
                <Mail color="#94A3B8" size={20} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="name@example.com"
                  placeholderTextColor="#94A3B8"
                  value={form.email}
                  onChangeText={(val) => setForm({ ...form, email: val })}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>PHONE NUMBER</Text>
              <View style={styles.inputWrapper}>
                <Phone color="#94A3B8" size={20} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="+91 98765 43210"
                  placeholderTextColor="#94A3B8"
                  value={form.phone}
                  onChangeText={(val) => setForm({ ...form, phone: val })}
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>ACCOUNT TYPE</Text>
              <View style={styles.roleSelectorRow}>
                <TouchableOpacity
                  style={[styles.roleOption, selectedRole === 'CITIZEN' && styles.roleOptionActive]}
                  onPress={() => setSelectedRole('CITIZEN')}
                >
                  <Text style={[styles.roleOptionText, selectedRole === 'CITIZEN' && styles.roleOptionTextActive]}>Citizen</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.roleOption, selectedRole === 'ADMIN' && styles.roleOptionActive]}
                  onPress={() => setSelectedRole('ADMIN')}
                >
                  <Text style={[styles.roleOptionText, selectedRole === 'ADMIN' && styles.roleOptionTextActive]}>Admin</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>PASSWORD</Text>
              <View style={styles.inputWrapper}>
                <Lock color="#94A3B8" size={20} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor="#94A3B8"
                  value={form.password}
                  onChangeText={(val) => setForm({ ...form, password: val })}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIconWrapper}>
                  {showPassword ? (
                    <EyeOff color="#94A3B8" size={20} />
                  ) : (
                    <Eye color="#94A3B8" size={20} />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>CONFIRM PASSWORD</Text>
              <View style={styles.inputWrapper}>
                <Lock color="#94A3B8" size={20} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor="#94A3B8"
                  value={form.confirmPassword}
                  onChangeText={(val) => setForm({ ...form, confirmPassword: val })}
                  secureTextEntry={!showPassword}
                />
              </View>
            </View>

            <TouchableOpacity 
              style={styles.registerButton} 
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <View style={styles.buttonInner}>
                  <UserPlus color="#fff" size={20} style={{ marginRight: 10 }} />
                  <Text style={styles.registerButtonText}>Register</Text>
                </View>
              )}
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => router.back()}>
                <Text style={styles.loginLinkText}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050A44',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
  brandContainer: {
    padding: 30,
    paddingTop: 60,
    paddingBottom: 40,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  logoIcon: {
    width: 40,
    height: 40,
    backgroundColor: '#F97316',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  brandName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 0.5,
  },
  govText: {
    fontSize: 10,
    color: '#F97316',
    fontWeight: '700',
    letterSpacing: 1,
  },
  heroText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    lineHeight: 40,
  },
  formCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 30,
    paddingTop: 40,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#050A44',
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 15,
    color: '#64748B',
    marginBottom: 32,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F7FF',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#0F172A',
  },
  eyeIconWrapper: {
    padding: 8,
  },
  registerButton: {
    backgroundColor: '#050A44',
    borderRadius: 14,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#050A44',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonInner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  registerButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
    marginBottom: 40,
  },
  footerText: {
    color: '#64748B',
    fontSize: 14,
  },
  loginLinkText: {
    color: '#F97316',
    fontSize: 14,
    fontWeight: '700',
  },
  roleSelectorRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  roleOption: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  roleOptionActive: {
    borderColor: '#050A44',
    backgroundColor: '#F0F7FF',
  },
  roleOptionText: {
    color: '#64748B',
    fontWeight: '600',
    fontSize: 14,
  },
  roleOptionTextActive: {
    color: '#050A44',
    fontWeight: 'bold',
  },
});

