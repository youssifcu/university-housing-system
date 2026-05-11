import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl, Alert, TextInput, Platform
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { auth } from '../../config/firebase';
import BACKEND_URL from '../../config/backend';

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

const REQUEST_TYPES = [
  { key: 'transfer', label: 'Room Transfer', icon: 'swap-horizontal' },
  { key: 'leave', label: 'Leave Request', icon: 'calendar-clock' },
  { key: 'vacate', label: 'Vacate Room', icon: 'exit-run' },
  { key: 'maintenance', label: 'Maintenance', icon: 'wrench' },
];

const getStatusConfig = (status) => {
  if (status === 'pending')  return { color: COLORS.WARNING, label: 'Pending',     icon: 'clock-outline' };
  if (status === 'approved') return { color: COLORS.SUCCESS, label: 'Approved',    icon: 'check-circle-outline' };
  if (status === 'rejected') return { color: COLORS.ERROR,   label: 'Rejected',    icon: 'close-circle-outline' };
  if (status === 'cancelled')return { color: COLORS.TEXT_SUB,label: 'Cancelled',   icon: 'cancel' };
  return { color: COLORS.TEXT_SUB, label: status || 'Unknown', icon: 'help-circle-outline' };
};

export default function RequestsListTab({ requests, loading, refreshing, onRefresh }) {
  const [editingRequest, setEditingRequest] = useState(null);
  const [editReason, setEditReason] = useState('');
  const [updating, setUpdating] = useState(false);

  const [editToRoomId, setEditToRoomId] = useState('');
  const [editStartDate, setEditStartDate] = useState(new Date());
  const [editEndDate, setEditEndDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(null);
  const [availableRooms, setAvailableRooms] = useState([]);

  const fetchAvailableRooms = useCallback(async () => {
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const res = await fetch(`${BACKEND_URL}/api/rooms/available`, {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      const data = await res.json();
      if (res.ok && data.data) {
        setAvailableRooms(data.data.rooms || []);
      }
    } catch (err) {
      console.log('Fetch rooms error:', err);
    }
  }, []);

  useEffect(() => {
    fetchAvailableRooms();
  }, [fetchAvailableRooms]);

  const handleUpdate = async () => {
    if (!editReason.trim()) {
      Alert.alert('Missing Fields', 'Please provide an updated reason.');
      return;
    }
    setUpdating(true);
    const payload = { reason: editReason.trim() };
    if (editingRequest.type === 'transfer') payload.toRoomId = editToRoomId;
    if (editingRequest.type === 'leave' || editingRequest.type === 'vacate') {
      payload.startDate = editStartDate.toISOString();
      payload.endDate = editEndDate.toISOString();
    }

    try {
      const idToken = await auth.currentUser?.getIdToken();
      const res = await fetch(`${BACKEND_URL}/api/housing-requests/${editingRequest._id}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${idToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        Alert.alert('✅ Updated', 'Your request has been updated.');
        setEditingRequest(null);
        setEditReason('');
        onRefresh();
      } else {
        Alert.alert('Error', data.message || 'Could not update request.');
      }
    } catch {
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  const openEdit = (item) => {
    setEditingRequest(item);
    setEditReason(item.reason || '');
    setEditToRoomId(item.toRoomId?._id || item.toRoomId || '');
    setEditStartDate(item.startDate ? new Date(item.startDate) : new Date());
    setEditEndDate(item.endDate ? new Date(item.endDate) : new Date());
  };

  const renderRequest = ({ item }) => {
    const cfg = getStatusConfig(item.status);
    const typeLabel = REQUEST_TYPES.find(t => t.key === item.type)?.label || item.type;
    const typeIcon  = REQUEST_TYPES.find(t => t.key === item.type)?.icon  || 'home-outline';
    const isPending = item.status === 'pending';

    return (
      <View style={styles.card}>
        <View style={[styles.iconBg, { backgroundColor: cfg.color + '15' }]}>
          <MaterialCommunityIcons name={typeIcon} size={24} color={cfg.color} />
        </View>
        <View style={styles.cardContent}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>{typeLabel}</Text>
            <View style={[styles.badge, { backgroundColor: cfg.color + '15' }]}>
              <Text style={[styles.badgeText, { color: cfg.color }]}>{cfg.label}</Text>
            </View>
          </View>

          {item.reason && (
            <Text style={styles.cardReason} numberOfLines={2}>{item.reason}</Text>
          )}

          <Text style={styles.cardDate}>
            {item.createdAt
              ? new Date(item.createdAt).toLocaleDateString('en-US', {
                  month: 'long', day: 'numeric', year: 'numeric'
                })
              : ''}
          </Text>

          {item.adminComment && (
            <View style={styles.adminNoteBox}>
              <MaterialCommunityIcons name="message-outline" size={12} color={COLORS.INFO} />
              <Text style={styles.adminNoteText}>{item.adminComment}</Text>
            </View>
          )}

          {isPending && (
            <TouchableOpacity style={styles.editBtn} onPress={() => openEdit(item)}>
              <MaterialCommunityIcons name="pencil-outline" size={14} color={COLORS.PRIMARY} />
              <Text style={styles.editBtnText}>Edit Request</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const renderEditForm = () => (
    <View style={styles.editOverlay}>
      <View style={styles.editSheet}>
        <View style={styles.editSheetHeader}>
          <Text style={styles.editSheetTitle}>Edit Request</Text>
          <TouchableOpacity onPress={() => setEditingRequest(null)}>
            <MaterialCommunityIcons name="close" size={24} color={COLORS.TEXT} />
          </TouchableOpacity>
        </View>

        <Text style={styles.formSectionLabel}>Request Type</Text>
        <Text style={styles.editTypeFixed}>
          {REQUEST_TYPES.find(t => t.key === editingRequest.type)?.label || editingRequest.type}
        </Text>

        {editingRequest.type === 'transfer' && (
          <View style={styles.dynamicFieldContainer}>
            <Text style={styles.formSectionLabel}>Target Room</Text>
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={editToRoomId}
                onValueChange={(itemValue) => setEditToRoomId(itemValue)}
                dropdownIconColor={COLORS.PRIMARY}
              >
                <Picker.Item label="Select a Room" value="" />
                {availableRooms.map(room => (
                  <Picker.Item 
                    key={room.id || room._id} 
                    label={`Room ${room.roomNumber} - ${room.building?.name || room.buildingId?.name || 'Unknown'}`} 
                    value={room.id || room._id} 
                  />
                ))}
              </Picker>
            </View>
          </View>
        )}

        {(editingRequest.type === 'leave' || editingRequest.type === 'vacate') && (
          <View style={styles.dynamicFieldContainerRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.formSectionLabel}>Start Date</Text>
              <TouchableOpacity style={styles.dateBtn} onPress={() => setShowPicker('start')}>
                <MaterialCommunityIcons name="calendar-start" size={20} color={COLORS.PRIMARY} />
                <Text style={styles.dateBtnText}>{editStartDate.toLocaleDateString()}</Text>
              </TouchableOpacity>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.formSectionLabel}>End Date</Text>
              <TouchableOpacity style={styles.dateBtn} onPress={() => setShowPicker('end')}>
                <MaterialCommunityIcons name="calendar-end" size={20} color={COLORS.PRIMARY} />
                <Text style={styles.dateBtnText}>{editEndDate.toLocaleDateString()}</Text>
              </TouchableOpacity>
            </View>
            {showPicker && (
              <DateTimePicker
                value={showPicker === 'start' ? editStartDate : editEndDate}
                mode="date"
                display="default"
                onChange={(event, selectedDate) => {
                  const current = selectedDate || (showPicker === 'start' ? editStartDate : editEndDate);
                  setShowPicker(Platform.OS === 'ios' ? showPicker : null);
                  if (showPicker === 'start') setEditStartDate(current);
                  else setEditEndDate(current);
                }}
              />
            )}
          </View>
        )}

        <Text style={[styles.formSectionLabel, { marginTop: 16 }]}>Updated Reason</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Update your reason..."
          placeholderTextColor={COLORS.TEXT_SUB}
          value={editReason}
          onChangeText={setEditReason}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />

        <TouchableOpacity
          style={[styles.submitBtn, updating && { opacity: 0.7 }]}
          onPress={handleUpdate}
          disabled={updating}
        >
          {updating
            ? <ActivityIndicator color={COLORS.WHITE} />
            : <>
                <MaterialCommunityIcons name="content-save-outline" size={18} color={COLORS.WHITE} />
                <Text style={styles.submitBtnText}>Save Changes</Text>
              </>
          }
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color={COLORS.PRIMARY} /></View>;
  }

  return (
    <>
      <FlatList
        data={requests}
        renderItem={renderRequest}
        keyExtractor={(item, i) => item._id || String(i)}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.PRIMARY}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="home-search-outline" size={60} color={COLORS.BORDER} />
            <Text style={styles.emptyTitle}>No Requests Yet</Text>
            <Text style={styles.emptyText}>
              Submit a room transfer, maintenance, or vacate request using the "New Request" tab.
            </Text>
          </View>
        }
      />
      {editingRequest && renderEditForm()}
    </>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 16, gap: 10 },
  card: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    elevation: 1,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
  },
  iconBg: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginTop: 2 },
  cardContent: { flex: 1 },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardTitle: { fontSize: 14, fontWeight: '700', color: COLORS.TEXT },
  cardReason: { fontSize: 13, color: COLORS.TEXT_SUB, marginTop: 4, lineHeight: 18 },
  cardDate: { fontSize: 11, color: COLORS.TEXT_SUB, marginTop: 4 },
  badge: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 20 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  adminNoteBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 8,
    backgroundColor: COLORS.INFO + '10',
    padding: 8,
    borderRadius: 8,
  },
  adminNoteText: { fontSize: 12, color: COLORS.INFO, flex: 1 },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 10,
    alignSelf: 'flex-start',
    backgroundColor: COLORS.PRIMARY + '10',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  editBtnText: { fontSize: 12, fontWeight: '700', color: COLORS.PRIMARY },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 12, paddingHorizontal: 30 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: COLORS.TEXT },
  emptyText: { fontSize: 14, color: COLORS.TEXT_SUB, textAlign: 'center', lineHeight: 20 },
  formSectionLabel: { fontSize: 13, fontWeight: '700', color: COLORS.TEXT_SUB, marginBottom: 6 },
  input: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: COLORS.TEXT,
  },
  textArea: { minHeight: 130 },
  submitBtn: {
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  submitBtnText: { color: COLORS.WHITE, fontSize: 16, fontWeight: '800' },
  editOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
    elevation: 10,
    zIndex: 10,
  },
  editSheet: {
    backgroundColor: COLORS.WHITE,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    gap: 8,
  },
  editSheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  editSheetTitle: { fontSize: 18, fontWeight: '800', color: COLORS.TEXT },
  editTypeFixed: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.PRIMARY,
    backgroundColor: COLORS.PRIMARY + '10',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  dynamicFieldContainer: { marginTop: 16 },
  dynamicFieldContainerRow: { flexDirection: 'row', gap: 12, marginTop: 16 },
  pickerWrapper: {
    backgroundColor: COLORS.WHITE,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    borderRadius: 12,
    overflow: 'hidden',
  },
  dateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.WHITE,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    padding: 14,
    borderRadius: 12,
  },
  dateBtnText: { fontSize: 14, color: COLORS.TEXT, fontWeight: '600' },
});
