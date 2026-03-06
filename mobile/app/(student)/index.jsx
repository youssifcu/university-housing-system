import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { auth } from '../../config/firebase';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import BACKEND_URL from '../../config/backend';

const COLORS = {
  DEEP_BLUE: '#1A237E',
  LIGHT_BLUE: '#3F51B5',
  ACCENT: '#FFD600',
  WHITE: '#FFFFFF',
  SOFT_WHITE: '#F8FAFC',
  TEXT_GRAY: '#64748B',
  SUCCESS: '#10B981',
  DANGER: '#EF4444',
  LOCKED: '#94A3B8'
};

export default function StudentHomeScreen() {
  const router = useRouter();
  const [userData, setUserData] = useState(null);
  const [appStatus, setAppStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const idToken = await auth.currentUser?.getIdToken();
      
      const [profileRes, appRes] = await Promise.all([
        fetch(`${BACKEND_URL}/api/auth/profile`, {
          headers: { 'Authorization': `Bearer ${idToken}` }
        }),
        fetch(`${BACKEND_URL}/api/housing/user-applications`, {
          headers: { 'Authorization': `Bearer ${idToken}` }
        })
      ]);

      const profileData = await profileRes.json();
      const apps = await appRes.json();

      if (profileRes.ok) setUserData(profileData.user);
      if (appRes.ok && apps.length > 0) {
        setAppStatus(apps[0].status); 
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const isPending = appStatus === 'pending';
  const isAccepted = appStatus === 'accepted';

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      <View style={styles.topHeader}>
        <View>
          <Text style={styles.welcomeText}>Welcome,</Text>
          <Text style={styles.userName}>{userData?.name || 'Student'}</Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/profile')}>
          <MaterialCommunityIcons name="account-circle-outline" size={40} color={COLORS.WHITE} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} />}
      >
        
        <View style={styles.statusBanner}>
          <Text style={styles.statusTitle}>Housing Status</Text>
          <View style={[styles.statusBadge, { backgroundColor: isAccepted ? COLORS.SUCCESS + '20' : '#E0E7FF' }]}>
            <Text style={[styles.statusText, { color: isAccepted ? COLORS.SUCCESS : COLORS.LIGHT_BLUE }]}>
              {appStatus ? appStatus.toUpperCase().replace('_', ' ') : 'NO APPLICATION'}
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Housing Services</Text>
        <View style={styles.serviceList}>
          
          <ServiceItem 
            title="Apply for Housing" 
            subTitle={isPending ? "Application under review" : "Submit your yearly application"}
            icon={isPending ? "lock-outline" : "home-edit-outline"} 
            color={isPending ? COLORS.LOCKED : "#4F46E5"} 
            disabled={isPending}
            onPress={() => router.push('../housing/HousingApplyScreen')} 
          />

          <ServiceItem 
            title="Application Status" 
            subTitle="Track your submitted application"
            icon="clipboard-text-search-outline" 
            color={COLORS.SUCCESS} 
            onPress={() => router.push('../housing/StatusScreen')} 
          />

          <ServiceItem 
            title="Room Booking" 
            subTitle={isAccepted ? "Choose your room now" : "Locked - Requires Acceptance"}
            icon={isAccepted ? "bed-outline" : "lock-outline"} 
            color={isAccepted ? "#8B5CF6" : COLORS.LOCKED} 
            disabled={!isAccepted}
            onPress={() => router.push('/housing/book-room')} 
          />

          <ServiceItem 
            title="Meal Booking" 
            subTitle={isAccepted ? "Book your meals" : "Locked - Requires Acceptance"}
            icon={isAccepted ? "silverware-fork-knife" : "lock-outline"} 
            color={isAccepted ? "#F59E0B" : COLORS.LOCKED} 
            disabled={!isAccepted}
            onPress={() => router.push('/meals/book')} 
          />

          <ServiceItem 
            title="My Complaints" 
            subTitle="Report maintenance issues"
            icon="alert-circle-outline" 
            color={COLORS.DANGER} 
            onPress={() => router.push('/complaints')} 
          />

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const ServiceItem = ({ title, subTitle, icon, color, onPress, disabled }) => (
  <TouchableOpacity 
    style={[styles.serviceCard, disabled && styles.disabledCard]} 
    onPress={onPress}
    disabled={disabled}
  >
    <View style={[styles.iconContainer, { backgroundColor: color + '15' }]}>
      <MaterialCommunityIcons name={icon} size={28} color={color} />
    </View>
    <View style={styles.serviceInfo}>
      <Text style={[styles.serviceTitle, disabled && { color: COLORS.LOCKED }]}>{title}</Text>
      <Text style={styles.serviceSubTitle}>{subTitle}</Text>
    </View>
    {!disabled && <MaterialCommunityIcons name="chevron-right" size={24} color={COLORS.TEXT_GRAY} />}
    {disabled && <MaterialCommunityIcons name="lock" size={20} color={COLORS.LOCKED} />}
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.SOFT_WHITE },
  topHeader: { backgroundColor: COLORS.DEEP_BLUE, paddingHorizontal: 25, paddingTop: 50, paddingBottom: 40, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  welcomeText: { color: 'rgba(255,255,255,0.7)', fontSize: 14 },
  userName: { color: COLORS.WHITE, fontSize: 20, fontWeight: '800' },
  scrollContent: { padding: 20 },
  statusBanner: { backgroundColor: COLORS.WHITE, padding: 20, borderRadius: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25, elevation: 3 },
  statusTitle: { fontSize: 16, fontWeight: '700', color: COLORS.DEEP_BLUE },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  statusText: { fontSize: 11, fontWeight: '800' },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: COLORS.DEEP_BLUE, marginBottom: 15 },
  serviceList: { gap: 15 },
  serviceCard: { backgroundColor: COLORS.WHITE, padding: 18, borderRadius: 15, flexDirection: 'row', alignItems: 'center', elevation: 2, borderWidth: 1, borderColor: '#F1F5F9' },
  disabledCard: { backgroundColor: '#F8FAFC', borderColor: '#E2E8F0', opacity: 0.8 },
  iconContainer: { width: 55, height: 55, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  serviceInfo: { flex: 1, marginLeft: 15 },
  serviceTitle: { fontSize: 16, fontWeight: '700', color: COLORS.DEEP_BLUE },
  serviceSubTitle: { fontSize: 12, color: COLORS.TEXT_GRAY, marginTop: 2 }
});