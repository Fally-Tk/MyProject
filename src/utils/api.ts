const API_BASE_URL = 'http://localhost/api_update' ;

export class APIService {
  private static async fetchWithTimeout(
    url: string,
    options: RequestInit = {},
    timeout = 5000
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  private static async handleResponse(response: Response) {
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const text = await response.text();
    try {
      return JSON.parse(text);
    } catch (parseError) {
      console.error('Invalid JSON response:', text);
      throw new Error('Invalid JSON response from server');
    }
  }

  static async getCurrentSessions() {
    const response = await this.fetchWithTimeout(`${API_BASE_URL}/get_current_sessions.php`);
    return this.handleResponse(response);
  }

  static async getTimetable() {
    const response = await this.fetchWithTimeout(`${API_BASE_URL}/get_timetable.php`);
    return this.handleResponse(response);
  }

  static async submitAttendance(attendanceData: any) {
    const response = await this.fetchWithTimeout(`${API_BASE_URL}/submit_attendance.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(attendanceData),
    });
    return this.handleResponse(response);
  }

  static async getAbsenteeReport(filters: any) {
    const params = new URLSearchParams(filters);
    const response = await this.fetchWithTimeout(
      `${API_BASE_URL}/get_absentee_report.php?${params}`
    );
    return this.handleResponse(response);
  }

  static async getDashboardStats() {
    const response = await this.fetchWithTimeout(`${API_BASE_URL}/get_dashboard_stats.php`);
    return this.handleResponse(response);
  }

  static async getStudents() {
    const response = await this.fetchWithTimeout(`${API_BASE_URL}/get_students.php`);
    return this.handleResponse(response);
  }

  static async getFields() {
    const response = await this.fetchWithTimeout(`${API_BASE_URL}/get_fields.php`);
    return this.handleResponse(response);
  }

  // NEW METHOD: Get student absentee hours from database
  static async getStudentAbsenteeHours() {
    const response = await this.fetchWithTimeout(`${API_BASE_URL}/get_student_absentee_hours.php`);
    return this.handleResponse(response);
  }

  static async addStudent(studentData: any) {
    const response = await this.fetchWithTimeout(`${API_BASE_URL}/add_student.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(studentData),
    });
    return this.handleResponse(response);
  }

  static async updateStudent(studentData: any) {
    const response = await this.fetchWithTimeout(`${API_BASE_URL}/update_student.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(studentData),
    });
    return this.handleResponse(response);
  }

  static async deleteStudent(studentId: string) {
    const response = await this.fetchWithTimeout(`${API_BASE_URL}/delete_student.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id: studentId }),
    });
    return this.handleResponse(response);
  }

  static async addField(fieldData: any) {
    const response = await this.fetchWithTimeout(`${API_BASE_URL}/add_field.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(fieldData),
    });
    return this.handleResponse(response);
  }

  static async updateField(fieldData: any) {
    const response = await this.fetchWithTimeout(`${API_BASE_URL}/update_field.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(fieldData),
    });
    return this.handleResponse(response);
  }

  static async deleteField(fieldId: string) {
    const response = await this.fetchWithTimeout(`${API_BASE_URL}/delete_field.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id: fieldId }),
    });
    return this.handleResponse(response);
  }

  static async addTimetableEntry(entryData: any) {
    const response = await this.fetchWithTimeout(`${API_BASE_URL}/add_timetable_entry.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(entryData),
    });
    return this.handleResponse(response);
  }

  static async updateTimetableEntry(entryData: any) {
    const response = await this.fetchWithTimeout(`${API_BASE_URL}/update_timetable_entry.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(entryData),
    });
    return this.handleResponse(response);
  }

  static async deleteTimetableEntry(entryId: string) {
    const response = await this.fetchWithTimeout(`${API_BASE_URL}/delete_timetable_entry.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id: entryId }),
    });
    return this.handleResponse(response);
  }

  // Admin Management APIs
  static async getAdminUsers() {
    const response = await this.fetchWithTimeout(`${API_BASE_URL}/get_admin_users.php`);
    return this.handleResponse(response);
  }

  static async addAdminUser(adminData: any) {
    const response = await this.fetchWithTimeout(`${API_BASE_URL}/add_admin_user.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(adminData),
    });
    return this.handleResponse(response);
  }

  static async updateAdminUser(adminData: any) {
    const response = await this.fetchWithTimeout(`${API_BASE_URL}/update_admin_user.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(adminData),
    });
    return this.handleResponse(response);
  }

  static async deleteAdminUser(adminId: string) {
    const response = await this.fetchWithTimeout(`${API_BASE_URL}/delete_admin_user.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id: adminId }),
    });
    return this.handleResponse(response);
  }

  static async authenticateAdmin(credentials: { email: string; password: string }) {
    const response = await this.fetchWithTimeout(`${API_BASE_URL}/authenticate_admin.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });
    return this.handleResponse(response);
  }
}