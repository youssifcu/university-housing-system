import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  SafeAreaView, ActivityIndicator, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import BACKEND_URL from '../../config/backend';

const DEEP_BLUE = '#1A237E';
const SOFT_WHITE = '#F8FAFC';
const SLATE_GRAY = '#475569';
const BORDER_COLOR = '#E2E8F0';

type AttendanceRecord = {
  _id: string;
  studentName: string;
  date: string;
  status: 'present' | 'absent';
};

const MOCK_ATTENDANCE: AttendanceRecord[] = [
  { _id: 'a1', studentName: 'Ahmed Ali',   date: '2026-04-04', status: 'present' },
  { _id: 'a2', studentName: 'Sara Khaled', date: '2026-04-04', status: 'absent'  },
  { _id: 'a3', studentName: 'Omar Hassan', date: '2026-04-03', status: 'present' },
];

export default function AttendanceListScreen() {
  const router = useRouter();
  const [records, setRecords] = useState<AttendanceRecord[]>(MOCK_ATTENDANCE);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const toggleStatus = async (record: AttendanceRecord) => {
    const newStatus: 'present' | 'absent' = record.status === 'present' ? 'absent' : 'present';
    setRecords((prev) =>
      prev.map((r) => r._id === record._id ? { ...r, status: newStatus } : r)
    );
  };

  const filtered = records.filter((r) => r.date === selectedDate);

  const renderItem = ({ item }: { item: AttendanceRecord }) => (
    <View style={styles.row}>
      <View style={styles.rowLeft}>
        <MaterialCommunityIcons name="account-circle" size={36} color={DEEP_BLUE} />
        <View style={{ marginLeft: 12 }}>
          <Text style={styles.studentName}>{item.studentName}</Text>
          <Text style={styles.dateText}>{item.date}</Text>
        </View>
      </View>
      <TouchableOpacity
        style={[styles.statusBadge, { backgroundColor: item.status === 'present' ? '#DCFCE7' : '#FEE2E2' }]}
        onPress={() => toggleStatus(item)}
      >
        <Text style={[styles.statusText, { color: item.status === 'present' ? '#16A34A' : '#DC2626' }]}>
          {item.status === 'present' ? 'Present' : 'Absent'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={26} color={DEEP_BLUE} />
        </TouchableOpacity>
        <Text style={styles.title}>Attendance Log</Text>
        <View style={{ width: 26 }} />
      </View>

      <View style={styles.dateRow}>
        <TouchableOpacity onPress={() => {
          const d = new Date(selectedDate);
          d.setDate(d.getDate() - 1);
          setSelectedDate(d.toISOString().split('T')[0]);
        }}>
          <MaterialCommunityIcons name="chevron-left" size={28} color={DEEP_BLUE} />
        </TouchableOpacity>
        <Text style={styles.dateLabel}>{selectedDate}</Text>
        <TouchableOpacity onPress={() => {
          const d = new Date(selectedDate);
          d.setDate(d.getDate() + 1);
          setSelectedDate(d.toISOString().split('T')[0]);
        }}>
          <MaterialCommunityIcons name="chevron-right" size={28} color={DEEP_BLUE} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={DEEP_BLUE} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <MaterialCommunityIcons name="clipboard-text-off" size={50} color={BORDER_COLOR} />
              <Text style={styles.emptyText}>No records for this date</Text>
            </View>
          }
        />
      )}
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
  dateRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 12, gap: 20, backgroundColor: '#FFF',
    borderBottomWidth: 1, borderBottomColor: BORDER_COLOR,
  },
  dateLabel: { fontSize: 16, fontWeight: '700', color: DEEP_BLUE },
  list: { padding: 16, gap: 12 },
  row: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#FFF', borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: BORDER_COLOR,
    elevation: 1, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4,
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center' },
  studentName: { fontSize: 15, fontWeight: '700', color: DEEP_BLUE },
  dateText: { fontSize: 12, color: SLATE_GRAY, marginTop: 2 },
  statusBadge: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 },
  statusText: { fontSize: 13, fontWeight: '700' },
  empty: { alignItems: 'center', marginTop: 60, gap: 10 },
  emptyText: { fontSize: 15, color: SLATE_GRAY },
});
