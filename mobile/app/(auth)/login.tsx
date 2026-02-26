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
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useLanguage } from '@/contexts/LanguageContext';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../firebaseConfig';


const COLORS = {
  DEEP_BLUE: '#1A237E',
  SLATE_GRAY: '#475569',
  SOFT_WHITE: '#F8FAFC',
  BORDER_COLOR: '#E2E8F0',
  ERROR_COLOR: '#DC2626',
  WHITE: '#FFFFFF',
};

export default function LoginScreen() {
  const router = useRouter();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const { language, toggle, t } = useLanguage();

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email.trim()) {
      newErrors.email = t('emailRequired');
    } else if (!email.includes('@')) {
      newErrors.email = t('invalidEmail');
    }

    if (!password) {
      newErrors.password = t('passwordRequired');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    console.log('🔐 Login attempt with email:', email.trim());
    
    if (!validateForm()) {
      console.log('❌ Validation failed');
      return;
    }

    setLoading(true);

    try {
      console.log('📲 Authenticating with Firebase...');
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );

      console.log('✅ Login successful:', userCredential.user.uid);
      Alert.alert('Success', 'Welcome back!');
      router.replace('/profile');
    } catch (error: any) {
      console.error('❌ Login error:', error.code, error.message);
      
      let message = 'Login failed. Please try again.';

      if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found') {
        message = 'Invalid email or password.';
      } else if (error.code === 'auth/user-disabled') {
        message = 'This account has been disabled.';
      } else if (error.code === 'auth/invalid-email') {
        message = 'Invalid email format.';
      } else if (error.code === 'auth/network-request-failed') {
        message = 'Network error. Please check your connection.';
      } else if (error.code === 'auth/invalid-api-key') {
        message = 'Firebase configuration error. Please contact support.';
      }

      Alert.alert('Login Failed', message);
    } finally {
      setLoading(false);
    }
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
              <MaterialCommunityIcons name="school" size={50} color={COLORS.DEEP_BLUE} />
            </View>
            <Text style={styles.title}>{t('loginTitle')}</Text>
            <Text style={styles.subtitle}>{t('loginSubtitle')}</Text>
            <TouchableOpacity style={styles.langSwitch} onPress={toggle}>
              <Text style={styles.langText}>{t('switchLanguage')}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.formSection}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('studentEmail')}</Text>
              <View style={[styles.inputContainer, errors.email && styles.inputError]}>
                <MaterialCommunityIcons name="email-outline" size={20} color={COLORS.SLATE_GRAY} style={styles.icon} />
                <TextInput
                  style={styles.input}
                  placeholder="student@university.edu"
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    if (errors.email) setErrors({ ...errors, email: undefined });
                  }}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>
              {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('password')}</Text>
              <View style={[styles.inputContainer, errors.password && styles.inputError]}>
                <MaterialCommunityIcons name="lock-outline" size={20} color={COLORS.SLATE_GRAY} style={styles.icon} />
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (errors.password) setErrors({ ...errors, password: undefined });
                  }}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <MaterialCommunityIcons 
                    name={showPassword ? "eye-off" : "eye"} 
                    size={20} 
                    color={COLORS.SLATE_GRAY} 
                  />
                </TouchableOpacity>
              </View>
              {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
            </View>

            <View style={styles.row}>
              <TouchableOpacity 
                style={styles.checkboxRow} 
                onPress={() => setRememberMe(!rememberMe)}
              >
                <MaterialCommunityIcons 
                  name={rememberMe ? "checkbox-marked" : "checkbox-blank-outline"} 
                  size={22} 
                  color={COLORS.DEEP_BLUE} 
                />
                <Text style={styles.smallText}>Remember Me</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => router.push('/forgot')}>
                <Text style={[styles.smallText, { color: COLORS.DEEP_BLUE, fontWeight: '700' }]}>{t('forgotPassword')}</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              style={[styles.mainButton, loading && { opacity: 0.7 }]} 
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.WHITE} />
              ) : (
                <Text style={styles.buttonText}>{t('loginButton')}</Text>
              )}
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={styles.line} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.line} />
            </View>

            <TouchableOpacity 
              style={styles.secondaryButton}
              onPress={() => router.push('/register')}
            >
              <Text style={styles.secondaryButtonText}>{t('createAccount')}</Text>
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
  title: { fontSize: 28, fontWeight: '800', color: COLORS.DEEP_BLUE, letterSpacing: 0.5 },
  subtitle: { fontSize: 16, color: COLORS.SLATE_GRAY, marginTop: 5 },
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
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 },
  checkboxRow: { flexDirection: 'row', alignItems: 'center' },
  smallText: { fontSize: 14, color: COLORS.SLATE_GRAY, marginLeft: 8 },
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
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 25 },
  line: { flex: 1, height: 1, backgroundColor: COLORS.BORDER_COLOR },
  dividerText: { marginHorizontal: 10, color: COLORS.SLATE_GRAY, fontWeight: '600' },
  secondaryButton: {
    height: 55,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.DEEP_BLUE,
  },
  secondaryButtonText: { color: COLORS.DEEP_BLUE, fontSize: 16, fontWeight: '700' },
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