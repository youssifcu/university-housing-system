import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, KeyboardAvoidingView,
  TouchableOpacity, TextInput, ScrollView, Platform, Alert, ActivityIndicator, Image
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { createUserWithEmailAndPassword, deleteUser, updateProfile } from 'firebase/auth';
import { auth } from '../../config/firebase';
import BACKEND_URL from '../../config/backend';

const DEEP_BLUE = '#1A237E';
const SOFT_WHITE = '#F8FAFC';
const BORDER_COLOR = '#E2E8F0';
const SLATE_GRAY = '#64748B';

export default function RegisterScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [imageUri, setImageUri] = useState(null);
  const [imageBase64, setImageBase64] = useState('');

  const [form, setForm] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    phoneNumber: '',
    studentId: '',
    nationalId: '',
    universityYear: '',
    faculty: ''
  });

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.4,
      base64: true,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
      setImageBase64(`data:image/jpeg;base64,${result.assets[0].base64}`);
    }
  };

  const validateStep1 = () => {
    const { name, email, password, confirmPassword, phoneNumber } = form;
    if (!name || !email || !password || !confirmPassword || !phoneNumber) {
      Alert.alert('Error', 'Please fill all account details');
      return false;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return false;
    }
    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return false;
    }
    return true;
  };

  const handleRegister = async () => {
    const {
      email, password, name, phoneNumber,
      studentId, nationalId, universityYear, faculty
    } = form;

    if (!studentId || !nationalId || !universityYear || !faculty) {
      Alert.alert('Error', 'Please fill all university details');
      return;
    }

    setLoading(true);
    let firebaseUser = null;

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
      firebaseUser = userCredential.user;
      await updateProfile(firebaseUser, { displayName: name });

      const idToken = await firebaseUser.getIdToken();

      const formData = new FormData();
      formData.append('firebaseUid', firebaseUser.uid);
      formData.append('email', firebaseUser.email || '');
      formData.append('name', name.trim());
      formData.append('phoneNumber', phoneNumber);
      formData.append('studentId', studentId);
      formData.append('nationalId', nationalId);
      formData.append('universityYear', universityYear.toString());
      formData.append('faculty', faculty.trim());

      if (imageUri) {
        formData.append('profilePicture', {
          uri: imageUri,
          name: 'photo.jpg',
          type: 'image/jpeg'
        } as any);
      }

      const response = await fetch(`${BACKEND_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Accept': 'application/json'
        },
        body: formData,
      });

      const data = await response.json();

      if (response.ok && data.success) {
        Alert.alert('Success', 'Account created successfully!', [
          { text: 'Continue', onPress: () => router.replace('/(student)') }
        ]);
      } else {
        if (firebaseUser) await deleteUser(firebaseUser);
        throw new Error(data.message || 'Registration failed');
      }
    } catch (error) {
      if (firebaseUser) await deleteUser(firebaseUser).catch(() => { });
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const renderInput = (label, value, key, placeholder, options = {}) => (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={(v) => setForm({ ...form, [key]: v })}
        placeholder={placeholder}
        {...options}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

          <View style={styles.stepper}>
            <View style={[styles.stepCircle, step >= 1 && styles.activeStep]}>
              <Text style={styles.stepNum}>1</Text>
            </View>
            <View style={[styles.stepLine, step >= 2 && styles.activeLine]} />
            <View style={[styles.stepCircle, step >= 2 && styles.activeStep]}>
              <Text style={styles.stepNum}>2</Text>
            </View>
          </View>

          <View style={styles.header}>
            <TouchableOpacity onPress={pickImage} style={styles.imagePicker}>
              {imageUri ? (
                <Image source={{ uri: imageUri }} style={styles.profileImage} />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <MaterialCommunityIcons name="camera-plus" size={30} color={DEEP_BLUE} />
                </View>
              )}
            </TouchableOpacity>
            <Text style={styles.title}>{step === 1 ? 'Account Info' : 'University Info'}</Text>
            <Text style={styles.subtitle}>{step === 1 ? 'Basic contact details' : 'Academic information'}</Text>
          </View>

          <View style={styles.form}>
            {step === 1 ? (
              <>
                {renderInput('Full Name', form.name, 'name', 'Enter your full name')}
                {renderInput('Email Address', form.email, 'email', 'example@mail.com', { autoCapitalize: 'none', keyboardType: 'email-address' })}
                {renderInput('Phone Number', form.phoneNumber, 'phoneNumber', '01xxxxxxxxx', { keyboardType: 'phone-pad' })}
                {renderInput('Password', form.password, 'password', '••••••••', { secureTextEntry: true })}
                {renderInput('Confirm Password', form.confirmPassword, 'confirmPassword', '••••••••', { secureTextEntry: true })}

                <TouchableOpacity style={styles.btn} onPress={() => validateStep1() && setStep(2)}>
                  <Text style={styles.btnText}>Next Step</Text>
                  <MaterialCommunityIcons name="arrow-right" size={20} color="#FFF" />
                </TouchableOpacity>
              </>
            ) : (
              <>
                {renderInput('Student ID', form.studentId, 'studentId', 'University ID Number')}
                {renderInput('National ID', form.nationalId, 'nationalId', '14-digit number', { keyboardType: 'numeric', maxLength: 14 })}
                {renderInput('University Year', form.universityYear, 'universityYear', 'e.g. 1, 2, 3', { keyboardType: 'numeric' })}
                {renderInput('Faculty', form.faculty, 'faculty', 'e.g. Engineering')}

                <View style={styles.footerBtns}>
                  <TouchableOpacity style={[styles.btn, styles.backBtn]} onPress={() => setStep(1)}>
                    <Text style={[styles.btnText, { color: DEEP_BLUE }]}>Back</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={[styles.btn, { flex: 2 }]} onPress={handleRegister} disabled={loading}>
                    {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.btnText}>Register Now</Text>}
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: SOFT_WHITE },
  scroll: { padding: 25, flexGrow: 1 },
  stepper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 30 },
  stepCircle: { width: 30, height: 30, borderRadius: 15, backgroundColor: BORDER_COLOR, justifyContent: 'center', alignItems: 'center' },
  activeStep: { backgroundColor: DEEP_BLUE },
  stepNum: { color: '#FFF', fontWeight: 'bold', fontSize: 12 },
  stepLine: { width: 40, height: 2, backgroundColor: BORDER_COLOR, marginHorizontal: 10 },
  activeLine: { backgroundColor: DEEP_BLUE },
  header: { alignItems: 'center', marginBottom: 25 },
  imagePicker: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#FFF', borderWidth: 1, borderColor: BORDER_COLOR, justifyContent: 'center', alignSelf: 'center', overflow: 'hidden', marginBottom: 15 },
  profileImage: { width: '100%', height: '100%' },
  imagePlaceholder: { alignItems: 'center', justifyContent: 'center', flex: 1 },
  title: { fontSize: 22, fontWeight: '800', color: DEEP_BLUE },
  subtitle: { fontSize: 14, color: SLATE_GRAY, marginTop: 5 },
  form: { width: '100%' },
  inputGroup: { marginBottom: 18 },
  label: { fontSize: 13, fontWeight: '700', color: DEEP_BLUE, marginBottom: 8, marginLeft: 4 },
  input: { backgroundColor: '#FFF', borderRadius: 12, borderWidth: 1, borderColor: BORDER_COLOR, paddingHorizontal: 15, height: 52, fontSize: 15, color: DEEP_BLUE },
  btn: { backgroundColor: DEEP_BLUE, borderRadius: 12, height: 55, justifyContent: 'center', alignItems: 'center', flexDirection: 'row', gap: 10 },
  backBtn: { backgroundColor: 'transparent', borderWidth: 1, borderColor: DEEP_BLUE, flex: 1 },
  btnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  footerBtns: { flexDirection: 'row', gap: 15, marginTop: 10 }
});