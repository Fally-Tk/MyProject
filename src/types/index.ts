export interface Student {
  id: string;
  name: string;
  matricule: string;
  field: string;
  level: string;
  parentPhone: string;
  parentName: string;
  parentEmail?: string;
  photo?: string;
  isPresent?: boolean;
}

export interface Field {
  id: string;
  name: string;
  code: string;
  description?: string;
  totalStudents: number;
  levels: string[];
}

export interface Course {
  id: string;
  title: string;
  code: string;
  fieldId: string;
  level: string;
  lecturer: string;
}

export interface TimeSlot {
  id: string;
  startTime: string;
  endTime: string;
  day: string;
  courseId: string;
  room: string;
  fieldId: string;
  level: string;
}

export interface Session {
  id: string;
  courseTitle: string;
  courseCode: string;
  fieldName: string;
  level: string;
  room: string;
  startTime: string;
  endTime: string;
  day: string;
  lecturer: string;
  students: Student[];
}

export interface AbsenteeRecord {
  id: string;
  studentName: string;
  matricule: string;
  fieldName: string;
  level: string;
  courseTitle: string;
  courseCode: string;
  parentPhone: string;
  parentName: string;
  parentEmail?: string;
  date: string;
  sessionId: string;
}

export interface AttendanceRecord {
  sessionId: string;
  studentId: string;
  isPresent: boolean;
  timestamp: string;
  synced: boolean;
}

export interface SyncStatus {
  lastSync: string | null;
  pendingCount: number;
  isOnline: boolean;
  isSyncing: boolean;
}

export interface DashboardStats {
  totalStudents: number;
  totalFields: number;
  todayAbsentees: number;
  weeklyAbsentees: number;
  monthlyAbsentees: number;
  fieldStats: FieldStats[];
  topAbsenteeFields: TopAbsenteeField[];
}

export interface FieldStats {
  fieldId: string;
  fieldName: string;
  totalStudents: number;
  presentToday: number;
  absentToday: number;
  attendanceRate: number;
}

export interface TopAbsenteeField {
  fieldName: string;
  absenteeCount: number;
  totalStudents: number;
  absenteeRate: number;
}

export interface TimetableEntry {
  id: string;
  day: string;
  timeSlot: string;
  course: string;
  field: string;
  level: string;
  room: string;
  lecturer: string;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  department: string;
  role: string;
  employee_id: string;
  created_at: string;
}