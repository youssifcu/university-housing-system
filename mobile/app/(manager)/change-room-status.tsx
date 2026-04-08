import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  SafeAreaView, Alert, ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import BACKEND_URL from '../../config/backend';

const DEEP_BLUE = '#1A237E';
const SOFT_WHITE = '#F8FAFC';
const BORDER_COLOR = '#E2E8F0';

const STATUSES = [
  { value: 'available',   label: 'Available',   icon: 'check-circle',  color: '#16A34A', bg: '#DCFCE7' },
  { value: 'full',        label: 'Full',         icon: 'account-group', color: '#DC2626', bg: '#FEE2E2' },
  { value: 'maintenance', label: 'Maintenance',  icon: 'wrench',        color: '#D97706', bg: '#FEF3C7' },
];

export default function ChangeRoomStatusScreen() {
  const router = useRouter();
  const { roomId, currentStatus } = useLocalSearchParams<{ roomId: string; currentStatus: string }>();
  const [selected, setSelected] = useState(currentStatus || 'available');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      // 🔌 Uncomment when backend ready:
      // const res = await fetch(`${BACKEND_URL}/api/rooms/${roomId}/status`, {
      //   method: 'PATCH',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ status: selected }),
      // });
      // if (!res.ok) throw new Error('Failed to update status');

      Alert.alert('Success', 'Room status updated!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={26} color={DEEP_BLUE} />
        </TouchableOpacity>
        <Text style={styles.title}>Change Room Status</Text>
        <View style={{ width: 26 }} />
      </View>

      <View style={styles.content}>
        <Text style={styles.subtitle}>Select the new status for this room</Text>

        {STATUSES.map((s) => (
          <TouchableOpacity
            key={s.value}
            style={[styles.option, selected === s.value && styles.optionActive, { borderColor: selected === s.value ? s.color : BORDER_COLOR }]}
            onPress={() => setSelected(s.value)}
          >
            <View style={[styles.iconBox, { backgroundColor: s.bg }]}>
              <MaterialCommunityIcons name={s.icon as any} size={24} color={s.color} />
            </View>
            <Text style={[styles.optionLabel, selected === s.value && { color: s.color }]}>{s.label}</Text>
            {selected === s.value && (
              <MaterialCommunityIcons name="check-circle" size={22} color={s.color} />
            )}
          </TouchableOpacity>
        ))}

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={loading}>
          {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.saveBtnText}>Save Status</Text>}
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
  content: { padding: 20, gap: 14 },
  subtitle: { fontSize: 14, color: '#475569', marginBottom: 8 },
  option: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: '#FFF', borderRadius: 16, padding: 16,
    borderWidth: 2, borderColor: BORDER_COLOR,
  },
  optionActive: { backgroundColor: '#FAFAFA' },
  iconBox: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  optionLabel: { flex: 1, fontSize: 16, fontWeight: '700', color: DEEP_BLUE },
  saveBtn: {
    backgroundColor: DEEP_BLUE, borderRadius: 15, height: 55,
    justifyContent: 'center', alignItems: 'center', marginTop: 16, elevation: 4,
  },
  saveBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});
