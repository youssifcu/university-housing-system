import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, SafeAreaView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import BACKEND_URL from '../../config/backend';

const DEEP_BLUE = '#1A237E';
const SOFT_WHITE = '#F8FAFC';
const SLATE_GRAY = '#475569';
const BORDER_COLOR = '#E2E8F0';

const STATUS_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  available:   { color: '#16A34A', bg: '#DCFCE7', label: 'Available'   },
  full:        { color: '#DC2626', bg: '#FEE2E2', label: 'Full'        },
  maintenance: { color: '#D97706', bg: '#FEF3C7', label: 'Maintenance' },
};


const MOCK_ROOMS = [
  { _id: 'r1', roomNumber: '101', floor: 1, capacity: 4, occupancy: 3, status: 'available'   },
  { _id: 'r2', roomNumber: '102', floor: 1, capacity: 2, occupancy: 2, status: 'full'        },
  { _id: 'r3', roomNumber: '201', floor: 2, capacity: 4, occupancy: 1, status: 'available'   },
  { _id: 'r4', roomNumber: '202', floor: 2, capacity: 3, occupancy: 0, status: 'maintenance' },
];

type Room = { _id: string; roomNumber: string; floor: number; capacity: number; occupancy: number; status: string };

function RoomCard({ item, onPress, onStatusPress }: { item: Room; onPress: () => void; onStatusPress: () => void }) {
  const cfg = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.available;
  const pct = item.capacity > 0 ? (item.occupancy / item.capacity) * 100 : 0;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.cardTop}>
        <View>
          <Text style={styles.roomNumber}>Room {item.roomNumber}</Text>
          <Text style={styles.floorText}>Floor {item.floor}</Text>
        </View>
        <TouchableOpacity style={[styles.statusChip, { backgroundColor: cfg.bg }]} onPress={onStatusPress}>
          <Text style={[styles.statusText, { color: cfg.color }]}>{cfg.label}</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.capacityRow}>
        <MaterialCommunityIcons name="account-multiple" size={14} color={SLATE_GRAY} />
        <Text style={styles.capacityText}>{item.occupancy}/{item.capacity} occupants</Text>
      </View>
      <View style={styles.barBg}>
        <View style={[styles.barFill, { width: `${pct}%` as any, backgroundColor: pct >= 100 ? '#EF4444' : DEEP_BLUE }]} />
      </View>
    </TouchableOpacity>
  );
}

const FILTERS = ['all', 'available', 'full', 'maintenance'] as const;

export default function BuildingRoomsScreen() {
  const router = useRouter();
  const { buildingId, buildingName } = useLocalSearchParams<{ buildingId: string; buildingName: string }>();
  const [rooms, setRooms] = useState<Room[]>(MOCK_ROOMS);
  const [floorFilter, setFloorFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const floors = ['all', ...Array.from(new Set(rooms.map((r) => String(r.floor))))];
  const filtered = rooms.filter((r) => {
    const floorMatch  = floorFilter  === 'all' || String(r.floor) === floorFilter;
    const statusMatch = statusFilter === 'all' || r.status === statusFilter;
    return floorMatch && statusMatch;
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={26} color={DEEP_BLUE} />
        </TouchableOpacity>
        <View>
          <Text style={styles.title}>Rooms</Text>
          <Text style={styles.subtitle}>{buildingName}</Text>
        </View>
        <TouchableOpacity onPress={() => router.push({ pathname: '/(manager)/add-edit-room' as any, params: { buildingId, buildingName } })}>
          <MaterialCommunityIcons name="plus-circle" size={28} color={DEEP_BLUE} />
        </TouchableOpacity>
      </View>

      {}
      <View style={styles.filterRow}>
        {FILTERS.map((f) => (
          <TouchableOpacity key={f} style={[styles.filterTab, statusFilter === f && styles.filterTabActive]} onPress={() => setStatusFilter(f)}>
            <Text style={[styles.filterTabText, statusFilter === f && styles.filterTabTextActive]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <RoomCard
            item={item}
            onPress={() => router.push({ pathname: '/(manager)/add-edit-room' as any, params: { roomId: item._id, buildingId, buildingName } })}
            onStatusPress={() => router.push({ pathname: '/(manager)/change-room-status' as any, params: { roomId: item._id, currentStatus: item.status } })}
          />
        )}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <MaterialCommunityIcons name="door-open" size={50} color={BORDER_COLOR} />
            <Text style={styles.emptyText}>No rooms found</Text>
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
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: BORDER_COLOR, backgroundColor: '#FFF',
  },
  title: { fontSize: 18, fontWeight: '800', color: DEEP_BLUE, textAlign: 'center' },
  subtitle: { fontSize: 12, color: SLATE_GRAY, textAlign: 'center' },
  filterRow: {
    flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 10, gap: 8,
    backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: BORDER_COLOR,
  },
  filterTab: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: SOFT_WHITE, borderWidth: 1, borderColor: BORDER_COLOR },
  filterTabActive: { backgroundColor: DEEP_BLUE, borderColor: DEEP_BLUE },
  filterTabText: { fontSize: 12, fontWeight: '600', color: SLATE_GRAY },
  filterTabTextActive: { color: '#FFF' },
  list: { padding: 16, gap: 12 },
  card: {
    backgroundColor: '#FFF', borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: BORDER_COLOR,
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  roomNumber: { fontSize: 16, fontWeight: '800', color: DEEP_BLUE },
  floorText: { fontSize: 12, color: SLATE_GRAY, marginTop: 2 },
  statusChip: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  statusText: { fontSize: 12, fontWeight: '700' },
  capacityRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  capacityText: { fontSize: 13, color: SLATE_GRAY },
  barBg: { height: 6, backgroundColor: BORDER_COLOR, borderRadius: 99, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 99 },
  empty: { alignItems: 'center', marginTop: 60, gap: 10 },
  emptyText: { fontSize: 15, color: SLATE_GRAY },
});
