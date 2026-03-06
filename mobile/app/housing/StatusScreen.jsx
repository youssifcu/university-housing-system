import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, FlatList, ActivityIndicator, SafeAreaView, TouchableOpacity, RefreshControl, Alert } from "react-native";
import { useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { auth } from "../../config/firebase";
import BACKEND_URL from "../../config/backend";

const COLORS = { PRIMARY: "#1A237E", BG: "#F8FAFC", WHITE: "#FFFFFF", BORDER: "#E2E8F0", TEXT_MAIN: "#1E293B", TEXT_SUB: "#64748B", PENDING: "#F59E0B", SUCCESS: "#10B981", REJECTED: "#EF4444", ACTION: "#3B82F6" };

export default function ApplicationStatusScreen() {
  const router = useRouter();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchApplications = async () => {
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch(`${BACKEND_URL}/api/housing/user-applications`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
      });
      const data = await res.json();
      if (res.ok) setApplications(data);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchApplications(); }, []);

  const getStatusDetails = (status) => {
    switch (status?.toLowerCase()) {
      case "accepted": return { label: "Accepted", color: COLORS.SUCCESS, icon: "check-circle" };
      case "rejected": return { label: "Rejected", color: COLORS.REJECTED, icon: "close-circle" };
      case "needs_update": return { label: "Needs Update", color: COLORS.ACTION, icon: "pencil-circle" };
      default: return { label: "Under Review", color: COLORS.PENDING, icon: "clock-outline" };
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.TEXT_MAIN} /></TouchableOpacity>
        <Text style={styles.headerTitle}>Application Status</Text>
      </View>
      <FlatList
        data={applications}
        keyExtractor={(item) => item._id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchApplications(); }} />}
        renderItem={({ item }) => {
          const status = getStatusDetails(item.status);
          return (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={[styles.iconBox, { backgroundColor: status.color + "15" }]}><MaterialCommunityIcons name={status.icon} size={24} color={status.color} /></View>
                <View style={styles.headerInfo}>
                  <Text style={styles.facultyText}>{item.faculty}</Text>
                  <Text style={styles.dateText}>{new Date(item.createdAt).toLocaleDateString()}</Text>
                </View>
                <View style={[styles.badge, { backgroundColor: status.color }]}><Text style={styles.badgeText}>{status.label}</Text></View>
              </View>
              <View style={styles.divider} />
              {(item.status === "needs_update" || item.status === "rejected") && (
                <TouchableOpacity style={styles.editButton} onPress={() => router.push({ pathname: "/housing/HousingApplyScreen", params: { initialData: JSON.stringify(item) } })}>
                  <Text style={styles.editButtonText}>Modify & Re-submit</Text>
                </TouchableOpacity>
              )}
              {item.rejectionReason && (
                <View style={styles.rejectionBox}><Text style={styles.rejectionText}>Note: {item.rejectionReason}</Text></View>
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
  header: { flexDirection: "row", alignItems: "center", padding: 20, backgroundColor: COLORS.WHITE, borderBottomWidth: 1, borderBottomColor: COLORS.BORDER },
  headerTitle: { fontSize: 18, fontWeight: "700", marginLeft: 15 },
  card: { backgroundColor: COLORS.WHITE, borderRadius: 15, padding: 16, margin: 16, elevation: 3 },
  cardHeader: { flexDirection: "row", alignItems: "center" },
  iconBox: { width: 45, height: 45, borderRadius: 10, justifyContent: "center", alignItems: "center" },
  headerInfo: { flex: 1, marginLeft: 12 },
  facultyText: { fontSize: 16, fontWeight: "700" },
  dateText: { fontSize: 12, color: COLORS.TEXT_SUB },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeText: { color: COLORS.WHITE, fontSize: 10, fontWeight: "800" },
  divider: { height: 1, backgroundColor: COLORS.BORDER, marginVertical: 15 },
  editButton: { backgroundColor: COLORS.ACTION, padding: 12, borderRadius: 10, alignItems: "center" },
  editButtonText: { color: COLORS.WHITE, fontWeight: "700" },
  rejectionBox: { marginTop: 15, padding: 12, backgroundColor: "#F1F5F9", borderRadius: 8 },
  rejectionText: { fontSize: 12, color: COLORS.REJECTED }
});