import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Save, X, User, Mail, Phone, Building, Shield, Eye, EyeOff } from 'lucide-react';
import { APIService } from '../utils/api';
import { LocalDBService } from '../utils/localdb';

interface AdminUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  department: string;
  role: string;
  employee_id: string;
  created_at: string;
}

export default function AdminManagement() {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    department: '',
    role: 'Discipline Master',
    employee_id: '',
    password: ''
  });

  useEffect(() => {
    loadAdmins();
  }, []);

  const loadAdmins = async () => {
    try {
      setLoading(true);
      setError(null);

      const adminsData = await APIService.getAdminUsers();
      setAdmins(adminsData || []);
      LocalDBService.cacheData('rollcall_cached_admins', adminsData);

    } catch (error) {
      console.error('Failed to load admin users:', error);
      setError('Failed to load admin users.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddAdmin = () => {
    setShowAddForm(true);
    setEditingAdmin(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      department: '',
      role: 'Discipline Master',
      employee_id: '',
      password: ''
    });
    setError(null);
  };

  const handleEditAdmin = (admin: AdminUser) => {
    setEditingAdmin(admin);
    setShowAddForm(true);
    setFormData({
      name: admin.name,
      email: admin.email,
      phone: admin.phone || '',
      department: admin.department,
      role: admin.role,
      employee_id: admin.employee_id,
      password: ''
    });
    setError(null);
  };

  const handleSaveAdmin = async () => {
    if (!formData.name || !formData.email || !formData.department || !formData.employee_id) {
      setError('Please fill in all required fields.');
      return;
    }

    if (!editingAdmin && !formData.password) {
      setError('Password is required for new admin users.');
      return;
    }

    const existingAdmin = admins.find(admin => 
      (admin.email === formData.email || admin.employee_id === formData.employee_id) && 
      admin.id !== editingAdmin?.id
    );

    if (existingAdmin) {
      setError('An admin with this email or employee ID already exists.');
      return;
    }

    try {
      const adminData = {
        ...formData,
        id: editingAdmin?.id || Date.now().toString()
      };

      if (editingAdmin) {
        await APIService.updateAdminUser(adminData);
        setAdmins(prev => prev.map(admin => 
          admin.id === editingAdmin.id ? { ...adminData, created_at: admin.created_at } : admin
        ));
      } else {
        await APIService.addAdminUser(adminData);
        const newAdmin = { ...adminData, created_at: new Date().toISOString() };
        setAdmins(prev => [...prev, newAdmin]);
      }

      setShowAddForm(false);
      setEditingAdmin(null);
      setFormData({
        name: '',
        email: '',
        phone: '',
        department: '',
        role: 'Discipline Master',
        employee_id: '',
        password: ''
      });
      setError(null);

    } catch (error) {
      console.error('Failed to save admin:', error);
      setError('Failed to save admin user.');
    }
  };

  const handleDeleteAdmin = async (adminId: string) => {
    if (admins.length <= 1) {
      setError('Cannot delete the last admin user.');
      return;
    }

    if (!confirm('Are you sure you want to delete this admin user? This action cannot be undone.')) {
      return;
    }

    try {
      await APIService.deleteAdminUser(adminId);
      setAdmins(prev => prev.filter(admin => admin.id !== adminId));
    } catch (error) {
      console.error('Failed to delete admin:', error);
      setError('Failed to delete admin user.');
    }
  };

  const handleCancel = () => {
    setShowAddForm(false);
    setEditingAdmin(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      department: '',
      role: 'Discipline Master',
      employee_id: '',
      password: ''
    });
    setError(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-500 dark:text-gray-400">Loading admin users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-purple-600 rounded-xl p-6 text-white">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Admin Management</h1>
            <p className="text-purple-100 mt-1">
              Manage system administrators and their permissions
            </p>
          </div>
          
          <button
            onClick={handleAddAdmin}
            className="flex items-center space-x-2 px-4 py-2 bg-white text-purple-600 rounded-lg hover:bg-purple-50 transition-colors mt-4 sm:mt-0 font-medium"
          >
            <Plus className="w-4 h-4" />
            <span>Add Admin</span>
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg p-4">
          <p className="text-red-600 dark:text-red-400 font-medium">{error}</p>
        </div>
      )}

      {/* Add/Edit Admin Form */}
      {showAddForm && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
            {editingAdmin ? 'Edit Admin User' : 'Add New Admin User'}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Full Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="Enter full name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email Address *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="admin@university.edu"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="+1234567890"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Department *
              </label>
              <select
                value={formData.department}
                onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="">Select Department</option>
                <option value="Computer Science">Computer Science</option>
                <option value="Software Engineering">Software Engineering</option>
                <option value="Information Technology">Information Technology</option>
                <option value="Cybersecurity">Cybersecurity</option>
                <option value="Data Science">Data Science</option>
                <option value="Administration">Administration</option>
                <option value="Academic Affairs">Academic Affairs</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Role
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="Discipline Master">Discipline Master</option>
                <option value="Academic Coordinator">Academic Coordinator</option>
                <option value="System Administrator">System Administrator</option>
                <option value="Department Head">Department Head</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Employee ID *
              </label>
              <input
                type="text"
                value={formData.employee_id}
                onChange={(e) => setFormData(prev => ({ ...prev, employee_id: e.target.value.toUpperCase() }))}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="EMP001"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Password {!editingAdmin && '*'}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder={editingAdmin ? "Leave blank to keep current password" : "Enter password"}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-4 mt-8">
            <button
              onClick={handleSaveAdmin}
              className="flex items-center space-x-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
            >
              <Save className="w-4 h-4" />
              <span>Save Admin</span>
            </button>
            <button
              onClick={handleCancel}
              className="flex items-center space-x-2 px-6 py-3 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors font-medium"
            >
              <X className="w-4 h-4" />
              <span>Cancel</span>
            </button>
          </div>
        </div>
      )}

      {/* Admin Users Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {admins.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No admin users found</h3>
            <p className="text-gray-500 dark:text-gray-400">Add your first admin user to get started.</p>
          </div>
        ) : (
          admins.map((admin) => (
            <div key={admin.id} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">{admin.name}</h3>
                    <span className="inline-block px-2 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded dark:bg-purple-900 dark:text-purple-200">
                      {admin.employee_id}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleEditAdmin(admin)}
                    className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900 rounded-lg transition-colors"
                    title="Edit Admin"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteAdmin(admin.id)}
                    className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900 rounded-lg transition-colors"
                    title="Delete Admin"
                    disabled={admins.length <= 1}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-2 text-sm">
                  <Mail className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  <span className="text-gray-900 dark:text-white truncate">{admin.email}</span>
                </div>
                
                {admin.phone && (
                  <div className="flex items-center space-x-2 text-sm">
                    <Phone className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    <span className="text-gray-900 dark:text-white">{admin.phone}</span>
                  </div>
                )}
                
                <div className="flex items-center space-x-2 text-sm">
                  <Building className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  <span className="text-gray-900 dark:text-white">{admin.department}</span>
                </div>
                
                <div className="flex items-center space-x-2 text-sm">
                  <Shield className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  <span className="text-gray-900 dark:text-white">{admin.role}</span>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Created: {new Date(admin.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}