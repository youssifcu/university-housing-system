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

export default function RegisterScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState('');
  const [form, setForm] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    phoneNumber: ''
  });

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.6,
      base64: true,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
      setImageBase64(`data:image/jpeg;base64,${result.assets[0].base64}`);
    }
  };

  const handleRegister = async () => {
    const { email, password, confirmPassword, fullName, phoneNumber } = form;

    if (!email || !password || !fullName || !confirmPassword) {
      Alert.alert('Error', 'Required fields are missing');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    setLoading(true);
    let firebaseUser = null;

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      firebaseUser = userCredential.user;

      await updateProfile(firebaseUser, { displayName: fullName });

      const idToken = await firebaseUser.getIdToken();

      const response = await fetch(`${BACKEND_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({
          name: fullName,
          uid: firebaseUser.uid, 
          email: firebaseUser.email,
          phoneNumber: phoneNumber,
          profilePicture: imageBase64
        }),
      });

      const data = await response.json();

      if (response.ok) {
        router.replace('/(student)');
      } else {
        if (firebaseUser) await deleteUser(firebaseUser);
        throw new Error(data.message || 'Server error');
      }

    } catch (error : any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.header}>
            <TouchableOpacity onPress={pickImage} style={styles.imagePicker}>
              {imageUri ? (
                <Image source={{ uri: imageUri }} style={styles.profileImage} />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <MaterialCommunityIcons name="camera-plus" size={40} color={DEEP_BLUE} />
                  <Text style={styles.imageText}>Photo</Text>
                </View>
              )}
            </TouchableOpacity>
            <Text style={styles.title}>New Account</Text>
          </View>

          <View style={styles.form}>
            <TextInput
              style={styles.input}
              value={form.fullName}
              onChangeText={(v) => setForm({...form, fullName: v})}
              placeholder="Full Name"
            />
            <TextInput
              style={styles.input}
              value={form.email}
              onChangeText={(v) => setForm({...form, email: v})}
              placeholder="Email"
              autoCapitalize="none"
            />
            <TextInput
              style={styles.input}
              value={form.password}
              onChangeText={(v) => setForm({...form, password: v})}
              placeholder="Password"
              secureTextEntry
            />
            <TextInput
              style={styles.input}
              value={form.confirmPassword}
              onChangeText={(v) => setForm({...form, confirmPassword: v})}
              placeholder="Confirm Password"
              secureTextEntry
            />
            <TextInput
              style={styles.input}
              value={form.phoneNumber}
              onChangeText={(v) => setForm({...form, phoneNumber: v})}
              placeholder="Phone Number"
              keyboardType="phone-pad"
            />

            <TouchableOpacity style={styles.btn} onPress={handleRegister} disabled={loading}>
              {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.btnText}>Register</Text>}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: SOFT_WHITE },
  scroll: { padding: 25, flexGrow: 1, justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: 20 },
  imagePicker: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#FFF', borderWidth: 1, borderColor: BORDER_COLOR, justifyContent: 'center', alignSelf: 'center', overflow: 'hidden', marginBottom: 10 },
  profileImage: { width: '100%', height: '100%' },
  imagePlaceholder: { alignItems: 'center', justifyContent: 'center', flex: 1 },
  imageText: { fontSize: 10, color: DEEP_BLUE, fontWeight: 'bold' },
  title: { fontSize: 24, fontWeight: 'bold', color: DEEP_BLUE },
  form: { width: '100%' },
  input: { backgroundColor: '#FFF', borderRadius: 10, borderWidth: 1, borderColor: BORDER_COLOR, paddingHorizontal: 15, height: 50, marginBottom: 15 },
  btn: { backgroundColor: DEEP_BLUE, borderRadius: 12, height: 55, justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  btnText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' }
});