import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

const COLORS = {
  PRIMARY: '#1A237E',
  TEXT_SECONDARY: '#64748B',
  BACKGROUND: '#F8FAFC',
  WHITE: '#FFFFFF',
  BORDER: '#E2E8F0'
};

export default function Index() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.content}>

        <View style={styles.logoWrapper}>
          <MaterialCommunityIcons name="office-building" size={55} color={COLORS.PRIMARY} />
        </View>

        <Text style={styles.title}>University Housing</Text>

        <Text style={styles.subtitle}>
          Apply for campus housing and manage your dorm stay easily through the university housing system.
        </Text>

        <View style={styles.buttons}>

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => router.push('/login')}
          >
            <Text style={styles.primaryText}>Login</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => router.push('/register')}
          >
            <Text style={styles.secondaryText}>Create New Account</Text>
          </TouchableOpacity>

        </View>

        <Text style={styles.footer}>© 2026 University Housing System</Text>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND
  },

  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24
  },

  logoWrapper: {
    width: 110,
    height: 110,
    borderRadius: 60,
    backgroundColor: COLORS.WHITE,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 6
  },

  title: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.PRIMARY,
    marginBottom: 10,
    letterSpacing: 0.5
  },

  subtitle: {
    fontSize: 16,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 50,
    paddingHorizontal: 10
  },

  buttons: {
    width: '100%',
    gap: 16
  },

  primaryButton: {
    backgroundColor: COLORS.PRIMARY,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.PRIMARY,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8
  },

  primaryText: {
    color: COLORS.WHITE,
    fontSize: 18,
    fontWeight: '700'
  },

  secondaryButton: {
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.PRIMARY
  },

  secondaryText: {
    color: COLORS.PRIMARY,
    fontSize: 17,
    fontWeight: '700'
  },

  footer: {
    position: 'absolute',
    bottom: 35,
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY
  }

});