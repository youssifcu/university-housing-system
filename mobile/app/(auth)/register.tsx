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
  StatusBar
} from 'react-native';
import { useRouter } from 'expo-router';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../../firebaseConfig';

const DEEP_BLUE = '#1A237E';
const SLATE_GRAY = '#475569';
const SOFT_WHITE = '#F8FAFC';
const BORDER_COLOR = '#E2E8F0';

export default function RegisterScreen() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    console.log('📝 handleRegister called');
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    // Password: min 6 chars (Firebase default), at least one letter and one number
    const pwdRegex = /^(?=.*[a-zA-Z])(?=.*\d).{6,}$/;

    // Validation checks
    if (!fullName.trim()) {
      Alert.alert('Error', 'Please enter your full name');
      return;
    }

    if (!studentId.trim()) {
      Alert.alert('Error', 'Please enter your student ID');
      return;
    }

    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email');
      return;
    }

    if (!emailRegex.test(email.trim())) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (!pwdRegex.test(password)) {
      Alert.alert('Error', 'Password must contain letters and numbers');
      return;
    }

    if (!agreeToTerms) {
      Alert.alert('Error', 'You must agree to the Terms & Conditions');
      return;
    }

    setLoading(true);
    console.log('🔄 Starting registration with email:', email.trim());

    try {
      console.log('📲 Creating user in Firebase Auth...');
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );

      const user = userCredential.user;
      console.log('✅ User created in Auth:', user.uid);

      console.log('💾 Saving user profile to Firestore...');
      await setDoc(doc(db, 'users', user.uid), {
        fullName: fullName.trim(),
        studentId: studentId.trim(),
        email: user.email,
        role: 'student',
        createdAt: serverTimestamp(),
      });

      console.log('✅ User profile saved successfully');
      Alert.alert('Success', 'Account created! Please sign in.');
      router.replace('/login');
    } catch (error: any) {
      console.error('❌ Registration error:', error.code, error.message);
      
      let message = 'Something went wrong. Please try again.';

      if (error.code === 'auth/email-already-in-use') {
        message = 'This email is already registered. Please sign in or use a different email.';
      } else if (error.code === 'auth/invalid-email') {
        message = 'The email address is invalid.';
      } else if (error.code === 'auth/weak-password') {
        message = 'Password is too weak. Use at least 6 characters with letters and numbers.';
      } else if (error.code === 'auth/invalid-api-key') {
        message = 'Firebase configuration error. Please contact support.';
      } else if (error.code === 'auth/network-request-failed') {
        message = 'Network error. Please check your internet connection.';
      } else if (error.message) {
        message = error.message;
      }

      Alert.alert('Registration Failed', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
             <View style={styles.backArrow} />
          </TouchableOpacity>

          <View style={styles.headerSection}>
            <View style={styles.logoCircle}>
              <View style={styles.logoHat} />
              <View style={styles.logoBody} />
            </View>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Dorm Management System</Text>
          </View>

          <View style={styles.formSection}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput style={styles.input} placeholder="John Doe" value={fullName} onChangeText={setFullName} />

            <Text style={styles.label}>Student ID</Text>
            <TextInput style={styles.input} placeholder="123456" keyboardType="numeric" value={studentId} onChangeText={setStudentId} />

            <Text style={styles.label}>University Email</Text>
            <TextInput style={styles.input} placeholder="name@university.edu" autoCapitalize="none" value={email} onChangeText={setEmail} />

            <Text style={styles.label}>Password</Text>
            <View style={styles.passwordWrapper}>
              <TextInput style={styles.flexInput} secureTextEntry={!showPassword} placeholder="********" value={password} onChangeText={setPassword} />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Text style={styles.eyeText}>{showPassword ? 'Hide' : 'Show'}</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Confirm Password</Text>
            <TextInput style={styles.input} secureTextEntry placeholder="********" value={confirmPassword} onChangeText={setConfirmPassword} />

            <TouchableOpacity style={styles.termsContainer} onPress={() => setAgreeToTerms(!agreeToTerms)}>
              <View style={[styles.customCheckbox, agreeToTerms && styles.checkboxActive]}>
                {agreeToTerms && <View style={styles.checkMark} />}
              </View>
              <Text style={styles.termsText}>I agree to the Terms & Conditions</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.registerButton} onPress={handleRegister} disabled={loading}>
              {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.registerButtonText}>Register Now</Text>}
            </TouchableOpacity>

            <View style={styles.footerLinkContainer}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => router.push('/login')}>
                <Text style={styles.loginLink}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: SOFT_WHITE },
  scrollContent: { padding: 25 },
  backButton: { width: 40, height: 40, justifyContent: 'center' },
  backArrow: {
    width: 12,
    height: 12,
    borderLeftWidth: 3,
    borderBottomWidth: 3,
    borderColor: DEEP_BLUE,
    transform: [{ rotate: '45deg' }],
  },
  headerSection: { alignItems: 'center', marginBottom: 40 },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 25,
    backgroundColor: DEEP_BLUE,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: DEEP_BLUE,
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  logoHat: { width: 30, height: 15, backgroundColor: '#FFF', borderTopLeftRadius: 2, borderTopRightRadius: 2, marginBottom: 2 },
  logoBody: { width: 34, height: 6, backgroundColor: '#FFF', borderRadius: 10 },
  title: { fontSize: 28, fontWeight: '800', color: DEEP_BLUE, letterSpacing: -0.5 },
  subtitle: { fontSize: 15, color: SLATE_GRAY, marginTop: 5 },
  formSection: { marginTop: 10 },
  label: { fontSize: 11, fontWeight: '700', color: DEEP_BLUE, marginBottom: 8, marginTop: 18, textTransform: 'uppercase', opacity: 0.6 },
  input: { backgroundColor: '#FFF', borderRadius: 12, borderWidth: 1.5, borderColor: BORDER_COLOR, paddingHorizontal: 15, height: 52, fontSize: 16 },
  passwordWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 12, borderWidth: 1.5, borderColor: BORDER_COLOR, paddingHorizontal: 15 },
  flexInput: { flex: 1, height: 52, fontSize: 16 },
  eyeText: { color: DEEP_BLUE, fontSize: 12, fontWeight: 'bold', padding: 5 },
  termsContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 25 },
  customCheckbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: DEEP_BLUE, marginRight: 12, justifyContent: 'center', alignItems: 'center' },
  checkboxActive: { backgroundColor: DEEP_BLUE },
  checkMark: { width: 10, height: 5, borderLeftWidth: 2, borderBottomWidth: 2, borderColor: '#FFF', transform: [{ rotate: '-45deg' }], marginTop: -2 },
  termsText: { color: SLATE_GRAY, fontSize: 14, fontWeight: '500' },
  registerButton: { 
    backgroundColor: DEEP_BLUE, 
    borderRadius: 15, 
    height: 56, 
    justifyContent: 'center', 
    alignItems: 'center', 
    shadowColor: DEEP_BLUE,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
    marginBottom: 25
  },
  registerButtonText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  footerLinkContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 30 },
  footerText: { color: SLATE_GRAY, fontSize: 15 },
  loginLink: { color: DEEP_BLUE, fontSize: 15, fontWeight: '800' }
});