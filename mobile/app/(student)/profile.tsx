import React, { useState, useEffect, use } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, TextInput,
  TouchableOpacity, Alert, ActivityIndicator, ScrollView, Image
} from 'react-native';
import { useRouter } from 'expo-router';
import { auth } from '../../config/firebase';
import { signOut } from 'firebase/auth';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import * as ImagePicker from 'expo-image-picker'; 
import BACKEND_URL from '../../config/backend';
import { useAppStore } from '../../store/useAppStore';

const COLORS = {
  DEEP_BLUE: '#1A237E',
  SLATE_GRAY: '#475569',
  SOFT_WHITE: '#F8FAFC',
  BORDER_COLOR: '#E2E8F0',
  ERROR_COLOR: '#DC2626',
  WHITE: '#FFFFFF',
  READ_ONLY_BG: '#F1F5F9',
  SUCCESS: '#10B981'
};

export default function ProfileScreen() {
  const router = useRouter();
  const user = auth.currentUser;
  
  const profile = useAppStore((s) => s.profile);
  const setProfile = useAppStore((s) => s.setProfile);

  const [fullName, setFullName] = useState(profile?.name || user?.displayName || '');
  const [email, setEmail] = useState(profile?.email || user?.email || '');
  const [studentInfo, setStudentInfo] = useState<any>(null);
  const [imageBase64, setImageBase64] = useState<string>(profile?.profilePicture || user?.photoURL || '');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    if (!user) return;
    try {
      const idToken = await user.getIdToken();
      const response = await fetch(`${BACKEND_URL}/api/students/me`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${idToken}` }
      });
      
      const data = await response.json();
      
      if (response.ok && data.student) {
        const s = data.student;
        setStudentInfo(s);
        
        const updatedProfile = {
          ...profile,
          name: s.name || user.displayName,
          email: s.email || user.email
        
        };
        setProfile(updatedProfile);
        
        setFullName(updatedProfile.name || '');
        setEmail(updatedProfile.email || '');
      }
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setFetching(false);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled) {
      const newPhotoBase64 = `data:image/jpeg;base64,${result.assets[0].base64}`;
      setImageBase64(newPhotoBase64);
      setProfile({ ...profile, profilePicture: result.assets[0].uri });
    }
  };

  const handleUpdate = async () => {
    setLoading(true);
    try {
      const idToken = await user?.getIdToken();
      const response = await fetch(`${BACKEND_URL}/api/auth/update-profile`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}` 
        },
        body: JSON.stringify({
          firebaseUID: user?.uid,
          name: fullName,
          email: email,
          profilePicture: imageBase64
        })
      });

      if (response.ok) {
        Alert.alert('Success', 'Profile updated successfully');
        fetchProfile();
      } else {
        const data = await response.json();
        throw new Error(data.message || 'Update failed');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  if (fetching && !profile) {
    return (
      <View style={[styles.container, { justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={COLORS.DEEP_BLUE} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        <View style={styles.header}>
          <TouchableOpacity onPress={pickImage} style={styles.avatarWrapper}>
            {profile?.profilePicture ? (
              <Image source={{ uri: profile.profilePicture }} style={styles.avatar} />
            ) : (
              <MaterialCommunityIcons name="account-circle" size={100} color={COLORS.DEEP_BLUE} />
            )}
            <View style={styles.cameraIcon}>
              <MaterialCommunityIcons name="camera" size={16} color={COLORS.WHITE} />
            </View>
          </TouchableOpacity>
          <Text style={styles.userNameText}>{fullName || 'Student'}</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{studentInfo?.housingStatus?.toUpperCase() || 'ACTIVE'}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Details</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name</Text>
            <View style={styles.fieldContainer}>
              <MaterialCommunityIcons name="account-outline" size={20} color={COLORS.SLATE_GRAY} style={styles.fieldIcon} />
              <TextInput style={styles.input} value={fullName} onChangeText={setFullName} />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email Address</Text>
            <View style={styles.fieldContainer}>
              <MaterialCommunityIcons name="email-outline" size={20} color={COLORS.SLATE_GRAY} style={styles.fieldIcon} />
              <TextInput style={styles.input} value={email} onChangeText={setEmail} keyboardType="email-address" />
            </View>
          </View>

          <TouchableOpacity style={styles.saveButton} onPress={handleUpdate} disabled={loading}>
            {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.saveButtonText}>Save Changes</Text>}
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Academic & Housing Info</Text>
          <View style={styles.readOnlyCard}>
            <ReadOnlyItem icon="fingerprint" label="University ID" value={studentInfo?.universityId || '—'} />
            <ReadOnlyItem icon="phone-outline" label="Phone Number" value={studentInfo?.phoneNumber || studentInfo?.phone || user?.phoneNumber || '—'} />
            <ReadOnlyItem icon="school-outline" label="Faculty" value={studentInfo?.faculty || '—'} />
            <ReadOnlyItem icon="office-building-outline" label="Building" value={studentInfo?.building?.name || '—'} />
            <ReadOnlyItem icon="bed-outline" label="Room & Bed" value={studentInfo?.room?.roomNumber ? `Room ${studentInfo.room.roomNumber} - Bed ${studentInfo.bedNumber}` : 'Pending'} />
            <ReadOnlyItem icon="food-apple-outline" label="Weekly Meals Left" value={`${studentInfo?.mealBalance || 0} Meals`} color={COLORS.SUCCESS} />
          </View>
        </View>

        <TouchableOpacity 
          style={styles.logoutBtn} 
          onPress={() => signOut(auth).then(() => router.replace('/(auth)/login'))}
        >
          <MaterialCommunityIcons name="logout" size={20} color={COLORS.ERROR_COLOR} />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const ReadOnlyItem = ({ icon, label, value, color }: any) => (
  <View style={styles.readOnlyItem}>
    <View style={styles.readOnlyIconBg}>
      <MaterialCommunityIcons name={icon} size={20} color={color || COLORS.DEEP_BLUE} />
    </View>
    <View style={{ marginLeft: 12 }}>
      <Text style={styles.readOnlyLabel}>{label}</Text>
      <Text style={[styles.readOnlyValue, color && { color: color }]}>{value}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.SOFT_WHITE },
  scrollContent: { padding: 20 },
  header: { alignItems: 'center', marginVertical: 20 },
  avatarWrapper: { 
    width: 110, height: 110, borderRadius: 55, backgroundColor: COLORS.WHITE, 
    justifyContent: 'center', alignItems: 'center', elevation: 3, overflow: 'hidden'
  },
  avatar: { width: '100%', height: '100%' },
  cameraIcon: { position: 'absolute', bottom: 0, right: 0, backgroundColor: COLORS.DEEP_BLUE, padding: 8, borderRadius: 20, borderWidth: 2, borderColor: COLORS.WHITE, zIndex: 10 },
  userNameText: { fontSize: 20, fontWeight: '800', color: COLORS.DEEP_BLUE, marginTop: 12 },
  badge: { backgroundColor: '#E0E7FF', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, marginTop: 6 },
  badgeText: { fontSize: 10, fontWeight: '800', color: COLORS.DEEP_BLUE },
  section: { marginBottom: 25 },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: COLORS.DEEP_BLUE, marginBottom: 12, marginLeft: 5 },
  inputGroup: { marginBottom: 15 },
  label: { fontSize: 12, fontWeight: '700', color: COLORS.SLATE_GRAY, marginBottom: 6, marginLeft: 5 },
  fieldContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.WHITE, borderRadius: 12, borderWidth: 1, borderColor: COLORS.BORDER_COLOR, paddingHorizontal: 12 },
  fieldIcon: { marginRight: 10 },
  input: { flex: 1, paddingVertical: 12, fontSize: 15, color: COLORS.DEEP_BLUE, fontWeight: '500' },
  saveButton: { backgroundColor: COLORS.DEEP_BLUE, padding: 15, borderRadius: 12, alignItems: 'center', marginTop: 5 },
  saveButtonText: { color: COLORS.WHITE, fontWeight: '700', fontSize: 15 },
  readOnlyCard: { backgroundColor: COLORS.READ_ONLY_BG, borderRadius: 16, padding: 8 },
  readOnlyItem: { flexDirection: 'row', alignItems: 'center', padding: 10 },
  readOnlyIconBg: { width: 36, height: 36, backgroundColor: COLORS.WHITE, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  readOnlyLabel: { fontSize: 10, color: COLORS.SLATE_GRAY, textTransform: 'uppercase', letterSpacing: 0.5 },
  readOnlyValue: { fontSize: 14, fontWeight: '700', color: '#1E293B' },
  logoutBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: 15 },
  logoutText: { color: COLORS.ERROR_COLOR, fontWeight: '700', fontSize: 16, marginLeft: 10 }
});