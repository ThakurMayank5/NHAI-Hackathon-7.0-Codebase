# NHAI Attendance Expo Baseline

Offline Expo baseline for employee enrollment, face capture, local embedding
storage, recognition matching, attendance marking, and an attendance log.

## Run

```sh
npm install
npx expo install expo-camera expo-file-system expo-image-manipulator expo-sqlite
npm start
```

Open the QR code with Expo Go. SDK 56 Expo Go may need to be installed from Expo
CLI directly on Android while the store app catches up.

## Notes

- Uses `expo-camera` for capture.
- Uses `expo-sqlite` for local employee and attendance tables.
- Bundles the MobileFaceNet `.tflite` asset from the bare project.
- Expo Go cannot execute native TFLite or ML Kit modules. The baseline ships an
  Expo Go-safe embedding adapter with the same 192-dimensional shape so a native
  MobileFaceNet adapter can be swapped in later without changing the app flow.
