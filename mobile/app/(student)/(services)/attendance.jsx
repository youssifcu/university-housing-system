import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, SafeAreaView,
  ActivityIndicator, RefreshControl
} from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { auth } from '../../../config/firebase';
import BACKEND_URL from '../../../config/backend';

const COLORS = {
  PRIMARY: '#1A237E',
  BG: '#F8FAFC',
  WHITE: '#FFFFFF',
  TEXT: '#1E293B',
  TEXT_SUB: '#64748B',
  BORDER: '#E2E8F0',
  SUCCESS: '#10B981',
  WARNING: '#F59E0B',
  ERROR: '#EF4444',
  INFO: '#3B82F6',
};

export default function AttendanceScreen() {
  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAttendance = useCallback(async () => {
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const res = await fetch(`${BACKEND_URL}/api/attendance/my`, {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      const data = await res.json();
      if (res.ok && data.data) {
        const recordsList = Array.isArray(data.data) ? data.data : data.data.records || [];
        setRecords(recordsList);
        
        const sum = { present: 0, absent: 0, onLeave: 0 };
        recordsList.forEach(r => {
           if (r.status === 'present' || r.status === 'late') sum.present++;
           else if (r.status === 'absent') sum.absent++;
           else if (r.status === 'excused') sum.onLeave++;
        });
        setSummary(sum);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  const formatShortDate = (dateStr) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return `${d.toLocaleDateString('en-US', { month: 'short', day: '2-digit' })}\n${d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
  };

  const getStatusConfig = (status) => {
    switch (status) {
      case 'present': return { color: COLORS.SUCCESS, label: 'Present' };
      case 'absent':  return { color: COLORS.ERROR, label: 'Absent' };
      case 'late':    return { color: COLORS.WARNING, label: 'Late' };
      case 'excused': return { color: COLORS.INFO, label: 'Excused' };
      default:        return { color: COLORS.TEXT_SUB, label: status || 'Unknown' };
    }
  };

  const renderHeader = () => (
    <View style={styles.tableHeaderRow}>
      <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Date & Time</Text>
      <Text style={[styles.tableHeaderCell, { flex: 1.5 }]}>Activity</Text>
      <Text style={[styles.tableHeaderCell, { flex: 1.2, textAlign: 'center' }]}>Status</Text>
    </View>
  );

  const renderRecord = ({ item }) => {
    const cfg = getStatusConfig(item.status);

    return (
      <View style={styles.tableRow}>
        <View style={styles.cellWrapperDouble}>
          <MaterialCommunityIcons name="calendar-clock-outline" size={14} color={COLORS.TEXT_SUB} style={styles.cellIcon} />
          <Text style={styles.tableCellDate}>{formatShortDate(item.date)}</Text>
        </View>

        <View style={styles.cellWrapperSingle}>
          <Text style={styles.tableCellActivity} numberOfLines={2}>Check-In</Text>
        </View>

        <View style={styles.statusCol}>
          <View style={[styles.statusBadge, { backgroundColor: cfg.color + '15' }]}>
            <Text style={[styles.statusBadgeText, { color: cfg.color }]}>{cfg.label}</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Attendance Log</Text>
        <Ionicons name="calendar-outline" size={26} color={COLORS.WHITE} />
      </View>

      {summary && (
        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, { borderColor: COLORS.SUCCESS }]}>
            <Text style={[styles.summaryNum, { color: COLORS.SUCCESS }]}>{summary.present || 0}</Text>
            <Text style={styles.summaryLabel}>Present</Text>
          </View>
          <View style={[styles.summaryCard, { borderColor: COLORS.ERROR }]}>
            <Text style={[styles.summaryNum, { color: COLORS.ERROR }]}>{summary.absent || 0}</Text>
            <Text style={styles.summaryLabel}>Absent</Text>
          </View>
          <View style={[styles.summaryCard, { borderColor: COLORS.WARNING }]}>
            <Text style={[styles.summaryNum, { color: COLORS.WARNING }]}>{summary.onLeave || 0}</Text>
            <Text style={styles.summaryLabel}>On Leave</Text>
          </View>
        </View>
      )}

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.PRIMARY} />
        </View>
      ) : (
        <View style={styles.tableContainer}>
          {records.length > 0 && renderHeader()}
          <FlatList
            data={records}
            renderItem={renderRecord}
            keyExtractor={(item, i) => item.id || item._id || String(i)}
            contentContainerStyle={styles.list}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => { setRefreshing(true); fetchAttendance(); }}
                tintColor={COLORS.PRIMARY}
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <MaterialCommunityIcons name="clipboard-text-off-outline" size={60} color={COLORS.BORDER} />
                <Text style={styles.emptyTitle}>No Records Yet</Text>
              </View>
            }
          />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.BG },
  header: {
    backgroundColor: COLORS.PRIMARY,
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 25,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: { color: COLORS.WHITE, fontSize: 22, fontWeight: '800' },
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    paddingBottom: 0,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: COLORS.WHITE,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    borderWidth: 2,
    elevation: 1,
  },
  summaryNum: { fontSize: 26, fontWeight: '800' },
  summaryLabel: { fontSize: 11, color: COLORS.TEXT_SUB, fontWeight: '600', marginTop: 3 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  tableContainer: { flex: 1, padding: 16, marginTop: 8 },
  list: { backgroundColor: COLORS.WHITE, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.BORDER, paddingBottom: 2 },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#EEF2FF',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    borderBottomWidth: 0,
  },
  tableHeaderCell: { fontSize: 12, fontWeight: '800', color: COLORS.PRIMARY, textTransform: 'uppercase' },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
    backgroundColor: COLORS.WHITE,
  },
  cellWrapperDouble: { flex: 2, flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  cellWrapperSingle: { flex: 1.5, justifyContent: 'center' },
  cellIcon: { marginTop: 2 },
  tableCellDate: { fontSize: 12, color: COLORS.TEXT, fontWeight: '600', lineHeight: 18, flex: 1 },
  tableCellActivity: { fontSize: 13, color: COLORS.TEXT, fontWeight: '700' },
  statusCol: { flex: 1.2, alignItems: 'center' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusBadgeText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingTop: 80, paddingBottom: 80, gap: 12 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: COLORS.TEXT_SUB },
});
