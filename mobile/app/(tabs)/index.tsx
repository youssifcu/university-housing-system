import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';

export default function HomeScreen() {
  return (
    <ScrollView style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>نظام إسكان الجامعة</Text>
        <Text style={styles.headerSubtitle}>اهلاً بك في التطبيق</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>الوحدات المتاحة</Text>
        <Text style={styles.cardValue}>١٢ وحدة</Text>
        <Text style={styles.cardDesc}>منها ٤ شاغرة اليوم</Text>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>٤٢</Text>
          <Text style={styles.statLabel}>طالب</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>١٨</Text>
          <Text style={styles.statLabel}>موظف</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>٦</Text>
          <Text style={styles.statLabel}>مبانٍ</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>آخر الإشعارات</Text>
        <View style={styles.notification}>
          <Text style={styles.notificationText}>تم تحديث بيانات السكن للفصل الجديد</Text>
        </View>
        <View style={styles.notification}>
          <Text style={styles.notificationText}>موعد تقديم طلبات السكن ١ سبتمبر</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#1A237E',
    padding: 30,
    paddingTop: 50,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#E8EAF6',
    textAlign: 'center',
  },
  card: {
    backgroundColor: 'white',
    margin: 16,
    padding: 20,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  cardTitle: {
    fontSize: 18,
    color: '#475569',
    marginBottom: 8,
  },
  cardValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#1A237E',
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 14,
    color: '#94a3b8',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginHorizontal: 16,
    marginBottom: 24,
  },
  statBox: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A237E',
  },
  statLabel: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 12,
  },
  notification: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  notificationText: {
    fontSize: 14,
    color: '#334155',
  },
});