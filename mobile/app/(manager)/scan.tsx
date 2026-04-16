import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Alert, ActivityIndicator, SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { CameraView, Camera } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import BACKEND_URL from '../../config/backend';
import { getAuth } from 'firebase/auth';

const DEEP_BLUE = '#1A237E';
const SOFT_WHITE = '#F8FAFC';
const SLATE_GRAY = '#475569';

export default function ScanAttendanceScreen() {
  const router = useRouter();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanning, setScanning] = useState(false);
  const [selectedBuilding, setSelectedBuilding] = useState('');
  const [buildings, setBuildings] = useState<{ _id: string; name: string }[]>([]);
  const [lastScan, setLastScan] = useState<{ name: string; status: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchingBuildings, setFetchingBuildings] = useState(true);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
    fetchBuildings();
  }, []);

  const getToken = async () => {
    const user = getAuth().currentUser;
    if (!user) throw new Error('Not authenticated');
    return await user.getIdToken();
  };

  const fetchBuildings = async () => {
    try {
      setFetchingBuildings(true);
      const token = await getToken();
      const res = await fetch(`${BACKEND_URL}/api/buildings`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      const list = data.data?.buildings || data.data || data || [];
      setBuildings(Array.isArray(list) ? list : []);
    } catch (error: any) {
      Alert.alert('Error', 'Failed to load buildings: ' + error.message);
      setBuildings([]);
    } finally {
      setFetchingBuildings(false);
    }
  };

  const handleScan = async ({ data }: { data: string }) => {
    if (!scanning || loading) return;

    setLoading(true);
    setScanning(false);

    try {
      const token = await getToken();

      const response = await fetch(`${BACKEND_URL}/api/attendance/scan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          qrCode: data,
          buildingId: selectedBuilding || null,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        Alert.alert('Error', result.message || 'Scan failed');
        setScanning(true);
        return;
      }

      if (result.data?.duplicate) {
        Alert.alert(
          'ℹ️ Already Scanned',
          `${result.data.studentName} was already checked in today.`
        );
        setScanning(true);
      } else {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setLastScan({
          name: result.data?.studentName || 'Student',
          status: result.data?.status || 'present',
        });

        setTimeout(() => {
          setLastScan(null);
          setScanning(true);
        }, 2500);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message);
      setScanning(true);
    } finally {
      setLoading(false);
    }
  };

  if (hasPermission === null || fetchingBuildings) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={DEEP_BLUE} />
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.center}>
        <MaterialCommunityIcons name="camera-off" size={60} color={SLATE_GRAY} />
        <Text style={styles.permText}>Camera permission denied.</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={26} color={DEEP_BLUE} />
        </TouchableOpacity>
        <Text style={styles.title}>Scan Attendance</Text>
        <View style={{ width: 26 }} />
      </View>

      {/* 🔹 خليت الـ picker موجود عادي (اختياري) */}
      <View style={styles.pickerWrapper}>
        <Text style={styles.label}>Select Building (Optional)</Text>
        <View style={styles.pickerBox}>
          <Picker
            selectedValue={selectedBuilding}
            onValueChange={(val) => setSelectedBuilding(val)}
            style={{ color: DEEP_BLUE }}
          >
            <Picker.Item label="-- No Building --" value="" />
            {buildings.map((b) => (
              <Picker.Item key={b._id} label={b.name} value={b._id} />
            ))}
          </Picker>
        </View>
      </View>

      {/* ✅ removed selectedBuilding condition */}
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
        </View>
      ) : (
        <View style={styles.center}>
          {lastScan ? (
            <View style={styles.resultCard}>
              <MaterialCommunityIcons name="check-circle" size={50} color="#16A34A" />
              <Text style={styles.resultName}>{lastScan.name}</Text>
              <Text style={styles.resultStatus}>
                {lastScan.status.toUpperCase()}
              </Text>
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

      {scanning && (
        <TouchableOpacity
          style={styles.stopBtn}
          onPress={() => setScanning(false)}
        >
          <Text style={styles.stopBtnText}>Stop Scanning</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: SOFT_WHITE },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
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
  title: { fontSize: 18, fontWeight: '800', color: DEEP_BLUE },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: DEEP_BLUE,
    marginBottom: 6,
    opacity: 0.7,
  },
  pickerWrapper: { padding: 20 },
  pickerBox: {
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    backgroundColor: '#FFF',
  },
  scannerContainer: { flex: 1, position: 'relative' },
  camera: { flex: 1 },
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
  },
  resultCard: {
    alignItems: 'center',
    gap: 10,
    padding: 30,
    backgroundColor: '#FFF',
    borderRadius: 20,
    elevation: 4,
  },
  resultName: { fontSize: 20, fontWeight: '800', color: DEEP_BLUE },
  resultStatus: {
    fontSize: 14,
    color: '#16A34A',
    fontWeight: '700',
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
  startBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  stopBtn: {
    margin: 20,
    padding: 16,
    backgroundColor: '#EF4444',
    borderRadius: 14,
    alignItems: 'center',
  },
  stopBtnText: { color: '#FFF', fontWeight: '700', fontSize: 15 },
  permText: { fontSize: 16, color: SLATE_GRAY, marginTop: 10 },
});