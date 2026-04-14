import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator,
  Alert, TextInput, ScrollView, KeyboardAvoidingView, Platform
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { auth } from '../../config/firebase';
import BACKEND_URL from '../../config/backend';

const COLORS = {
  PRIMARY: '#1A237E',
  BG: '#F8FAFC',
  WHITE: '#FFFFFF',
  TEXT: '#1E293B',
  TEXT_SUB: '#64748B',
  BORDER: '#E2E8F0',
};

const REQUEST_TYPES = [
  { key: 'transfer', label: 'Room Transfer', icon: 'swap-horizontal' },
  { key: 'leave', label: 'Leave Request', icon: 'calendar-clock' },
  { key: 'vacate', label: 'Vacate Room', icon: 'exit-run' },
  { key: 'maintenance', label: 'Maintenance', icon: 'wrench' },
];

export default function NewRequestTab({ onSuccess }) {
  const [reqType, setReqType] = useState('transfer');
  const [reason, setReason] = useState('');
  const [toRoomId, setToRoomId] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(null);
  const [availableRooms, setAvailableRooms] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const fetchAvailableRooms = useCallback(async () => {
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const res = await fetch(`${BACKEND_URL}/api/rooms/available`, {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      const data = await res.json();
      if (res.ok && data.data) {
        setAvailableRooms(data.data.rooms || []);
        if (data.data.rooms?.length > 0) setToRoomId(data.data.rooms[0]._id);
      }
    } catch (err) {
      console.log('Fetch rooms error:', err);
    }
  }, []);

  useEffect(() => { 
    fetchAvailableRooms();
  }, [fetchAvailableRooms]);

  const handleSubmit = async () => {
    if (!reason.trim()) {
      Alert.alert('Missing Fields', 'Please provide a reason for your request.');
      return;
    }
    if (reqType === 'transfer' && !toRoomId) {
      Alert.alert('Missing Fields', 'Please select a target room for transfer.');
      return;
    }
    setSubmitting(true);

    const payload = { type: reqType, reason: reason.trim() };
    if (reqType === 'transfer') payload.toRoomId = toRoomId;
    if (reqType === 'leave' || reqType === 'vacate') {
      payload.startDate = startDate.toISOString();
      payload.endDate = endDate.toISOString();
    }
    
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const res = await fetch(`${BACKEND_URL}/api/housing-requests`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${idToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        Alert.alert('✅ Submitted', 'Your request has been submitted successfully.');
        setReason('');
        setReqType('transfer');
        if (onSuccess) onSuccess();
      } else {
        Alert.alert('Error', data.message || 'Could not submit request.');
      }
    } catch {
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.formContainer} keyboardShouldPersistTaps="handled">
        <Text style={styles.formSectionLabel}>Request Type</Text>
        {REQUEST_TYPES.map(t => (
          <TouchableOpacity
            key={t.key}
            style={[styles.typeRow, reqType === t.key && styles.activeTypeRow]}
            onPress={() => setReqType(t.key)}
          >
            <View style={[styles.typeIconBg, { backgroundColor: reqType === t.key ? COLORS.PRIMARY + '15' : COLORS.BG }]}>
              <MaterialCommunityIcons name={t.icon} size={22} color={reqType === t.key ? COLORS.PRIMARY : COLORS.TEXT_SUB} />
            </View>
            <Text style={[styles.typeLabel, reqType === t.key && styles.activeTypeLabel]}>{t.label}</Text>
            {reqType === t.key && <MaterialCommunityIcons name="check-circle" size={20} color={COLORS.PRIMARY} />}
          </TouchableOpacity>
        ))}

        {reqType === 'transfer' && (
          <View style={styles.dynamicFieldContainer}>
            <Text style={styles.formSectionLabel}>Target Room</Text>
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={toRoomId}
                onValueChange={(itemValue) => setToRoomId(itemValue)}
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

        {(reqType === 'leave' || reqType === 'vacate') && (
          <View style={styles.dynamicFieldContainerRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.formSectionLabel}>Start Date</Text>
              <TouchableOpacity style={styles.dateBtn} onPress={() => setShowPicker('start')}>
                <MaterialCommunityIcons name="calendar-start" size={20} color={COLORS.PRIMARY} />
                <Text style={styles.dateBtnText}>{startDate.toLocaleDateString()}</Text>
              </TouchableOpacity>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.formSectionLabel}>End Date</Text>
              <TouchableOpacity style={styles.dateBtn} onPress={() => setShowPicker('end')}>
                <MaterialCommunityIcons name="calendar-end" size={20} color={COLORS.PRIMARY} />
                <Text style={styles.dateBtnText}>{endDate.toLocaleDateString()}</Text>
              </TouchableOpacity>
            </View>
            {showPicker && (
              <DateTimePicker
                value={showPicker === 'start' ? startDate : endDate}
                mode="date"
                display="default"
                onChange={(event, selectedDate) => {
                  const current = selectedDate || (showPicker === 'start' ? startDate : endDate);
                  setShowPicker(Platform.OS === 'ios' ? showPicker : null);
                  if (showPicker === 'start') setStartDate(current);
                  else setEndDate(current);
                }}
              />
            )}
          </View>
        )}

        <Text style={[styles.formSectionLabel, { marginTop: 20 }]}>Reason / Details</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Explain your request in detail..."
          placeholderTextColor={COLORS.TEXT_SUB}
          value={reason}
          onChangeText={setReason}
          multiline
          numberOfLines={5}
          textAlignVertical="top"
        />

        <TouchableOpacity
          style={[styles.submitBtn, submitting && { opacity: 0.7 }]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting
            ? <ActivityIndicator color={COLORS.WHITE} />
            : <>
                <MaterialCommunityIcons name="send" size={18} color={COLORS.WHITE} />
                <Text style={styles.submitBtnText}>Submit Request</Text>
              </>
          }
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  formContainer: { padding: 20, gap: 8 },
  formSectionLabel: { fontSize: 13, fontWeight: '700', color: COLORS.TEXT_SUB, marginBottom: 6 },
  typeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: COLORS.BORDER,
    backgroundColor: COLORS.WHITE,
    gap: 12,
    marginBottom: 8,
  },
  activeTypeRow: { borderColor: COLORS.PRIMARY, backgroundColor: '#EEF2FF' },
  typeIconBg: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  typeLabel: { flex: 1, fontSize: 14, fontWeight: '600', color: COLORS.TEXT_SUB },
  activeTypeLabel: { color: COLORS.PRIMARY, fontWeight: '800' },
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
