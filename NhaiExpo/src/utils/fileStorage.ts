import * as FileSystem from 'expo-file-system/legacy';

const FACE_IMAGE_DIR = `${FileSystem.documentDirectory ?? ''}face_images/`;

export async function saveFaceImage(sourceUri: string, employeeId: string): Promise<string> {
  if (!FileSystem.documentDirectory) {
    throw new Error('Document storage is not available on this device.');
  }

  const directoryInfo = await FileSystem.getInfoAsync(FACE_IMAGE_DIR);
  if (!directoryInfo.exists) {
    await FileSystem.makeDirectoryAsync(FACE_IMAGE_DIR, { intermediates: true });
  }

  const safeId = employeeId.replace(/[^a-zA-Z0-9_-]/g, '_');
  const destination = `${FACE_IMAGE_DIR}${safeId}_${Date.now()}.jpg`;
  await FileSystem.copyAsync({ from: sourceUri, to: destination });

  return destination;
}
