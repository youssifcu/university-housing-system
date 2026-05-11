import { Stack } from 'expo-router';
import { StatusBar, View, SafeAreaView, Platform } from 'react-native';

export default function AuthLayout() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      <StatusBar 
        barStyle="dark-content" 
        backgroundColor="#F8FAFC" 
        translucent={false} 
      />
      <View style={{ flex: 1 }}>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: '#F8FAFC' },
            animation: 'fade',
          }}
        >
          <Stack.Screen name = "index" /> 
          <Stack.Screen name="login" />
          <Stack.Screen name="register" />
        </Stack>
      </View>
    </SafeAreaView>
  );
}