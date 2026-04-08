import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const COLORS = {
  PRIMARY: '#1A237E',
  INFO: '#3B82F6',
  WARNING: '#F59E0B',
  URGENT: '#EF4444',
  BG: '#F8FAFC',
  WHITE: '#FFFFFF',
  TEXT_SUB: '#64748B'
};

const ANNOUNCEMENTS = [
  {
    id: '1',
    title: 'AC Maintenance Schedule',
    content: 'Routine maintenance for air conditioning units in Buildings A and B will start this Saturday. Please ensure access to your rooms.',
    date: 'Mar 06, 2026',
    type: 'info',
    icon: 'wrench'
  },
  {
    id: '2',
    title: 'Urgent: Room Clearance',
    content: 'All departing students must complete their room clearance and return keys before 4:00 PM this Thursday.',
    date: 'Mar 05, 2026',
    type: 'urgent',
    icon: 'alert-decagram'
  },
  {
    id: '3',
    title: 'Meal Plan Update',
    content: 'Ramadan meal schedules have been updated. Please check the Meal Booking section for new timings.',
    date: 'Mar 04, 2026',
    type: 'warning',
    icon: 'food-apple'
  }
];

export default function AnnouncementsScreen() {
  const renderItem = ({ item }) => {
    const getBadgeColor = () => {
      if (item.type === 'urgent') return COLORS.URGENT;
      if (item.type === 'warning') return COLORS.WARNING;
      return COLORS.INFO;
    };

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={[styles.iconBox, { backgroundColor: getBadgeColor() + '15' }]}>
            <MaterialCommunityIcons name={item.icon} size={24} color={getBadgeColor()} />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.date}>{item.date}</Text>
          </View>
        </View>
        <Text style={styles.content}>{item.content}</Text>
        <TouchableOpacity style={styles.readMore}>
          <Text style={[styles.readMoreText, { color: getBadgeColor() }]}>Details</Text>
          <MaterialCommunityIcons name="arrow-right" size={16} color={getBadgeColor()} />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <Text style={styles.topBarTitle}>Announcements</Text>
        <MaterialCommunityIcons name="bullhorn-outline" size={26} color={COLORS.WHITE} />
      </View>

      <FlatList
        data={ANNOUNCEMENTS}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.BG },
  topBar: { 
    backgroundColor: COLORS.PRIMARY, 
    paddingHorizontal: 20, 
    paddingTop: 50, 
    paddingBottom: 25, 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center' 
  },
  topBarTitle: { color: COLORS.WHITE, fontSize: 22, fontWeight: '800' },
  list: { padding: 16 },
  card: { 
    backgroundColor: COLORS.WHITE, 
    borderRadius: 16, 
    padding: 16, 
    marginBottom: 16, 
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  iconBox: { width: 45, height: 45, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  headerText: { flex: 1, marginLeft: 12 },
  title: { fontSize: 16, fontWeight: '700', color: COLORS.PRIMARY },
  date: { fontSize: 12, color: COLORS.TEXT_SUB, marginTop: 2 },
  content: { fontSize: 14, color: '#475569', lineHeight: 20 },
  readMore: { flexDirection: 'row', alignItems: 'center', marginTop: 15, borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 10 },
  readMoreText: { fontSize: 13, fontWeight: '700', marginRight: 5 }
});