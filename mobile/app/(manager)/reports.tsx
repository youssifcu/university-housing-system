import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, SafeAreaView, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import BACKEND_URL from '../../config/backend';

const DEEP_BLUE = '#1A237E';
const SOFT_WHITE = '#F8FAFC';
const SLATE_GRAY = '#475569';
const BORDER_COLOR = '#E2E8F0';

const SEVERITY_CONFIG: Record<string, { color: string; bg: string }> = {
  low:      { color: '#16A34A', bg: '#DCFCE7' },
  medium:   { color: '#D97706', bg: '#FEF3C7' },
  high:     { color: '#DC2626', bg: '#FEE2E2' },
};

const STATUS_CONFIG: Record<string, { color: string; bg: string }> = {
  open:        { color: '#DC2626', bg: '#FEE2E2' },
  in_progress: { color: '#D97706', bg: '#FEF3C7' },
  resolved:    { color: '#16A34A', bg: '#DCFCE7' },
};

// 🔌 Mock data — replace with real API
const MOCK_REPORTS = [
  { _id: 'r1', type: 'Maintenance', description: 'Broken window in room 204', severity: 'high',   status: 'open'        },
  { _id: 'r2', type: 'Noise',       description: 'Loud music after midnight', severity: 'medium', status: 'in_progress' },
  { _id: 'r3', type: 'Cleanliness', description: 'Hallway needs cleaning',    severity: 'low',    status: 'open'        },
];

type Report = {
  _id: string;
  type: string;
  description: string;
  severity: string;
  status: string;
};

export default function FloorReportsScreen() {
  const router = useRouter();
  const [reports, setReports] = useState<Report[]>(MOCK_REPORTS);

  const updateStatus = (id: string, newStatus: string) => {
    Alert.alert('Update Status', `Set to "${newStatus}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Confirm', onPress: async () => {
          // 🔌 Uncomment when backend ready:
          // await fetch(`${BACKEND_URL}/api/reports/${id}`, {
          //   method: 'PATCH',
          //   headers: { 'Content-Type': 'application/json' },
          //   body: JSON.stringify({ status: newStatus }),
          // });
          setReports((prev) => prev.map((r) => r._id === id ? { ...r, status: newStatus } : r));
        }
      },
    ]);
  };

  const renderItem = ({ item }: { item: Report }) => {
    const sev = SEVERITY_CONFIG[item.severity] ?? SEVERITY_CONFIG.low;
    const sta = STATUS_CONFIG[item.status]    ?? STATUS_CONFIG.open;

    return (
      <View style={styles.card}>
        <View style={styles.cardTop}>
          <Text style={styles.reportType}>{item.type}</Text>
          <View style={[styles.badge, { backgroundColor: sev.bg }]}>
            <Text style={[styles.badgeText, { color: sev.color }]}>{item.severity.toUpperCase()}</Text>
          </View>
        </View>

        <Text style={styles.description}>{item.description}</Text>

        <View style={styles.statusRow}>
          <View style={[styles.badge, { backgroundColor: sta.bg }]}>
            <Text style={[styles.badgeText, { color: sta.color }]}>{item.status.replace('_', ' ').toUpperCase()}</Text>
          </View>
          <View style={styles.actions}>
            {item.status !== 'in_progress' && (
              <TouchableOpacity style={styles.actionBtn} onPress={() => updateStatus(item._id, 'in_progress')}>
                <Text style={styles.actionBtnText}>In Progress</Text>
              </TouchableOpacity>
            )}
            {item.status !== 'resolved' && (
              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#DCFCE7' }]} onPress={() => updateStatus(item._id, 'resolved')}>
                <Text style={[styles.actionBtnText, { color: '#16A34A' }]}>Resolve</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={26} color={DEEP_BLUE} />
        </TouchableOpacity>
        <Text style={styles.title}>Reports</Text>
        <View style={{ width: 26 }} />
      </View>

      <FlatList
        data={reports.filter((r) => r.status !== 'resolved')}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <MaterialCommunityIcons name="check-all" size={50} color={BORDER_COLOR} />
            <Text style={styles.emptyText}>No open reports</Text>
          </View>
        }
      />
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
  list: { padding: 16, gap: 14 },
  card: {
    backgroundColor: '#FFF', borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: BORDER_COLOR,
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  reportType: { fontSize: 16, fontWeight: '800', color: DEEP_BLUE },
  description: { fontSize: 14, color: SLATE_GRAY, marginBottom: 14, lineHeight: 20 },
  statusRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  actions: { flexDirection: 'row', gap: 8 },
  actionBtn: { backgroundColor: '#FEF3C7', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  actionBtnText: { fontSize: 12, fontWeight: '700', color: '#D97706' },
  empty: { alignItems: 'center', marginTop: 60, gap: 10 },
  emptyText: { fontSize: 15, color: SLATE_GRAY },
});
