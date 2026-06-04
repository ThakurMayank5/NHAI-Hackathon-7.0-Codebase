import * as SQLite from 'expo-sqlite';
import { ALL_TABLES } from '../database/schema';
import {
  AttendanceRecord,
  AttendanceRecordWithEmployee,
  Employee,
} from '../models/types';

let db: SQLite.SQLiteDatabase | null = null;

type EmployeeRow = {
  employeeId: string;
  name: string;
  embedding: string;
  faceImageUri: string;
  createdAt: string;
};

type AttendanceRow = {
  attendanceId: number;
  employeeId: string;
  timestamp: string;
  status: 'Present';
};

type AttendanceJoinRow = AttendanceRow & {
  name: string | null;
  faceImageUri: string | null;
};

export async function initDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db) {
    return db;
  }

  db = await SQLite.openDatabaseAsync('nhai_attendance.db');
  await db.execAsync('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');

  for (const sql of ALL_TABLES) {
    await db.execAsync(sql);
  }

  return db;
}

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  return db ?? initDatabase();
}

export async function insertEmployee(employee: Employee): Promise<void> {
  const database = await getDatabase();

  await database.runAsync(
    `INSERT OR REPLACE INTO employees
      (employeeId, name, embedding, faceImageUri, createdAt)
     VALUES (?, ?, ?, ?, ?)`,
    [
      employee.employeeId,
      employee.name,
      JSON.stringify(employee.embedding),
      employee.faceImageUri,
      employee.createdAt,
    ],
  );
}

export async function getEmployeeById(employeeId: string): Promise<Employee | null> {
  const database = await getDatabase();
  const row = await database.getFirstAsync<EmployeeRow>(
    'SELECT * FROM employees WHERE employeeId = ?',
    employeeId,
  );

  return row ? rowToEmployee(row) : null;
}

export async function getAllEmployees(): Promise<Employee[]> {
  const database = await getDatabase();
  const rows = await database.getAllAsync<EmployeeRow>(
    'SELECT * FROM employees ORDER BY createdAt DESC',
  );

  return rows.map(rowToEmployee).filter(Boolean) as Employee[];
}

export async function getEmployeeCount(): Promise<number> {
  const database = await getDatabase();
  const row = await database.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM employees',
  );

  return row?.count ?? 0;
}

export async function insertAttendance(record: AttendanceRecord): Promise<void> {
  const database = await getDatabase();

  await database.runAsync(
    'INSERT INTO attendance (employeeId, timestamp, status) VALUES (?, ?, ?)',
    record.employeeId,
    record.timestamp,
    record.status,
  );
}

export async function getTodayAttendance(
  employeeId: string,
): Promise<AttendanceRecord | null> {
  const database = await getDatabase();
  const today = new Date().toISOString().slice(0, 10);
  const row = await database.getFirstAsync<AttendanceRow>(
    `SELECT * FROM attendance
     WHERE employeeId = ? AND timestamp LIKE ?
     ORDER BY timestamp DESC LIMIT 1`,
    employeeId,
    `${today}%`,
  );

  return row ?? null;
}

export async function getAttendanceRecords(): Promise<AttendanceRecordWithEmployee[]> {
  const database = await getDatabase();
  const rows = await database.getAllAsync<AttendanceJoinRow>(
    `SELECT a.attendanceId, a.employeeId, a.timestamp, a.status,
            e.name, e.faceImageUri
     FROM attendance a
     LEFT JOIN employees e ON e.employeeId = a.employeeId
     ORDER BY a.timestamp DESC`,
  );

  return rows.map(row => ({
    attendanceId: row.attendanceId,
    employeeId: row.employeeId,
    timestamp: row.timestamp,
    status: row.status,
    name: row.name ?? 'Unknown',
    faceImageUri: row.faceImageUri ?? '',
  }));
}

export async function getTodayAttendanceCount(): Promise<number> {
  const database = await getDatabase();
  const today = new Date().toISOString().slice(0, 10);
  const row = await database.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM attendance WHERE timestamp LIKE ?',
    `${today}%`,
  );

  return row?.count ?? 0;
}

function rowToEmployee(row: EmployeeRow): Employee | null {
  try {
    const embedding = JSON.parse(row.embedding);

    if (!Array.isArray(embedding)) {
      return null;
    }

    return {
      employeeId: row.employeeId,
      name: row.name,
      embedding,
      faceImageUri: row.faceImageUri,
      createdAt: row.createdAt,
    };
  } catch {
    return null;
  }
}
