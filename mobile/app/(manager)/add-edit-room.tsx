import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput,
  TouchableOpacity, SafeAreaView, Alert,
  ActivityIndicator, ScrollView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import BACKEND_URL from '../../config/backend';

const DEEP_BLUE = '#1A237E';
const SOFT_WHITE = '#F8FAFC';
const BORDER_COLOR = '#E2E8F0';

export default function AddEditRoomScreen() {
  const router = useRouter();
  const { roomId, buildingId, buildingName } = useLocalSearchParams<{ roomId?: string; buildingId: string; buildingName: string }>();
  const isEdit = !!roomId;

  const [roomNumber, setRoomNumber] = useState('');
  const [floor, setFloor] = useState('');
  const [capacity, setCapacity] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isEdit) {
      // 🔌 Fetch room details when backend ready:
      // fetch(`${BACKEND_URL}/api/rooms/${roomId}`)
      //   .then(r => r.json()).then(data => {
      //     setRoomNumber(data.roomNumber); setFloor(String(data.floor)); setCapacity(String(data.capacity));
      //   });
    }
  }, []);

  const handleSave = async () => {
    if (!roomNumber.trim() || !floor.trim() || !capacity.trim()) {
      Alert.alert('Required', 'Please fill in all fields.');
      return;
    }
    setLoading(true);
    try {
      const payload = { roomNumber: roomNumber.trim(), buildingId, floor: parseInt(floor), capacity: parseInt(capacity) };

      // 🔌 Uncomment when backend ready:
      // const url = isEdit ? `${BACKEND_URL}/api/rooms/${roomId}` : `${BACKEND_URL}/api/rooms`;
      // const method = isEdit ? 'PUT' : 'POST';
      // const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      // if (!res.ok) throw new Error('Failed to save room');

      Alert.alert('Success', isEdit ? 'Room updated!' : 'Room created!', [
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
        <Text style={styles.title}>{isEdit ? 'Edit Room' : 'Add Room'}</Text>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView contentContainerStyle={styles.form}>
        <Text style={styles.label}>Building</Text>
        <View style={styles.disabledInput}>
          <Text style={{ color: DEEP_BLUE, fontSize: 15 }}>{buildingName}</Text>
        </View>

        <Text style={styles.label}>Room Number</Text>
        <TextInput style={styles.input} value={roomNumber} onChangeText={setRoomNumber} placeholder="e.g. 101" />

        <Text style={styles.label}>Floor</Text>
        <TextInput style={styles.input} value={floor} onChangeText={setFloor} placeholder="e.g. 1" keyboardType="numeric" />

        <Text style={styles.label}>Capacity</Text>
        <TextInput style={styles.input} value={capacity} onChangeText={setCapacity} placeholder="e.g. 4" keyboardType="numeric" />

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={loading}>
          {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.saveBtnText}>{isEdit ? 'Update Room' : 'Create Room'}</Text>}
        </TouchableOpacity>
      </ScrollView>
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
  form: { padding: 20, gap: 6 },
  label: { fontSize: 11, fontWeight: '700', color: DEEP_BLUE, opacity: 0.6, textTransform: 'uppercase', marginTop: 14, marginBottom: 6 },
  input: {
    backgroundColor: '#FFF', borderRadius: 12, borderWidth: 1.5,
    borderColor: BORDER_COLOR, paddingHorizontal: 15, height: 50, fontSize: 15, color: DEEP_BLUE,
  },
  disabledInput: {
    backgroundColor: '#F1F5F9', borderRadius: 12, borderWidth: 1.5,
    borderColor: BORDER_COLOR, paddingHorizontal: 15, height: 50, justifyContent: 'center',
  },
  saveBtn: {
    backgroundColor: DEEP_BLUE, borderRadius: 15, height: 55,
    justifyContent: 'center', alignItems: 'center', marginTop: 30, elevation: 4,
  },
  saveBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});
