import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
  ScrollView,
  Image
} from 'react-native';
import { useRouter } from 'expo-router';
import { auth } from '../../config/firebase';
import { signOut } from 'firebase/auth';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import * as ImagePicker from 'expo-image-picker'; 
import BACKEND_URL from '../../config/backend';

const COLORS = {
  DEEP_BLUE: '#1A237E',
  SLATE_GRAY: '#475569',
  SOFT_WHITE: '#F8FAFC',
  BORDER_COLOR: '#E2E8F0',
  ERROR_COLOR: '#DC2626',
  WHITE: '#FFFFFF',
  READ_ONLY_BG: '#F1F5F9'
};

export default function ProfileScreen() {
  const router = useRouter();
  const user = auth.currentUser;

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [studentInfo, setStudentInfo] = useState<any>(null);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      try {
        const idToken = await user.getIdToken();
        const response = await fetch(`${BACKEND_URL}/api/auth/profile`, {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${idToken}` }
        });
        
        const data = await response.json();
        if (response.ok && data.user) {
          setStudentInfo(data.user);
          setFullName(data.user.name || '');
          setEmail(data.user.email || user.email || '');
          if (data.user.profilePicture) {
            setImageUri(data.user.profilePicture);
          }
        }
      } catch (error) {
        console.error("Fetch error:", error);
      } finally {
        setFetching(false);
      }
    };
    fetchProfile();
  }, []);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5, 
    });
    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleUpdate = async () => {
    setLoading(true);
    try {
      const idToken = await user?.getIdToken();
      const formData = new FormData();
      formData.append('name', fullName);
      formData.append('email', email);

      if (imageUri && imageUri.startsWith('file://')) {
        const filename = imageUri.split('/').pop() || 'profile.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image/jpeg`;
        formData.append('profilePicture', { uri: imageUri, name: filename, type } as any);
      }

      const response = await fetch(`${BACKEND_URL}/api/auth/profile`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${idToken}` },
        body: formData 
      });

      if (response.ok) {
        Alert.alert('Success', 'Profile updated successfully');
      } else {
        throw new Error('Failed to update');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
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
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.avatar} />
            ) : (
              <MaterialCommunityIcons name="account-circle" size={100} color={COLORS.DEEP_BLUE} />
            )}
            <View style={styles.cameraIcon}>
              <MaterialCommunityIcons name="camera" size={16} color={COLORS.WHITE} />
            </View>
          </TouchableOpacity>
          <Text style={styles.userNameText}>{studentInfo?.name || 'Student'}</Text>
          <Text style={styles.roleText}>Student Account</Text>
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
          <Text style={styles.sectionTitle}>Support & Services</Text>
          <TouchableOpacity 
            style={styles.complaintButton} 
            onPress={() => router.push('../')}
          >
            <MaterialCommunityIcons name="alert-circle-outline" size={24} color={COLORS.DEEP_BLUE} />
            <Text style={styles.complaintButtonText}>Report an Issue / Complaint</Text>
            <MaterialCommunityIcons name="chevron-right" size={24} color={COLORS.SLATE_GRAY} />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Academic & Housing Info</Text>
          <View style={styles.readOnlyCard}>
            <ReadOnlyItem icon="fingerprint" label="Student ID" value={studentInfo?.studentId || 'N/A'} />
            <ReadOnlyItem icon="school-outline" label="Department" value={studentInfo?.department || 'N/A'} />
            <ReadOnlyItem icon="bed-outline" label="Assigned Room" value={studentInfo?.roomNumber || 'Pending'} />
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

const ReadOnlyItem = ({ icon, label, value }: any) => (
  <View style={styles.readOnlyItem}>
    <View style={styles.readOnlyIconBg}>
      <MaterialCommunityIcons name={icon} size={20} color={COLORS.DEEP_BLUE} />
    </View>
    <View style={{ marginLeft: 12 }}>
      <Text style={styles.readOnlyLabel}>{label}</Text>
      <Text style={styles.readOnlyValue}>{value}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.SOFT_WHITE },
  scrollContent: { padding: 20 },
  header: { alignItems: 'center', marginVertical: 30 },
  avatarWrapper: { 
    width: 120, height: 120, borderRadius: 60, backgroundColor: COLORS.WHITE, 
    justifyContent: 'center', alignItems: 'center', elevation: 3,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 5
  },
  avatar: { width: 120, height: 120, borderRadius: 60 },
  cameraIcon: { position: 'absolute', bottom: 5, right: 5, backgroundColor: COLORS.DEEP_BLUE, padding: 8, borderRadius: 20, borderWidth: 2, borderColor: COLORS.WHITE },
  userNameText: { fontSize: 20, fontWeight: '800', color: COLORS.DEEP_BLUE, marginTop: 15 },
  roleText: { fontSize: 13, fontWeight: '600', color: COLORS.SLATE_GRAY, marginTop: 4 },
  section: { marginBottom: 30 },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: COLORS.DEEP_BLUE, marginBottom: 15, marginLeft: 5 },
  inputGroup: { marginBottom: 18 },
  label: { fontSize: 13, fontWeight: '700', color: COLORS.SLATE_GRAY, marginBottom: 8, marginLeft: 5 },
  fieldContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.WHITE, borderRadius: 12, borderWidth: 1, borderColor: COLORS.BORDER_COLOR, paddingHorizontal: 12 },
  fieldIcon: { marginRight: 10 },
  input: { flex: 1, paddingVertical: 14, fontSize: 15, color: COLORS.DEEP_BLUE, fontWeight: '500' },
  saveButton: { backgroundColor: COLORS.DEEP_BLUE, padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 10, elevation: 2 },
  saveButtonText: { color: COLORS.WHITE, fontWeight: '700', fontSize: 16 },
  complaintButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.WHITE, padding: 18, borderRadius: 15, borderWidth: 1, borderColor: COLORS.BORDER_COLOR, elevation: 1 },
  complaintButtonText: { flex: 1, marginLeft: 12, fontSize: 15, fontWeight: '600', color: COLORS.DEEP_BLUE },
  readOnlyCard: { backgroundColor: COLORS.READ_ONLY_BG, borderRadius: 16, padding: 10 },
  readOnlyItem: { flexDirection: 'row', alignItems: 'center', padding: 12 },
  readOnlyIconBg: { width: 40, height: 40, backgroundColor: COLORS.WHITE, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  readOnlyLabel: { fontSize: 11, color: COLORS.SLATE_GRAY, textTransform: 'uppercase', letterSpacing: 0.5 },
  readOnlyValue: { fontSize: 15, fontWeight: '700', color: '#1E293B', marginTop: 1 },
  logoutBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: 15, marginTop: 10 },
  logoutText: { color: COLORS.ERROR_COLOR, fontWeight: '700', fontSize: 16, marginLeft: 10 }
});