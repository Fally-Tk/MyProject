import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Rollcall from './pages/Rollcall';
import Timetable from './pages/Timetable';
import Reports from './pages/Reports';
import Fields from './pages/Fields';
import Students from './pages/Students';
import Settings from './pages/Settings';
import AdminManagement from './pages/AdminManagement';
import PWAInstallPrompt from './components/PWAInstallPrompt';
import { SyncService } from './utils/sync';
import { useTheme } from './hooks/useTheme';
import { APIService } from './utils/api';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  department?: string;
  employee_id?: string;
}

function App() {
  const { theme } = useTheme();
  const [user, setUser] = useState<User | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const checkExistingSession = () => {
      const storedUser = localStorage.getItem('rollcall_user_data');
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch (error) {
          console.error('Invalid stored user data');
          localStorage.removeItem('rollcall_user_data');
        }
      }
      setInitialLoading(false);
    };

    checkExistingSession();

    // Initialize sync service
    SyncService.initialize();
    SyncService.scheduleBackgroundSync();

    // Apply theme to document
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  const handleLogin = async (credentials: { email: string; password: string }) => {
    setLoginLoading(true);
    setLoginError(null);

    try {
      // Try real authentication first
      try {
        const response = await APIService.authenticateAdmin(credentials);
        if (response.success && response.user) {
          const userData: User = {
            id: response.user.id,
            name: response.user.name,
            email: response.user.email,
            role: response.user.role,
            department: response.user.department,
            employee_id: response.user.employee_id
          };

          setUser(userData);
          localStorage.setItem('rollcall_user_data', JSON.stringify(userData));
          localStorage.setItem('rollcall_auth_token', response.token);
          return;
        }
      } catch (apiError) {
        console.log('API authentication failed, trying demo credentials...');
      }

      // Fallback to demo credentials
      if (credentials.email === 'admin@university.edu' && credentials.password === 'admin123') {
        const userData: User = {
          id: '1',
          name: 'Dr. John Smith',
          email: credentials.email,
          role: 'Discipline Master',
          department: 'Computer Science',
          employee_id: 'EMP001'
        };

        setUser(userData);
        localStorage.setItem('rollcall_user_data', JSON.stringify(userData));
        localStorage.setItem('rollcall_auth_token', 'demo-token-123');
      } else {
        throw new Error('Invalid email or password');
      }
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : 'Login failed');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('rollcall_user_data');
    localStorage.removeItem('rollcall_auth_token');
  };

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-black">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <Login 
          onLogin={handleLogin} 
          loading={loginLoading} 
          error={loginError} 
        />
        <PWAInstallPrompt />
      </>
    );
  }

  return (
    <Router>
      <div className="App bg-white min-h-screen">
        <Routes>
          <Route path="/" element={<Layout user={user} onLogout={handleLogout} />}>
            <Route index element={<Dashboard />} />
            <Route path="rollcall" element={<Rollcall />} />
            <Route path="timetable" element={<Timetable />} />
            <Route path="reports" element={<Reports />} />
            <Route path="fields" element={<Fields />} />
            <Route path="students" element={<Students />} />
            <Route path="admin" element={<AdminManagement />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
        <PWAInstallPrompt />
      </div>
    </Router>
  );
}

export default App;