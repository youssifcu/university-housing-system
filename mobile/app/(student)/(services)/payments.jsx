import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, SafeAreaView,
  ActivityIndicator, RefreshControl
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
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

const getStatusConfig = (status) => {
  if (status === 'confirmed' || status === 'paid') return { color: COLORS.SUCCESS, label: 'Confirmed', icon: 'check-circle-outline' };
  if (status === 'pending') return { color: COLORS.WARNING, label: 'Pending', icon: 'clock-outline' };
  if (status === 'refunded') return { color: COLORS.INFO, label: 'Refunded', icon: 'cash-refund' };
  if (status === 'failed') return { color: COLORS.ERROR, label: 'Failed', icon: 'close-circle-outline' };
  return { color: COLORS.TEXT_SUB, label: status || 'Unknown', icon: 'help-circle-outline' };
};

const getTypeIcon = (type) => {
  if (type === 'housing') return 'home-city-outline';
  if (type === 'meal' || type === 'meal_booking') return 'silverware-fork-knife';
  return 'credit-card-outline';
};

export default function PaymentsScreen() {
  const [payments, setPayments] = useState([]);
  const [summary, setSummary] = useState({ total: 0, confirmed: 0, pending: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPayments = useCallback(async () => {
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const res = await fetch(`${BACKEND_URL}/api/payments/my`, {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      const data = await res.json();
      if (res.ok && data.data) {
        const list = Array.isArray(data.data) ? data.data : data.data.payments || [];
        setPayments(list);

        const total = list.reduce((sum, p) => sum + (p.amount || 0), 0);
        const confirmed = list.filter(p => p.status === 'confirmed' || p.status === 'paid').reduce((s, p) => s + (p.amount || 0), 0);
        const pending = list.filter(p => p.status === 'pending').reduce((s, p) => s + (p.amount || 0), 0);
        setSummary({ total, confirmed, pending });
      }
    } catch (err) {
      console.error('[Payments] Fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const renderPayment = ({ item }) => {
    const cfg = getStatusConfig(item.status);
    return (
      <View style={styles.card}>
        <View style={[styles.iconBg, { backgroundColor: cfg.color + '15' }]}>
          <MaterialCommunityIcons name={getTypeIcon(item.type)} size={26} color={cfg.color} />
        </View>
        <View style={styles.cardContent}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle} numberOfLines={1}>
              {item.description || (item.type === 'housing' ? 'Housing Fee' : 'Meal Payment')}
            </Text>
            <Text style={[styles.amountText, { color: cfg.color }]}>
              {item.amount != null ? `${item.amount} EGP` : '—'}
            </Text>
          </View>
          <View style={styles.cardFooterRow}>
            <View style={[styles.badge, { backgroundColor: cfg.color + '15' }]}>
              <MaterialCommunityIcons name={cfg.icon} size={11} color={cfg.color} />
              <Text style={[styles.badgeText, { color: cfg.color }]}>{cfg.label}</Text>
            </View>
            <Text style={styles.cardDate}>
              {item.createdAt
                ? new Date(item.createdAt).toLocaleDateString('en-US', {
                    month: 'short', day: 'numeric', year: 'numeric',
                  })
                : ''}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="light" />

      {}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Payments</Text>
          <Text style={styles.headerSub}>Your financial history</Text>
        </View>
        <MaterialCommunityIcons name="credit-card-outline" size={28} color={COLORS.WHITE} />
      </View>

      {}
      <View style={styles.summaryRow}>
        <View style={[styles.summaryCard, { flex: 1.2, borderColor: COLORS.PRIMARY }]}>
          <MaterialCommunityIcons name="sigma" size={18} color={COLORS.PRIMARY} />
          <Text style={[styles.summaryNum, { color: COLORS.PRIMARY }]}>{summary.total} EGP</Text>
          <Text style={styles.summaryLabel}>Total Paid</Text>
        </View>
        <View style={[styles.summaryCard, { borderColor: COLORS.SUCCESS }]}>
          <MaterialCommunityIcons name="check-circle-outline" size={18} color={COLORS.SUCCESS} />
          <Text style={[styles.summaryNum, { color: COLORS.SUCCESS }]}>{summary.confirmed}</Text>
          <Text style={styles.summaryLabel}>Confirmed</Text>
        </View>
        <View style={[styles.summaryCard, { borderColor: COLORS.WARNING }]}>
          <MaterialCommunityIcons name="clock-outline" size={18} color={COLORS.WARNING} />
          <Text style={[styles.summaryNum, { color: COLORS.WARNING }]}>{summary.pending}</Text>
          <Text style={styles.summaryLabel}>Pending</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.PRIMARY} />
        </View>
      ) : (
        <FlatList
          data={payments}
          renderItem={renderPayment}
          keyExtractor={(item, i) => item._id || String(i)}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); fetchPayments(); }}
              tintColor={COLORS.PRIMARY}
            />
          }
          ListHeaderComponent={
            payments.length > 0
              ? <Text style={styles.listHeader}>Transaction History ({payments.length})</Text>
              : null
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="receipt-text-outline" size={60} color={COLORS.BORDER} />
              <Text style={styles.emptyTitle}>No Payments Yet</Text>
              <Text style={styles.emptyText}>Your payment history will appear here.</Text>
            </View>
          }
        />
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
  headerSub: { color: '#A5B4FC', fontSize: 13, fontWeight: '500', marginTop: 2 },
  summaryRow: {
    flexDirection: 'row',
    gap: 10,
    padding: 16,
    paddingBottom: 8,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: COLORS.WHITE,
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    borderWidth: 2,
    gap: 4,
    elevation: 1,
  },
  summaryNum: { fontSize: 16, fontWeight: '800' },
  summaryLabel: { fontSize: 10, color: COLORS.TEXT_SUB, fontWeight: '600' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.TEXT_SUB,
    marginBottom: 10,
    marginLeft: 2,
  },
  list: { padding: 16, gap: 10 },
  card: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    elevation: 1,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
  },
  iconBg: {
    width: 50,
    height: 50,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContent: { flex: 1 },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardFooterRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 },
  cardTitle: { fontSize: 14, fontWeight: '700', color: COLORS.TEXT, flex: 1, marginRight: 8 },
  amountText: { fontSize: 15, fontWeight: '800' },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  badgeText: { fontSize: 11, fontWeight: '700' },
  cardDate: { fontSize: 11, color: COLORS.TEXT_SUB },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingTop: 60, gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: COLORS.TEXT },
  emptyText: { fontSize: 14, color: COLORS.TEXT_SUB },
});
