export const CREATE_EMPLOYEES_TABLE = `
CREATE TABLE IF NOT EXISTS employees (
  employeeId TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  embedding TEXT NOT NULL,
  faceImageUri TEXT NOT NULL,
  createdAt TEXT NOT NULL
);
`;

export const CREATE_ATTENDANCE_TABLE = `
CREATE TABLE IF NOT EXISTS attendance (
  attendanceId INTEGER PRIMARY KEY AUTOINCREMENT,
  employeeId TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  status TEXT NOT NULL,
  FOREIGN KEY (employeeId) REFERENCES employees(employeeId)
);
`;

export const CREATE_ATTENDANCE_DATE_INDEX = `
CREATE INDEX IF NOT EXISTS idx_attendance_employee_timestamp
ON attendance(employeeId, timestamp);
`;

export const ALL_TABLES = [
  CREATE_EMPLOYEES_TABLE,
  CREATE_ATTENDANCE_TABLE,
  CREATE_ATTENDANCE_DATE_INDEX,
];
