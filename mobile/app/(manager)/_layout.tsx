import { Stack } from 'expo-router';

export default function ManagerLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="buildings" />
      <Stack.Screen name="rooms" />
      <Stack.Screen name="scan" />
      <Stack.Screen name="attendance" />
      <Stack.Screen name="reports" />
      <Stack.Screen name="add-edit-building" />
      <Stack.Screen name="add-edit-room" />
      <Stack.Screen name="change-room-status" />
      <Stack.Screen name="profile" />
    </Stack>
  );
}
