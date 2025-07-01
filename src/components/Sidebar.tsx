import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, ClipboardList, FileText, Calendar, Users, Settings, LogOut, User, BookOpen, Shield } from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
  onProfileClick: () => void;
  user: User;
}

export default function Sidebar({ isOpen, onClose, onLogout, onProfileClick, user }: SidebarProps) {
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Dashboard', icon: Home },
    { path: '/rollcall', label: 'Rollcall', icon: ClipboardList },
    { path: '/timetable', label: 'Timetable', icon: Calendar },
    { path: '/reports', label: 'Reports', icon: FileText },
    { path: '/fields', label: 'Fields', icon: BookOpen },
    { path: '/students', label: 'Students', icon: Users },
    { path: '/admin', label: 'Admin Management', icon: Shield },
    { path: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed left-0 top-0 h-full w-64 bg-blue-600 text-white transform transition-transform duration-300 ease-in-out z-50 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0`}>
        
        {/* Header */}
        <div className="p-6 border-b-2 border-blue-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
            <img src="/public/ime.jpg" alt="IME LOGO" 
                className="h-9 w-9 md:h-12 md:w-12 lg:h-17 lg:w-17 rounded-full object-contain "/>
            </div>
            <div>
              <h1 className="text-lg font-bold">IME Rollcall</h1>
              <p className="text-blue-100 text-sm">Management System</p>
            </div>
          </div>
        </div>

        {/* User Info */}
        <div className="p-4 border-b-2 border-blue-700">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium">{user.name}</p>
              <p className="text-xs text-blue-100">{user.role}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {navItems.map(({ path, label, icon: Icon }) => {
              const isActive = location.pathname === path;
              return (
                <li key={path}>
                  <Link
                    to={path}
                    onClick={onClose}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                      isActive
                        ? 'bg-white text-blue-600 shadow-lg font-medium'
                        : 'text-blue-100 hover:bg-blue-700 hover:text-white'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User Actions */}
        <div className="p-4 border-t-2 border-blue-700">
          <div className="space-y-2">
            <button
              onClick={onProfileClick}
              className="w-full flex items-center space-x-3 px-4 py-3 text-blue-100 hover:bg-blue-700 hover:text-white rounded-lg transition-all duration-200"
            >
              <User className="w-5 h-5" />
              <span className="font-medium">Profile</span>
            </button>
            <button
              onClick={onLogout}
              className="w-full flex items-center space-x-3 px-4 py-3 text-red-200 hover:bg-red-600 hover:text-white rounded-lg transition-all duration-200"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}