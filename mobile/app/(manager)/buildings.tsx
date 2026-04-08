import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import BACKEND_URL from '../../config/backend';

const DEEP_BLUE = '#1A237E';
const SOFT_WHITE = '#F8FAFC';
const SLATE_GRAY = '#475569';
const BORDER_COLOR = '#E2E8F0';

// 🔌 Mock data — replace with GET /api/buildings
const MOCK_BUILDINGS = [
  { _id: 'b1', name: 'Building A', gender: 'male',   floors: 4, totalRooms: 40, availableRooms: 12 },
  { _id: 'b2', name: 'Building B', gender: 'female', floors: 3, totalRooms: 30, availableRooms: 5  },
  { _id: 'b3', name: 'Building C', gender: 'mixed',  floors: 5, totalRooms: 50, availableRooms: 20 },
];

type Building = {
  _id: string;
  name: string;
  gender: string;
  floors: number;
  totalRooms: number;
  availableRooms: number;
};

function BuildingCard({ item, onPress }: { item: Building; onPress: () => void }) {
  const genderIcon = item.gender === 'male' ? 'human-male' : item.gender === 'female' ? 'human-female' : 'human-male-female';
  const genderColor = item.gender === 'male' ? '#3B82F6' : item.gender === 'female' ? '#EC4899' : '#8B5CF6';

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.cardHeader}>
        <View style={[styles.genderBadge, { backgroundColor: genderColor + '20' }]}>
          <MaterialCommunityIcons name={genderIcon as any} size={20} color={genderColor} />
        </View>
        <Text style={styles.buildingName}>{item.name}</Text>
        <MaterialCommunityIcons name="chevron-right" size={22} color={SLATE_GRAY} />
      </View>
      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <MaterialCommunityIcons name="stairs" size={15} color={DEEP_BLUE} />
          <Text style={styles.statText}>{item.floors} Floors</Text>
        </View>
        <View style={styles.stat}>
          <MaterialCommunityIcons name="door" size={15} color={DEEP_BLUE} />
          <Text style={styles.statText}>{item.totalRooms} Rooms</Text>
        </View>
        <View style={styles.stat}>
          <MaterialCommunityIcons name="door-open" size={15} color="#16A34A" />
          <Text style={[styles.statText, { color: '#16A34A' }]}>{item.availableRooms} Available</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function BuildingsScreen() {
  const router = useRouter();
  const [buildings, setBuildings] = useState<Building[]>(MOCK_BUILDINGS);

  // 🔌 Uncomment when backend ready:
  // useEffect(() => {
  //   fetch(`${BACKEND_URL}/api/buildings`)
  //     .then(r => r.json()).then(setBuildings);
  // }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={26} color={DEEP_BLUE} />
        </TouchableOpacity>
        <Text style={styles.title}>Buildings</Text>
        <TouchableOpacity onPress={() => router.push('/(manager)/add-edit-building' as any)}>
          <MaterialCommunityIcons name="plus-circle" size={28} color={DEEP_BLUE} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={buildings}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <BuildingCard
            item={item}
            onPress={() => router.push({ pathname: '/(manager)/rooms' as any, params: { buildingId: item._id, buildingName: item.name } })}
          />
        )}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <MaterialCommunityIcons name="office-building-outline" size={50} color={BORDER_COLOR} />
            <Text style={styles.emptyText}>No buildings yet</Text>
          </View>
        }
      />
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
  list: { padding: 16, gap: 14 },
  card: {
    backgroundColor: '#FFF', borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: BORDER_COLOR,
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  genderBadge: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  buildingName: { flex: 1, fontSize: 16, fontWeight: '700', color: DEEP_BLUE },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  statText: { fontSize: 13, color: SLATE_GRAY, fontWeight: '500' },
  empty: { alignItems: 'center', marginTop: 60, gap: 10 },
  emptyText: { fontSize: 15, color: SLATE_GRAY },
});
