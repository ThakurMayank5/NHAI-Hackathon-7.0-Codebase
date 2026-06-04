export const MODEL_REGISTRY = {
  detection: {
    id: 'expo-go-centered-face-detector',
    family: 'Face detector adapter',
    input: 'captured image',
    output: 'single centered face box',
  },
  recognition: {
    id: 'mobilefacenet-compatible-embedding-adapter',
    family: 'MobileFaceNet shape-compatible embedding',
    input: '112x112 RGB face crop',
    output: '192-dimensional normalized embedding',
    bundledTfliteAsset: require('../../assets/models/mobilefacenet.tflite'),
  },
} as const;

export function getModelReadinessNote(): string {
  return 'Expo Go can bundle the MobileFaceNet asset, but native TFLite execution needs a development build. The baseline adapter keeps the offline attendance flow runnable in Expo Go.';
}
