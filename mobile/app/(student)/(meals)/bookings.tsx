import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, SafeAreaView,
  TouchableOpacity, RefreshControl, Alert, ActivityIndicator
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { auth } from '../../../config/firebase';
import BACKEND_URL from '../../../config/backend';
import { useAppStore } from '../../../store/useAppStore';

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

const getMealIcon = (type : string) => {
  if (type === 'breakfast') return 'coffee';
  if (type === 'lunch') return 'silverware-fork-knife';
  return 'moon-waning-crescent';
};

const getStatusColor = (status : string) => {
  if (status === 'booked') return COLORS.INFO;
  if (status === 'served') return COLORS.SUCCESS;
  if (status === 'cancelled') return COLORS.ERROR;
  return COLORS.TEXT_SUB;
};

export default function BookingsScreen() {
  const router = useRouter();
  const { bookings, setBookings, removeBooking } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchBookings = useCallback(async () => {
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const res = await fetch(`${BACKEND_URL}/api/meals/my-bookings`, {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      const data = await res.json();
      if (res.ok && data.data) {
        setBookings(Array.isArray(data.data) ? data.data : data.data.bookings || []);
      }
    } catch (err) {
      console.error('[Bookings] Fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);


  React.useEffect(() => { fetchBookings(); }, [fetchBookings]);

  const handleCancel = (bookingId: string) => {
    Alert.alert(
      'Cancel Booking',
      'Are you sure you want to cancel this meal booking?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Cancel Booking',
          style: 'destructive',
          onPress: async () => {
            try {
              const idToken = await auth.currentUser?.getIdToken();
              const res = await fetch(`${BACKEND_URL}/api/meals/book/${bookingId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${idToken}` },
              });
              if (res.ok) {
                removeBooking(bookingId);
                Alert.alert('Cancelled', 'Booking cancelled successfully.');
              } else {
                const data = await res.json();
                Alert.alert('Error', data.message || 'Could not cancel booking.');
              }
            } catch {
              Alert.alert('Error', 'Network error.');
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: any }) => {
    const statusColor = getStatusColor(item.status);
    const mealType = item.meal?.type || item.mealType || 'lunch';
    return (
      <View style={styles.card}>
        <View style={[styles.iconBg, { backgroundColor: statusColor + '15' }]}>
          <MaterialCommunityIcons name={getMealIcon(mealType)} size={26} color={statusColor} />
        </View>
        <View style={styles.cardContent}>
          <Text style={styles.mealName}>{item.meal?.name || 'Meal'}</Text>
          <Text style={[styles.statusText, { color: statusColor }]}>
            ● {item.status?.toUpperCase()}
          </Text>
          <Text style={styles.dateText}>
            {item.createdAt
              ? new Date(item.createdAt).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
              : ''}
          </Text>
        </View>
        {item.status === 'booked' && (
          <TouchableOpacity style={styles.cancelBtn} onPress={() => handleCancel(item._id)}>
            <MaterialCommunityIcons name="close-circle-outline" size={18} color={COLORS.ERROR} />
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.WHITE} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Bookings</Text>
        <MaterialCommunityIcons name="calendar-check" size={24} color={COLORS.WHITE} />
      </View>

      {loading ? (
        <View style={styles.centered}><ActivityIndicator size="large" color={COLORS.PRIMARY} /></View>
      ) : (
        <FlatList
          data={bookings}
          renderItem={renderItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); fetchBookings(); }}
              tintColor={COLORS.PRIMARY}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="calendar-blank-outline" size={60} color={COLORS.BORDER} />
              <Text style={styles.emptyTitle}>No Bookings Yet</Text>
              <Text style={styles.emptyText}>Book a meal from the Meals tab.</Text>
              <TouchableOpacity style={styles.goBtn} onPress={() => router.push('/(student)/(meals)/meals')}>
                <Text style={styles.goBtnText}>Browse Meals</Text>
              </TouchableOpacity>
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
  backBtn: { padding: 4 },
  headerTitle: { color: '#FFF', fontSize: 20, fontWeight: '800', flex: 1, marginLeft: 10 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 16, gap: 12 },
  card: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    elevation: 1,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
  },
  iconBg: { width: 52, height: 52, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  cardContent: { flex: 1 },
  mealName: { fontSize: 15, fontWeight: '700', color: COLORS.TEXT },
  statusText: { fontSize: 12, fontWeight: '700', marginTop: 3 },
  dateText: { fontSize: 11, color: COLORS.TEXT_SUB, marginTop: 2 },
  cancelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1.5,
    borderColor: COLORS.ERROR,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
  },
  cancelText: { color: COLORS.ERROR, fontWeight: '700', fontSize: 12 },
  emptyContainer: { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: COLORS.TEXT },
  emptyText: { fontSize: 14, color: COLORS.TEXT_SUB },
  goBtn: { marginTop: 8, backgroundColor: COLORS.PRIMARY, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  goBtnText: { color: '#FFF', fontWeight: '700', fontSize: 14 },
});
