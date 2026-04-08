import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  SafeAreaView, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { auth } from '../../config/firebase';
import { signOut } from 'firebase/auth';

const DEEP_BLUE = '#1A237E';
const SOFT_WHITE = '#F8FAFC';
const BORDER_COLOR = '#E2E8F0';
const SLATE_GRAY = '#475569';

export default function ManagerProfileScreen() {
  const router = useRouter();

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout', style: 'destructive', onPress: async () => {
          await signOut(auth);
          router.replace('/(auth)/login' as any);
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={26} color={DEEP_BLUE} />
        </TouchableOpacity>
        <Text style={styles.title}>Profile</Text>
        <View style={{ width: 26 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.avatarCircle}>
          <MaterialCommunityIcons name="account" size={60} color={DEEP_BLUE} />
        </View>
        <Text style={styles.name}>Floor Supervisor</Text>
        <Text style={styles.role}>Manager Account</Text>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <MaterialCommunityIcons name="logout" size={20} color="#DC2626" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: SOFT_WHITE },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 15,
    borderBottomWidth: 1, borderBottomColor: BORDER_COLOR, backgroundColor: '#FFF',
  },
  title: { fontSize: 18, fontWeight: '800', color: DEEP_BLUE },
  content: { flex: 1, alignItems: 'center', paddingTop: 50, gap: 8 },
  avatarCircle: {
    width: 100, height: 100, borderRadius: 50, backgroundColor: '#EEF2FF',
    justifyContent: 'center', alignItems: 'center', marginBottom: 10,
  },
  name: { fontSize: 22, fontWeight: '800', color: DEEP_BLUE },
  role: { fontSize: 14, color: SLATE_GRAY },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginTop: 40, paddingHorizontal: 30, paddingVertical: 14,
    borderRadius: 14, borderWidth: 2, borderColor: '#FEE2E2', backgroundColor: '#FFF',
  },
  logoutText: { fontSize: 16, fontWeight: '700', color: '#DC2626' },
});
