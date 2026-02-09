import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { markAPI, studentAPI } from '../../services/api';
import { toast } from 'react-hot-toast';
import {
  FiDownload,
  FiPrinter,
  FiFileText,
  FiAward,
  FiTrendingUp,
  FiCheckCircle,
  FiXCircle,
  FiBarChart2,
  FiUser,
  FiBook,
  FiAlertCircle
} from 'react-icons/fi';
import { useReactToPrint } from 'react-to-print';
import { useRef } from 'react';

const StudentReport = () => {
  const { user, getStudentId } = useAuth();
  const [reportData, setReportData] = useState(null);
  const [studentInfo, setStudentInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const reportRef = useRef();

  useEffect(() => {
    fetchReportData();
  }, []);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      const studentId = getStudentId();
      
      if (!studentId) {
        toast.error('Student ID not found. Please login again.');
        return;
      }

      console.log('Fetching report for student ID:', studentId);

      // Fetch student info
      const studentResponse = await studentAPI.getById(studentId);
      console.log('Student info response:', studentResponse.data);
      
      if (studentResponse.data.success) {
        setStudentInfo(studentResponse.data.data);
      }

      // Fetch marks
      const marksResponse = await markAPI.getStudentMarks(studentId);
      console.log('Marks response:', marksResponse.data);
      
      if (marksResponse.data.success) {
        setReportData(marksResponse.data.data);
      } else {
        // If no marks yet
        setReportData({
          marks: [],
          summary: {
            totalMarks: 0,
            totalFullMarks: 0,
            overallPercentage: '0.00',
            overallGrade: 'N/A',
            overallStatus: 'pending',
            passedSubjects: 0,
            failedSubjects: 0,
            totalSubjects: 0,
            progressRemark: 'No marks recorded yet'
          }
        });
      }
    } catch (error) {
      console.error('Report error:', error);
      
      if (error.response?.status === 404) {
        toast.error('No marks recorded yet. Please check back later.');
      } else {
        toast.error('Failed to load report');
      }
      
      // Set empty data
      setReportData({
        marks: [],
        summary: {
          totalMarks: 0,
          totalFullMarks: 0,
          overallPercentage: '0.00',
          overallGrade: 'N/A',
          overallStatus: 'pending',
          passedSubjects: 0,
          failedSubjects: 0,
          totalSubjects: 0,
          progressRemark: 'No data available'
        }
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = useReactToPrint({
    content: () => reportRef.current,
    documentTitle: `Student_Report_${studentInfo?.studentId || 'student'}`,
    onAfterPrint: () => toast.success('Report printed successfully!')
  });

  const handleDownload = () => {
    // Create CSV report
    let csvContent = "Academic Report\n\n";
    
    if (studentInfo) {
      csvContent += `Student ID: ${studentInfo.studentId}\n`;
      csvContent += `Name: ${studentInfo.name}\n`;
      csvContent += `Class: ${studentInfo.class}\n`;
      csvContent += `Department: ${studentInfo.department || 'N/A'}\n`;
      csvContent += `Year: ${studentInfo.year}\n\n`;
    }
    
    csvContent += "Subject-wise Performance\n";
    csvContent += "Subject Code,Subject Name,Marks Obtained,Full Marks,Percentage,Grade,Status,Remark\n";
    
    if (reportData?.marks?.length > 0) {
      reportData.marks.forEach(mark => {
        csvContent += `${mark.subjectCode || 'N/A'},${mark.subjectName || 'N/A'},${mark.marksObtained},${mark.fullMarks || 100},${mark.percentage?.toFixed(2) || 0}%,${mark.grade || 'N/A'},${mark.status || 'N/A'},${mark.remark || ''}\n`;
      });
    }
    
    csvContent += "\nOverall Summary\n";
    if (reportData?.summary) {
      const summary = reportData.summary;
      csvContent += `Total Marks: ${summary.totalMarks}/${summary.totalFullMarks}\n`;
      csvContent += `Overall Percentage: ${summary.overallPercentage}%\n`;
      csvContent += `Overall Grade: ${summary.overallGrade}\n`;
      csvContent += `Overall Status: ${summary.overallStatus}\n`;
      csvContent += `Passed Subjects: ${summary.passedSubjects}/${summary.totalSubjects}\n`;
      csvContent += `Progress Remark: ${summary.progressRemark}\n`;
    }
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report_${studentInfo?.studentId || 'student'}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    toast.success('Report downloaded as CSV!');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!studentInfo) {
    return (
      <div className="text-center py-12">
        <FiAlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Student Information Not Found</h3>
        <p className="text-gray-500 mb-4">
          Your student record could not be loaded. Please contact your administrator.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="btn-primary"
        >
          Refresh Page
        </button>
      </div>
    );
  }

  const { marks = [], summary } = reportData || { marks: [], summary: null };

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Academic Report</h1>
          <p className="text-gray-600">Detailed performance analysis</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={handleDownload}
            className="btn-secondary flex items-center"
            disabled={marks.length === 0}
          >
            <FiDownload className="mr-2" />
            Download CSV
          </button>
          <button
            onClick={handlePrint}
            className="btn-primary flex items-center"
            disabled={marks.length === 0}
          >
            <FiPrinter className="mr-2" />
            Print Report
          </button>
        </div>
      </div>

      {/* Report Content */}
      <div ref={reportRef} className="bg-white rounded-lg shadow">
        {/* Report Header */}
        <div className="border-b border-gray-200 p-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">
                Academic Progress Report
              </h2>
              <p className="text-gray-600">Learning Progress Monitor System</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">Report Generated</div>
              <div className="font-medium">
                {new Date().toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>

        {/* Student Information */}
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Student Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-600">Student ID</p>
              <p className="text-lg font-semibold">{studentInfo.studentId}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Full Name</p>
              <p className="text-lg font-semibold">{studentInfo.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Class</p>
              <p className="text-lg font-semibold">{studentInfo.class}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Department</p>
              <p className="text-lg font-semibold">{studentInfo.department || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Performance Summary */}
        {summary && (
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Performance Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <FiBarChart2 className="h-6 w-6 text-blue-600 mr-3" />
                  <div>
                    <p className="text-sm text-gray-600">Overall Percentage</p>
                    <p className="text-xl font-bold text-gray-900">
                      {summary.overallPercentage}%
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-emerald-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <FiAward className="h-6 w-6 text-emerald-600 mr-3" />
                  <div>
                    <p className="text-sm text-gray-600">Overall Grade</p>
                    <p className="text-xl font-bold text-gray-900">
                      {summary.overallGrade}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <FiCheckCircle className="h-6 w-6 text-green-600 mr-3" />
                  <div>
                    <p className="text-sm text-gray-600">Passed Subjects</p>
                    <p className="text-xl font-bold text-gray-900">
                      {summary.passedSubjects}/{summary.totalSubjects}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-amber-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <FiTrendingUp className="h-6 w-6 text-amber-600 mr-3" />
                  <div>
                    <p className="text-sm text-gray-600">Progress Status</p>
                    <p className="text-xl font-bold text-gray-900 capitalize">
                      {summary.progressRemark}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Detailed Marks Table */}
        <div className="p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Subject-wise Performance</h3>
          {marks.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Subject
                    </th>
                    <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Marks
                    </th>
                    <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Percentage
                    </th>
                    <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Grade
                    </th>
                    <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Remark
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {marks.map((subject, index) => (
                    <tr key={index}>
                      <td className="px-4 py-3">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {subject.subjectName || subject.subject}
                          </div>
                          <div className="text-sm text-gray-500">
                            {subject.subjectCode || subject.code}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-gray-900">
                          {subject.marksObtained}/{subject.fullMarks || 100}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-gray-900">
                          {subject.percentage?.toFixed(2) || '0.00'}%
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          (subject.grade === 'F' || subject.status === 'fail') 
                            ? 'bg-red-100 text-red-800'
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {subject.grade || 'N/A'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          subject.status === 'pass'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {(subject.status || 'N/A').toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-gray-900">{subject.remark || ''}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <FiBook className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Marks Recorded</h3>
              <p className="text-gray-500">
                Your marks will appear here once your teacher enters them.
              </p>
              <p className="text-sm text-gray-400 mt-2">
                Check back later or contact your teacher for updates.
              </p>
            </div>
          )}
        </div>

        {/* Overall Summary */}
        {summary && (
          <div className="bg-gray-50 p-6 border-t border-gray-200">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Overall Academic Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <p className="text-sm text-gray-600">Total Marks Obtained</p>
                <p className="text-xl font-bold text-gray-900">
                  {summary.totalMarks} / {summary.totalFullMarks}
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <p className="text-sm text-gray-600">Overall Result</p>
                <p className={`text-xl font-bold ${
                  summary.overallStatus === 'pass' ? 'text-green-600' : 
                  summary.overallStatus === 'fail' ? 'text-red-600' : 'text-gray-600'
                }`}>
                  {summary.overallStatus?.toUpperCase() || 'PENDING'}
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <p className="text-sm text-gray-600">Failed Subjects</p>
                <p className="text-xl font-bold text-gray-900">
                  {summary.failedSubjects}
                </p>
              </div>
            </div>
            
            {/* Final Remarks */}
            {summary.progressRemark !== 'No data available' && (
              <div className="mt-6 p-4 bg-white rounded-lg shadow-sm">
                <h4 className="text-lg font-semibold text-gray-900 mb-2">Final Remarks</h4>
                <p className="text-gray-700">
                  Based on the performance analysis, you have shown{' '}
                  <span className="font-semibold">{summary.progressRemark.toLowerCase()}</span>{' '}
                  progress.{' '}
                  {summary.failedSubjects > 0 ? (
                    <span className="text-red-600 font-semibold">
                      You need improvement in {summary.failedSubjects} subject{summary.failedSubjects > 1 ? 's' : ''}.
                    </span>
                  ) : summary.totalSubjects > 0 ? (
                    <span className="text-green-600 font-semibold">
                      Great job on passing all subjects!
                    </span>
                  ) : null}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="p-6 text-center text-gray-500 text-sm border-t border-gray-200">
          <p>This report is generated by the Learning Progress Monitor System</p>
          <p className="mt-1">© {new Date().getFullYear()} Academic Management System</p>
          <p className="mt-1 text-xs">Report ID: {studentInfo.studentId}_{Date.now()}</p>
        </div>
      </div>

      {/* Help Section */}
      {marks.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-start">
            <FiAlertCircle className="h-6 w-6 text-yellow-600 mr-3 mt-1 flex-shrink-0" />
            <div>
              <h3 className="text-lg font-medium text-yellow-800 mb-2">No Marks Available</h3>
              <p className="text-yellow-700">
                Your academic report is empty because no marks have been entered for you yet.
              </p>
              <ul className="mt-2 text-yellow-700 text-sm space-y-1">
                <li>• Your teacher needs to enter marks for your subjects</li>
                <li>• Make sure you have subjects assigned to you</li>
                <li>• Check back after your exams are graded</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentReport;