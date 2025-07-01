import React, { useState, useEffect } from 'react';
import { Clock, User, AlertTriangle, Calendar, BookOpen, Search, X } from 'lucide-react';
import { APIService } from '../utils/api';
import { LocalDBService } from '../utils/localdb';
import type { Student } from '../types';

interface StudentAbsenteeHours {
  studentId: string;
  studentName: string;
  matricule: string;
  field: string;
  level: string;
  totalAbsentHours: number;
  absentSessions: Array<{
    date: string;
    course: string;
    courseCode: string;
    duration: number;
    timeSlot: string;
  }>;
}

interface StudentAbsenteeHoursProps {
  students: Student[];
}

export default function StudentAbsenteeHours({ students }: StudentAbsenteeHoursProps) {
  const [absenteeHours, setAbsenteeHours] = useState<StudentAbsenteeHours[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedField, setSelectedField] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [searchResult, setSearchResult] = useState<StudentAbsenteeHours | null>(null);
  const [showSearchResult, setShowSearchResult] = useState(false);

  useEffect(() => {
    loadAbsenteeHours();
  }, [students]);

  const loadAbsenteeHours = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get absentee data from the database
      const absenteeData = await APIService.getStudentAbsenteeHours();
      
      // Process the data to calculate hours for each student
      const hoursData: StudentAbsenteeHours[] = students.map(student => {
        // Find all absentee records for this student
        const studentAbsences = absenteeData.filter((record: any) => 
          record.studentId === student.id || record.matricule === student.matricule
        );

        // Calculate total hours and sessions
        const absentSessions = studentAbsences.map((absence: any) => ({
          date: absence.date,
          course: absence.courseTitle,
          courseCode: absence.courseCode,
          duration: calculateSessionDuration(absence.timeSlot),
          timeSlot: absence.timeSlot
        }));

        const totalAbsentHours = absentSessions.reduce((sum, session) => sum + session.duration, 0);

        return {
          studentId: student.id,
          studentName: student.name,
          matricule: student.matricule,
          field: student.field,
          level: student.level,
          totalAbsentHours,
          absentSessions
        };
      });

      setAbsenteeHours(hoursData);
      
      // Cache the processed data
      LocalDBService.cacheData('rollcall_cached_absentee_hours', hoursData);

    } catch (error) {
      console.error('Failed to load absentee hours:', error);
      setError('Failed to load absentee hours data. Please try again.');
      
      // Try to load from cache as fallback
      const cachedData = LocalDBService.getCachedData('rollcall_cached_absentee_hours');
      if (cachedData) {
        setAbsenteeHours(cachedData);
      }
    } finally {
      setLoading(false);
    }
  };

  const calculateSessionDuration = (timeSlot: string): number => {
    if (!timeSlot) return 2; // Default 2 hours
    
    try {
      const [startTime, endTime] = timeSlot.split(' - ');
      const start = new Date(`2000-01-01 ${startTime}`);
      const end = new Date(`2000-01-01 ${endTime}`);
      const diffInMs = end.getTime() - start.getTime();
      const diffInHours = diffInMs / (1000 * 60 * 60);
      return Math.max(diffInHours, 1); // Minimum 1 hour
    } catch (error) {
      console.error('Error calculating session duration:', error);
      return 2; // Default 2 hours
    }
  };

  const handleSearch = () => {
    if (!searchTerm.trim()) {
      setError('Please enter a student name or matricule to search');
      return;
    }

    const searchTermLower = searchTerm.toLowerCase().trim();
    const foundStudent = absenteeHours.find(student => 
      student.studentName.toLowerCase().includes(searchTermLower) ||
      student.matricule.toLowerCase().includes(searchTermLower)
    );

    if (foundStudent) {
      setSearchResult(foundStudent);
      setShowSearchResult(true);
      setError(null);
    } else {
      setError(`No student found with name or matricule containing "${searchTerm}"`);
      setSearchResult(null);
      setShowSearchResult(false);
    }
  };

  const clearSearch = () => {
    setSearchTerm('');
    setSearchResult(null);
    setShowSearchResult(false);
    setError(null);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const getFilteredData = () => {
    if (!selectedField) return absenteeHours;
    return absenteeHours.filter(data => data.field === selectedField);
  };

  const getUniqueFields = () => {
    return [...new Set(absenteeHours.map(data => data.field))];
  };

  const getHighRiskStudents = () => {
    return absenteeHours.filter(data => data.totalAbsentHours >= 10);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-black">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-black">Loading absentee hours...</p>
        </div>
      </div>
    );
  }

  if (error && !absenteeHours.length) {
    return (
      <div className="bg-red-50 border-2 border-red-600 rounded-xl p-6">
        <div className="flex items-center space-x-2 mb-2">
          <AlertTriangle className="w-5 h-5 text-red-600" />
          <h3 className="font-bold text-red-600">Error Loading Data</h3>
        </div>
        <p className="text-red-600 text-sm mb-4">{error}</p>
        <button
          onClick={loadAbsenteeHours}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  const filteredData = getFilteredData();
  const highRiskStudents = getHighRiskStudents();

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="bg-blue-600 rounded-xl p-6 text-white">
        <h2 className="text-xl font-bold mb-4">Student Absentee Hours</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white bg-opacity-20 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5" />
              <span className="text-sm font-medium">Total Students</span>
            </div>
            <div className="text-2xl font-bold mt-1">{absenteeHours.length}</div>
          </div>
          
          <div className="bg-white bg-opacity-20 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5" />
              <span className="text-sm font-medium">High Risk (≥10h)</span>
            </div>
            <div className="text-2xl font-bold mt-1">{highRiskStudents.length}</div>
          </div>
          
          <div className="bg-white bg-opacity-20 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <User className="w-5 h-5" />
              <span className="text-sm font-medium">Avg Hours/Student</span>
            </div>
            <div className="text-2xl font-bold mt-1">
              {absenteeHours.length > 0 
                ? Math.round(absenteeHours.reduce((sum, data) => sum + data.totalAbsentHours, 0) / absenteeHours.length)
                : 0
              }h
            </div>
          </div>
        </div>
      </div>

      {/* Student Search */}
      <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-black">
        <h3 className="text-lg font-medium text-black mb-4">Search Student Absentee Hours</h3>
        
        <div className="flex items-center space-x-4 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by student name or matricule..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={handleKeyPress}
              className="w-full pl-10 pr-4 py-3 border-2 border-black rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 text-black"
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={!searchTerm.trim()}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            Search
          </button>
          {(searchResult || showSearchResult) && (
            <button
              onClick={clearSearch}
              className="px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {/* Search Result */}
        {showSearchResult && searchResult && (
          <div className="bg-blue-50 border-2 border-blue-600 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-bold text-black">Search Result</h4>
              <button
                onClick={clearSearch}
                className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Student Info */}
              <div>
                <div className="space-y-3">
                  <div>
                    <span className="text-sm font-medium text-gray-600">Student Name:</span>
                    <p className="text-lg font-bold text-black">{searchResult.studentName}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Matricule:</span>
                    <p className="text-black font-medium">{searchResult.matricule}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Field & Level:</span>
                    <p className="text-black">{searchResult.field} - {searchResult.level}</p>
                  </div>
                </div>
              </div>

              {/* Absentee Stats */}
              <div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-blue-600 mb-2">
                    {searchResult.totalAbsentHours}h
                  </div>
                  <p className="text-sm text-gray-600 mb-4">Total Absentee Hours</p>
                  
                  <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                    searchResult.totalAbsentHours >= 15 
                      ? 'bg-red-600 text-white'
                      : searchResult.totalAbsentHours >= 10
                      ? 'bg-red-100 text-red-600'
                      : searchResult.totalAbsentHours >= 5
                      ? 'bg-yellow-100 text-yellow-600'
                      : 'bg-green-100 text-green-600'
                  }`}>
                    {searchResult.totalAbsentHours >= 15 
                      ? 'Critical Risk'
                      : searchResult.totalAbsentHours >= 10
                      ? 'High Risk'
                      : searchResult.totalAbsentHours >= 5
                      ? 'Medium Risk'
                      : searchResult.totalAbsentHours === 0
                      ? 'Perfect Attendance'
                      : 'Low Risk'
                    }
                  </span>
                </div>
              </div>
            </div>

            {/* Absent Sessions */}
            {searchResult.absentSessions.length > 0 && (
              <div className="mt-6">
                <h5 className="text-md font-semibold text-black mb-3">Absent Sessions ({searchResult.absentSessions.length})</h5>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {searchResult.absentSessions.map((session, index) => (
                    <div key={index} className="bg-white border border-gray-200 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <BookOpen className="w-4 h-4 text-blue-600" />
                          <span className="font-medium text-black">{session.course}</span>
                          <span className="text-sm text-gray-500">({session.courseCode})</span>
                        </div>
                        <div className="flex items-center space-x-3 text-sm text-gray-600">
                          <div className="flex items-center space-x-1">
                            <Clock className="w-3 h-3" />
                            <span>{session.duration}h</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-3 h-3" />
                            <span>{new Date(session.date).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500 mt-1 ml-7">
                        Time: {session.timeSlot}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {searchResult.absentSessions.length === 0 && (
              <div className="mt-6 text-center">
                <div className="bg-green-100 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center justify-center space-x-2">
                    <User className="w-5 h-5 text-green-600" />
                    <span className="text-green-600 font-medium">Perfect Attendance!</span>
                  </div>
                  <p className="text-green-600 text-sm mt-1">This student has not missed any classes.</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Field Filter */}
      <div className="bg-white rounded-xl p-4 shadow-lg border-2 border-black">
        <div className="flex items-center space-x-4">
          <label className="text-sm font-medium text-black">Filter by Field:</label>
          <select
            value={selectedField}
            onChange={(e) => setSelectedField(e.target.value)}
            className="px-3 py-2 border-2 border-black rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 text-black"
          >
            <option value="">All Fields</option>
            {getUniqueFields().map(field => (
              <option key={field} value={field}>{field}</option>
            ))}
          </select>
        </div>
      </div>

      {/* High Risk Alert */}
      {highRiskStudents.length > 0 && (
        <div className="bg-red-50 border-2 border-red-600 rounded-xl p-4">
          <div className="flex items-center space-x-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <h3 className="font-bold text-red-600">High Risk Students</h3>
          </div>
          <p className="text-red-600 text-sm">
            {highRiskStudents.length} students have 10+ hours of absence and require immediate attention.
          </p>
        </div>
      )}

      {/* Students Table */}
      <div className="bg-white rounded-xl shadow-lg border-2 border-black overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-blue-600 text-white">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Student
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Field & Level
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Total Absent Hours
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Risk Level
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Recent Absences
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y-2 divide-black">
              {filteredData.map((data) => (
                <tr key={data.studentId} className="hover:bg-blue-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-black">{data.studentName}</div>
                      <div className="text-sm text-black">{data.matricule}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-black">{data.field}</div>
                    <div className="text-sm text-black">{data.level}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-black" />
                      <span className="text-sm font-bold text-black">{data.totalAbsentHours}h</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      data.totalAbsentHours >= 15 
                        ? 'bg-red-600 text-white'
                        : data.totalAbsentHours >= 10
                        ? 'bg-red-100 text-red-600'
                        : data.totalAbsentHours >= 5
                        ? 'bg-yellow-100 text-yellow-600'
                        : 'bg-green-100 text-green-600'
                    }`}>
                      {data.totalAbsentHours >= 15 
                        ? 'Critical'
                        : data.totalAbsentHours >= 10
                        ? 'High'
                        : data.totalAbsentHours >= 5
                        ? 'Medium'
                        : data.totalAbsentHours === 0
                        ? 'Perfect'
                        : 'Low'
                      }
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-black">
                      {data.absentSessions.slice(0, 2).map((session, index) => (
                        <div key={index} className="mb-1 flex items-center space-x-2">
                          <BookOpen className="w-3 h-3" />
                          <span>{session.course} ({session.duration}h)</span>
                          <Calendar className="w-3 h-3" />
                          <span>{new Date(session.date).toLocaleDateString()}</span>
                        </div>
                      ))}
                      {data.absentSessions.length > 2 && (
                        <div className="text-blue-600 font-medium">
                          +{data.absentSessions.length - 2} more sessions
                        </div>
                      )}
                      {data.absentSessions.length === 0 && (
                        <div className="text-green-600 font-medium">
                          Perfect attendance!
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredData.length === 0 && (
        <div className="text-center py-8">
          <User className="w-16 h-16 text-black mx-auto mb-4" />
          <h3 className="text-lg font-medium text-black mb-2">No data available</h3>
          <p className="text-black">No absentee hours data found for the selected criteria.</p>
        </div>
      )}
    </div>
  );
}