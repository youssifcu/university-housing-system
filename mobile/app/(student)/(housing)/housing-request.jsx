import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { auth } from '../../../config/firebase';
import BACKEND_URL from '../../../config/backend';

import RequestsListTab from '../../../components/housing/RequestsListTab';
import NewRequestTab from '../../../components/housing/NewRequestTab';

const COLORS = {
  PRIMARY: '#1A237E',
  BG: '#F8FAFC',
  WHITE: '#FFFFFF',
  TEXT_SUB: '#64748B',
  BORDER: '#E2E8F0',
};

export default function HousingRequestScreen() {
  const [tab, setTab] = useState('list');
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchRequests = useCallback(async () => {
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const res = await fetch(`${BACKEND_URL}/api/housing-requests`, {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      const data = await res.json();
      if (res.ok && data.data) {
        setRequests(data.data.requests || []);
      }
    } catch (err) {
      console.error('[HousingRequest] Fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { 
    fetchRequests(); 
  }, [fetchRequests]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchRequests();
  };

  const handleRequestSuccess = () => {
    setTab('list');
    handleRefresh();
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="light" />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Housing Requests</Text>
        <MaterialCommunityIcons name="home-edit" size={26} color={COLORS.WHITE} />
      </View>

      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, tab === 'list' && styles.activeTab]}
          onPress={() => setTab('list')}
        >
          <Text style={[styles.tabText, tab === 'list' && styles.activeTabText]}>My Requests</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'new' && styles.activeTab]}
          onPress={() => setTab('new')}
        >
          <MaterialCommunityIcons name="plus" size={16} color={tab === 'new' ? COLORS.PRIMARY : COLORS.TEXT_SUB} />
          <Text style={[styles.tabText, tab === 'new' && styles.activeTabText]}>New Request</Text>
        </TouchableOpacity>
      </View>

      {tab === 'list' && (
        <RequestsListTab 
          requests={requests}
          loading={loading}
          refreshing={refreshing}
          onRefresh={handleRefresh}
        />
      )}

      {tab === 'new' && (
        <NewRequestTab onSuccess={handleRequestSuccess} />
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
  tab: { flex: 1, paddingVertical: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 5 },
  activeTab: { borderBottomWidth: 3, borderBottomColor: COLORS.PRIMARY },
  tabText: { fontSize: 14, fontWeight: '600', color: COLORS.TEXT_SUB },
  activeTabText: { color: COLORS.PRIMARY, fontWeight: '800' },
});