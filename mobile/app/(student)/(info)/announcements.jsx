import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  SafeAreaView, ActivityIndicator, RefreshControl, Modal, ScrollView, Alert
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { auth } from '../../../config/firebase';
import BACKEND_URL from '../../../config/backend';

const COLORS = {
  PRIMARY: '#1A237E',
  INFO: '#3B82F6',
  WARNING: '#F59E0B',
  URGENT: '#EF4444',
  BG: '#F8FAFC',
  WHITE: '#FFFFFF',
  TEXT_SUB: '#64748B',
  TEXT: '#1E293B',
};

export default function AnnouncementsScreen() {
  const router = useRouter();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [detailData, setDetailData] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchAnnouncements = useCallback(async () => {
    try {
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) return;
      const response = await fetch(`${BACKEND_URL}/api/announcements`, {
        headers: { 'Authorization': `Bearer ${idToken}` },
      });
      const result = await response.json();
      if (response.ok && result.data) setAnnouncements(result.data);
    } catch (error) {
      console.error('[AnnouncementsScreen] Fetch Error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchAnnouncements(); }, [fetchAnnouncements]);

  const handleOpenDetails = async (id) => {
    setSelectedId(id);
    setDetailLoading(true);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const response = await fetch(`${BACKEND_URL}/api/announcements/${id}`, {
        headers: { 'Authorization': `Bearer ${idToken}` },
      });
      const result = await response.json();
      if (response.ok && result.data) {
        setDetailData(result.data);
      } else {
        Alert.alert('Error', result.message || 'Failed to fetch details');
      }
    } catch (err) {
      console.log(err);
      Alert.alert('Error', 'Network error while fetching details.');
    } finally {
      setDetailLoading(false);
    }
  };

  const renderItem = ({ item }) => {
    const getBadgeColor = () => {
      if (item.priority === 'high') return COLORS.URGENT;
      if (item.priority === 'medium') return COLORS.WARNING;
      return COLORS.INFO;
    };
    const getIcon = () => {
      if (item.priority === 'high') return 'alert-decagram';
      if (item.priority === 'medium') return 'alert-circle';
      return 'information';
    };
    const formattedDate = item.createdAt
      ? new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
      : '';

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.8}
        onPress={() => handleOpenDetails(item.id || item._id)}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.iconBox, { backgroundColor: getBadgeColor() + '15' }]}>
            <MaterialCommunityIcons name={getIcon()} size={24} color={getBadgeColor()} />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
            <Text style={styles.date}>{formattedDate}</Text>
          </View>
          <View style={[styles.priorityBadge, { backgroundColor: getBadgeColor() + '20' }]}>
            <Text style={[styles.priorityText, { color: getBadgeColor() }]}>
              {item.priority?.toUpperCase() || 'LOW'}
            </Text>
          </View>
        </View>
        <View style={styles.footer}>
          <MaterialCommunityIcons name="arrow-right-circle-outline" size={16} color={getBadgeColor()} />
          <Text style={[styles.readMoreText, { color: getBadgeColor() }]}>View Details</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.WHITE} />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Announcements</Text>
        <MaterialCommunityIcons name="bullhorn-outline" size={26} color={COLORS.WHITE} />
      </View>

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={COLORS.PRIMARY} />
        </View>
      ) : (
        <FlatList
          data={announcements}
          renderItem={renderItem}
          keyExtractor={item => item.id || item._id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); fetchAnnouncements(); }}
              tintColor={COLORS.PRIMARY}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="bullhorn-outline" size={60} color="#E2E8F0" />
              <Text style={styles.emptyTitle}>No Announcements</Text>
              <Text style={styles.emptyText}>Check back later for updates.</Text>
            </View>
          }
        />
      )}

      <Modal visible={!!selectedId} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {detailLoading ? (
              <View style={{ padding: 40 }}><ActivityIndicator size="large" color={COLORS.PRIMARY} /></View>
            ) : detailData ? (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{detailData.title}</Text>
                  <TouchableOpacity onPress={() => { setSelectedId(null); setDetailData(null); }}>
                    <MaterialCommunityIcons name="close" size={24} color={COLORS.TEXT} />
                  </TouchableOpacity>
                </View>
                <ScrollView style={styles.modalBody}>
                  <Text style={styles.modalDate}>
                    {new Date(detailData.createdAt).toLocaleDateString('en-US', { dateStyle: 'long' })}
                  </Text>
                  <View style={styles.modalBadgeRow}>
                    <View style={styles.detailBadge}>
                      <Text style={styles.detailBadgeText}>{detailData.priority?.toUpperCase()}</Text>
                    </View>
                  </View>
                  <Text style={styles.modalText}>{detailData.content}</Text>
                </ScrollView>
              </>
            ) : null}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.BG },
  topBar: {
    backgroundColor: COLORS.PRIMARY,
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 25,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: { padding: 4 },
  topBarTitle: { color: COLORS.WHITE, fontSize: 20, fontWeight: '800', flex: 1 },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 10 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: COLORS.TEXT },
  emptyText: { color: COLORS.TEXT_SUB, fontSize: 14 },
  list: { padding: 16, gap: 12 },
  card: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 16,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12, gap: 12 },
  iconBox: { width: 45, height: 45, borderRadius: 12, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  headerText: { flex: 1 },
  title: { fontSize: 15, fontWeight: '700', color: COLORS.TEXT, lineHeight: 21 },
  date: { fontSize: 12, color: COLORS.TEXT_SUB, marginTop: 3 },
  priorityBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, flexShrink: 0 },
  priorityText: { fontSize: 10, fontWeight: '800' },
  footer: { flexDirection: 'row', alignItems: 'center', gap: 5, borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 10 },
  readMoreText: { fontSize: 13, fontWeight: '700' },
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.WHITE, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '80%', minHeight: '40%',
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: COLORS.TEXT, flex: 1, marginRight: 10 },
  modalBody: { flexShrink: 1 },
  modalDate: { fontSize: 13, fontWeight: '600', color: COLORS.TEXT_SUB, marginBottom: 8 },
  modalBadgeRow: { flexDirection: 'row', marginBottom: 16 },
  detailBadge: { backgroundColor: COLORS.PRIMARY + '15', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  detailBadgeText: { fontSize: 11, fontWeight: '800', color: COLORS.PRIMARY },
  modalText: { fontSize: 15, color: COLORS.TEXT, lineHeight: 26 },
});
