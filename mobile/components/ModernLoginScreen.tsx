/**
 * MODERN LOGIN SCREEN EXAMPLE
 * 
 * This is a reference implementation showing modern UI patterns:
 * - Clean, minimal design
 * - Proper spacing and typography
 * - Smooth animations
 * - Professional color scheme
 * - Better UX with feedback
 * 
 * You can copy parts of this into your actual login.tsx
 */

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
  Animated,
  Dimensions,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const { width, height } = Dimensions.get('window');

// MODERN COLOR PALETTE
const COLORS = {
  primary: '#6366F1',        // Indigo (professional, modern)
  primaryDark: '#4F46E5',    // Darker indigo
  secondary: '#EC4899',      // Pink accent
  background: '#FFFFFF',
  surface: '#F8FAFC',        // Soft gray
  text: '#1E293B',           // Dark slate
  textLight: '#64748B',      // Medium slate
  textLighter: '#CBD5E1',    // Light slate
  border: '#E2E8F0',         // Border color
  error: '#EF4444',
  success: '#10B981',
};

// MODERN TYPOGRAPHY
const FONTS = {
  headingLarge: { fontSize: 32, fontWeight: 700 as const, letterSpacing: -1 },
  headingMedium: { fontSize: 24, fontWeight: 700 as const, letterSpacing: -0.5 },
  body: { fontSize: 16, fontWeight: 400 as const, lineHeight: 24 },
  label: { fontSize: 14, fontWeight: 600 as const },
  small: { fontSize: 12, fontWeight: 400 as const },
};

const ModernLoginScreen = () => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focusedInput, setFocusedInput] = useState<'email' | 'password' | null>(null);

  // Animation for button press
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Missing Information', 'Please enter both email and password');
      return;
    }

    if (!email.includes('@')) {
      Alert.alert('Invalid Email', 'Please enter a valid email address');
      return;
    }

    setLoading(true);
    // Simulate Firebase call
    setTimeout(() => {
      setLoading(false);
      Alert.alert('Success', 'Logged in successfully!');
      router.replace('/profile');
    }, 2000);
  };

  // INPUT COMPONENT (REUSABLE)
  const ModernTextInput = ({
    label,
    value,
    onChangeText,
    placeholder,
    icon,
    isPassword = false,
    focused,
  }: {
    label: string;
    value: string;
    onChangeText: (text: string) => void;
    placeholder: string;
    icon: string & keyof typeof MaterialCommunityIcons.glyphMap;
    isPassword?: boolean;
    focused: boolean;
  }) => (
    <View style={styles.inputGroup}>
      <Text style={[styles.label, { color: focused ? COLORS.primary : COLORS.textLight }]}>
        {label}
      </Text>
      <View
        style={[
          styles.inputContainer,
          focused && styles.inputContainerFocused,
          !focused && styles.inputContainerDefault,
        ]}
      >
        <MaterialCommunityIcons name={icon as any} size={20} color={focused ? COLORS.primary : COLORS.textLight} style={styles.icon} />
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={COLORS.textLighter}
          secureTextEntry={isPassword && !showPassword}
          autoCapitalize="none"
          keyboardType={isPassword ? 'default' : 'email-address'}
          onFocus={() => setFocusedInput(isPassword ? 'password' : 'email')}
          onBlur={() => setFocusedInput(null)}
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

  // BUTTON COMPONENT (REUSABLE)
  const ModernButton = ({
    onPress,
    loading,
    text,
  }: {
    onPress: () => void;
    loading: boolean;
    text: string;
  }) => (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onPress}
        disabled={loading}
        activeOpacity={0.8}
        style={[styles.button, loading && { opacity: 0.7 }]}
      >
        {loading ? (
          <ActivityIndicator color={COLORS.background} size="small" />
        ) : (
          <Text style={styles.buttonText}>{text}</Text>
        )}
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* HEADER */}
          <View style={styles.header}>
            {/* GRADIENT CIRCLE */}
            <View style={styles.gradientCircle} />

            {/* ICON */}
            <View style={styles.iconContainer}>
              <MaterialCommunityIcons name="school" size={60} color={COLORS.background} />
            </View>

            {/* TITLE */}
            <Text style={[styles.title, FONTS.headingLarge] as any}>Welcome Back</Text>
            <Text style={[styles.subtitle, FONTS.body, { color: COLORS.textLight }] as any}>
              Sign in to your university housing account
            </Text>
          </View>

          {/* FORM */}
          <View style={styles.form}>
            <ModernTextInput
              label="Email Address"
              value={email}
              onChangeText={setEmail}
              placeholder="student@university.edu"
              icon="email-outline"
              focused={focusedInput === 'email'}
            />

            <ModernTextInput
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your password"
              icon="lock-outline"
              isPassword
              focused={focusedInput === 'password'}
            />

            {/* FORGOT PASSWORD */}
            <TouchableOpacity style={styles.forgotContainer}>
              <Text style={[styles.forgotText, FONTS.label] as any}>Forgot Password?</Text>
            </TouchableOpacity>

            {/* LOGIN BUTTON */}
            <ModernButton onPress={handleLogin} loading={loading} text="Sign In" />

            {/* DIVIDER */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={[{ color: COLORS.textLight }, FONTS.small] as any}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* SIGN UP LINK */}
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => router.push('/register')}
            >
              <Text style={[styles.secondaryButtonText, FONTS.label] as any}>
                Don't have an account? Sign Up
              </Text>
            </TouchableOpacity>
          </View>

          {/* FOOTER */}
          <View style={styles.footer}>
            <Text style={[{ color: COLORS.textLighter }, FONTS.small] as any}>
              By signing in, you agree to our Terms & Privacy Policy
            </Text>
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
    paddingTop: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 50,
    position: 'relative',
    minHeight: 280,
    justifyContent: 'center',
  },
  gradientCircle: {
    position: 'absolute',
    top: -60,
    right: -40,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: COLORS.primary,
    opacity: 0.1,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 8,
    zIndex: 10,
  },
  title: {
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    textAlign: 'center',
    maxWidth: 280,
  },
  form: {
    marginBottom: 40,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    color: COLORS.text,
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
    backgroundColor: COLORS.surface,
  },
  inputContainerDefault: {
    borderColor: COLORS.border,
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
  forgotContainer: {
    alignItems: 'flex-end',
    marginBottom: 24,
  },
  forgotText: {
    color: COLORS.primary,
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
  },
  buttonText: {
    color: COLORS.background,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 32,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  secondaryButton: {
    height: 56,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
  },
  secondaryButtonText: {
    color: COLORS.primary,
    letterSpacing: 0.5,
  },
  footer: {
    alignItems: 'center',
    marginTop: 'auto',
  },
});

export default ModernLoginScreen;
