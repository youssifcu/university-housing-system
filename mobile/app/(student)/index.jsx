import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, SafeAreaView, RefreshControl, Image
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppStore } from '../../store/useAppStore';
import { LoadingSpinner } from '../../components/shared/LoadingSpinner';
import { auth } from '../../config/firebase';
import { StatusBar } from 'expo-status-bar';
import BACKEND_URL from '../../config/backend';

const COLORS = {
  DEEP_BLUE: '#1A237E',
  SOFT_WHITE: '#F8FAFC',
  WHITE: '#FFFFFF',
  SLATE_GRAY: '#475569',
  BORDER_COLOR: '#E2E8F0',
  SUCCESS: '#10B981',
  WARNING: '#F59E0B'
};

export default function HomeScreen() {
  const router = useRouter();
  const profile = useAppStore((s) => s.profile);
  const setProfile = useAppStore((s) => s.setProfile);
  const unreadCount = useAppStore((s) => s.unreadCount);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [appStatus, setAppStatus] = useState(null);

  const fetchData = async () => {
    try {
      const idToken = await auth.currentUser?.getIdToken();
      
      const [profileRes, appRes] = await Promise.all([
        fetch(`${BACKEND_URL}/api/auth/profile`, {
          headers: { 'Authorization': `Bearer ${idToken}` }
        }),
        fetch(`${BACKEND_URL}/api/applications/my`, { 
          headers: { 'Authorization': `Bearer ${idToken}` }
        })
      ]);

      if (profileRes.ok) {
        const profileData = await profileRes.json();
        setProfile(profileData.user);
      }
      
      if (appRes.ok) {
        const apps = await appRes.json();
        if (Array.isArray(apps) && apps.length > 0) {
          setAppStatus(apps[0].status); 
        }
      }
    } catch (err) {
      console.error('[HomeScreen] Fetch Error:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
  };

  if (loading && !profile) return <LoadingSpinner fullscreen />;


  const hasNoApplication = !appStatus; 
  const isPending = appStatus === 'pending';
  const isAccepted = appStatus === 'approved' || appStatus === 'accepted';
  const isRejected = appStatus === 'rejected';

  const SERVICES = [
    { 
      label: 'Housing Status', 
      icon: 'home-analytics', 
      route: '/housing/StatusScreen', 
      color: COLORS.SUCCESS, 
      sub: appStatus?.toUpperCase() || 'NO APP',
      
      disabled: hasNoApplication 
    },
    { 
      label: 'Apply for Housing', 
      icon: 'home-edit', 
      route: '../housing/HousingApplyScreen', 
      color: '#6C63FF', 
      
      disabled: isPending || isAccepted 
    },
    { 
      label: 'Meal Menu', 
      icon: 'silverware-fork-knife', 
      route: '/(student)/meals', 
      color: '#F59E0B', 
      disabled: !isAccepted 
    },
    { 
      label: 'Room Booking', 
      icon: 'bed', 
      route: '/housing/book-room', 
      color: '#8B5CF6', 
      disabled: !isAccepted 
    },
    { 
      label: 'My QR Code', 
      icon: 'qrcode-scan', 
      route: '/(student)/qrcode', 
      color: '#14B8A6',
      disabled: !isAccepted 
    },
    { 
      label: 'Reports', 
      icon: 'alert-circle', 
      route: '/complaints', 
      color: '#EF4444',
      disabled: !isAccepted 
    },
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.DEEP_BLUE} />}
      >
        <View style={styles.headerCard}>
          <View style={styles.headerTop}>
            <TouchableOpacity onPress={() => router.push('/profile')} style={styles.avatarWrapper}>
              {profile?.profilePicture ? (
                <Image source={{ uri: profile.profilePicture }} style={styles.avatarImg} />
              ) : (
                <MaterialCommunityIcons name="account-circle" size={55} color={COLORS.DEEP_BLUE} />
              )}
            </TouchableOpacity>
            <View style={styles.welcomeTextGroup}>
              <Text style={styles.helloText}>Welcome back,</Text>
              <Text style={styles.nameText} numberOfLines={1}>{profile?.name || 'Student'}</Text>
            </View>
            {unreadCount > 0 && (
              <TouchableOpacity style={styles.notifBadge} onPress={() => router.push('/(student)/notifications')}>
                <Ionicons name="notifications" size={20} color={COLORS.WHITE} />
                <View style={styles.notifCountDot}><Text style={styles.notifText}>{unreadCount}</Text></View>
              </TouchableOpacity>
            )}
          </View>

          <View style={[styles.statusPill, { backgroundColor: isAccepted ? COLORS.SUCCESS + '15' : COLORS.WARNING + '15' }]}>
            <MaterialCommunityIcons 
              name={isAccepted ? "check-decagram" : "clock-outline"} 
              size={16} 
              color={isAccepted ? COLORS.SUCCESS : COLORS.WARNING} 
            />
            <Text style={[styles.statusPillText, { color: isAccepted ? COLORS.SUCCESS : COLORS.WARNING }]}>
              {isAccepted ? `Room: ${profile?.roomNumber || 'Assigned'}` : `Housing: ${appStatus || 'Not Applied'}`}
            </Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <StatCard icon="school-outline" label="Department" value={profile?.department || '—'} />
          <StatCard icon="fingerprint" label="Student ID" value={profile?.studentId || '—'} />
        </View>

        <Text style={styles.sectionTitle}>Main Services</Text>
        <View style={styles.grid}>
          {SERVICES.map((s, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.serviceCard, s.disabled && styles.disabledCard]}
              onPress={() => !s.disabled && router.push(s.route)}
              disabled={s.disabled}
            >
              <View style={[styles.iconBg, { backgroundColor: s.color + '10' }]}>
                <MaterialCommunityIcons name={s.icon} size={28} color={s.disabled ? COLORS.SLATE_GRAY : s.color} />
              </View>
              <Text style={[styles.serviceLabel, s.disabled && { color: COLORS.SLATE_GRAY }]}>{s.label}</Text>
              {s.sub && <Text style={styles.serviceSubText}>{s.sub}</Text>}
              {s.disabled && <MaterialCommunityIcons name="lock" size={14} color={COLORS.SLATE_GRAY} style={styles.lockIcon} />}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({ icon, label, value }) {
  return (
    <View style={styles.statCard}>
      <Ionicons name={icon} size={20} color={COLORS.DEEP_BLUE} />
      <View>
        <Text style={styles.statLabel}>{label}</Text>
        <Text style={styles.statValue} numberOfLines={1}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.SOFT_WHITE },
  content: { padding: 20, paddingBottom: 40 },
  headerCard: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10
  },
  headerTop: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  avatarWrapper: { width: 55, height: 55, borderRadius: 28, backgroundColor: COLORS.SOFT_WHITE, overflow: 'hidden', justifyContent: 'center', alignItems: 'center' },
  avatarImg: { width: '100%', height: '100%' },
  welcomeTextGroup: { flex: 1 },
  helloText: { fontSize: 13, color: COLORS.SLATE_GRAY, fontWeight: '500' },
  nameText: { fontSize: 20, fontWeight: '800', color: COLORS.DEEP_BLUE },
  notifBadge: { backgroundColor: COLORS.DEEP_BLUE, padding: 10, borderRadius: 12 },
  notifCountDot: { position: 'absolute', top: -5, right: -5, backgroundColor: '#EF4444', borderRadius: 10, width: 18, height: 18, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: COLORS.WHITE },
  notifText: { color: COLORS.WHITE, fontSize: 10, fontWeight: '800' },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 15, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, alignSelf: 'flex-start' },
  statusPillText: { fontSize: 12, fontWeight: '700' },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 25 },
  statCard: { flex: 1, backgroundColor: COLORS.WHITE, borderRadius: 16, padding: 15, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: COLORS.BORDER_COLOR },
  statLabel: { fontSize: 10, color: COLORS.SLATE_GRAY, textTransform: 'uppercase', letterSpacing: 0.5 },
  statValue: { fontSize: 14, fontWeight: '700', color: COLORS.DEEP_BLUE },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: COLORS.DEEP_BLUE, marginBottom: 15, marginLeft: 5 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  serviceCard: { width: '47%', backgroundColor: COLORS.WHITE, borderRadius: 18, padding: 20, alignItems: 'center', borderWidth: 1, borderColor: COLORS.BORDER_COLOR, gap: 8, position: 'relative' },
  disabledCard: { backgroundColor: '#F1F5F9', opacity: 0.6 },
  iconBg: { width: 60, height: 60, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 5 },
  serviceLabel: { fontSize: 13, fontWeight: '700', color: COLORS.DEEP_BLUE, textAlign: 'center' },
  serviceSubText: { fontSize: 10, fontWeight: '600', color: COLORS.SLATE_GRAY },
  lockIcon: { position: 'absolute', top: 12, right: 12 }
});