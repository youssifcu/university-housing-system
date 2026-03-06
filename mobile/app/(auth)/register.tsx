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
  StatusBar,
  Image
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import BACKEND_URL from '../../config/backend';

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
  const [phoneNumber, setPhoneNumber] = useState('');
  const [universityYear, setUniversityYear] = useState('');
  const [faculty, setFaculty] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });
    if (!result.canceled) setImageUri(result.assets[0].uri);
  };

  const handleRegister = async () => {
    if (!fullName || !studentId || !email || !password || !universityYear || !faculty) {
      Alert.alert('Required', 'Please fill in all mandatory fields.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match.');
      return;
    }

    if (!agreeToTerms) {
      Alert.alert('Warning', 'You must agree to the Terms & Conditions.');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('name', fullName.trim());
      formData.append('studentId', studentId.trim());
      formData.append('email', email.trim().toLowerCase());
      formData.append('password', password);
      formData.append('phoneNumber', phoneNumber.trim());
      formData.append('universityYear', universityYear);
      formData.append('faculty', faculty.trim());

      if (imageUri) {
        const filename = imageUri.split('/').pop();
        const match = /\.(\w+)$/.exec(filename || '');
        const type = match ? `image/${match[1]}` : `image`;
        
        formData.append('profilePicture', {
          uri: Platform.OS === 'android' ? imageUri : imageUri.replace('file://', ''),
          name: filename,
          type,
        } as any);
      }

      const response = await fetch(`${BACKEND_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert('Success', 'Account created successfully!');
        router.replace('/(auth)/login');
      } else {
        throw new Error(data.message || 'Registration failed');
      }

    } catch (error: any) {
      Alert.alert('Registration Error', error.message);
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
             <MaterialCommunityIcons name="arrow-left" size={28} color={DEEP_BLUE} />
          </TouchableOpacity>

          <View style={styles.headerSection}>
            <TouchableOpacity onPress={pickImage} style={styles.logoCircle}>
              {imageUri ? (
                <Image source={{ uri: imageUri }} style={styles.profileImg} />
              ) : (
                <View style={styles.logoPlaceholder}>
                  <MaterialCommunityIcons name="camera-plus" size={35} color="#FFF" />
                </View>
              )}
            </TouchableOpacity>
            <Text style={styles.title}>Student Register</Text>
            <Text style={styles.subtitle}>Join University Dorm System</Text>
          </View>

          <View style={styles.formSection}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput style={styles.input} placeholder="Ahmed Ali" value={fullName} onChangeText={setFullName} />

            <View style={styles.row}>
                <View style={{ flex: 1, marginRight: 10 }}>
                    <Text style={styles.label}>Student ID</Text>
                    <TextInput style={styles.input} placeholder="2024001" keyboardType="numeric" value={studentId} onChangeText={setStudentId} />
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={styles.label}>Univ. Year</Text>
                    <TextInput style={styles.input} placeholder="1-7" keyboardType="numeric" value={universityYear} onChangeText={setUniversityYear} />
                </View>
            </View>

            <Text style={styles.label}>Faculty</Text>
            <TextInput style={styles.input} placeholder="Engineering" value={faculty} onChangeText={setFaculty} />

            <Text style={styles.label}>Phone Number</Text>
            <TextInput style={styles.input} placeholder="01xxxxxxxxx" keyboardType="phone-pad" value={phoneNumber} onChangeText={setPhoneNumber} />

            <Text style={styles.label}>University Email</Text>
            <TextInput style={styles.input} placeholder="name@university.edu" autoCapitalize="none" value={email} onChangeText={setEmail} />

            <Text style={styles.label}>Password</Text>
            <View style={styles.passwordWrapper}>
              <TextInput 
                style={styles.flexInput} 
                secureTextEntry={!showPassword} 
                placeholder="********" 
                value={password} 
                onChangeText={setPassword} 
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <MaterialCommunityIcons name={showPassword ? "eye-off" : "eye"} size={20} color={DEEP_BLUE} />
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Confirm Password</Text>
            <TextInput style={styles.input} secureTextEntry placeholder="********" value={confirmPassword} onChangeText={setConfirmPassword} />

            <TouchableOpacity style={styles.termsContainer} onPress={() => setAgreeToTerms(!agreeToTerms)}>
              <View style={[styles.customCheckbox, agreeToTerms && styles.checkboxActive]}>
                {agreeToTerms && <MaterialCommunityIcons name="check" size={14} color="#FFF" />}
              </View>
              <Text style={styles.termsText}>I agree to the Terms & Conditions</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.registerButton} onPress={handleRegister} disabled={loading}>
              {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.registerButtonText}>Register Now</Text>}
            </TouchableOpacity>

            <View style={styles.footerLinkContainer}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
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
  headerSection: { alignItems: 'center', marginBottom: 20 },
  logoCircle: {
    width: 90, height: 90, borderRadius: 45, backgroundColor: DEEP_BLUE,
    justifyContent: 'center', alignItems: 'center', marginBottom: 15,
    overflow: 'hidden', elevation: 10, shadowColor: DEEP_BLUE, shadowOpacity: 0.3, shadowRadius: 10,
  },
  profileImg: { width: '100%', height: '100%' },
  logoPlaceholder: { alignItems: 'center' },
  title: { fontSize: 26, fontWeight: '800', color: DEEP_BLUE },
  subtitle: { fontSize: 14, color: SLATE_GRAY, marginTop: 5 },
  formSection: { marginTop: 5 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  label: { fontSize: 10, fontWeight: '700', color: DEEP_BLUE, marginBottom: 5, marginTop: 12, textTransform: 'uppercase', opacity: 0.6 },
  input: { backgroundColor: '#FFF', borderRadius: 12, borderWidth: 1.5, borderColor: BORDER_COLOR, paddingHorizontal: 15, height: 50, fontSize: 15, color: DEEP_BLUE },
  passwordWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 12, borderWidth: 1.5, borderColor: BORDER_COLOR, paddingHorizontal: 15, height: 50 },
  flexInput: { flex: 1, fontSize: 15, color: DEEP_BLUE },
  termsContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  customCheckbox: { width: 20, height: 20, borderRadius: 6, borderWidth: 2, borderColor: DEEP_BLUE, marginRight: 10, justifyContent: 'center', alignItems: 'center' },
  checkboxActive: { backgroundColor: DEEP_BLUE },
  termsText: { color: SLATE_GRAY, fontSize: 13, fontWeight: '500' },
  registerButton: { 
    backgroundColor: DEEP_BLUE, borderRadius: 15, height: 55, 
    justifyContent: 'center', alignItems: 'center', elevation: 6, marginBottom: 20
  },
  registerButtonText: { color: '#FFF', fontSize: 17, fontWeight: 'bold' },
  footerLinkContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  footerText: { color: SLATE_GRAY, fontSize: 14 },
  loginLink: { color: DEEP_BLUE, fontSize: 14, fontWeight: '800' }
});