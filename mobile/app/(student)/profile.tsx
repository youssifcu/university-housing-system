import React, { useState, useEffect, useCallback } from 'react';
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
  BORDER: '#E2E8F0',
  ERROR: '#DC2626',
  WHITE: '#FFFFFF',
  READ_BG: '#F1F5F9',
  SUCCESS: '#10B981',
  WARNING: '#F59E0B',
};

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  new_applicant: { label: 'NEW APPLICANT', color: COLORS.WARNING },
  active: { label: 'ACTIVE', color: COLORS.SUCCESS },
  inactive: { label: 'INACTIVE', color: COLORS.SLATE_GRAY },
  suspended: { label: 'SUSPENDED', color: COLORS.ERROR },
  banned: { label: 'BANNED', color: COLORS.ERROR },
  graduated: { label: 'GRADUATED', color: COLORS.DEEP_BLUE },
};

export default function ProfileScreen() {
  const router = useRouter();
  const firebaseUser = auth.currentUser;

  const setProfile = useAppStore((s) => s.setProfile);
  const clearUser = useAppStore((s) => s.clearUser);

  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [studentData, setStudentData] = useState<any>(null);
  const [pickedUri, setPickedUri] = useState<string | null>(null);
  const [sessionAvatar, setSessionAvatar] = useState<string | null>(null);
  const [avatarStamp, setAvatarStamp] = useState(Date.now());
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);


  const fetchProfile = useCallback(async (user: any) => {
    if (!user) return;

    try {
      const token = await user.getIdToken();

      const res = await fetch(`${BACKEND_URL}/api/auth/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const json = await res.json();

      if (res.ok && json.data?.user) {
        const u = json.data.user;

        setStudentData(u);
        setProfile(u);
        setFullName(u.name || '');
        setEmail(u.email || '');
        setPhoneNumber(u.phoneNumber || '');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setFetching(false);
    }
  }, [setProfile]);

  useEffect(() => { 
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        fetchProfile(user);
      } else {
        setFetching(false);
      }
    });
    return () => unsubscribe();
  }, [fetchProfile]);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Gallery access is required.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.6,
    });
    if (!result.canceled) {
      setPickedUri(result.assets[0].uri);
    }
  };

  const handleUpdate = async () => {
    if (!fullName.trim() || !phoneNumber.trim()) {
      Alert.alert('Validation', 'Name and phone number are required.');
      return;
    }
    setLoading(true);
    try {
      const token = await firebaseUser?.getIdToken();
      const formData = new FormData();
      formData.append('name', fullName);
      formData.append('phoneNumber', phoneNumber);

      if (pickedUri) {
        formData.append('profilePicture', {
          uri: pickedUri,
          name: 'photo.jpg',
          type: 'image/jpeg'
        } as any);
      }

      const res = await fetch(`${BACKEND_URL}/api/users/profile/update`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json'
        },
        body: formData,
      });

      const rawText = await res.text();
      let json: any = {};
      try { json = JSON.parse(rawText); } catch { }

      if (res.ok) {
        if (json.data?.user) {
          setStudentData((prev: any) => ({ ...prev, ...json.data.user }));
          setProfile(json.data.user);
        }
        if (pickedUri) setSessionAvatar(pickedUri);
        setPickedUri(null);
        setAvatarStamp(Date.now());
        Alert.alert('Success', 'Profile updated ✓');
      } else {
        Alert.alert(`Error ${res.status}`, json.message || rawText || 'Update failed');
      }
    } catch {
      Alert.alert('Error', 'Network connection error');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await signOut(auth);
          clearUser();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  const renderAvatar = () => {
    if (pickedUri) {
      return <Image source={{ uri: pickedUri }} style={styles.avatar} />;
    }
    if (sessionAvatar) {
      return <Image source={{ uri: sessionAvatar }} style={styles.avatar} />;
    }

    const hasImage = typeof studentData?.profilePicture === 'string' 
                     || (studentData?.profilePicture && studentData.profilePicture.contentType);

    return (
      <View style={{ width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' }}>
        <MaterialCommunityIcons name="account-circle" size={100} color="#E2E8F0" style={{ position: 'absolute' }} />
        {(studentData?._id || studentData?.id) && hasImage && (
          <Image
            source={{ uri: typeof studentData.profilePicture === 'string' 
                ? `${BACKEND_URL}${studentData.profilePicture}?t=${avatarStamp}` 
                : `${BACKEND_URL}/api/users/${studentData._id || studentData.id}/profile-picture?t=${avatarStamp}` 
            }}
            style={styles.avatar}
          />
        )}
      </View>
    );
  };

  if (fetching) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={COLORS.DEEP_BLUE} />
        <Text style={{ marginTop: 12, color: COLORS.SLATE_GRAY }}>Loading profile…</Text>
      </View>
    );
  }

  const statusInfo = STATUS_LABEL[studentData?.housingStatus] ?? { label: 'UNKNOWN', color: COLORS.SLATE_GRAY };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        <View style={styles.header}>
          <TouchableOpacity onPress={pickImage} style={styles.avatarWrapper}>
            {renderAvatar()}
            <View style={styles.cameraIcon}>
              <MaterialCommunityIcons name="camera" size={16} color={COLORS.WHITE} />
            </View>
          </TouchableOpacity>

          <Text style={styles.userName}>{fullName || 'Student'}</Text>

          <View style={[styles.badge, { backgroundColor: `${statusInfo.color}22` }]}>
            <View style={[styles.badgeDot, { backgroundColor: statusInfo.color }]} />
            <Text style={[styles.badgeText, { color: statusInfo.color }]}>{statusInfo.label}</Text>
          </View>

          {pickedUri && (
            <Text style={styles.pickedHint}>📷 New photo selected — tap Update to save</Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Information</Text>

          <Field icon="account-outline" label="Full Name" value={fullName} onChange={setFullName} />
          <Field icon="phone-outline" label="Phone Number" value={phoneNumber} onChange={setPhoneNumber} keyboardType="phone-pad" />
          <Field icon="email-outline" label="Email Address" value={email} readOnly />

          <TouchableOpacity style={styles.saveBtn} onPress={handleUpdate} disabled={loading}>
            {loading
              ? <ActivityIndicator color={COLORS.WHITE} />
              : <Text style={styles.saveBtnText}>Update Profile</Text>
            }
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>University & Housing</Text>
          <View style={styles.readCard}>
            <ReadRow icon="fingerprint" label="Student ID" value={studentData?.studentId || '—'} />
            <ReadRow icon="card-account-details-outline" label="National ID" value={studentData?.nationalId || '—'} />
            <ReadRow icon="school-outline" label="Faculty" value={studentData?.faculty || '—'} />
            <ReadRow icon="calendar-outline" label="Academic Year" value={studentData?.universityYear != null ? `Year ${studentData.universityYear}` : '—'} />
            <ReadRow icon="home-outline" label="Housing Status" value={statusInfo.label} color={statusInfo.color} />
            {studentData?.assignedRoomId && (
              <ReadRow icon="bed-outline" label="Room" value="Room assigned" color={COLORS.SUCCESS} />
            )}
          </View>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <MaterialCommunityIcons name="logout" size={20} color={COLORS.ERROR} />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const Field = ({ icon, label, value, onChange, readOnly = false, keyboardType = 'default' }: any) => (
  <View style={styles.inputGroup}>
    <Text style={styles.label}>{label}</Text>
    <View style={[styles.fieldRow, readOnly && { backgroundColor: '#F1F5F9' }]}>
      <MaterialCommunityIcons name={icon} size={20} color="#64748B" style={{ marginRight: 10 }} />
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChange}
        editable={!readOnly}
        keyboardType={keyboardType}
        placeholderTextColor="#94A3B8"
      />
    </View>
  </View>
);

const ReadRow = ({ icon, label, value, color }: any) => (
  <View style={styles.readRow}>
    <View style={styles.readIconBg}>
      <MaterialCommunityIcons name={icon} size={20} color={color || '#1A237E'} />
    </View>
    <View style={{ marginLeft: 12, flex: 1 }}>
      <Text style={styles.readLabel}>{label}</Text>
      <Text style={[styles.readValue, color && { color }]}>{value}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  scroll: { padding: 20, paddingBottom: 40 },
  header: { alignItems: 'center', marginVertical: 24 },
  avatarWrapper: {
    width: 110, height: 110, borderRadius: 55, backgroundColor: '#FFF',
    justifyContent: 'center', alignItems: 'center', elevation: 4,
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 }, overflow: 'hidden'
  },
  avatar: { width: '100%', height: '100%', borderRadius: 55 },
  cameraIcon: {
    position: 'absolute', bottom: 0, right: 0, backgroundColor: '#1A237E',
    padding: 7, borderRadius: 20, borderWidth: 2, borderColor: '#FFF'
  },
  userName: { fontSize: 21, fontWeight: '800', color: '#1A237E', marginTop: 14 },
  badge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, marginTop: 8, gap: 6 },
  badgeDot: { width: 7, height: 7, borderRadius: 4 },
  badgeText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  pickedHint: { fontSize: 12, color: '#F59E0B', marginTop: 10, fontStyle: 'italic' },
  section: { marginBottom: 28 },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: '#1A237E', marginBottom: 14, marginLeft: 4 },
  inputGroup: { marginBottom: 14 },
  label: { fontSize: 12, fontWeight: '700', color: '#64748B', marginBottom: 6, marginLeft: 4 },
  fieldRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF',
    borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', paddingHorizontal: 14
  },
  input: { flex: 1, paddingVertical: 13, fontSize: 15, color: '#1A237E', fontWeight: '500' },
  saveBtn: {
    backgroundColor: '#1A237E', borderRadius: 12, height: 52,
    justifyContent: 'center', alignItems: 'center', marginTop: 6
  },
  saveBtnText: { color: '#FFF', fontWeight: '700', fontSize: 15 },
  readCard: { backgroundColor: '#F1F5F9', borderRadius: 16, padding: 6 },
  readRow: { flexDirection: 'row', alignItems: 'center', padding: 10 },
  readIconBg: {
    width: 38, height: 38, backgroundColor: '#FFF',
    borderRadius: 10, justifyContent: 'center', alignItems: 'center'
  },
  readLabel: { fontSize: 10, color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.5 },
  readValue: { fontSize: 14, fontWeight: '700', color: '#1E293B', marginTop: 2 },
  logoutBtn: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    gap: 8, padding: 16, marginTop: 4
  },
  logoutText: { color: '#DC2626', fontWeight: '700', fontSize: 16 },
});