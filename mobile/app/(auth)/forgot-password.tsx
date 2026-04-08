import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import BACKEND_URL from '../../config/backend';

const COLORS = {
  DEEP_BLUE: '#1A237E',
  SLATE_GRAY: '#475569',
  SOFT_WHITE: '#F8FAFC',
  BORDER_COLOR: '#E2E8F0',
  WHITE: '#FFFFFF',
};

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleResetPassword = async () => {
    const cleanEmail = email.trim().toLowerCase();
    
    if (!cleanEmail) {
      Alert.alert('Required', 'Please enter your registered email address.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail }),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert(
          'Email Verified',
          'A password reset link has been generated. Please check your inbox.',
          [{ text: 'Back to Login', onPress: () => router.back() }]
        );
      } else {
        throw new Error(data.message || 'Something went wrong');
      }
    } catch (error: any) {
      Alert.alert('Request Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <MaterialCommunityIcons name="arrow-left" size={28} color={COLORS.DEEP_BLUE} />
          </TouchableOpacity>

          <View style={styles.headerSection}>
            <View style={styles.iconContainer}>
              <MaterialCommunityIcons name="lock-reset" size={60} color={COLORS.DEEP_BLUE} />
            </View>
            <Text style={styles.title}>Forgot Password?</Text>
            <Text style={styles.subtitle}>
              Enter your university email to verify your account and receive a reset link.
            </Text>
          </View>

          <View style={styles.formSection}>
            <Text style={styles.label}>Registered Email</Text>
            <View style={styles.inputContainer}>
              <MaterialCommunityIcons name="email-outline" size={20} color={COLORS.SLATE_GRAY} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="e.g., student@university.edu"
                placeholderTextColor="#94A3B8"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <TouchableOpacity 
              style={styles.resetButton} 
              onPress={handleResetPassword}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.WHITE} />
              ) : (
                <Text style={styles.resetButtonText}>Verify & Send Link</Text>
              )}
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.SOFT_WHITE },
  scrollContent: { padding: 24, flexGrow: 1 },
  backButton: { width: 40, height: 40, justifyContent: 'center', marginTop: 10 },
  headerSection: { alignItems: 'center', marginTop: 30, marginBottom: 40 },
  iconContainer: {
    width: 100, height: 100, borderRadius: 50, backgroundColor: COLORS.WHITE,
    justifyContent: 'center', alignItems: 'center', marginBottom: 20,
    elevation: 5, shadowColor: COLORS.DEEP_BLUE, shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1, shadowRadius: 15,
  },
  title: { fontSize: 26, fontWeight: '800', color: COLORS.DEEP_BLUE, marginBottom: 10 },
  subtitle: { fontSize: 14, color: COLORS.SLATE_GRAY, textAlign: 'center', lineHeight: 22, paddingHorizontal: 20 },
  formSection: { width: '100%' },
  label: { fontSize: 13, fontWeight: '700', color: COLORS.DEEP_BLUE, marginBottom: 8, marginLeft: 4 },
  inputContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.WHITE,
    borderRadius: 15, paddingHorizontal: 15, height: 60, borderWidth: 1, borderColor: COLORS.BORDER_COLOR,
    marginBottom: 30,
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 16, color: COLORS.DEEP_BLUE },
  resetButton: {
    backgroundColor: COLORS.DEEP_BLUE, height: 60, borderRadius: 15,
    justifyContent: 'center', alignItems: 'center', elevation: 8,
    shadowColor: COLORS.DEEP_BLUE, shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3, shadowRadius: 10,
  },
  resetButtonText: { color: COLORS.WHITE, fontSize: 18, fontWeight: '700' },
});