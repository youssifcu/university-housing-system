/**
 * MODERN REGISTRATION SCREEN EXAMPLE
 * 
 * Professional, modern sign-up flow with:
 * - Step-by-step validation feedback
 * - Password strength indicator
 * - Smooth interactions
 * - Clean typography and spacing
 */

import React, { useState, useMemo } from 'react';
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
  Dimensions,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

// MODERN COLOR PALETTE
const COLORS = {
  primary: '#6366F1',
  primaryDark: '#4F46E5',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  background: '#FFFFFF',
  surface: '#F8FAFC',
  text: '#1E293B',
  textLight: '#64748B',
  textLighter: '#CBD5E1',
  border: '#E2E8F0',
};

const FONTS = {
  headingLarge: { fontSize: 28, fontWeight: 700 as const, letterSpacing: -1 },
  body: { fontSize: 16, fontWeight: 400 as const, lineHeight: 24 },
  label: { fontSize: 14, fontWeight: 600 as const },
  small: { fontSize: 12, fontWeight: 400 as const },
};

// PASSWORD STRENGTH CHECKER
const getPasswordStrength = (password: string): 'weak' | 'fair' | 'strong' => {
  if (password.length < 6) return 'weak';
  const hasUpperCase = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);

  if (hasUpperCase && hasNumber && hasSpecial) return 'strong';
  if ((hasUpperCase && hasNumber) || (hasNumber && hasSpecial)) return 'fair';
  return 'weak';
};

const ModernRegisterScreen = () => {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const passwordStrength = useMemo(() => getPasswordStrength(password), [password]);

  const getStrengthColor = () => {
    switch (passwordStrength) {
      case 'strong':
        return COLORS.success;
      case 'fair':
        return COLORS.warning;
      default:
        return COLORS.error;
    }
  };

  const canSubmit = () => {
    return (
      fullName.trim() &&
      studentId.trim() &&
      email.includes('@') &&
      password.length >= 6 &&
      password === confirmPassword &&
      agreeToTerms
    );
  };

  const handleRegister = async () => {
    if (!canSubmit()) {
      Alert.alert('Incomplete Form', 'Please fill all fields correctly');
      return;
    }

    setLoading(true);
    // Simulate Firebase call
    setTimeout(() => {
      setLoading(false);
      Alert.alert('Welcome!', 'Account created successfully. Sign in to continue.');
      router.replace('/login');
    }, 2000);
  };

  // INPUT COMPONENT
  const ModernInput = ({
    label,
    value,
    onChangeText,
    placeholder,
    icon,
    keyboardType = 'default',
    isPassword = false,
  }: {
    label: string;
    value: string;
    onChangeText: (text: string) => void;
    placeholder: string;
    icon: string & keyof typeof MaterialCommunityIcons.glyphMap;
    keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
    isPassword?: boolean;
  }) => {
    const isFocused = focusedField === label;
    const [showPassword, setShowPassword] = useState(false);

    return (
      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: isFocused ? COLORS.primary : COLORS.text }]}>
          {label}
        </Text>
        <View
          style={[
            styles.inputContainer,
            isFocused && styles.inputContainerFocused,
          ]}
        >
          <MaterialCommunityIcons
            name={icon as any}
            size={20}
            color={isFocused ? COLORS.primary : COLORS.textLight}
            style={styles.icon}
          />
          <TextInput
            style={styles.input}
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor={COLORS.textLighter}
            keyboardType={keyboardType}
            secureTextEntry={isPassword && !showPassword}
            autoCapitalize="none"
            onFocus={() => setFocusedField(label)}
            onBlur={() => setFocusedField(null)}
          />
          {isPassword && (
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <MaterialCommunityIcons
                name={showPassword ? 'eye-off' : 'eye'}
                size={20}
                color={COLORS.textLight}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* HEADER */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.primary} />
            </TouchableOpacity>

            <Text style={[styles.title, FONTS.headingLarge] as any}>Create Account</Text>
            <Text style={[styles.subtitle, FONTS.body, { color: COLORS.textLight }] as any}>
              Join the university housing network
            </Text>
          </View>

          {/* FORM */}
          <View style={styles.form}>
            <ModernInput
              label="Full Name"
              value={fullName}
              onChangeText={setFullName}
              placeholder="John Doe"
              icon="account"
            />

            <ModernInput
              label="Student ID"
              value={studentId}
              onChangeText={setStudentId}
              placeholder="123456"
              icon="card-account-details"
              keyboardType="numeric"
            />

            <ModernInput
              label="Email Address"
              value={email}
              onChangeText={setEmail}
              placeholder="student@university.edu"
              icon="email-outline"
              keyboardType="email-address"
            />

            <ModernInput
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="Create a strong password"
              icon="lock-outline"
              isPassword
            />

            {/* PASSWORD STRENGTH INDICATOR */}
            {password.length > 0 && (
              <View style={styles.strengthContainer}>
                <View
                  style={[
                    styles.strengthBar,
                    {
                      width: `${(password.length / 12) * 100}%`,
                      backgroundColor: getStrengthColor(),
                    },
                  ]}
                />
              </View>
            )}

            <ModernInput
              label="Confirm Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Re-enter your password"
              icon="lock-check-outline"
              isPassword
            />

            {/* PASSWORD MATCH INDICATOR */}
            {confirmPassword.length > 0 && (
              <View style={styles.matchContainer}>
                <MaterialCommunityIcons
                  name={password === confirmPassword ? 'check-circle' : 'alert-circle'}
                  size={16}
                  color={
                    password === confirmPassword ? COLORS.success : COLORS.error
                  }
                />
                <Text
                  style={[
                    styles.matchText,
                    {
                      color:
                        password === confirmPassword
                          ? COLORS.success
                          : COLORS.error,
                    },
                  ]}
                >
                  {password === confirmPassword
                    ? 'Passwords match'
                    : 'Passwords do not match'}
                </Text>
              </View>
            )}

            {/* TERMS CHECKBOX */}
            <TouchableOpacity
              style={styles.termsContainer}
              onPress={() => setAgreeToTerms(!agreeToTerms)}
            >
              <View
                style={[
                  styles.checkbox,
                  agreeToTerms && styles.checkboxChecked,
                ]}
              >
                {agreeToTerms && (
                  <MaterialCommunityIcons
                    name="check"
                    size={16}
                    color={COLORS.background}
                  />
                )}
              </View>
              <Text style={[styles.termsText, FONTS.small] as any}>
                I agree to the{' '}
                <Text style={{ fontWeight: 700, color: COLORS.primary }}>
                  Terms & Conditions
                </Text>
              </Text>
            </TouchableOpacity>

            {/* SIGN UP BUTTON */}
            <TouchableOpacity
              style={[
                styles.button,
                !canSubmit() && styles.buttonDisabled,
              ]}
              onPress={handleRegister}
              disabled={!canSubmit() || loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.background} size="small" />
              ) : (
                <Text style={styles.buttonText}>Create Account</Text>
              )}
            </TouchableOpacity>

            {/* SIGN IN LINK */}
            <View style={styles.signInContainer}>
              <Text style={[{ color: COLORS.textLight }, FONTS.body] as any}>
                Already have an account?{' '}
              </Text>
              <TouchableOpacity onPress={() => router.push('/login')}>
                <Text style={[{ color: COLORS.primary, fontWeight: 700 }, FONTS.body] as any}>
                  Sign In
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  header: {
    marginBottom: 32,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: {
    color: COLORS.text,
    marginBottom: 8,
  },
  subtitle: {
    color: COLORS.textLight,
  },
  form: {
    marginBottom: 32,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 56,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  inputContainerFocused: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.background,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  icon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '500',
  },
  strengthContainer: {
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    marginBottom: 12,
    overflow: 'hidden',
  },
  strengthBar: {
    height: '100%',
    borderRadius: 2,
  },
  matchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: -8,
    marginLeft: 4,
  },
  matchText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  checkboxChecked: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  termsText: {
    color: COLORS.textLight,
    flex: 1,
  },
  button: {
    backgroundColor: COLORS.primary,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 6,
    marginBottom: 20,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: COLORS.background,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  signInContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ModernRegisterScreen;
