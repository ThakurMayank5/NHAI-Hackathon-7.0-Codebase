import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

interface EmployeeFormProps {
  isLoading?: boolean;
  onSubmit: (employeeId: string, name: string) => void;
}

export function EmployeeForm({ isLoading = false, onSubmit }: EmployeeFormProps) {
  const [employeeId, setEmployeeId] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  function handleSubmit() {
    if (!employeeId.trim() || !name.trim()) {
      setError('Employee ID and name are required.');
      return;
    }

    setError('');
    onSubmit(employeeId.trim().toUpperCase(), name.trim());
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.form}
    >
      <View style={styles.field}>
        <Text style={styles.label}>Employee ID</Text>
        <TextInput
          autoCapitalize="characters"
          editable={!isLoading}
          onChangeText={setEmployeeId}
          placeholder="EMP001"
          placeholderTextColor="#6B7A8C"
          style={styles.input}
          value={employeeId}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Employee Name</Text>
        <TextInput
          autoCapitalize="words"
          editable={!isLoading}
          onChangeText={setName}
          placeholder="Rahul Sharma"
          placeholderTextColor="#6B7A8C"
          style={styles.input}
          value={name}
        />
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <TouchableOpacity
        activeOpacity={0.8}
        disabled={isLoading}
        onPress={handleSubmit}
        style={[styles.button, isLoading && styles.buttonDisabled]}
      >
        <Text style={styles.buttonText}>{isLoading ? 'Processing' : 'Capture Face'}</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: 16,
  },
  field: {
    gap: 8,
  },
  label: {
    color: '#B8C7D9',
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: '#172331',
    borderColor: '#2B3C50',
    borderRadius: 8,
    borderWidth: 1,
    color: '#F8FAFC',
    fontSize: 16,
    minHeight: 52,
    paddingHorizontal: 14,
  },
  error: {
    color: '#F97066',
    fontSize: 13,
  },
  button: {
    alignItems: 'center',
    backgroundColor: '#2F80ED',
    borderRadius: 8,
    minHeight: 52,
    justifyContent: 'center',
    marginTop: 4,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
});
