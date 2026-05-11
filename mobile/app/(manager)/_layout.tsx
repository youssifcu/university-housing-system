import { Tabs } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const COLORS = {
  primary: '#1A237E',
  inactive: '#94A3B8',
  bg: '#FFFFFF',
  border: '#F1F5F9'
};

export default function ManagerLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.inactive,
        tabBarStyle: {
          height: 65,
          paddingBottom: 10,
          paddingTop: 8,
          backgroundColor: COLORS.bg,
          borderTopWidth: 1,
          borderTopColor: COLORS.border,
          elevation: 0,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="home-variant" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="buildings"
        options={{
          title: "Buildings",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="office-building-outline" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="scan"
        options={{
          title: "Scan",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="qrcode-scan" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="attendance"
        options={{
          title: "Attendance",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="clipboard-check-outline" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="reports"
        options={{
          title: "Reports",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="chart-bar" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account-circle-outline" size={size} color={color} />
          ),
        }}
      />

      {}
      <Tabs.Screen
        name="rooms"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="add-edit-building"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="add-edit-room"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="change-room-status"
        options={{ href: null }}
      />
    </Tabs>
  );
}