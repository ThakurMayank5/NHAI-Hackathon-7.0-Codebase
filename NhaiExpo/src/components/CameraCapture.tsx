import { CameraCapturedPicture, CameraView, useCameraPermissions } from 'expo-camera';
import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { CapturedPhoto } from '../models/types';

interface CameraCaptureProps {
  mode: 'enrollment' | 'attendance';
  isProcessing?: boolean;
  onCancel: () => void;
  onCapture: (photo: CapturedPhoto) => Promise<void> | void;
}

export function CameraCapture({
  mode,
  isProcessing = false,
  onCancel,
  onCapture,
}: CameraCaptureProps) {
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [isCapturing, setIsCapturing] = useState(false);

  async function handleCapture() {
    if (!cameraRef.current || isCapturing || isProcessing) {
      return;
    }

    setIsCapturing(true);
    try {
      const photo = (await cameraRef.current.takePictureAsync({
        base64: true,
        quality: 0.88,
        skipProcessing: false,
      })) as CameraCapturedPicture | undefined;

      if (!photo?.uri) {
        throw new Error('Camera did not return a photo.');
      }

      await onCapture({
        uri: photo.uri,
        width: photo.width,
        height: photo.height,
        base64: photo.base64,
      });
    } finally {
      setIsCapturing(false);
    }
  }

  if (!permission) {
    return <View style={styles.center} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.permissionTitle}>Camera access required</Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryAction} onPress={onCancel}>
          <Text style={styles.secondaryActionText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        active
        facing="front"
        mirror
        mode="picture"
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.overlay}>
        <View style={styles.frameWrap}>
          <View style={styles.faceFrame} />
          <Text style={styles.modeLabel}>
            {mode === 'enrollment' ? 'Enrollment Capture' : 'Attendance Capture'}
          </Text>
        </View>

        <View style={styles.controls}>
          <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.85}
            disabled={isCapturing || isProcessing}
            onPress={handleCapture}
            style={[styles.captureButton, (isCapturing || isProcessing) && styles.disabled]}
          >
            {isCapturing || isProcessing ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <View style={styles.captureInner} />
            )}
          </TouchableOpacity>

          <View style={styles.controlSpacer} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#000000',
    flex: 1,
  },
  center: {
    alignItems: 'center',
    backgroundColor: '#101820',
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  permissionTitle: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  permissionButton: {
    backgroundColor: '#2F80ED',
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  permissionButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  secondaryAction: {
    marginTop: 16,
    padding: 12,
  },
  secondaryActionText: {
    color: '#B8C7D9',
    fontWeight: '700',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
  },
  frameWrap: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  faceFrame: {
    borderColor: '#34D399',
    borderRadius: 120,
    borderWidth: 3,
    height: 300,
    width: 230,
  },
  modeLabel: {
    backgroundColor: 'rgba(16, 24, 32, 0.72)',
    borderRadius: 8,
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '800',
    marginTop: 16,
    overflow: 'hidden',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  controls: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 42,
    paddingHorizontal: 28,
  },
  cancelButton: {
    minWidth: 72,
    paddingVertical: 12,
  },
  cancelText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  captureButton: {
    alignItems: 'center',
    backgroundColor: '#2F80ED',
    borderColor: '#FFFFFF',
    borderRadius: 38,
    borderWidth: 4,
    height: 76,
    justifyContent: 'center',
    width: 76,
  },
  captureInner: {
    backgroundColor: '#FFFFFF',
    borderRadius: 25,
    height: 50,
    width: 50,
  },
  controlSpacer: {
    minWidth: 72,
  },
  disabled: {
    opacity: 0.7,
  },
});
