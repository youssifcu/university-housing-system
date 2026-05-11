import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, SafeAreaView,
  TouchableOpacity, ActivityIndicator, RefreshControl, Alert, Modal
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
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

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const getMealIcon = (type) => {
  if (type === 'breakfast') return 'coffee';
  if (type === 'lunch') return 'silverware-fork-knife';
  return 'moon-waning-crescent';
};

const getStatusColor = (status) => {
  if (status === 'booked') return COLORS.INFO;
  if (status === 'served') return COLORS.SUCCESS;
  if (status === 'cancelled') return COLORS.ERROR;
  return COLORS.TEXT_SUB;
};

export default function MealsScreen() {
  const [tab, setTab] = useState('menu');
  const [meals, setMeals] = useState([]);
  const { bookings, setBookings, removeBooking } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [bookingId, setBookingId] = useState(null);
  const [selectedDay, setSelectedDay] = useState(new Date());


  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d;
  });

  const fetchMeals = useCallback(async (date = selectedDay) => {
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const dateStr = date.toISOString().split('T')[0];
      const res = await fetch(
        `${BACKEND_URL}/api/meals?date=${dateStr}`,
        { headers: { Authorization: `Bearer ${idToken}` } }
      );
      const data = await res.json();
      if (res.ok && data.data) {
        setMeals(Array.isArray(data.data) ? data.data : data.data.meals || []);
      }
    } catch (err) {
      console.error('[Meals] Fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

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
      console.error('[Meals] Bookings fetch error:', err);
    }
  }, []);

  useEffect(() => {
    fetchMeals();
    fetchBookings();
  }, []);

  const handleBook = async (mealId) => {
    setBookingId(mealId);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const res = await fetch(`${BACKEND_URL}/api/meals/book`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${idToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mealId }),
      });
      const data = await res.json();
      if (res.ok) {
        Alert.alert('✅ Booked!', 'Meal booked successfully.');
        fetchBookings();
        fetchMeals(selectedDay);
      } else {
        Alert.alert('Error', data.message || 'Could not book meal.');
      }
    } catch (err) {
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setBookingId(null);
    }
  };

  const handleCancel = (bookingId) => {
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
            } catch (err) {
              Alert.alert('Error', 'Network error.');
            }
          },
        },
      ]
    );
  };

  const renderMealCard = ({ item }) => {
    const isBooked = bookings.some(b => b.mealId === item._id && b.status === 'booked');
    return (
      <View style={styles.mealCard}>
        <View style={[styles.mealIconBg, { backgroundColor: COLORS.PRIMARY + '10' }]}>
          <MaterialCommunityIcons name={getMealIcon(item.type)} size={28} color={COLORS.PRIMARY} />
        </View>
        <View style={styles.mealInfo}>
          <Text style={styles.mealName}>{item.name}</Text>
          <Text style={styles.mealType}>{item.type?.charAt(0).toUpperCase() + item.type?.slice(1)}</Text>
          {item.price !== undefined && (
            <Text style={styles.mealPrice}>{item.price} EGP</Text>
          )}
        </View>
        <TouchableOpacity
          style={[styles.bookBtn, isBooked && styles.bookedBtn]}
          onPress={() => !isBooked && handleBook(item._id)}
          disabled={isBooked || bookingId === item._id}
        >
          {bookingId === item._id ? (
            <ActivityIndicator size="small" color={COLORS.WHITE} />
          ) : (
            <Text style={styles.bookBtnText}>{isBooked ? 'Booked ✓' : 'Book'}</Text>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  const renderBookingCard = ({ item }) => {
    const statusColor = getStatusColor(item.status);
    return (
      <View style={styles.bookingCard}>
        <View style={[styles.mealIconBg, { backgroundColor: statusColor + '15' }]}>
          <MaterialCommunityIcons name={getMealIcon(item.meal?.type || 'lunch')} size={24} color={statusColor} />
        </View>
        <View style={styles.mealInfo}>
          <Text style={styles.mealName}>{item.meal?.name || 'Meal'}</Text>
          <Text style={[styles.statusBadge, { color: statusColor }]}>
            ● {item.status?.toUpperCase()}
          </Text>
          <Text style={styles.bookingDate}>
            {item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}
          </Text>
        </View>
        {item.status === 'booked' && (
          <TouchableOpacity style={styles.cancelBtn} onPress={() => handleCancel(item._id)}>
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Meal Menu</Text>
        <MaterialCommunityIcons name="silverware-fork-knife" size={26} color={COLORS.WHITE} />
      </View>


      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, tab === 'menu' && styles.activeTab]}
          onPress={() => setTab('menu')}
        >
          <Text style={[styles.tabText, tab === 'menu' && styles.activeTabText]}>Menu</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'bookings' && styles.activeTab]}
          onPress={() => setTab('bookings')}
        >
          <Text style={[styles.tabText, tab === 'bookings' && styles.activeTabText]}>My Bookings</Text>
        </TouchableOpacity>
      </View>

      {tab === 'menu' && (
        <>

          <View style={styles.daySelector}>
            <FlatList
              horizontal
              data={weekDays}
              keyExtractor={(d) => d.toDateString()}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }}
              renderItem={({ item: day }) => {
                const isSelected = day.toDateString() === selectedDay.toDateString();
                return (
                  <TouchableOpacity
                    style={[styles.dayBtn, isSelected && styles.activeDayBtn]}
                    onPress={() => {
                      setSelectedDay(day);
                      setLoading(true);
                      fetchMeals(day);
                    }}
                  >
                    <Text style={[styles.dayName, isSelected && styles.activeDayText]}>
                      {DAYS[day.getDay()]}
                    </Text>
                    <Text style={[styles.dayNum, isSelected && styles.activeDayText]}>
                      {day.getDate()}
                    </Text>
                  </TouchableOpacity>
                );
              }}
            />
          </View>

          {loading ? (
            <View style={styles.centered}><ActivityIndicator size="large" color={COLORS.PRIMARY} /></View>
          ) : (
            <FlatList
              data={meals}
              renderItem={renderMealCard}
              keyExtractor={(item) => item._id}
              contentContainerStyle={styles.list}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchMeals(selectedDay); }} tintColor={COLORS.PRIMARY} />
              }
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <MaterialCommunityIcons name="food-off" size={56} color={COLORS.BORDER} />
                  <Text style={styles.emptyText}>No meals available for this day</Text>
                </View>
              }
            />
          )}
        </>
      )}

      {tab === 'bookings' && (
        <FlatList
          data={bookings}
          renderItem={renderBookingCard}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="calendar-blank-outline" size={56} color={COLORS.BORDER} />
              <Text style={styles.emptyText}>No bookings yet</Text>
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
  tabBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.WHITE,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
  },
  tab: { flex: 1, paddingVertical: 14, alignItems: 'center' },
  activeTab: { borderBottomWidth: 3, borderBottomColor: COLORS.PRIMARY },
  tabText: { fontSize: 14, fontWeight: '600', color: COLORS.TEXT_SUB },
  activeTabText: { color: COLORS.PRIMARY, fontWeight: '800' },
  daySelector: { paddingVertical: 14, backgroundColor: COLORS.WHITE, borderBottomWidth: 1, borderBottomColor: COLORS.BORDER },
  dayBtn: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: COLORS.BG,
  },
  activeDayBtn: { backgroundColor: COLORS.PRIMARY },
  dayName: { fontSize: 11, fontWeight: '600', color: COLORS.TEXT_SUB },
  dayNum: { fontSize: 16, fontWeight: '800', color: COLORS.TEXT, marginTop: 2 },
  activeDayText: { color: COLORS.WHITE },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 16, gap: 12 },
  mealCard: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
  },
  bookingCard: {
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
  mealIconBg: {
    width: 54,
    height: 54,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mealInfo: { flex: 1 },
  mealName: { fontSize: 15, fontWeight: '700', color: COLORS.TEXT },
  mealType: { fontSize: 12, color: COLORS.TEXT_SUB, marginTop: 2 },
  mealPrice: { fontSize: 13, fontWeight: '700', color: COLORS.SUCCESS, marginTop: 3 },
  statusBadge: { fontSize: 12, fontWeight: '700', marginTop: 3 },
  bookingDate: { fontSize: 11, color: COLORS.TEXT_SUB, marginTop: 2 },
  bookBtn: {
    backgroundColor: COLORS.PRIMARY,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 12,
  },
  bookedBtn: { backgroundColor: COLORS.SUCCESS },
  bookBtnText: { color: COLORS.WHITE, fontWeight: '700', fontSize: 13 },
  cancelBtn: {
    borderWidth: 1.5,
    borderColor: COLORS.ERROR,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  cancelBtnText: { color: COLORS.ERROR, fontWeight: '700', fontSize: 13 },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 15, color: COLORS.TEXT_SUB, fontWeight: '600' },
});
