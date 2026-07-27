import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, SafeAreaView, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { api } from '../../lib/api';
import { Mail, Lock, Key, ArrowLeft, Send, Eye, EyeOff } from 'lucide-react-native';

export default function ForgotPasswordScreen() {
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRequestCode = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your registered email address');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/auth/forgot-password', { email: email.trim() });
      Alert.alert('Code Sent', response.data?.message || 'Verification code sent successfully!');
      setStep(2);
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Something went wrong';
      Alert.alert('Failed to Send Code', message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!otp || !newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/auth/reset-password', {
        email: email.trim(),
        token: otp.trim(),
        newPassword: newPassword,
      });
      Alert.alert('Success', response.data?.message || 'Password has been reset successfully!', [
        {
          text: 'OK',
          onPress: () => router.replace('/(auth)/login'),
        },
      ]);
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Something went wrong';
      Alert.alert('Reset Failed', message);
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
            <TouchableOpacity onPress={() => step === 2 ? setStep(1) : router.back()} style={styles.backButton}>
              <ArrowLeft color="#fff" size={20} />
              <Text style={styles.backText}>Back</Text>
            </TouchableOpacity>
            
            <View style={styles.logoRow}>
              <View style={styles.logoIcon}>
                <Send color="#fff" size={20} />
              </View>
              <View>
                <Text style={styles.brandName}>CivicFlow</Text>
                <Text style={styles.govText}>GOVERNMENT OF INDIA</Text>
              </View>
            </View>
            <Text style={styles.heroText}>Reset Your{"\n"}Password Securely.</Text>
          </View>

          {/* Form Card */}
          <View style={styles.formCard}>
            {step === 1 ? (
              // Step 1: Email Input
              <View>
                <Text style={styles.welcomeTitle}>Forgot Password?</Text>
                <Text style={styles.welcomeSubtitle}>Enter your registered email address and we'll send you a 6-digit OTP code to reset your password.</Text>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>EMAIL ADDRESS</Text>
                  <View style={styles.inputWrapper}>
                    <Mail color="#94A3B8" size={20} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="name@example.com"
                      placeholderTextColor="#94A3B8"
                      value={email}
                      onChangeText={setEmail}
                      autoCapitalize="none"
                      keyboardType="email-address"
                    />
                  </View>
                </View>

                <TouchableOpacity 
                  style={styles.actionButton} 
                  onPress={handleRequestCode}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <View style={styles.buttonInner}>
                      <Send color="#fff" size={18} style={{ marginRight: 10 }} />
                      <Text style={styles.actionButtonText}>Send Reset Code</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            ) : (
              // Step 2: OTP & New Password Input
              <View>
                <Text style={styles.welcomeTitle}>Verify OTP</Text>
                <Text style={styles.welcomeSubtitle}>Enter the 6-digit code sent to {email} and choose your new password.</Text>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>VERIFICATION CODE (OTP)</Text>
                  <View style={styles.inputWrapper}>
                    <Key color="#94A3B8" size={20} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Enter 6-digit OTP"
                      placeholderTextColor="#94A3B8"
                      value={otp}
                      onChangeText={setOtp}
                      keyboardType="number-pad"
                      maxLength={6}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>NEW PASSWORD</Text>
                  <View style={styles.inputWrapper}>
                    <Lock color="#94A3B8" size={20} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Min 6 characters"
                      placeholderTextColor="#94A3B8"
                      value={newPassword}
                      onChangeText={setNewPassword}
                      secureTextEntry={!showNewPassword}
                    />
                    <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)} style={styles.eyeIconWrapper}>
                      {showNewPassword ? (
                        <EyeOff color="#94A3B8" size={20} />
                      ) : (
                        <Eye color="#94A3B8" size={20} />
                      )}
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>CONFIRM NEW PASSWORD</Text>
                  <View style={styles.inputWrapper}>
                    <Lock color="#94A3B8" size={20} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Repeat new password"
                      placeholderTextColor="#94A3B8"
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      secureTextEntry={!showConfirmPassword}
                    />
                    <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeIconWrapper}>
                      {showConfirmPassword ? (
                        <EyeOff color="#94A3B8" size={20} />
                      ) : (
                        <Eye color="#94A3B8" size={20} />
                      )}
                    </TouchableOpacity>
                  </View>
                </View>

                <TouchableOpacity 
                  style={styles.actionButton} 
                  onPress={handleResetPassword}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <View style={styles.buttonInner}>
                      <Lock color="#fff" size={18} style={{ marginRight: 10 }} />
                      <Text style={styles.actionButtonText}>Reset Password</Text>
                    </View>
                  )}
                </TouchableOpacity>

                <TouchableOpacity 
                  onPress={() => setStep(1)} 
                  style={styles.resendContainer}
                  disabled={loading}
                >
                  <Text style={styles.resendText}>Didn't receive the email? Request a new code</Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.footer}>
              <Text style={styles.footerText}>Remembered your password? </Text>
              <TouchableOpacity onPress={() => router.replace('/(auth)/login')}>
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
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    alignSelf: 'flex-start',
  },
  backText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 8,
  },
  brandContainer: {
    padding: 30,
    paddingTop: 40,
    paddingBottom: 30,
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
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
    marginBottom: 32,
  },
  inputGroup: {
    marginBottom: 20,
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
  actionButton: {
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
  actionButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
  resendContainer: {
    alignItems: 'center',
    marginTop: 20,
    paddingVertical: 10,
  },
  resendText: {
    color: '#F97316',
    fontSize: 13,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 32,
    marginBottom: 20,
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
});
