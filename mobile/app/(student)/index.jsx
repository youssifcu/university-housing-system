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
  WARNING: '#F59E0B',
  DANGER: '#EF4444',
  INFO: '#3B82F6'
};

export default function HomeScreen() {
  const router = useRouter();
  const profile = useAppStore((s) => s.profile);
  const setProfile = useAppStore((s) => s.setProfile);
  const unreadCount = useAppStore((s) => s.unreadCount);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [appData, setAppData] = useState(null);

  const fetchData = async (user) => {
    if (!user) {
      setLoading(false);
      return;
    }
    
    try {
      const idToken = await user.getIdToken();

      const [profileRes, appRes] = await Promise.all([
        fetch(`${BACKEND_URL}/api/auth/profile`, {
          headers: { 'Authorization': `Bearer ${idToken}` }
        }),
        fetch(`${BACKEND_URL}/api/applications/me`, {
          headers: { 'Authorization': `Bearer ${idToken}` }
        })
      ]);

      if (profileRes.ok) {
        const resData = await profileRes.json();
        setProfile(resData.data.user);
      }

      if (appRes.ok) {
        const resData = await appRes.json();
        setAppData(resData.data.application);
      } else {
        setAppData(null);
      }
    } catch (err) {
      console.error("Home Data Fetch Error:", err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      fetchData(user);
    });
    return () => unsubscribe();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    const currentUser = auth.currentUser;
    if (currentUser) {
      await fetchData(currentUser);
    } else {
      setRefreshing(false);
    }
  };

  if (loading && !profile) return <LoadingSpinner fullscreen />;

  const status = profile?.housingStatus || 'no_application';
  const isAccepted = status === 'active';

  const getStatusConfig = () => {
    switch (status) {
      case 'active':
        return { label: 'Approved', color: COLORS.SUCCESS, icon: 'check-decagram' };
      case 'pending':
        return { label: 'Pending Review', color: COLORS.WARNING, icon: 'clock-outline' };
      case 'rejected':
        return { label: 'Rejected', color: COLORS.DANGER, icon: 'close-circle-outline' };
      case 'needs_update':
        return { label: 'Needs Update', color: COLORS.INFO, icon: 'alert-circle-outline' };
      default:
        return { label: 'No Application', color: COLORS.SLATE_GRAY, icon: 'home-off-outline' };
    }
  };

  const statusConfig = getStatusConfig();

  const SERVICES = [
    {
      label: 'Housing Status',
      icon: 'home-analytics',
      route: '/(student)/(housing)/[id]/status',
      color: statusConfig.color,
      sub: statusConfig.label.toUpperCase(),
      disabled: status === 'no_application'
    },
    {
      label: 'Apply Housing',
      icon: 'home-edit',
      route: '/(student)/(housing)/HousingApplyScreen',
      color: '#6C63FF',
      disabled: status === 'pending' || isAccepted || status === 'suspended'
    },
    {
      label: 'Announcements',
      icon: 'bullhorn-outline',
      route: '/(student)/(info)/announcements',
      color: '#3B82F6',
      disabled: false
    },
    {
      label: 'AI Assistant',
      icon: 'robot-happy-outline',
      route: '/(student)/(info)/ai-chat',
      color: '#6366F1',
      disabled: false
    },
    {
      label: 'Meal Bookings',
      icon: 'food-fork-drink',
      route: '/(student)/(meals)/bookings',
      color: '#F59E0B',
      disabled: !isAccepted
    },
    {
      label: 'Attendance',
      icon: 'calendar-check',
      route: '/(student)/(services)/attendance',
      color: '#8B5CF6',
      disabled: !isAccepted
    },
    {
      label: 'Payments',
      icon: 'credit-card-outline',
      route: '/(student)/(services)/payments',
      color: '#10B981',
      disabled: !isAccepted
    },
    {
      label: 'Maintenance',
      icon: 'hammer-wrench',
      route: '/(student)/(housing)/housing-request',
      color: '#EC4899',
      disabled: !isAccepted
    },
    {
      label: 'Reports',
      icon: 'file-chart-outline',
      route: '/(student)/(services)/reports',
      color: '#64748B',
      disabled: !isAccepted
    }
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
            <TouchableOpacity onPress={() => router.push('/(student)/profile')} style={styles.avatarWrapper}>
              {profile?.profilePicture && typeof profile.profilePicture === 'string' ? (
                <Image
                  source={{ uri: `${BACKEND_URL}${profile.profilePicture}?t=${Date.now()}` }}
                  style={styles.avatarImg}
                />
              ) : profile?._id ? (
                <Image
                  source={{ uri: `${BACKEND_URL}/api/users/${profile._id}/profile-picture?t=${Date.now()}` }}
                  style={styles.avatarImg}
                />
              ) : (
                <MaterialCommunityIcons name="account-circle" size={55} color={COLORS.DEEP_BLUE} />
              )}
            </TouchableOpacity>
            <View style={styles.welcomeTextGroup}>
              <Text style={styles.helloText}>Welcome back,</Text>
              <Text style={styles.nameText} numberOfLines={1}>{profile?.name || 'Student'}</Text>
            </View>
            <TouchableOpacity style={styles.notifBadge} onPress={() => router.push('/(student)/(info)/notifications')}>
              <Ionicons name="notifications" size={20} color={COLORS.WHITE} />
              {unreadCount > 0 && (
                <View style={styles.notifCountDot}>
                  <Text style={styles.notifText}>{unreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          <View style={[styles.statusPill, { backgroundColor: statusConfig.color + '15' }]}>
            <MaterialCommunityIcons name={statusConfig.icon} size={16} color={statusConfig.color} />
            <Text style={[styles.statusPillText, { color: statusConfig.color }]}>
              {isAccepted ? `Room: ${profile?.assignedRoomId?.roomNumber || 'Assigned'}` : `Status: ${statusConfig.label}`}
            </Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <StatCard icon="school-outline" label="Faculty" value={profile?.faculty || '—'} />
          <StatCard icon="fingerprint" label="ID" value={profile?.studentId || '—'} />
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
              {s.sub && <Text style={[styles.serviceSubText, { color: s.color }]}>{s.sub}</Text>}
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
      <View style={{ flex: 1 }}>
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
  statCard: { flex: 1, backgroundColor: COLORS.WHITE, borderRadius: 16, padding: 15, flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: COLORS.BORDER_COLOR },
  statLabel: { fontSize: 10, color: COLORS.SLATE_GRAY, textTransform: 'uppercase', letterSpacing: 0.5 },
  statValue: { fontSize: 13, fontWeight: '700', color: COLORS.DEEP_BLUE },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: COLORS.DEEP_BLUE, marginBottom: 15, marginLeft: 5 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between' },
  serviceCard: { width: '48%', backgroundColor: COLORS.WHITE, borderRadius: 18, padding: 20, alignItems: 'center', borderWidth: 1, borderColor: COLORS.BORDER_COLOR, gap: 8, position: 'relative' },
  disabledCard: { backgroundColor: '#F1F5F9', opacity: 0.6 },
  iconBg: { width: 55, height: 55, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 5 },
  serviceLabel: { fontSize: 13, fontWeight: '700', color: COLORS.DEEP_BLUE, textAlign: 'center' },
  serviceSubText: { fontSize: 9, fontWeight: '600', color: COLORS.SLATE_GRAY },
  lockIcon: { position: 'absolute', top: 12, right: 12 }
});