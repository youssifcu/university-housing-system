import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView,
  TouchableOpacity, Platform, Image, StatusBar, ActivityIndicator, ScrollView,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import * as Brightness from 'expo-brightness';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { auth } from '../../config/firebase';
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
  SUCCESS: '#10B981',
  WARNING: '#F59E0B',
};

export default function QRCodeScreen() {
  const user = auth.currentUser;
  const profile = useAppStore((s) => s.profile);

  const [qrValue, setQrValue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const isActive = profile?.housingStatus?.toLowerCase() === 'active';

  const fetchQRData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const idToken = await user.getIdToken();

      const getResponse = await fetch(`${BACKEND_URL}/api/qr/my`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${idToken}`,
          'Content-Type': 'application/json',
        },
      });
      const getResult = await getResponse.json();

      if (getResponse.ok && getResult.data?.qrCodes) {
        const raw = getResult.data.qrCodes;
        const code = raw.attendanceCode || raw.attendance?.code || raw.mealCode || raw.meal?.code;
        setQrValue(code ? String(code) : null);
        return;
      }

      if (getResponse.status === 404) {
        const genResponse = await fetch(`${BACKEND_URL}/api/qr/generate`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${idToken}`,
            'Content-Type': 'application/json',
          },
        });
        const genResult = await genResponse.json();

        if (genResponse.ok && genResult.data?.qrCodes) {
          const raw = genResult.data.qrCodes;
          const code = raw.attendance?.code || raw.attendanceCode || raw.meal?.code || raw.mealCode;
          setQrValue(code ? String(code) : null);
          return;
        }

        throw new Error(genResult.message || 'Failed to generate QR');
      }

      throw new Error(getResult.message || 'Failed to fetch QR');

    } catch (err) {
      console.log('QR Error:', err.message);
      setError('Connection error. Could not generate ID code.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (isActive) {
      fetchQRData();
    } else {
      setLoading(false);
    }
  }, [isActive, fetchQRData]);

  useEffect(() => {
    let prevBrightness = null;
    const boostBrightness = async () => {
      if (Platform.OS !== 'web') {
        try {
          const { status } = await Brightness.requestPermissionsAsync();
          if (status === 'granted') {
            prevBrightness = await Brightness.getBrightnessAsync();
            await Brightness.setBrightnessAsync(1.0);
          }
        } catch {}
      }
    };
    boostBrightness();
    return () => {
      if (prevBrightness !== null && Platform.OS !== 'web') {
        Brightness.setBrightnessAsync(prevBrightness).catch(() => {});
      }
    };
  }, []);

  if (loading && isActive) {
    return (
      <View style={[styles.container, { justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={COLORS.DEEP_BLUE} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        <View style={styles.header}>
          <View style={styles.avatarWrapper}>
            {profile?.profilePicture ? (
              <Image source={{ uri: profile.profilePicture }} style={styles.avatar} />
            ) : (
              <MaterialCommunityIcons name="account-circle" size={110} color={COLORS.DEEP_BLUE} />
            )}
          </View>
          <Text style={styles.userNameText}>{profile?.name || 'Student'}</Text>
          <View style={[styles.badge, { backgroundColor: isActive ? '#E0E7FF' : '#FFEDD5' }]}>
            <Text style={[styles.badgeText, { color: isActive ? COLORS.DEEP_BLUE : COLORS.WARNING }]}>
              {profile?.housingStatus?.toUpperCase().replace('_', ' ') || 'PENDING'}
            </Text>
          </View>
        </View>

        {!isActive ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Identity Status</Text>
            <View style={styles.readOnlyCard}>
              <View style={styles.inactiveBox}>
                <MaterialCommunityIcons name="shield-lock-outline" size={48} color={COLORS.WARNING} />
                <Text style={styles.inactiveTitle}>Access Restricted</Text>
                <Text style={styles.inactiveText}>
                  Your digital identity card is only available for students with an "ACTIVE" housing status.
                </Text>
                <TouchableOpacity style={styles.refreshBtn} onPress={fetchQRData}>
                  <Text style={styles.refreshBtnText}>Refresh Status</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ) : (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Digital Access QR</Text>
              <View style={styles.qrCard}>
                {error ? (
                  <View style={styles.errorContainer}>
                    <MaterialCommunityIcons name="alert-circle-outline" size={40} color={COLORS.ERROR_COLOR} />
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity onPress={fetchQRData}>
                      <Text style={styles.retryText}>Retry</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.qrWrapper}>
                    {typeof qrValue === 'string' && qrValue.length > 0 ? (
                      <QRCode
                        value={qrValue}
                        size={200}
                        color={COLORS.DEEP_BLUE}
                        backgroundColor={COLORS.WHITE}
                        ecl="H"
                      />
                    ) : (
                      <ActivityIndicator color={COLORS.DEEP_BLUE} />
                    )}
                  </View>
                )}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Identity Details</Text>
              <View style={styles.readOnlyCard}>
                <ReadOnlyItem icon="fingerprint" label="Identity Token" value={qrValue || 'Generating...'} />
                <ReadOnlyItem icon="school-outline" label="University ID" value={profile?.studentId || '—'} />
                <ReadOnlyItem icon="check-decagram-outline" label="Status" value="Verified Member" color={COLORS.SUCCESS} />
              </View>
            </View>

            <TouchableOpacity style={styles.syncBtn} onPress={fetchQRData}>
              <MaterialCommunityIcons name="sync" size={20} color={COLORS.WHITE} />
              <Text style={styles.syncBtnText}>Sync Identity</Text>
            </TouchableOpacity>
          </>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const ReadOnlyItem = ({ icon, label, value, color }) => (
  <View style={styles.readOnlyItem}>
    <View style={styles.readOnlyIconBg}>
      <MaterialCommunityIcons name={icon} size={20} color={color || COLORS.DEEP_BLUE} />
    </View>
    <View style={{ marginLeft: 12, flex: 1 }}>
      <Text style={styles.readOnlyLabel}>{label}</Text>
      <Text style={[styles.readOnlyValue, color && { color }]}>{value}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.SOFT_WHITE },
  scrollContent: { padding: 20 },
  header: { alignItems: 'center', marginVertical: 20 },
  avatarWrapper: {
    width: 110, height: 110, borderRadius: 55, backgroundColor: COLORS.WHITE,
    justifyContent: 'center', alignItems: 'center', elevation: 3, overflow: 'hidden',
  },
  avatar: { width: '100%', height: '100%', borderRadius: 55 },
  userNameText: { fontSize: 20, fontWeight: '800', color: COLORS.DEEP_BLUE, marginTop: 12 },
  badge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, marginTop: 6 },
  badgeText: { fontSize: 10, fontWeight: '800' },
  section: { marginBottom: 25 },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: COLORS.DEEP_BLUE, marginBottom: 12, marginLeft: 5 },
  readOnlyCard: { backgroundColor: COLORS.READ_ONLY_BG, borderRadius: 16, padding: 8 },
  readOnlyItem: { flexDirection: 'row', alignItems: 'center', padding: 10 },
  readOnlyIconBg: {
    width: 36, height: 36, backgroundColor: COLORS.WHITE,
    borderRadius: 10, justifyContent: 'center', alignItems: 'center',
  },
  readOnlyLabel: { fontSize: 10, color: COLORS.SLATE_GRAY, textTransform: 'uppercase', letterSpacing: 0.5 },
  readOnlyValue: { fontSize: 14, fontWeight: '700', color: '#1E293B' },
  qrCard: {
    backgroundColor: COLORS.WHITE, borderRadius: 25, padding: 30,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: COLORS.BORDER_COLOR, elevation: 2,
  },
  qrWrapper: {
    padding: 10, backgroundColor: COLORS.WHITE,
    borderRadius: 15, minHeight: 200, justifyContent: 'center',
  },
  errorContainer: { alignItems: 'center', padding: 20 },
  errorText: { color: COLORS.ERROR_COLOR, fontWeight: '600', textAlign: 'center', marginTop: 10 },
  retryText: { color: COLORS.DEEP_BLUE, marginTop: 10, fontWeight: '700' },
  syncBtn: {
    flexDirection: 'row', backgroundColor: COLORS.DEEP_BLUE, padding: 16,
    borderRadius: 12, alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 30,
  },
  syncBtnText: { color: COLORS.WHITE, fontWeight: '700', fontSize: 16 },
  inactiveBox: { alignItems: 'center', padding: 20, gap: 10 },
  inactiveTitle: { fontSize: 16, fontWeight: '700', color: COLORS.DEEP_BLUE },
  inactiveText: { fontSize: 13, color: COLORS.SLATE_GRAY, textAlign: 'center', lineHeight: 20 },
  refreshBtn: { backgroundColor: COLORS.DEEP_BLUE, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10, marginTop: 10 },
  refreshBtnText: { color: COLORS.WHITE, fontWeight: '700' },
});