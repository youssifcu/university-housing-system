import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, SafeAreaView,
  TouchableOpacity, ActivityIndicator, RefreshControl,
  Alert, TextInput, ScrollView, KeyboardAvoidingView, Platform
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

const REPORT_TYPES = [
  { key: 'maintenance', label: 'Maintenance', icon: 'wrench' },
  { key: 'complaint', label: 'Complaint', icon: 'alert-circle' },
  { key: 'other', label: 'Other', icon: 'dots-horizontal-circle' },
];

const getStatusConfig = (status) => {
  if (status === 'open') return { color: COLORS.INFO, label: 'Open', icon: 'clock-outline' };
  if (status === 'in_progress') return { color: COLORS.WARNING, label: 'In Progress', icon: 'progress-wrench' };
  if (status === 'resolved') return { color: COLORS.SUCCESS, label: 'Resolved', icon: 'check-circle-outline' };
  return { color: COLORS.TEXT_SUB, label: status || 'Unknown', icon: 'help-circle-outline' };
};

export default function ReportsScreen() {
  const [tab, setTab] = useState('list');
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [type, setType] = useState('maintenance');
  const [description, setDescription] = useState('');
  const [editingReport, setEditingReport] = useState(null);

  const fetchReports = useCallback(async () => {
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const res = await fetch(`${BACKEND_URL}/api/reports/me`, {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      const data = await res.json();
      if (res.ok) {
        setReports(data.data?.reports || []);
      }
    } catch (err) {
      console.error('[Reports] Fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleSubmit = async () => {
    if (!description.trim()) {
      Alert.alert('Required', 'Please enter a description.');
      return;
    }
    setSubmitting(true);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const url = editingReport 
        ? `${BACKEND_URL}/api/reports/${editingReport._id}` 
        : `${BACKEND_URL}/api/reports`;
      
      const method = editingReport ? 'PATCH' : 'POST';

      
      const selectedTypeLabel = REPORT_TYPES.find(t => t.key === type)?.label || type;

      const res = await fetch(url, {
        method: method,
        headers: {
          Authorization: `Bearer ${idToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
            title: selectedTypeLabel, 
            type, 
            description: description.trim() 
        }),
      });

      if (res.ok) {
        Alert.alert('Success', editingReport ? 'Report updated!' : 'Report submitted!');
        resetForm();
        setTab('list');
        fetchReports();
      } else {
        const data = await res.json();
        Alert.alert('Error', data.message || 'Action failed');
      }
    } catch {
      Alert.alert('Error', 'Network connection failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setEditingReport(null);
    setDescription('');
    setType('maintenance');
  };

  const handleEdit = (item) => {
    setEditingReport(item);
    setType(item.type);
    setDescription(item.description);
    setTab('new');
  };

  const renderReport = ({ item }) => {
    const cfg = getStatusConfig(item.status);
    const typeLabel = REPORT_TYPES.find(t => t.key === item.type)?.label || item.type;

    return (
      <View style={styles.card}>
        <View style={[styles.iconBg, { backgroundColor: cfg.color + '15' }]}>
          <MaterialCommunityIcons name={cfg.icon} size={24} color={cfg.color} />
        </View>
        <View style={styles.cardContent}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>{typeLabel}</Text>
            <View style={[styles.badge, { backgroundColor: cfg.color + '15' }]}>
              <Text style={[styles.badgeText, { color: cfg.color }]}>{cfg.label}</Text>
            </View>
          </View>
          <Text style={styles.cardDesc} numberOfLines={3}>{item.description}</Text>
          <View style={styles.footerRow}>
            <Text style={styles.cardDate}>
                {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : ''}
            </Text>
            {item.status === 'open' && (
              <TouchableOpacity style={styles.editBtn} onPress={() => handleEdit(item)}>
                <MaterialCommunityIcons name="pencil-outline" size={14} color={COLORS.PRIMARY} />
                <Text style={styles.editBtnText}>Edit</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Reports</Text>
        <MaterialCommunityIcons name="clipboard-text-outline" size={24} color={COLORS.WHITE} />
      </View>

      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, tab === 'list' && styles.activeTab]}
          onPress={() => { setTab('list'); resetForm(); }}
        >
          <Text style={[styles.tabText, tab === 'list' && styles.activeTabText]}>History</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'new' && styles.activeTab]}
          onPress={() => { resetForm(); setTab('new'); }}
        >
          <MaterialCommunityIcons name="plus" size={18} color={tab === 'new' ? COLORS.PRIMARY : COLORS.TEXT_SUB} />
          <Text style={[styles.tabText, tab === 'new' && styles.activeTabText]}>
            {editingReport ? 'Edit' : 'New Report'}
          </Text>
        </TouchableOpacity>
      </View>

      {tab === 'list' ? (
        loading ? (
          <View style={styles.centered}><ActivityIndicator size="large" color={COLORS.PRIMARY} /></View>
        ) : (
          <FlatList
            data={reports}
            renderItem={renderReport}
            keyExtractor={(item) => item._id}
            contentContainerStyle={styles.list}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchReports(); }} />}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <MaterialCommunityIcons name="folder-open-outline" size={60} color={COLORS.BORDER} />
                <Text style={styles.emptyTitle}>No reports yet</Text>
              </View>
            }
          />
        )
      ) : (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.formContainer} keyboardShouldPersistTaps="handled">
            <Text style={styles.formLabel}>Select Report Type</Text>
            <View style={styles.typeRow}>
              {REPORT_TYPES.map(t => (
                <TouchableOpacity key={t.key} style={[styles.typeChip, type === t.key && styles.activeTypeChip]} onPress={() => setType(t.key)}>
                  <MaterialCommunityIcons name={t.icon} size={20} color={type === t.key ? COLORS.WHITE : COLORS.TEXT_SUB} />
                  <Text style={[styles.typeChipText, type === t.key && styles.activeTypeChipText]}>{t.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.formLabel}>Description</Text>
            <TextInput 
              style={[styles.input, styles.textArea]} 
              placeholder="Provide details about the issue..." 
              value={description} 
              onChangeText={setDescription} 
              multiline 
              placeholderTextColor={COLORS.TEXT_SUB}
            />

            <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={submitting}>
              {submitting ? (
                <ActivityIndicator color={COLORS.WHITE} />
              ) : (
                <Text style={styles.submitBtnText}>{editingReport ? 'Update' : 'Submit Report'}</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.BG },
  header: { backgroundColor: COLORS.PRIMARY, paddingHorizontal: 20, paddingTop: 55, paddingBottom: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { color: COLORS.WHITE, fontSize: 20, fontWeight: '800' },
  tabBar: { flexDirection: 'row', backgroundColor: COLORS.WHITE, borderBottomWidth: 1, borderBottomColor: COLORS.BORDER },
  tab: { flex: 1, paddingVertical: 15, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6 },
  activeTab: { borderBottomWidth: 3, borderBottomColor: COLORS.PRIMARY },
  tabText: { fontSize: 14, fontWeight: '600', color: COLORS.TEXT_SUB },
  activeTabText: { color: COLORS.PRIMARY, fontWeight: '800' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 16 },
  card: { backgroundColor: COLORS.WHITE, borderRadius: 16, padding: 15, flexDirection: 'row', gap: 12, marginBottom: 12, elevation: 1 },
  iconBg: { width: 45, height: 45, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  cardContent: { flex: 1 },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: COLORS.TEXT },
  cardDesc: { fontSize: 13, color: COLORS.TEXT_SUB, lineHeight: 18 },
  footerRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, alignItems: 'center' },
  cardDate: { fontSize: 11, color: COLORS.TEXT_SUB },
  editBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  editBtnText: { fontSize: 13, fontWeight: '700', color: COLORS.PRIMARY },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  badgeText: { fontSize: 10, fontWeight: '800' },
  emptyContainer: { alignItems: 'center', paddingTop: 100 },
  emptyTitle: { fontSize: 16, color: COLORS.TEXT_SUB, marginTop: 15 },
  formContainer: { padding: 20 },
  formLabel: { fontSize: 14, fontWeight: '700', color: COLORS.TEXT, marginTop: 20, marginBottom: 10 },
  typeRow: { flexDirection: 'row', gap: 8 },
  typeChip: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: COLORS.BORDER, gap: 6 },
  activeTypeChip: { backgroundColor: COLORS.PRIMARY, borderColor: COLORS.PRIMARY },
  typeChipText: { fontSize: 13, fontWeight: '600', color: COLORS.TEXT_SUB },
  activeTypeChipText: { color: COLORS.WHITE },
  input: { backgroundColor: COLORS.WHITE, borderRadius: 12, borderWidth: 1, borderColor: COLORS.BORDER, padding: 15, fontSize: 15, color: COLORS.TEXT },
  textArea: { minHeight: 150, textAlignVertical: 'top' },
  submitBtn: { backgroundColor: COLORS.PRIMARY, borderRadius: 12, padding: 18, alignItems: 'center', marginTop: 40 },
  submitBtnText: { color: COLORS.WHITE, fontSize: 16, fontWeight: '800' },
});