import { CapturedPhoto, AttendanceRecord } from '../models/types';
import {
  getAllEmployees,
  getTodayAttendance,
  insertAttendance,
} from './databaseService';
import { detectFace } from './faceDetectionService';
import { extractEmbedding } from './embeddingService';
import { findBestMatch } from '../utils/similarity';

export async function enrollFace(photo: CapturedPhoto): Promise<number[]> {
  const face = await detectFace(photo);
  return extractEmbedding(photo, face);
}

export async function recognizeFace(photo: CapturedPhoto) {
  const face = await detectFace(photo);
  const embedding = await extractEmbedding(photo, face);
  const employees = await getAllEmployees();

  return findBestMatch(embedding, employees);
}

export async function markAttendance(photo: CapturedPhoto): Promise<{
  recognition: ReturnType<typeof findBestMatch>;
  alreadyMarked: boolean;
  attendanceRecord: AttendanceRecord | null;
}> {
  const recognition = await recognizeFace(photo);

  if (!recognition.matched || !recognition.employee) {
    return {
      recognition,
      alreadyMarked: false,
      attendanceRecord: null,
    };
  }

  const existing = await getTodayAttendance(recognition.employee.employeeId);
  if (existing) {
    return {
      recognition,
      alreadyMarked: true,
      attendanceRecord: existing,
    };
  }

  const attendanceRecord: AttendanceRecord = {
    employeeId: recognition.employee.employeeId,
    timestamp: new Date().toISOString(),
    status: 'Present',
  };

  await insertAttendance(attendanceRecord);

  return {
    recognition,
    alreadyMarked: false,
    attendanceRecord,
  };
}
