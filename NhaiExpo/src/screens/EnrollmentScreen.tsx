import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { CameraCapture } from '../components/CameraCapture';
import { EmployeeForm } from '../components/EmployeeForm';
import { CapturedPhoto, Employee, EnrollmentStep } from '../models/types';
import { getEmployeeById, insertEmployee } from '../services/databaseService';
import { enrollFace } from '../services/recognitionService';
import { saveFaceImage } from '../utils/fileStorage';

interface EnrollmentScreenProps {
  onDataChanged: () => void;
}

export function EnrollmentScreen({ onDataChanged }: EnrollmentScreenProps) {
  const [step, setStep] = useState<EnrollmentStep>('form');
  const [employeeId, setEmployeeId] = useState('');
  const [employeeName, setEmployeeName] = useState('');
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [error, setError] = useState('');

  async function handleFormSubmit(id: string, name: string) {
    const existing = await getEmployeeById(id);

    if (existing) {
      Alert.alert(
        'Employee already enrolled',
        `${existing.name} is already stored under ${id}.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Re-enroll',
            style: 'default',
            onPress: () => {
              setEmployeeId(id);
              setEmployeeName(name);
              setStep('camera');
            },
          },
        ],
      );
      return;
    }

    setEmployeeId(id);
    setEmployeeName(name);
    setStep('camera');
  }

  async function handleCapture(photo: CapturedPhoto) {
    setStep('processing');
    setError('');

    try {
      const embedding = await enrollFace(photo);
      const faceImageUri = await saveFaceImage(photo.uri, employeeId);
      const nextEmployee: Employee = {
        employeeId,
        name: employeeName,
        embedding,
        faceImageUri,
        createdAt: new Date().toISOString(),
      };

      await insertEmployee(nextEmployee);
      setEmployee(nextEmployee);
      setStep('success');
      onDataChanged();
    } catch (captureError) {
      setError(captureError instanceof Error ? captureError.message : 'Enrollment failed.');
      setStep('error');
    }
  }

  function reset() {
    setStep('form');
    setEmployeeId('');
    setEmployeeName('');
    setEmployee(null);
    setError('');
  }

  if (step === 'camera') {
    return (
      <CameraCapture
        mode="enrollment"
        onCancel={() => setStep('form')}
        onCapture={handleCapture}
      />
    );
  }

  if (step === 'processing') {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#2F80ED" size="large" />
        <Text style={styles.processingText}>Processing enrollment</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.panel}>
        <Text style={styles.title}>
          {step === 'success' ? 'Employee Enrolled' : step === 'error' ? 'Enrollment Error' : 'Enroll Employee'}
        </Text>
        <Text style={styles.subtitle}>
          Store employee details and a local face embedding for offline matching.
        </Text>

        {step === 'form' ? (
          <EmployeeForm onSubmit={handleFormSubmit} />
        ) : null}

        {step === 'success' && employee ? (
          <View style={styles.result}>
            <Image source={{ uri: employee.faceImageUri }} style={styles.avatar} />
            <Text style={styles.resultName}>{employee.name}</Text>
            <Text style={styles.resultMeta}>ID: {employee.employeeId}</Text>
            <Text style={styles.resultMeta}>{employee.embedding.length}-dim embedding saved</Text>
            <TouchableOpacity style={styles.primaryButton} onPress={reset}>
              <Text style={styles.primaryButtonText}>Enroll Another</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {step === 'error' ? (
          <View style={styles.result}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.primaryButton} onPress={() => setStep('camera')}>
              <Text style={styles.primaryButtonText}>Retry Capture</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.linkButton} onPress={reset}>
              <Text style={styles.linkButtonText}>Back to Form</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 18,
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
    marginBottom: 20,
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
  result: {
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    borderColor: '#34D399',
    borderRadius: 52,
    borderWidth: 3,
    height: 104,
    marginBottom: 8,
    width: 104,
  },
  resultName: {
    color: '#F8FAFC',
    fontSize: 21,
    fontWeight: '900',
  },
  resultMeta: {
    color: '#B8C7D9',
    fontSize: 14,
  },
  errorText: {
    color: '#F97066',
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: '#2F80ED',
    borderRadius: 8,
    marginTop: 12,
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  linkButton: {
    padding: 10,
  },
  linkButtonText: {
    color: '#B8C7D9',
    fontWeight: '800',
  },
});
