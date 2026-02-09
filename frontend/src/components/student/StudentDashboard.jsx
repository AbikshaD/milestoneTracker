import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { studentAPI, markAPI } from '../../services/api';
import { toast } from 'react-hot-toast';
import {
  FiUser,
  FiBook,
  FiBarChart2,
  FiAward,
  FiClock,
  FiCalendar,
  FiAlertCircle,
  FiRefreshCw,
  FiDownload,
  FiEye,
  FiTrendingUp,
  FiTrendingDown
} from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

// Remove useMarksPolling import temporarily to debug
// import useMarksPolling from '../../hooks/useMarksPolling';

const StudentDashboard = () => {
  const { user, getStudentId, loading: authLoading } = useAuth();
  const [studentInfo, setStudentInfo] = useState(null);
  const [marks, setMarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const navigate = useNavigate();

  // Safely get student ID
  const studentId = getStudentId ? getStudentId() : null;

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        navigate('/login');
      } else if (user.role === 'student') {
        fetchStudentData();
      }
    }
  }, [user, authLoading, navigate]);

  const fetchStudentData = async () => {
    try {
      setLoading(true);
      
      if (!studentId) {
        console.error('Student ID is null or undefined');
        toast.error('Student ID not found. Please login again.');
        return;
      }

      console.log('Fetching student data for ID:', studentId);

      // Fetch student info
      const studentResponse = await studentAPI.getById(studentId);
      console.log('Student response:', studentResponse.data);
      
      if (studentResponse.data.success) {
        setStudentInfo(studentResponse.data.data);
      } else {
        throw new Error('Failed to load student data');
      }

      // Fetch marks
      await fetchStudentMarks();
      
    } catch (error) {
      console.error('Student dashboard error:', error);
      
      if (error.response?.status === 404) {
        toast.error('Student record not found. Please contact administrator.');
      } else if (error.response?.status === 403) {
        toast.error('Access denied. You can only view your own data.');
      } else {
        toast.error('Failed to load student data');
      }
      
      // Set empty data structure
      if (user) {
        setStudentInfo({
          name: user.email?.split('@')[0] || 'Student',
          studentId: 'N/A',
          class: 'Not assigned',
          department: 'Not assigned',
          year: 1
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentMarks = async () => {
    try {
      const response = await markAPI.getStudentMarks(studentId);
      if (response.data.success) {
        setMarks(response.data.data.marks || []);
      }
    } catch (error) {
      console.error('Fetch marks error:', error);
      setMarks([]);
    }
  };

  const refreshAllData = async () => {
    setDashboardLoading(true);
    try {
      await fetchStudentData();
      toast.success('Dashboard refreshed!');
    } catch (error) {
      console.error('Refresh error:', error);
    } finally {
      setDashboardLoading(false);
    }
  };

  // Calculate summary from marks
  const calculateSummary = () => {
    if (!marks || marks.length === 0) {
      return {
        totalMarks: 0,
        totalFullMarks: 0,
        overallPercentage: '0.00',
        overallGrade: 'N/A',
        overallStatus: 'pending',
        passedSubjects: 0,
        failedSubjects: 0,
        totalSubjects: 0,
        progressRemark: 'No marks recorded yet'
      };
    }

    let totalMarks = 0;
    let totalFullMarks = 0;
    let passedSubjects = 0;
    let failedSubjects = 0;

    marks.forEach(mark => {
      const fullMarks = mark.fullMarks || 100;
      totalMarks += mark.marksObtained;
      totalFullMarks += fullMarks;
      
      if (mark.status === 'pass') {
        passedSubjects++;
      } else {
        failedSubjects++;
      }
    });

    const overallPercentage = totalFullMarks > 0 ? (totalMarks / totalFullMarks) * 100 : 0;
    const overallGrade = calculateGrade(overallPercentage);
    const overallStatus = failedSubjects === 0 && marks.length > 0 ? 'pass' : 
                         marks.length > 0 ? 'fail' : 'pending';
    
    let progressRemark = 'No data';
    if (marks.length > 0) {
      if (overallPercentage >= 80) progressRemark = 'Excellent';
      else if (overallPercentage >= 60) progressRemark = 'Good';
      else if (overallPercentage >= 40) progressRemark = 'Average';
      else progressRemark = 'Needs Improvement';
    }

    return {
      totalMarks,
      totalFullMarks,
      overallPercentage: overallPercentage.toFixed(2),
      overallGrade,
      overallStatus,
      passedSubjects,
      failedSubjects,
      totalSubjects: marks.length,
      progressRemark
    };
  };

  const calculateGrade = (percentage) => {
    if (percentage >= 90) return 'A+';
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B+';
    if (percentage >= 60) return 'B';
    if (percentage >= 50) return 'C+';
    if (percentage >= 40) return 'C';
    return 'F';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pass': return 'text-green-600';
      case 'fail': return 'text-red-600';
      default: return 'text-yellow-600';
    }
  };

  const getGradeColor = (grade) => {
    if (grade === 'A+' || grade === 'A') return 'text-green-600';
    if (grade === 'B+' || grade === 'B') return 'text-blue-600';
    if (grade === 'C+' || grade === 'C') return 'text-yellow-600';
    return 'text-red-600';
  };

  // Show loading while auth is checking
  if (authLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Redirect if no user
  if (!user) {
    navigate('/login');
    return null;
  }

  // Show loading while fetching data
  if (loading || !studentInfo) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const summary = calculateSummary();
  const hasMarks = marks && marks.length > 0;

  return (
    <div className="space-y-6">
      {/* Header with Refresh */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Student Dashboard</h1>
          <p className="text-gray-600">Welcome back, {studentInfo.name}!</p>
        </div>
        <button
          onClick={refreshAllData}
          disabled={dashboardLoading}
          className="btn-secondary flex items-center text-sm"
          title="Refresh data"
        >
          <FiRefreshCw className={`mr-2 ${dashboardLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Student Info Card */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between">
          <div className="flex items-center mb-4 md:mb-0">
            <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center">
              <FiUser className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-6">
              <h2 className="text-xl font-bold text-gray-900">{studentInfo.name}</h2>
              <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Student ID</p>
                  <p className="font-medium">{studentInfo.studentId || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Class</p>
                  <p className="font-medium">{studentInfo.class}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Department</p>
                  <p className="font-medium">{studentInfo.department || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Year</p>
                  <p className="font-medium">Year {studentInfo.year}</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Quick Stats */}
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center">
              <div className="mr-4">
                <p className="text-sm text-blue-600">Total Subjects</p>
                <p className="text-2xl font-bold text-blue-700">{studentInfo.subjects?.length || 0}</p>
              </div>
              <div>
                <p className="text-sm text-blue-600">Marks Recorded</p>
                <p className="text-2xl font-bold text-blue-700">{marks?.length || 0}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100">
              <FiBarChart2 className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Overall Percentage</p>
              <p className="text-2xl font-bold text-gray-900">
                {summary.overallPercentage}%
              </p>
            </div>
          </div>
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full"
                style={{
                  width: `${Math.min(100, parseFloat(summary.overallPercentage))}%`
                }}
              ></div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-emerald-100">
              <FiAward className="h-6 w-6 text-emerald-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Overall Grade</p>
              <p className={`text-2xl font-bold ${getGradeColor(summary.overallGrade)}`}>
                {summary.overallGrade}
              </p>
            </div>
          </div>
          <div className="mt-4">
            <p className={`text-sm ${getStatusColor(summary.overallStatus)}`}>
              Status: <span className="font-medium">{summary.overallStatus.toUpperCase()}</span>
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100">
              <FiBook className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Passed Subjects</p>
              <p className="text-2xl font-bold text-gray-900">
                {summary.passedSubjects}/{summary.totalSubjects}
              </p>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center text-sm">
              {summary.failedSubjects > 0 ? (
                <>
                  <FiTrendingDown className="h-4 w-4 text-red-500 mr-1" />
                  <span className="text-red-600">{summary.failedSubjects} subject(s) need improvement</span>
                </>
              ) : summary.totalSubjects > 0 ? (
                <>
                  <FiTrendingUp className="h-4 w-4 text-green-500 mr-1" />
                  <span className="text-green-600">All subjects passed!</span>
                </>
              ) : null}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-amber-100">
              <FiClock className="h-6 w-6 text-amber-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Progress Status</p>
              <p className="text-2xl font-bold text-gray-900 capitalize">
                {summary.progressRemark}
              </p>
            </div>
          </div>
          <div className="mt-4">
            <p className="text-xs text-gray-500">
              Click refresh to update
            </p>
          </div>
        </div>
      </div>

      {/* Recent Subjects Performance */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900">Subject-wise Performance</h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={fetchStudentMarks}
              disabled={dashboardLoading}
              className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
              title="Refresh marks"
            >
              <FiRefreshCw className={`h-4 w-4 mr-1 ${dashboardLoading ? 'animate-spin' : ''}`} />
              Refresh Marks
            </button>
            <a
              href="/student/report"
              className="text-sm text-green-600 hover:text-green-800 flex items-center"
            >
              <FiEye className="h-4 w-4 mr-1" />
              View Full Report
            </a>
          </div>
        </div>
        
        {dashboardLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : hasMarks ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Subject
                  </th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Marks
                  </th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Grade
                  </th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Remark
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {marks.map((subject, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {subject.subjectName || subject.subject}
                        </div>
                        <div className="text-sm text-gray-500">
                          {subject.subjectCode || subject.code}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {subject.marksObtained}/{subject.fullMarks || 100}
                      </div>
                      <div className="text-sm text-gray-500">
                        {subject.percentage?.toFixed(1) || ((subject.marksObtained / (subject.fullMarks || 100)) * 100).toFixed(1)}%
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        (subject.grade === 'F' || subject.status === 'fail') 
                          ? 'bg-red-100 text-red-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {subject.grade || calculateGrade((subject.marksObtained / (subject.fullMarks || 100)) * 100)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        subject.status === 'pass'
                          ? 'bg-green-100 text-green-800'
                          : subject.status === 'fail'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {(subject.status || 'N/A').toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {subject.remark || 'No remark'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <FiBook className="h-16 w-16 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Marks Recorded Yet
            </h3>
            <p className="text-gray-500 mb-4">
              Your marks will appear here once your teacher enters them
            </p>
            <button
              onClick={fetchStudentMarks}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Click here to check for new marks
            </button>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <a
              href="/student/report"
              className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <FiEye className="h-5 w-5 text-green-600 mr-3" />
              <div>
                <p className="font-medium text-gray-900">View Detailed Report</p>
                <p className="text-sm text-gray-500">Comprehensive academic performance analysis</p>
              </div>
            </a>
            
            <button
              onClick={refreshAllData}
              disabled={dashboardLoading}
              className="w-full flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <FiRefreshCw className={`h-5 w-5 text-blue-600 mr-3 ${dashboardLoading ? 'animate-spin' : ''}`} />
              <div>
                <p className="font-medium text-gray-900">Refresh Dashboard</p>
                <p className="text-sm text-gray-500">Get latest marks and updates</p>
              </div>
            </button>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-blue-900 mb-4">Student Information</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Logged in as:</span>
              <span className="font-medium">{user.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Student ID:</span>
              <span className="font-medium">{studentInfo.studentId || 'Not assigned'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Role:</span>
              <span className="font-medium capitalize">{user.role}</span>
            </div>
          </div>
          
          <div className="mt-6 p-3 bg-white rounded border border-blue-100">
            <p className="text-sm text-blue-800">
              <span className="font-medium">Note:</span> Your marks are updated when your teacher enters them. Use the refresh button to check for updates.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;