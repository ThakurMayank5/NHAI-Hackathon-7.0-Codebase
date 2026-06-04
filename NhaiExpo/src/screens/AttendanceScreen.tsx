import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { CameraCapture } from '../components/CameraCapture';
import { AttendanceStep, CapturedPhoto, Employee } from '../models/types';
import {
  getEmployeeCount,
  getTodayAttendanceCount,
} from '../services/databaseService';
import { markAttendance } from '../services/recognitionService';

interface AttendanceScreenProps {
  dataVersion: number;
  onDataChanged: () => void;
}

export function AttendanceScreen({ dataVersion, onDataChanged }: AttendanceScreenProps) {
  const [step, setStep] = useState<AttendanceStep>('idle');
  const [employeeCount, setEmployeeCount] = useState(0);
  const [todayCount, setTodayCount] = useState(0);
  const [matchedEmployee, setMatchedEmployee] = useState<Employee | null>(null);
  const [similarity, setSimilarity] = useState(0);
  const [message, setMessage] = useState('');

  useEffect(() => {
    refreshCounts();
  }, [dataVersion]);

  async function refreshCounts() {
    const [employees, attendance] = await Promise.all([
      getEmployeeCount(),
      getTodayAttendanceCount(),
    ]);
    setEmployeeCount(employees);
    setTodayCount(attendance);
  }

  async function handleCapture(photo: CapturedPhoto) {
    setStep('processing');
    setMessage('');
    setMatchedEmployee(null);

    try {
      const result = await markAttendance(photo);
      setSimilarity(result.recognition.similarity);

      if (result.recognition.matched && result.recognition.employee) {
        setMatchedEmployee(result.recognition.employee);

        if (result.alreadyMarked) {
          setStep('already_marked');
          setMessage(`${result.recognition.employee.name} is already marked today.`);
        } else {
          setStep('success');
          setMessage(`Attendance marked for ${result.recognition.employee.name}.`);
          onDataChanged();
          await refreshCounts();
        }
      } else {
        setStep('failure');
        setMessage(result.recognition.message);
      }
    } catch (captureError) {
      setStep('failure');
      setMessage(captureError instanceof Error ? captureError.message : 'Recognition failed.');
    }
  }

  if (step === 'camera') {
    return (
      <CameraCapture
        mode="attendance"
        onCancel={() => setStep('idle')}
        onCapture={handleCapture}
      />
    );
  }

  if (step === 'processing') {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#2F80ED" size="large" />
        <Text style={styles.processingText}>Running local recognition</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{employeeCount}</Text>
          <Text style={styles.statLabel}>Enrolled</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{todayCount}</Text>
          <Text style={styles.statLabel}>Today</Text>
        </View>
      </View>

      <View style={styles.panel}>
        <Text style={styles.title}>Mark Attendance</Text>
        <Text style={styles.subtitle}>
          Capture one face and compare it with enrolled local embeddings.
        </Text>

        {employeeCount === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyTitle}>No employees enrolled</Text>
            <Text style={styles.emptyText}>Add an employee before marking attendance.</Text>
          </View>
        ) : (
          <TouchableOpacity style={styles.primaryButton} onPress={() => setStep('camera')}>
            <Text style={styles.primaryButtonText}>Open Camera</Text>
          </TouchableOpacity>
        )}
      </View>

      {step !== 'idle' ? (
        <View
          style={[
            styles.resultPanel,
            step === 'failure' ? styles.failurePanel : styles.successPanel,
          ]}
        >
          {matchedEmployee ? (
            <Image source={{ uri: matchedEmployee.faceImageUri }} style={styles.avatar} />
          ) : null}
          <Text style={styles.resultTitle}>
            {step === 'success'
              ? 'Attendance Marked'
              : step === 'already_marked'
                ? 'Already Marked'
                : 'Recognition Failed'}
          </Text>
          <Text style={styles.resultText}>{message}</Text>
          {similarity > 0 ? (
            <Text style={styles.resultMeta}>Similarity: {(similarity * 100).toFixed(1)}%</Text>
          ) : null}
          <TouchableOpacity style={styles.secondaryButton} onPress={() => setStep('idle')}>
            <Text style={styles.secondaryButtonText}>Done</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 14,
    padding: 18,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statBox: {
    backgroundColor: '#172331',
    borderColor: '#25364A',
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    padding: 16,
  },
  statValue: {
    color: '#F8FAFC',
    fontSize: 28,
    fontWeight: '900',
  },
  statLabel: {
    color: '#B8C7D9',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
  },
  panel: {
    backgroundColor: '#172331',
    borderColor: '#25364A',
    borderRadius: 8,
    borderWidth: 1,
    padding: 18,
  },
  title: {
    color: '#F8FAFC',
    fontSize: 24,
    fontWeight: '900',
    marginBottom: 6,
  },
  subtitle: {
    color: '#B8C7D9',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 18,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: '#2F80ED',
    borderRadius: 8,
    minHeight: 52,
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },
  emptyBox: {
    backgroundColor: '#101820',
    borderColor: '#25364A',
    borderRadius: 8,
    borderWidth: 1,
    padding: 16,
  },
  emptyTitle: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '800',
  },
  emptyText: {
    color: '#B8C7D9',
    fontSize: 14,
    marginTop: 4,
  },
  resultPanel: {
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    padding: 18,
  },
  successPanel: {
    backgroundColor: 'rgba(52, 211, 153, 0.12)',
    borderColor: '#34D399',
  },
  failurePanel: {
    backgroundColor: 'rgba(249, 112, 102, 0.12)',
    borderColor: '#F97066',
  },
  avatar: {
    borderColor: '#34D399',
    borderRadius: 42,
    borderWidth: 2,
    height: 84,
    marginBottom: 10,
    width: 84,
  },
  resultTitle: {
    color: '#F8FAFC',
    fontSize: 20,
    fontWeight: '900',
  },
  resultText: {
    color: '#D9E2EC',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6,
    textAlign: 'center',
  },
  resultMeta: {
    color: '#B8C7D9',
    fontSize: 13,
    marginTop: 8,
  },
  secondaryButton: {
    borderColor: '#B8C7D9',
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 14,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  secondaryButtonText: {
    color: '#F8FAFC',
    fontWeight: '800',
  },
  center: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  processingText: {
    color: '#D9E2EC',
    fontSize: 15,
    marginTop: 14,
  },
});
