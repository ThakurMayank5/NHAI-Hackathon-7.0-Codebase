import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { AppNavigator } from './src/navigation/AppNavigator';
import { useDatabase } from './src/hooks/useDatabase';

export default function App() {
  const { error, isReady } = useDatabase();

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorTitle}>Initialization failed</Text>
        <Text style={styles.errorText}>{error}</Text>
        <StatusBar style="light" />
      </View>
    );
  }

  if (!isReady) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#2F80ED" size="large" />
        <Text style={styles.loadingText}>Preparing local attendance store</Text>
        <StatusBar style="light" />
      </View>
    );
  }

  return (
    <>
      <AppNavigator />
      <StatusBar style="light" />
    </>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    backgroundColor: '#101820',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    color: '#D9E2EC',
    fontSize: 15,
    marginTop: 16,
  },
  errorTitle: {
    color: '#F97066',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  errorText: {
    color: '#D9E2EC',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
});
