import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, SafeAreaView,
  TouchableOpacity, ActivityIndicator, RefreshControl
} from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
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
  UNREAD_BG: '#EEF2FF',
};

const getTypeConfig = (type) => {
  const map = {
    application: { icon: 'file-document-outline', color: COLORS.INFO, label: 'Application' },
    meal: { icon: 'silverware-fork-knife', color: COLORS.WARNING, label: 'Meal' },
    announcement: { icon: 'bullhorn-outline', color: COLORS.PRIMARY, label: 'Announcement' },
    payment: { icon: 'credit-card-outline', color: COLORS.SUCCESS, label: 'Payment' },
    report: { icon: 'alert-circle-outline', color: COLORS.ERROR, label: 'Report' },
    housing: { icon: 'home-outline', color: '#8B5CF6', label: 'Housing' },
  };
  return map[type] || { icon: 'bell-outline', color: COLORS.PRIMARY, label: 'Notification' };
};

export default function NotificationsScreen() {
  const { notifications, setNotifications, markNotificationRead, markAllRead, unreadCount } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const res = await fetch(`${BACKEND_URL}/api/notifications/my`, {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      const data = await res.json();
      if (res.ok && data.data) {
        setNotifications(Array.isArray(data.data) ? data.data : data.data.notifications || []);
      }
    } catch (err) {
      console.error('[Notifications] Fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkRead = async (id) => {
    try {
      const idToken = await auth.currentUser?.getIdToken();
      await fetch(`${BACKEND_URL}/api/notifications/${id}/read`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${idToken}` },
      });
      markNotificationRead(id);
    } catch (err) {
      console.error('[Notifications] Mark read error:', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const idToken = await auth.currentUser?.getIdToken();
      await fetch(`${BACKEND_URL}/api/notifications/read-all`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${idToken}` },
      });
      markAllRead();
    } catch (err) {
      console.error('[Notifications] Mark all read error:', err);
    }
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const renderItem = ({ item }) => {
    const cfg = getTypeConfig(item.type);
    const isUnread = !item.read;
    return (
      <TouchableOpacity
        style={[styles.card, isUnread && styles.unreadCard]}
        onPress={() => isUnread && handleMarkRead(item._id)}
        activeOpacity={0.8}
      >
        <View style={[styles.iconBg, { backgroundColor: cfg.color + '15' }]}>
          <MaterialCommunityIcons name={cfg.icon} size={24} color={cfg.color} />
        </View>
        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle} numberOfLines={1}>{item.title || cfg.label}</Text>
            <Text style={styles.timeText}>{formatTime(item.createdAt)}</Text>
          </View>
          <Text style={styles.cardBody} numberOfLines={2}>{item.message || item.body || '—'}</Text>
          {isUnread && <View style={styles.unreadDot} />}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Notifications</Text>
          {unreadCount > 0 && (
            <Text style={styles.headerSub}>{unreadCount} unread</Text>
          )}
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity style={styles.markAllBtn} onPress={handleMarkAllRead}>
            <Ionicons name="checkmark-done" size={16} color={COLORS.WHITE} />
            <Text style={styles.markAllText}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.PRIMARY} />
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item._id || Math.random().toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); fetchNotifications(); }}
              tintColor={COLORS.PRIMARY}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="bell-sleep-outline" size={64} color={COLORS.BORDER} />
              <Text style={styles.emptyTitle}>You're all caught up!</Text>
              <Text style={styles.emptyText}>No notifications yet</Text>
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
  markAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  markAllText: { color: COLORS.WHITE, fontSize: 12, fontWeight: '700' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 16, gap: 10 },
  card: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
  },
  unreadCard: {
    backgroundColor: COLORS.UNREAD_BG,
    borderColor: '#C7D2FE',
  },
  iconBg: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContent: { flex: 1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  cardTitle: { fontSize: 14, fontWeight: '700', color: COLORS.TEXT, flex: 1, marginRight: 6 },
  timeText: { fontSize: 11, color: COLORS.TEXT_SUB, fontWeight: '500' },
  cardBody: { fontSize: 13, color: COLORS.TEXT_SUB, lineHeight: 19 },
  unreadDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.PRIMARY,
  },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: COLORS.TEXT },
  emptyText: { fontSize: 14, color: COLORS.TEXT_SUB },
});
