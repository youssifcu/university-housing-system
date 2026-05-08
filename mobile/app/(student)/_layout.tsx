import { Tabs } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useAppStore } from "../../store/useAppStore";
import { View, Text, StyleSheet } from "react-native";

const COLORS = {
  primary: '#1A237E',
  inactive: '#94A3B8',
  bg: '#FFFFFF',
  border: '#F1F5F9',
};

function Badge({ count }: { count: number }) {
  if (!count) return null;
  return (
    <View style={styles.badge}>
      <Text style={styles.badgeText}>{count > 9 ? '9+' : count}</Text>
    </View>
  );
}

export default function TabsLayout() {
  const unreadCount = useAppStore((s) => s.unreadCount);

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
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.06,
          shadowRadius: 12,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >


      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <View>
              <MaterialCommunityIcons name="home-variant" size={size} color={color} />
              <Badge count={unreadCount} />
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="(info)/announcements"
        options={{
          title: "Updates",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="bullhorn-outline" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="(meals)/meals"
        options={{
          title: "Meals",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="silverware-fork-knife" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="qrcode"
        options={{
          title: "My QR",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="qrcode-scan" size={size} color={color} />
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

      <Tabs.Screen name="(housing)/explore" options={{ href: null }} />
      <Tabs.Screen name="(housing)/housing-request" options={{ href: null }} />
      <Tabs.Screen name="(housing)/HousingApplyScreen" options={{ href: null }} />
      <Tabs.Screen name="(housing)/StatusScreen" options={{ href: null }} />
      <Tabs.Screen name="(housing)/[id]/apply" options={{ href: null }} />
      <Tabs.Screen name="(housing)/[id]/status" options={{ href: null }} />
      <Tabs.Screen name="(info)/notifications" options={{ href: null }} />
      <Tabs.Screen name="(info)/ai-chat" options={{ href: null, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="(meals)/bookings" options={{ href: null }} />
      <Tabs.Screen name="(services)/attendance" options={{ href: null }} />
      <Tabs.Screen name="(services)/reports" options={{ href: null }} />
      <Tabs.Screen name="(services)/payments" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: '#EF4444',
    borderRadius: 9,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  badgeText: { color: '#FFF', fontSize: 9, fontWeight: '800' },
});