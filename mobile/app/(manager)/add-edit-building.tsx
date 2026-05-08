import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput,
  TouchableOpacity, SafeAreaView, Alert,
  ActivityIndicator, ScrollView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import BACKEND_URL from '../../config/backend';

const DEEP_BLUE = '#1A237E';
const SOFT_WHITE = '#F8FAFC';
const BORDER_COLOR = '#E2E8F0';
const SLATE_GRAY = '#475569';

export default function AddEditBuildingScreen() {
  const router = useRouter();
  const { buildingId, buildingName } = useLocalSearchParams<{ buildingId?: string; buildingName?: string }>();
  const isEdit = !!buildingId;

  const [name, setName] = useState('');
  const [gender, setGender] = useState('male');
  const [floors, setFloors] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isEdit) {
      
      
      
      
      
      
      setName(buildingName || '');
    }
  }, []);

  const handleSave = async () => {
    if (!name.trim() || !floors.trim()) {
      Alert.alert('Required', 'Please fill in name and floors.');
      return;
    }

    setLoading(true);
    try {
      const payload = { name: name.trim(), gender, floors: parseInt(floors), description: description.trim() };

      
      
      
      
      
      
      
      
      

      Alert.alert('Success', isEdit ? 'Building updated!' : 'Building created!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={26} color={DEEP_BLUE} />
        </TouchableOpacity>
        <Text style={styles.title}>{isEdit ? 'Edit Building' : 'Add Building'}</Text>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView contentContainerStyle={styles.form}>
        <Text style={styles.label}>Building Name</Text>
        <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="e.g. Building A" />

        <Text style={styles.label}>Gender</Text>
        <View style={styles.pickerBox}>
          <Picker selectedValue={gender} onValueChange={setGender} style={{ color: DEEP_BLUE }}>
            <Picker.Item label="Male" value="male" />
            <Picker.Item label="Female" value="female" />
            <Picker.Item label="Mixed" value="mixed" />
          </Picker>
        </View>

        <Text style={styles.label}>Number of Floors</Text>
        <TextInput style={styles.input} value={floors} onChangeText={setFloors} placeholder="e.g. 4" keyboardType="numeric" />

        <Text style={styles.label}>Description (optional)</Text>
        <TextInput
          style={[styles.input, { height: 100, textAlignVertical: 'top' }]}
          value={description} onChangeText={setDescription}
          placeholder="Add any notes..." multiline
        />

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={loading}>
          {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.saveBtnText}>{isEdit ? 'Update Building' : 'Create Building'}</Text>}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: SOFT_WHITE },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 15,
    borderBottomWidth: 1, borderBottomColor: BORDER_COLOR, backgroundColor: '#FFF',
  },
  title: { fontSize: 18, fontWeight: '800', color: DEEP_BLUE },
  form: { padding: 20, gap: 6 },
  label: { fontSize: 11, fontWeight: '700', color: DEEP_BLUE, opacity: 0.6, textTransform: 'uppercase', marginTop: 14, marginBottom: 6 },
  input: {
    backgroundColor: '#FFF', borderRadius: 12, borderWidth: 1.5,
    borderColor: BORDER_COLOR, paddingHorizontal: 15, height: 50, fontSize: 15, color: DEEP_BLUE,
  },
  pickerBox: { borderWidth: 1.5, borderColor: BORDER_COLOR, borderRadius: 12, backgroundColor: '#FFF' },
  saveBtn: {
    backgroundColor: DEEP_BLUE, borderRadius: 15, height: 55,
    justifyContent: 'center', alignItems: 'center', marginTop: 30, elevation: 4,
  },
  saveBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});
