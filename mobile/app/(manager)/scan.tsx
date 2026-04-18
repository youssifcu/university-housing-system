import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Alert, ActivityIndicator, SafeAreaView,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { CameraView, Camera } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import BACKEND_URL from '../../config/backend';
import { getAuth } from 'firebase/auth';

const DEEP_BLUE = '#1A237E';
const SOFT_WHITE = '#F8FAFC';
const SLATE_GRAY = '#475569';
const SUCCESS_GREEN = '#16A34A';
const ERROR_RED = '#EF4444';
const WARNING_ORANGE = '#F97316';

interface ScanResult {
  name: string;
  status: 'present' | 'on-leave' | 'error';
  message?: string;
}

export default function ScanAttendanceScreen() {
  const router = useRouter();
  
  // Camera & Permissions
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanning, setScanning] = useState(false);
  
  // Scan Results
  const [lastScan, setLastScan] = useState<ScanResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [scannedCount, setScannedCount] = useState(0);
  const scanLockRef = useRef(false);
  
  // Error Handling
  const [lastError, setLastError] = useState<string | null>(null);

  // Request camera permissions on mount
  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  /**
   * Get Firebase ID token for authentication
   */
  const getToken = useCallback(async () => {
    const user = getAuth().currentUser;
    if (!user) throw new Error('Not authenticated');
    return await user.getIdToken();
  }, []);

  /**
   * Handle QR code scan
   */
  const handleScan = async ({ data }: { data: string }) => {
    if (scanLockRef.current || loading) return;
    scanLockRef.current = true;
    setLoading(true);
    setScanning(false);
    setLastError(null);

    try {
      const token = await getToken();

      const requestBody = {
        qrCodeString: data.trim(),
      };

      console.log('📸 Scanning QR Code:', {
        qrCode: data.substring(0, 10) + '...',
        building: 'Auto-detect from student room',
      });

      const response = await fetch(`${BACKEND_URL}/api/attendance/scan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      const result = await response.json();

      // Handle non-OK responses
      if (!response.ok) {
        // Handle specific error cases
        if (result.message?.includes('already recorded')) {
          Alert.alert(
            'ℹ️ Already Scanned',
            'This student was already checked in today.'
          );
          await Haptics.notificationAsync(
            Haptics.NotificationFeedbackType.Warning
          );
          setLastScan({
            name: 'Duplicate Scan',
            status: 'error',
            message: 'Already scanned today',
          });
        } else if (result.message?.includes('not authenticated')) {
          Alert.alert(
            '🔐 Authentication Error',
            'Please log in with an admin or supervisor account.'
          );
        } else if (result.message?.includes('Access denied')) {
          Alert.alert(
            '⛔ Insufficient Permissions',
            'Only admins and supervisors can scan attendance.'
          );
        } else {
          Alert.alert('❌ Error', result.message || 'Scan failed');
          setLastError(result.message || 'Scan failed');
        }
        setScanning(true);
        return;
      }

      // Handle on-leave case
      if (result.data?.onLeave) {
        Alert.alert(
          '📋 On Leave',
          `${result.data.studentName} is on approved leave. Attendance not required.`
        );
        await Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Warning
        );
        setLastScan({
          name: result.data.studentName || 'Student',
          status: 'on-leave',
          message: 'On approved leave',
        });
        setScanning(true);
        return;
      }

      // ✅ Success
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setScannedCount(prev => prev + 1);
      setLastScan({
        name: result.data?.studentName || 'Student',
        status: 'present',
        message: 'Attendance recorded',
      });

      console.log('✅ Attendance recorded for:', result.data?.studentName);

      // Auto-resume after 2.5 seconds
      setTimeout(() => {
        setLastScan(null);
        setScanning(true);
      }, 2500);
    } catch (error: any) {
      const errorMsg = error.message || 'Unknown error occurred';
      setLastError(errorMsg);
      
      // Handle specific error types
      if (error.message?.includes('Failed to fetch')) {
        Alert.alert(
          '🌐 Network Error',
          'Cannot reach the server. Check your internet connection and backend URL.'
        );
      } else if (error.message?.includes('Not authenticated')) {
        Alert.alert('🔐 Authentication Error', 'Please log in again.');
      } else {
        Alert.alert('❌ Error', errorMsg);
      }

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setScanning(true);
    } finally {
      scanLockRef.current = false;
      setLoading(false);
    }
  };

  /**
   * Render loading state
   */
  if (hasPermission === null) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={DEEP_BLUE} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  /**
   * Render permission denied state
   */
  if (hasPermission === false) {
    return (
      <View style={styles.center}>
        <MaterialCommunityIcons
          name="camera-off"
          size={60}
          color={SLATE_GRAY}
        />
        <Text style={styles.permText}>Camera permission denied.</Text>
        <TouchableOpacity
          style={styles.retryBtn}
          onPress={async () => {
            const { status } = await Camera.requestCameraPermissionsAsync();
            setHasPermission(status === 'granted');
          }}
        >
          <Text style={styles.retryBtnText}>Request Permission Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={26} color={DEEP_BLUE} />
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={styles.title}>Scan Attendance</Text>
          {scannedCount > 0 && (
            <Text style={styles.counter}>Scanned: {scannedCount}</Text>
          )}
        </View>
      </View>

      {/* Error Banner */}
      {lastError && (
        <View style={styles.errorBanner}>
          <MaterialCommunityIcons name="alert-circle" size={20} color={ERROR_RED} />
          <Text style={styles.errorText}>{lastError}</Text>
          <TouchableOpacity onPress={() => setLastError(null)}>
            <MaterialCommunityIcons name="close" size={20} color={ERROR_RED} />
          </TouchableOpacity>
        </View>
      )}


      {/* Camera or Result */}
      {scanning ? (
        <View style={styles.scannerContainer}>
          <CameraView
            style={styles.camera}
            onBarcodeScanned={handleScan}
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          />
          <View style={styles.overlay}>
            <View style={styles.scanBox} />
          </View>
          {loading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#FFF" />
              <Text style={styles.loadingOverlayText}>Processing...</Text>
            </View>
          )}
        </View>
      ) : (
        <View style={styles.center}>
          {lastScan ? (
            <View
              style={[
                styles.resultCard,
                {
                  borderLeftColor:
                    lastScan.status === 'present'
                      ? SUCCESS_GREEN
                      : lastScan.status === 'on-leave'
                        ? WARNING_ORANGE
                        : ERROR_RED,
                },
              ]}
            >
              <MaterialCommunityIcons
                name={
                  lastScan.status === 'present'
                    ? 'check-circle'
                    : lastScan.status === 'on-leave'
                      ? 'information'
                      : 'alert-circle'
                }
                size={50}
                color={
                  lastScan.status === 'present'
                    ? SUCCESS_GREEN
                    : lastScan.status === 'on-leave'
                      ? WARNING_ORANGE
                      : ERROR_RED
                }
              />
              <Text style={styles.resultName}>{lastScan.name}</Text>
              <Text style={styles.resultStatus}>{lastScan.status}</Text>
              {lastScan.message && (
                <Text style={styles.resultMessage}>{lastScan.message}</Text>
              )}
            </View>
          ) : (
            <TouchableOpacity
              style={styles.startBtn}
              onPress={() => setScanning(true)}
            >
              <MaterialCommunityIcons name="qrcode-scan" size={28} color="#FFF" />
              <Text style={styles.startBtnText}>Start Scanning</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Stop Button */}
      {scanning && (
        <TouchableOpacity
          style={styles.stopBtn}
          onPress={() => setScanning(false)}
          disabled={loading}
        >
          <Text style={styles.stopBtnText}>
            {loading ? 'Processing...' : 'Stop Scanning'}
          </Text>
        </TouchableOpacity>
      )}

      {/* Footer Info */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          {scanning ? '📱 Position QR code in frame' : '👆 Tap to start scanning'}
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: SOFT_WHITE,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#FFF',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: DEEP_BLUE,
  },
  counter: {
    fontSize: 12,
    color: SUCCESS_GREEN,
    fontWeight: '600',
    marginTop: 4,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: SLATE_GRAY,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FEE2E2',
    borderBottomWidth: 1,
    borderBottomColor: ERROR_RED,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    color: ERROR_RED,
    fontWeight: '600',
  },
  scannerContainer: {
    flex: 1,
    position: 'relative',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanBox: {
    width: 220,
    height: 220,
    borderWidth: 3,
    borderColor: '#FFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingOverlayText: {
    color: '#FFF',
    marginTop: 12,
    fontSize: 14,
    fontWeight: '600',
  },
  resultCard: {
    alignItems: 'center',
    gap: 10,
    padding: 30,
    backgroundColor: '#FFF',
    borderRadius: 20,
    borderLeftWidth: 5,
    elevation: 4,
  },
  resultName: {
    fontSize: 20,
    fontWeight: '800',
    color: DEEP_BLUE,
  },
  resultStatus: {
    fontSize: 14,
    color: SUCCESS_GREEN,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  resultMessage: {
    fontSize: 12,
    color: SLATE_GRAY,
    fontStyle: 'italic',
  },
  startBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: DEEP_BLUE,
    paddingHorizontal: 30,
    paddingVertical: 16,
    borderRadius: 16,
    elevation: 4,
  },
  startBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  stopBtn: {
    margin: 20,
    padding: 16,
    backgroundColor: ERROR_RED,
    borderRadius: 14,
    alignItems: 'center',
  },
  stopBtnText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 15,
  },
  retryBtn: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: DEEP_BLUE,
    borderRadius: 8,
  },
  retryBtnText: {
    color: '#FFF',
    fontWeight: '600',
  },
  permText: {
    fontSize: 16,
    color: SLATE_GRAY,
    marginTop: 10,
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: SLATE_GRAY,
    fontWeight: '500',
  },
});
