import { useEffect, useState } from 'react';
import {
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { AttendanceRecordWithEmployee } from '../models/types';
import { getAttendanceRecords } from '../services/databaseService';

interface AttendanceLogScreenProps {
  dataVersion: number;
}

export function AttendanceLogScreen({ dataVersion }: AttendanceLogScreenProps) {
  const [records, setRecords] = useState<AttendanceRecordWithEmployee[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadRecords();
  }, [dataVersion]);

  async function loadRecords() {
    const nextRecords = await getAttendanceRecords();
    setRecords(nextRecords);
  }

  async function handleRefresh() {
    setIsRefreshing(true);
    try {
      await loadRecords();
    } finally {
      setIsRefreshing(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Attendance Log</Text>
          <Text style={styles.subtitle}>{records.length} local records</Text>
        </View>
        <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
          <Text style={styles.refreshButtonText}>Refresh</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        contentContainerStyle={records.length === 0 ? styles.emptyList : styles.list}
        data={records}
        keyExtractor={item => String(item.attendanceId ?? `${item.employeeId}-${item.timestamp}`)}
        refreshControl={
          <RefreshControl
            colors={['#2F80ED']}
            onRefresh={handleRefresh}
            refreshing={isRefreshing}
            tintColor="#2F80ED"
          />
        }
        renderItem={({ item }) => <AttendanceRow record={item} />}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyTitle}>No records yet</Text>
            <Text style={styles.emptyText}>Successful attendance marks will appear here.</Text>
          </View>
        }
      />
    </View>
  );
}

function AttendanceRow({ record }: { record: AttendanceRecordWithEmployee }) {
  const date = new Date(record.timestamp);

  return (
    <View style={styles.row}>
      {record.faceImageUri ? (
        <Image source={{ uri: record.faceImageUri }} style={styles.avatar} />
      ) : (
        <View style={styles.avatarFallback}>
          <Text style={styles.avatarFallbackText}>{record.name.slice(0, 1).toUpperCase()}</Text>
        </View>
      )}

      <View style={styles.rowBody}>
        <Text style={styles.name}>{record.name}</Text>
        <Text style={styles.meta}>ID: {record.employeeId}</Text>
      </View>

      <View style={styles.rowRight}>
        <Text style={styles.time}>
          {date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
        </Text>
        <Text style={styles.date}>
          {date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 18,
  },
  title: {
    color: '#F8FAFC',
    fontSize: 24,
    fontWeight: '900',
  },
  subtitle: {
    color: '#B8C7D9',
    fontSize: 13,
    marginTop: 2,
  },
  refreshButton: {
    borderColor: '#2F80ED',
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  refreshButtonText: {
    color: '#8FC3FF',
    fontWeight: '800',
  },
  list: {
    gap: 10,
    paddingHorizontal: 18,
    paddingBottom: 18,
  },
  emptyList: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 18,
  },
  row: {
    alignItems: 'center',
    backgroundColor: '#172331',
    borderColor: '#25364A',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    padding: 14,
  },
  avatar: {
    borderRadius: 24,
    height: 48,
    marginRight: 12,
    width: 48,
  },
  avatarFallback: {
    alignItems: 'center',
    backgroundColor: '#2F80ED',
    borderRadius: 24,
    height: 48,
    justifyContent: 'center',
    marginRight: 12,
    width: 48,
  },
  avatarFallbackText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
  },
  rowBody: {
    flex: 1,
  },
  name: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '800',
  },
  meta: {
    color: '#B8C7D9',
    fontSize: 12,
    marginTop: 2,
  },
  rowRight: {
    alignItems: 'flex-end',
  },
  time: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '800',
  },
  date: {
    color: '#B8C7D9',
    fontSize: 12,
    marginTop: 2,
  },
  emptyBox: {
    alignItems: 'center',
    backgroundColor: '#172331',
    borderColor: '#25364A',
    borderRadius: 8,
    borderWidth: 1,
    padding: 22,
  },
  emptyTitle: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: '900',
  },
  emptyText: {
    color: '#B8C7D9',
    fontSize: 14,
    marginTop: 6,
    textAlign: 'center',
  },
});
