import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView,
  TouchableOpacity, Platform, Image,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import * as Brightness from 'expo-brightness';
import { Ionicons } from '@expo/vector-icons';
import { auth } from '../../config/firebase';
import BACKEND_URL from '../../config/backend';
import { LoadingSpinner } from '../../components/shared/LoadingSpinner';

const COLORS = {
  primary: '#1A237E',
  inactive: '#94A3B8',
  bg: '#FFFFFF',
  border: '#F1F5F9',
  error: '#EF4444',
  text: '#1E293B',
  subText: '#64748B',
  white: '#FFFFFF',
  slate_gray: '#475569'
};

export default function QRCodeScreen() {
  const [studentData, setStudentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAccepted, setIsAccepted] = useState(false);

  const fetchQR = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await auth.currentUser?.getIdToken();
      const response = await fetch(`${BACKEND_URL}/api/students/me/qr`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setStudentData(data);
        setIsAccepted(data.status === 'accepted'); 
      } else {
        throw new Error(data.message || 'Data fetch failed');
      }
    } catch (err) {
      setError('Failed to load data. Please check your connection.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQR();
  }, [fetchQR]);

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
        } catch (_) {}
      }
    };
    boostBrightness();
    return () => {
      if (prevBrightness !== null && Platform.OS !== 'web') {
        Brightness.setBrightnessAsync(prevBrightness).catch(() => {});
      }
    };
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <LoadingSpinner message="Verifying status..." />
      </SafeAreaView>
    );
  }

  if (!isAccepted ) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.simpleContainer}>
          <Ionicons name="alert-circle-outline" size={60} color={COLORS.inactive} />
          <Text style={styles.simpleTitle}>Application Under Review</Text>
          <Text style={styles.simpleSubText}>
            Your application hasn't been accepted yet. Once approved, your QR code will appear here.
          </Text>
          <TouchableOpacity style={styles.simpleBtn} onPress={fetchQR}>
            <Text style={styles.simpleBtnText}>Check Status</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.headerCard}>
          <View style={styles.avatarWrapper}>
            {studentData?.profileImage ? (
              <Image source={{ uri: studentData.profileImage }} style={styles.avatar} />
            ) : (
              <Ionicons name="person" size={40} color={COLORS.white} />
            )}
          </View>
          <Text style={styles.studentName}>Digital Identity Card</Text>
          <Text style={styles.subInfo}>Use this code for University Housing access</Text>
        </View>

        <View style={styles.qrCard}>
          {error ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle-outline" size={48} color={COLORS.error} />
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity style={styles.retryBtn} onPress={fetchQR}>
                <Ionicons name="refresh-outline" size={16} color={COLORS.white} />
                <Text style={styles.retryText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.qrWrapper}>
              <QRCode
                value={studentData?.qrCode || 'N/A'}
                size={220}
                color={COLORS.primary}
                backgroundColor={COLORS.white}
                ecl="H"
              />
              <Text style={styles.qrValueText}>{studentData?.qrCode}</Text>
            </View>
          )}
        </View>

        <View style={styles.hintRow}>
          <Ionicons name="information-circle-outline" size={18} color={COLORS.inactive} />
          <Text style={styles.hintText}>
            Please present this code to the security officer
          </Text>
        </View>

        <TouchableOpacity 
          style={styles.refreshBtn} 
          onPress={fetchQR} 
          disabled={loading}
        >
          <Ionicons name="sync-outline" size={18} color={COLORS.primary} />
          <Text style={styles.refreshText}>Refresh Code</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8FAFC' },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 25,
  },
  simpleContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    gap: 15,
  },
  simpleTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 10,
  },
  simpleSubText: {
    fontSize: 15,
    color: COLORS.subText,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  simpleBtn: {
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 30,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
  },
  simpleBtnText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 16,
  },
  headerCard: { alignItems: 'center', gap: 10 },
  avatarWrapper: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    overflow: 'hidden',
  },
  avatar: { width: '100%', height: '100%', resizeMode: 'cover' },
  studentName: { color: COLORS.text, fontSize: 24, fontWeight: '800' },
  subInfo: { color: COLORS.subText, fontSize: 14, textAlign: 'center' },
  qrCard: {
    backgroundColor: COLORS.white,
    borderRadius: 30,
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    maxWidth: 340,
    aspectRatio: 1,
    elevation: 15,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12,
    shadowRadius: 25,
  },
  qrWrapper: { alignItems: 'center', justifyContent: 'center', gap: 15 },
  qrValueText: {
    fontSize: 13,
    color: COLORS.inactive,
    letterSpacing: 2,
    fontWeight: '600',
    marginTop: 5,
  },
  errorContainer: { alignItems: 'center', gap: 15 },
  errorText: { color: COLORS.error, fontSize: 15, textAlign: 'center', fontWeight: '600' },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.error,
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 15,
    gap: 10,
  },
  retryText: { color: COLORS.white, fontWeight: '700', fontSize: 16 },
  hintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 15,
    backgroundColor: '#E2E8F0',
    padding: 15,
    borderRadius: 15,
    maxWidth: '90%',
  },
  hintText: {
    color: COLORS.slate_gray,
    fontSize: 13,
    textAlign: 'left',
    flex: 1,
    lineHeight: 20,
  },
  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: COLORS.primary,
    backgroundColor: COLORS.white,
  },
  refreshText: { color: COLORS.primary, fontSize: 16, fontWeight: '700' },
});