import React, { useState, useEffect } from "react";
import { 
  View, Text, StyleSheet, FlatList, ActivityIndicator, 
  SafeAreaView, TouchableOpacity, RefreshControl, StatusBar, Platform 
} from "react-native";
import { useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { auth } from "../../../../config/firebase";
import BACKEND_URL from "../../../../config/backend";

const COLORS = { 
  PRIMARY: "#1A237E", 
  BG: "#F1F5F9", 
  WHITE: "#FFFFFF", 
  BORDER: "#E2E8F0", 
  TEXT_MAIN: "#0F172A", 
  TEXT_SUB: "#64748B", 
  PENDING: "#F59E0B", 
  SUCCESS: "#10B981", 
  REJECTED: "#EF4444", 
  ACTION: "#3B82F6" 
};

export default function ApplicationStatusScreen() {
  const router = useRouter();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchApplications = async () => {
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch(`${BACKEND_URL}/api/applications/my`, {
        headers: { 
          'Authorization': `Bearer ${token}`, 
          'Accept': 'application/json' 
        }
      });
      const resData = await res.json();
      
      if (res.ok) {
        const rawData = resData.data?.application || resData.data || resData;
        const appsArray = Array.isArray(rawData) ? rawData : [rawData];
        setApplications(appsArray.filter(app => app && app._id));
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchApplications(); }, []);

  const getStatusDetails = (status) => {
    switch (status?.toLowerCase()) {
      case "approved":
      case "active":
      case "accepted": 
        return { label: "Accepted", color: COLORS.SUCCESS, icon: "check-decagram" };
      case "rejected": 
        return { label: "Rejected", color: COLORS.REJECTED, icon: "close-octagon" };
      case "needs_update": 
        return { label: "Needs Update", color: COLORS.ACTION, icon: "alert-circle" };
      default: 
        return { label: "Under Review", color: COLORS.PENDING, icon: "clock-fast" };
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={COLORS.PRIMARY} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <MaterialCommunityIcons name="chevron-left" size={28} color={COLORS.TEXT_MAIN} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Applications</Text>
        <View style={{ width: 40 }} /> 
      </View>

      <FlatList
        data={applications}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconBg}>
              <MaterialCommunityIcons name="clipboard-text-off-outline" size={80} color={COLORS.TEXT_SUB} />
            </View>
            <Text style={styles.emptyTitle}>No Applications Yet</Text>
            <Text style={styles.emptySubText}>When you apply for housing, it will appear here.</Text>
          </View>
        }
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={() => { setRefreshing(true); fetchApplications(); }} 
            tintColor={COLORS.PRIMARY}
          />
        }
        renderItem={({ item }) => {
          const statusConfig = getStatusDetails(item.status);
          const canEdit = item.status === "pending" || item.status === "needs_update";

          return (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={[styles.statusIconContainer, { backgroundColor: statusConfig.color + "15" }]}>
                  <MaterialCommunityIcons name={statusConfig.icon} size={24} color={statusConfig.color} />
                </View>
                <View style={styles.headerTextInfo}>
                  <Text style={styles.cardCategory}>Housing Request</Text>
                  <Text style={styles.cardTitle} numberOfLines={1}>{item.college || "University Housing"}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: statusConfig.color + "15" }]}>
                  <Text style={[styles.statusBadgeText, { color: statusConfig.color }]}>
                    {statusConfig.label}
                  </Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <View style={styles.infoItem}>
                  <MaterialCommunityIcons name="calendar-month" size={14} color={COLORS.TEXT_SUB} />
                  <Text style={styles.infoValue}>
                    {item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-GB') : 'N/A'}
                  </Text>
                </View>
                <View style={styles.infoItem}>
                  <MaterialCommunityIcons name="identifier" size={14} color={COLORS.TEXT_SUB} />
                  <Text style={styles.infoValue}>ID: {item._id.slice(-6).toUpperCase()}</Text>
                </View>
              </View>

              {item.rejectionReason && (
                <View style={styles.noteBox}>
                  <MaterialCommunityIcons name="message-alert" size={16} color={COLORS.REJECTED} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.noteTitle}>Admin Note:</Text>
                    <Text style={styles.noteText}>{item.rejectionReason}</Text>
                  </View>
                </View>
              )}

              {canEdit && (
                <TouchableOpacity 
                  style={styles.modifyButton} 
                  onPress={() => router.push({ 
                    pathname: "../HousingApplyScreen", 
                    params: { initialData: JSON.stringify(item), isEdit: 'true' } 
                  })}
                  activeOpacity={0.8}
                >
                  <MaterialCommunityIcons name="pencil-box-outline" size={20} color={COLORS.WHITE} />
                  <Text style={styles.modifyButtonText}>Modify Details</Text>
                </TouchableOpacity>
              )}
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.BG },
  header: { 
    flexDirection: "row", 
    alignItems: "center", 
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 15, 
    backgroundColor: COLORS.WHITE,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
    paddingTop: Platform.OS === 'android' ? 40 : 15 
  },
  backButton: { padding: 5 },
  headerTitle: { fontSize: 20, fontWeight: "800", color: COLORS.TEXT_MAIN },
  listContent: { padding: 16, paddingBottom: 40 },
  card: { 
    backgroundColor: COLORS.WHITE, 
    borderRadius: 20, 
    padding: 18, 
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2 
  },
  cardHeader: { flexDirection: "row", alignItems: "center", marginBottom: 15 },
  statusIconContainer: { 
    width: 48, 
    height: 48, 
    borderRadius: 14, 
    justifyContent: "center", 
    alignItems: "center" 
  },
  headerTextInfo: { flex: 1, marginLeft: 12 },
  cardCategory: { fontSize: 11, fontWeight: "600", color: COLORS.TEXT_SUB, textTransform: 'uppercase', letterSpacing: 0.5 },
  cardTitle: { fontSize: 17, fontWeight: "700", color: COLORS.TEXT_MAIN, marginTop: 2 },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  statusBadgeText: { fontSize: 11, fontWeight: "800" },
  infoRow: { flexDirection: 'row', gap: 20, marginBottom: 15 },
  infoItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  infoValue: { fontSize: 13, color: COLORS.TEXT_SUB, fontWeight: "500" },
  noteBox: { 
    backgroundColor: "#FFF1F2", 
    borderRadius: 12, 
    padding: 12, 
    flexDirection: 'row', 
    gap: 10,
    borderWidth: 1,
    borderColor: "#FECDD3",
    marginBottom: 15
  },
  noteTitle: { fontSize: 12, fontWeight: "700", color: COLORS.REJECTED },
  noteText: { fontSize: 13, color: "#9F1239", lineHeight: 18, marginTop: 2 },
  modifyButton: { 
    backgroundColor: COLORS.ACTION, 
    height: 50,
    borderRadius: 12, 
    flexDirection: 'row', 
    justifyContent: 'center', 
    alignItems: "center", 
    gap: 8,
    shadowColor: COLORS.ACTION,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3
  },
  modifyButtonText: { color: COLORS.WHITE, fontWeight: "700", fontSize: 15 },
  emptyContainer: { alignItems: 'center', marginTop: 80, paddingHorizontal: 40 },
  emptyIconBg: { width: 120, height: 120, borderRadius: 60, backgroundColor: COLORS.WHITE, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  emptyTitle: { fontSize: 20, fontWeight: "800", color: COLORS.TEXT_MAIN },
  emptySubText: { fontSize: 14, color: COLORS.TEXT_SUB, textAlign: 'center', marginTop: 8, lineHeight: 20 }
});