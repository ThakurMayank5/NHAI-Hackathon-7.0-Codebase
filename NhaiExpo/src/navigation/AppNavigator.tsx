import { useMemo, useState } from 'react';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AttendanceLogScreen } from '../screens/AttendanceLogScreen';
import { AttendanceScreen } from '../screens/AttendanceScreen';
import { EnrollmentScreen } from '../screens/EnrollmentScreen';

type TabKey = 'enroll' | 'attendance' | 'log';

const TABS: Array<{ key: TabKey; label: string }> = [
  { key: 'enroll', label: 'Enroll' },
  { key: 'attendance', label: 'Attendance' },
  { key: 'log', label: 'Log' },
];

export function AppNavigator() {
  const [activeTab, setActiveTab] = useState<TabKey>('attendance');
  const [dataVersion, setDataVersion] = useState(0);

  const screen = useMemo(() => {
    const bumpDataVersion = () => setDataVersion(version => version + 1);

    if (activeTab === 'enroll') {
      return <EnrollmentScreen onDataChanged={bumpDataVersion} />;
    }

    if (activeTab === 'log') {
      return <AttendanceLogScreen dataVersion={dataVersion} />;
    }

    return <AttendanceScreen dataVersion={dataVersion} onDataChanged={bumpDataVersion} />;
  }, [activeTab, dataVersion]);

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>NHAI</Text>
          <Text style={styles.title}>Attendance</Text>
        </View>
      </View>

      <View style={styles.content}>{screen}</View>

      <View style={styles.tabBar}>
        {TABS.map(tab => {
          const isActive = tab.key === activeTab;

          return (
            <TouchableOpacity
              accessibilityRole="button"
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              style={[styles.tab, isActive && styles.activeTab]}
            >
              <Text style={[styles.tabText, isActive && styles.activeTabText]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: '#101820',
    flex: 1,
  },
  header: {
    alignItems: 'center',
    borderBottomColor: '#25364A',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  eyebrow: {
    color: '#34D399',
    fontSize: 12,
    fontWeight: '900',
  },
  title: {
    color: '#F8FAFC',
    fontSize: 24,
    fontWeight: '900',
  },
  content: {
    flex: 1,
  },
  tabBar: {
    backgroundColor: '#172331',
    borderTopColor: '#25364A',
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  tab: {
    alignItems: 'center',
    borderRadius: 8,
    flex: 1,
    minHeight: 44,
    justifyContent: 'center',
  },
  activeTab: {
    backgroundColor: '#2F80ED',
  },
  tabText: {
    color: '#B8C7D9',
    fontSize: 13,
    fontWeight: '800',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
});
