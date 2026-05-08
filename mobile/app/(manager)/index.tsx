import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, SafeAreaView, StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const DEEP_BLUE = '#1A237E';
const SOFT_WHITE = '#F8FAFC';
const BORDER_COLOR = '#E2E8F0';
const SLATE_GRAY = '#475569';

const CARDS = [
  { label: 'Scan Attendance', icon: 'qrcode-scan',       color: '#6366F1', route: '/(manager)/scan'       },
  { label: 'Attendance Log',  icon: 'clipboard-list',    color: '#0EA5E9', route: '/(manager)/attendance'  },
  { label: 'Reports',         icon: 'alert-circle',      color: '#F59E0B', route: '/(manager)/reports'     },
  { label: 'Buildings',       icon: 'office-building',   color: '#10B981', route: '/(manager)/buildings'   },
  { label: 'Profile',         icon: 'account-circle',    color: '#EC4899', route: '/(manager)/profile'     },
];

export default function FloorHomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={styles.scroll}>

        {}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Welcome back 👋</Text>
            <Text style={styles.role}>Floor Supervisor</Text>
          </View>
          <View style={styles.avatarCircle}>
            <MaterialCommunityIcons name="account" size={28} color={DEEP_BLUE} />
          </View>
        </View>

        {}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.grid}>
          {CARDS.map((card) => (
            <TouchableOpacity
              key={card.label}
              style={styles.card}
              onPress={() => router.push(card.route as any)}
              activeOpacity={0.85}
            >
              <View style={[styles.iconBox, { backgroundColor: card.color + '18' }]}>
                <MaterialCommunityIcons name={card.icon as any} size={30} color={card.color} />
              </View>
              <Text style={styles.cardLabel}>{card.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: SOFT_WHITE },
  scroll: { padding: 20 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 30, marginTop: 10,
  },
  greeting: { fontSize: 22, fontWeight: '800', color: DEEP_BLUE },
  role: { fontSize: 14, color: SLATE_GRAY, marginTop: 3 },
  avatarCircle: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: '#EEF2FF', justifyContent: 'center', alignItems: 'center',
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: SLATE_GRAY, marginBottom: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  card: {
    width: '47%', backgroundColor: '#FFF', borderRadius: 18,
    padding: 20, alignItems: 'center',
    borderWidth: 1, borderColor: BORDER_COLOR,
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 },
  },
  iconBox: { width: 60, height: 60, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  cardLabel: { fontSize: 13, fontWeight: '700', color: DEEP_BLUE, textAlign: 'center' },
});
