import React, { useState, useEffect } from 'react';
import { markAPI } from '../../services/api';
import {
  FiUsers,
  FiBookOpen,
  FiCheckCircle,
  FiXCircle,
  FiTrendingUp,
  FiActivity,
  FiEdit,
  FiUpload
} from 'react-icons/fi';
import { toast } from 'react-hot-toast';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalSubjects: 0,
    totalMarksEntries: 0,
    passCount: 0,
    failCount: 0,
    recentActivities: [],
    classDistribution: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const response = await markAPI.getDashboardStats();
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      toast.error('Failed to load dashboard stats');
      console.error('Dashboard error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Students',
      value: stats.totalStudents,
      icon: FiUsers,
      color: 'bg-blue-500',
      textColor: 'text-blue-500'
    },
    {
      title: 'Total Subjects',
      value: stats.totalSubjects,
      icon: FiBookOpen,
      color: 'bg-green-500',
      textColor: 'text-green-500'
    },
    {
      title: 'Passed',
      value: stats.passCount,
      icon: FiCheckCircle,
      color: 'bg-emerald-500',
      textColor: 'text-emerald-500'
    },
    {
      title: 'Failed',
      value: stats.failCount,
      icon: FiXCircle,
      color: 'bg-red-500',
      textColor: 'text-red-500'
    },
    {
      title: 'Total Entries',
      value: stats.totalMarksEntries,
      icon: FiActivity,
      color: 'bg-purple-500',
      textColor: 'text-purple-500'
    },
    {
      title: 'Pass Rate',
      value: stats.totalMarksEntries > 0 
        ? `${((stats.passCount / stats.totalMarksEntries) * 100).toFixed(1)}%`
        : '0%',
      icon: FiTrendingUp,
      color: 'bg-amber-500',
      textColor: 'text-amber-500'
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600">Monitor and manage academic progress</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((stat, index) => (
          <div key={index} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className="text-2xl font-semibold text-gray-900 mt-1">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-full ${stat.color} bg-opacity-10`}>
                <stat.icon className={`h-6 w-6 ${stat.textColor}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activities & Class Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activities */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Recent Activities</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {stats.recentActivities.length > 0 ? (
              stats.recentActivities.map((activity, index) => (
                <div key={index} className="px-6 py-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                        <FiEdit className="h-4 w-4 text-blue-600" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-900">
                        Marks entered for {activity.student?.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {activity.subject?.code} - {activity.marksObtained} marks
                      </p>
                      <p className="text-xs text-gray-400">
                        {new Date(activity.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-6 py-8 text-center text-gray-500">
                No recent activities
              </div>
            )}
          </div>
        </div>

        {/* Class Distribution */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Class Distribution</h3>
          </div>
          <div className="px-6 py-4">
            {stats.classDistribution.length > 0 ? (
              <div className="space-y-4">
                {stats.classDistribution.map((item, index) => (
                  <div key={index}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-700">Class {item._id}</span>
                      <span className="font-medium text-gray-900">{item.count} students</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{
                          width: `${(item.count / stats.totalStudents) * 100}%`
                        }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                No class distribution data
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a
            href="/admin/students"
            className="bg-blue-50 border border-blue-200 rounded-lg p-4 hover:bg-blue-100 transition-colors duration-200"
          >
            <div className="flex items-center">
              <FiUsers className="h-5 w-5 text-blue-600" />
              <span className="ml-3 font-medium text-blue-700">Manage Students</span>
            </div>
            <p className="mt-2 text-sm text-blue-600">
              Add, edit, or remove student records
            </p>
          </a>
          
          <a
            href="/admin/marks"
            className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 hover:bg-emerald-100 transition-colors duration-200"
          >
            <div className="flex items-center">
              <FiEdit className="h-5 w-5 text-emerald-600" />
              <span className="ml-3 font-medium text-emerald-700">Enter Marks</span>
            </div>
            <p className="mt-2 text-sm text-emerald-600">
              Record student marks and grades
            </p>
          </a>
          
          <a
            href="/admin/bulk-upload"
            className="bg-purple-50 border border-purple-200 rounded-lg p-4 hover:bg-purple-100 transition-colors duration-200"
          >
            <div className="flex items-center">
              <FiUpload className="h-5 w-5 text-purple-600" />
              <span className="ml-3 font-medium text-purple-700">Bulk Upload</span>
            </div>
            <p className="mt-2 text-sm text-purple-600">
              Upload multiple records via CSV
            </p>
          </a>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;