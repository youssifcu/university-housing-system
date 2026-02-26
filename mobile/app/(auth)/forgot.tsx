import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLanguage } from '@/contexts/LanguageContext';

const COLORS = {
  DEEP_BLUE: '#1A237E',
  SLATE_GRAY: '#475569',
  SOFT_WHITE: '#F8FAFC',
  BORDER_COLOR: '#E2E8F0',
  ERROR_COLOR: '#DC2626',
  WHITE: '#FFFFFF',
};

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { t, toggle } = useLanguage();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const validate = () => {
    if (!email.trim()) {
      setError(t('emailRequired'));
      return false;
    }
    if (!email.includes('@')) {
      setError(t('invalidEmail'));
      return false;
    }
    setError(undefined);
    return true;
  };

  const handleSend = () => {
    if (!validate()) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      Alert.alert('Success', 'If an account exists we sent a reset link');
      router.replace('/(auth)/login');
    }, 1500);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.headerSection}>
            <View style={styles.logoContainer}>
              <MaterialCommunityIcons name="lock-reset" size={50} color={COLORS.DEEP_BLUE} />
            </View>
            <Text style={styles.title}>{t('resetTitle')}</Text>
            <Text style={styles.subtitle}>{t('resetSubtitle')}</Text>
            <TouchableOpacity style={styles.langSwitch} onPress={toggle}>
              <Text style={styles.langText}>{t('switchLanguage')}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.formSection}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('studentEmail')}</Text>
              <View style={[styles.inputContainer, error && styles.inputError]}>
                <MaterialCommunityIcons name="email-outline" size={20} color={COLORS.SLATE_GRAY} style={styles.icon} />
                <TextInput
                  style={styles.input}
                  placeholder="student@university.edu"
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    if (error) setError(undefined);
                  }}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>
              {error && <Text style={styles.errorText}>{error}</Text>}
            </View>

            <TouchableOpacity
              style={[styles.mainButton, loading && { opacity: 0.7 }]}
              onPress={handleSend}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.WHITE} />
              ) : (
                <Text style={styles.buttonText}>{t('sendReset')}</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.replace('/(auth)/login')} style={styles.backLink}>
              <Text style={styles.backLinkText}>{t('backToLogin')}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.SOFT_WHITE },
  keyboardView: { flex: 1 },
  scrollContent: { flexGrow: 1, padding: 24, justifyContent: 'center' },
  headerSection: { alignItems: 'center', marginBottom: 40, position: 'relative' },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.WHITE,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10 },
      android: { elevation: 5 },
    }),
  },
  title: { fontSize: 24, fontWeight: '800', color: COLORS.DEEP_BLUE, letterSpacing: 0.5 },
  subtitle: { fontSize: 14, color: COLORS.SLATE_GRAY, marginTop: 5, textAlign: 'center' },
  formSection: { width: '100%' },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '700', color: COLORS.DEEP_BLUE, marginBottom: 8, marginLeft: 4 },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.WHITE,
    borderRadius: 15,
    paddingHorizontal: 15,
    height: 55,
    borderWidth: 1,
    borderColor: COLORS.BORDER_COLOR,
  },
  inputError: { borderColor: COLORS.ERROR_COLOR },
  icon: { marginRight: 10 },
  input: { flex: 1, fontSize: 16, color: COLORS.DEEP_BLUE },
  errorText: { color: COLORS.ERROR_COLOR, fontSize: 12, marginTop: 5, marginLeft: 5 },
  mainButton: {
    backgroundColor: COLORS.DEEP_BLUE,
    height: 55,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.DEEP_BLUE,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  buttonText: { color: COLORS.WHITE, fontSize: 18, fontWeight: '700' },
  backLink: { marginTop: 20, alignSelf: 'center' },
  backLinkText: { color: COLORS.DEEP_BLUE, fontSize: 14, fontWeight: '600' },
  langSwitch: {
    position: 'absolute',
    top: 10,
    right: 10,
    padding: 6,
  },
  langText: {
    color: COLORS.DEEP_BLUE,
    fontSize: 14,
    fontWeight: '600',
  },
});
