import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Clock, Users, MapPin, Phone, MessageCircle, Filter, Eye, Calendar, BookOpen, X, Ban, ArrowRight } from 'lucide-react';
import { APIService } from '../utils/api';
import { LocalDBService } from '../utils/localdb';
import { SyncService } from '../utils/sync';
import type { Session, Student, AttendanceRecord, AbsenteeRecord } from '../types';

export default function Rollcall() {
  const [availableSessions, setAvailableSessions] = useState<Session[]>([]);
  const [completedSessions, setCompletedSessions] = useState<string[]>([]);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [absentees, setAbsentees] = useState<AbsenteeRecord[]>([]);
  const [showAbsentees, setShowAbsentees] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [selectedField, setSelectedField] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedAbsenteeGroup, setSelectedAbsenteeGroup] = useState<any>(null);

  useEffect(() => {
    loadAvailableSessions();
    loadCompletedSessions();
  }, []);

  const loadAvailableSessions = async () => {
    try {
      setLoading(true);
      setError(null);

      const sessionData = await APIService.getCurrentSessions();
      setAvailableSessions(sessionData || []);

    } catch (error) {
      console.error('Failed to load available sessions:', error);
      setError('Failed to load available sessions. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadCompletedSessions = () => {
    const completed = LocalDBService.getCachedData('rollcall_completed_sessions') || [];
    setCompletedSessions(completed);
  };

  const markSessionAsCompleted = (sessionId: string) => {
    const completed = [...completedSessions, sessionId];
    setCompletedSessions(completed);
    LocalDBService.cacheData('rollcall_completed_sessions', completed);
  };

  const isSessionCompleted = (sessionId: string) => {
    return completedSessions.includes(sessionId);
  };

  const handleSessionSelect = (session: Session) => {
    if (isSessionCompleted(session.id)) {
      setError('This session has already been completed for this field.');
      return;
    }

    setSelectedSession(session);
    setStudents(session.students.map(student => ({ ...student, isPresent: undefined })));
    setShowAbsentees(false);
    setAbsentees([]);
    setError(null);
  };

  const handleToggleStudentPresence = (studentId: string, isPresent: boolean) => {
    setStudents(prev => prev.map(student => 
      student.id === studentId 
        ? { ...student, isPresent }
        : student
    ));
  };

  const generateSMSMessage = (studentName: string, parentName: string, fieldName: string, courseTitle: string, timeSlot: string) => {
    return `Hello ${parentName},

Greetings from IME Business and Engineering School.

We would like to inform you that your child ${studentName} from ${fieldName} was absent from ${courseTitle} class today at ${timeSlot}.

Please ensure regular attendance for better academic performance.

Best regards,
IME Discipline Master`;
  };

  const handleSubmitAttendance = async () => {
    if (!selectedSession) return;

    const attendanceRecords = students
      .filter(student => student.isPresent !== undefined)
      .map(student => ({
        sessionId: selectedSession.id,
        studentId: student.id,
        isPresent: student.isPresent!,
        timestamp: new Date().toISOString(),
        synced: false,
      }));

    if (attendanceRecords.length === 0) {
      setError('Please mark attendance for at least one student.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // Submit attendance records
      if (navigator.onLine) {
        try {
          for (const record of attendanceRecords) {
            await APIService.submitAttendance({
              session_id: record.sessionId,
              student_id: record.studentId,
              is_present: record.isPresent,
              timestamp: record.timestamp,
            });
          }
          setSuccessMessage('Attendance submitted successfully!');
        } catch (apiError) {
          attendanceRecords.forEach(record => {
            LocalDBService.saveAttendanceToQueue(record);
          });
          setSuccessMessage('Attendance saved offline. Will sync when connection is restored.');
        }
      } else {
        attendanceRecords.forEach(record => {
          LocalDBService.saveAttendanceToQueue(record);
        });
        setSuccessMessage('Attendance saved offline. Will sync when connection is restored.');
      }

      // Generate absentee list
      const absentStudents = students.filter(student => student.isPresent === false);
      const absenteeRecords: AbsenteeRecord[] = absentStudents.map(student => ({
        id: `${selectedSession.id}-${student.id}`,
        studentName: student.name,
        matricule: student.matricule,
        fieldName: student.field,
        level: student.level,
        courseTitle: selectedSession.courseTitle,
        courseCode: selectedSession.courseCode,
        parentPhone: student.parentPhone,
        parentName: student.parentName,
        parentEmail: student.parentEmail,
        date: new Date().toISOString(),
        sessionId: selectedSession.id,
      }));

      // Save absentees to reports
      if (absenteeRecords.length > 0) {
        const existingAbsentees = LocalDBService.getCachedData('rollcall_absentee_records') || [];
        const updatedAbsentees = [...existingAbsentees, ...absenteeRecords];
        LocalDBService.cacheData('rollcall_absentee_records', updatedAbsentees);
      }

      setAbsentees(absenteeRecords);

      // Mark session as completed
      markSessionAsCompleted(selectedSession.id);

      // Remove the session from available sessions
      setAvailableSessions(prev => prev.filter(session => session.id !== selectedSession.id));
      
      // Show absentee summary if there are absentees
      if (absenteeRecords.length > 0) {
        setShowAbsentees(true);
      } else {
        // If no absentees, show success and go back to sessions
        setTimeout(() => {
          setSelectedSession(null);
          setSuccessMessage(null);
        }, 3000);
      }

      // Clear success message after 5 seconds
      setTimeout(() => setSuccessMessage(null), 5000);

    } catch (error) {
      console.error('Failed to submit attendance:', error);
      setError('Failed to submit attendance. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCallParent = (phoneNumber: string) => {
    navigator.clipboard.writeText(phoneNumber).catch(console.error);
    window.location.href = `tel:${phoneNumber}`;
  };

  const handleSendSMS = (phoneNumber: string, studentName: string, parentName: string, fieldName: string) => {
    if (!selectedSession && !selectedAbsenteeGroup) return;
    
    const courseTitle = selectedSession?.courseTitle || selectedAbsenteeGroup?.courseTitle;
    const timeSlot = selectedSession ? `${selectedSession.startTime} - ${selectedSession.endTime}` : 'today';
    
    const message = generateSMSMessage(
      studentName, 
      parentName, 
      fieldName, 
      courseTitle, 
      timeSlot
    );
    
    const encodedMessage = encodeURIComponent(message);
    window.location.href = `sms:${phoneNumber}?body=${encodedMessage}`;
  };

  // Get unique fields from available sessions
  const getAvailableFields = () => {
    const fields = [...new Set(availableSessions.flatMap(session => 
      session.fieldName.includes(',') 
        ? session.fieldName.split(',').map(f => f.trim())
        : [session.fieldName]
    ))];
    return fields;
  };

  // Filter sessions by selected field and exclude completed ones
  const getFilteredSessions = () => {
    let filtered = availableSessions;
    
    if (selectedField) {
      filtered = filtered.filter(session => 
        session.fieldName.includes(selectedField)
      );
    }
    
    // Exclude completed sessions
    filtered = filtered.filter(session => !isSessionCompleted(session.id));
    
    return filtered;
  };

  // Group absentees by field and course
  const getAbsenteeGroups = () => {
    const groups = absentees.reduce((acc, absentee) => {
      const key = `${absentee.fieldName}-${absentee.courseTitle}`;
      if (!acc[key]) {
        acc[key] = {
          fieldName: absentee.fieldName,
          courseTitle: absentee.courseTitle,
          courseCode: absentee.courseCode,
          date: absentee.date,
          absentees: []
        };
      }
      acc[key].absentees.push(absentee);
      return acc;
    }, {} as Record<string, any>);

    return Object.values(groups);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500 dark:text-gray-400">Loading available sessions...</p>
        </div>
      </div>
    );
  }

  if (error && availableSessions.length === 0) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Unable to Load Sessions
        </h2>
        <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
          {error}
        </p>
        <button
          onClick={loadAvailableSessions}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  // Show absentee groups after attendance submission
  if (showAbsentees && absentees.length > 0) {
    const absenteeGroups = getAbsenteeGroups();

    if (selectedAbsenteeGroup) {
      return (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Absentee Details - {selectedAbsenteeGroup.courseTitle}
              </h1>
              <p className="text-gray-500 dark:text-gray-400 mt-1">
                {selectedAbsenteeGroup.absentees.length} students absent from {selectedAbsenteeGroup.fieldName}
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setSelectedAbsenteeGroup(null)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                ← Back to Summary
              </button>
              <button
                onClick={() => {
                  setShowAbsentees(false);
                  setSelectedSession(null);
                  setAbsentees([]);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Back to Sessions
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Student
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Field & Level
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Parent Contact
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {selectedAbsenteeGroup.absentees.map((record: any) => (
                    <tr key={record.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {record.studentName}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {record.matricule}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {record.fieldName}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {record.level}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {record.parentName}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {record.parentPhone}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleCallParent(record.parentPhone)}
                            className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                            title="Call Parent"
                          >
                            <Phone className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          </button>
                          <button
                            onClick={() => handleSendSMS(record.parentPhone, record.studentName, record.parentName, record.fieldName)}
                            className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100 dark:bg-green-900 hover:bg-green-200 dark:hover:bg-green-800 transition-colors"
                            title="Send SMS"
                          >
                            <MessageCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Absentee Summary
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              {absentees.length} total students absent from {absenteeGroups.length} courses
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => window.location.href = '/reports'}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <ArrowRight className="w-4 h-4" />
              <span>View in Reports</span>
            </button>
            <button
              onClick={() => {
                setShowAbsentees(false);
                setSelectedSession(null);
                setAbsentees([]);
              }}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Back to Sessions
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {absenteeGroups.map((group, index) => (
            <div key={index} className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {group.fieldName}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {group.courseTitle} ({group.courseCode})
                  </p>
                </div>
                <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full dark:bg-red-900 dark:text-red-200">
                  {group.absentees.length} absent
                </span>
              </div>
              
              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400 mb-4">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(group.date).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4" />
                  <span>{group.absentees.length} students absent</span>
                </div>
              </div>
              
              <button
                onClick={() => setSelectedAbsenteeGroup(group)}
                className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Eye className="w-4 h-4" />
                <span>View Student Info</span>
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const markedCount = students.filter(s => s.isPresent !== undefined).length;
  const presentCount = students.filter(s => s.isPresent === true).length;
  const absentCount = students.filter(s => s.isPresent === false).length;
  const filteredSessions = getFilteredSessions();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Rollcall Management
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Select a session to take attendance (one-time per field per session)
        </p>
      </div>

      {/* Success/Error Messages */}
      {successMessage && (
        <div className="bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-700 rounded-lg p-4">
          <div className="flex items-center">
            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mr-3" />
            <p className="text-green-800 dark:text-green-200">{successMessage}</p>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mr-3" />
            <p className="text-red-800 dark:text-red-200">{error}</p>
          </div>
        </div>
      )}

      {/* Field Filter */}
      {!selectedSession && availableSessions.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Filter className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Filter by Field:
              </label>
              <select
                value={selectedField}
                onChange={(e) => setSelectedField(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="">All Fields</option>
                {getAvailableFields().map(field => (
                  <option key={field} value={field}>{field}</option>
                ))}
              </select>
              {selectedField && (
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Showing {filteredSessions.length} sessions for {selectedField}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Available Sessions */}
      {!selectedSession && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Current Sessions ({filteredSessions.length})
          </h3>
          {filteredSessions.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-8 text-center border border-gray-200 dark:border-gray-700">
              <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">
                {selectedField 
                  ? `No active sessions for ${selectedField} at this time.`
                  : 'No active sessions at this time.'
                }
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredSessions.map((session) => {
                const isCompleted = isSessionCompleted(session.id);
                return (
                  <div
                    key={session.id}
                    className={`bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700 transition-all ${
                      isCompleted 
                        ? 'opacity-50 cursor-not-allowed' 
                        : 'hover:border-blue-500 hover:shadow-md cursor-pointer'
                    }`}
                    onClick={() => !isCompleted && handleSessionSelect(session)}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {session.courseTitle}
                        </h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {session.courseCode}
                        </p>
                      </div>
                      <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${
                        isCompleted
                          ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                      }`}>
                        {isCompleted ? 'Completed' : 'Active'}
                      </span>
                    </div>
                    
                    <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center space-x-2">
                        <Users className="w-4 h-4" />
                        <span>{session.fieldName} - {session.level}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4" />
                        <span>{session.startTime} - {session.endTime}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4" />
                        <span>{session.room}</span>
                      </div>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {session.students.length} students
                        </span>
                        {isCompleted ? (
                          <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                            <Ban className="w-4 h-4" />
                            <span>Already Completed</span>
                          </div>
                        ) : (
                          <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                            Take Attendance →
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Selected Session Attendance */}
      {selectedSession && (
        <div className="space-y-6">
          {/* Session Info */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  {selectedSession.courseTitle} ({selectedSession.courseCode})
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  {selectedSession.fieldName} - {selectedSession.level} • {selectedSession.room}
                </p>
              </div>
              <button
                onClick={() => setSelectedSession(null)}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              >
                ← Back to Sessions
              </button>
            </div>

            {/* Attendance Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {students.length}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Total Students</div>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {presentCount}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Present</div>
              </div>
              <div className="bg-red-50 dark:bg-red-900 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {absentCount}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Absent</div>
              </div>
              <div className="bg-yellow-50 dark:bg-yellow-900 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                  {students.length - markedCount}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Unmarked</div>
              </div>
            </div>
          </div>

          {/* Student List */}
          <div className="space-y-4">
            <h4 className="text-lg font-medium text-gray-900 dark:text-white">
              Mark Attendance
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {students.map(student => (
                <div key={student.id} className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center space-x-4 mb-4">
                    <img
                      src={student.photo || 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop'}
                      alt={student.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div className="flex-1">
                      <h5 className="font-medium text-gray-900 dark:text-white">
                        {student.name}
                      </h5>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {student.matricule}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        {student.field}
                      </p>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleToggleStudentPresence(student.id, true)}
                      className={`flex-1 px-3 py-2 rounded-lg font-medium text-sm transition-colors ${
                        student.isPresent === true
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-gray-600'
                      }`}
                    >
                      Present
                    </button>
                    <button
                      onClick={() => handleToggleStudentPresence(student.id, false)}
                      className={`flex-1 px-3 py-2 rounded-lg font-medium text-sm transition-colors ${
                        student.isPresent === false
                          ? 'bg-red-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-gray-600'
                      }`}
                    >
                      Absent
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-center pt-6">
            <button
              onClick={handleSubmitAttendance}
              disabled={submitting || markedCount === 0}
              className="flex items-center space-x-2 px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {submitting && <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>}
              <span>
                {submitting 
                  ? 'Submitting...' 
                  : `Submit Attendance (${markedCount}/${students.length})`
                }
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}