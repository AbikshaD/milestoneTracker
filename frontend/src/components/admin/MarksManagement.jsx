import React, { useState, useEffect } from 'react';
import { studentAPI, subjectAPI, markAPI } from '../../services/api';
import { toast } from 'react-hot-toast';
import {
  FiSearch,
  FiUser,
  FiBook,
  FiEdit,
  FiSave,
  FiTrash2,
  FiEye,
  FiCheck,
  FiX,
  FiFilter,
  FiDownload,
  FiRefreshCw,
  FiCheckCircle,
  FiXCircle
} from 'react-icons/fi';

const MarksManagement = () => {
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [marks, setMarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  
  const [showMarksModal, setShowMarksModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [currentMarks, setCurrentMarks] = useState({});
  const [editingMode, setEditingMode] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const studentsRes = await studentAPI.getAll({ limit: 200 });
      if (studentsRes.data.success) {
        setStudents(studentsRes.data.data);
      }
      
      const subjectsRes = await subjectAPI.getAll({ limit: 100 });
      if (subjectsRes.data.success) {
        setSubjects(subjectsRes.data.data);
      }
      
      await fetchAllMarks();
      
    } catch (error) {
      toast.error('Failed to load data');
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllMarks = async () => {
    try {
      const marksResponse = await markAPI.getDashboardStats();
      if (marksResponse.data.success) {
        setMarks(marksResponse.data.data.recentActivities || []);
      }
    } catch (error) {
      console.error('Fetch marks error:', error);
    }
  };

  const handleEnterMarks = (student) => {
    setSelectedStudent(student);
    setCurrentMarks({});
    setEditingMode(false);
    setShowMarksModal(true);
  };

  const handleViewMarks = async (student) => {
    try {
      setSelectedStudent(student);
      setLoading(true);
      
      const response = await markAPI.getStudentMarks(student._id);
      if (response.data.success) {
        setCurrentMarks(response.data.data);
        setEditingMode(true);
        setShowMarksModal(true);
      }
    } catch (error) {
      console.error('View marks error:', error);
      toast.error('Failed to load student marks');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateMarks = async () => {
    try {
      for (const [subjectId, markValue] of Object.entries(currentMarks)) {
        if (markValue < 0 || markValue > 100) {
          toast.error(`Marks must be between 0 and 100`);
          return;
        }
      }

      const marksData = Object.entries(currentMarks).map(([subjectId, marksObtained]) => ({
        studentId: selectedStudent._id,
        subjectId,
        marksObtained,
        examType: 'final'
      }));

      const response = await markAPI.bulkEnterMarks(marksData);
      if (response.data.success) {
        toast.success(editingMode ? 'Marks updated successfully!' : 'Marks entered successfully!');
        setShowMarksModal(false);
        fetchData();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save marks');
    }
  };

  const handleDeleteMarks = async (studentId) => {
    if (window.confirm('Are you sure you want to delete all marks for this student?')) {
      try {
        const response = await markAPI.getStudentMarks(studentId);
        if (response.data.success) {
          const marksToDelete = response.data.data.marks || [];
          
          for (const mark of marksToDelete) {
            if (mark._id) {
              await markAPI.deleteMarks(mark._id);
            }
          }
          
          toast.success('All marks deleted successfully');
          fetchData();
        }
      } catch (error) {
        toast.error('Failed to delete marks');
      }
    }
  };

  const handleMarksChange = (subjectId, value) => {
    setCurrentMarks(prev => ({
      ...prev,
      [subjectId]: parseFloat(value) || 0
    }));
  };

  const filteredStudents = students.filter(student => {
    const matchesSearch = search === '' || 
      student.name.toLowerCase().includes(search.toLowerCase()) ||
      student.studentId.toLowerCase().includes(search.toLowerCase());
    
    const matchesClass = selectedClass === '' || student.class === selectedClass;
    
    return matchesSearch && matchesClass;
  });

  const uniqueClasses = [...new Set(students.map(s => s.class))].sort();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Marks Management</h1>
          <p className="text-gray-600">Enter, view, and manage student marks</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={fetchData}
            className="btn-secondary flex items-center"
            disabled={loading}
          >
            <FiRefreshCw className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => toast.info('Export feature coming soon')}
            className="btn-secondary flex items-center"
          >
            <FiDownload className="mr-2" />
            Export
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search Students
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiSearch className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or ID..."
                className="input-field pl-10"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Filter by Class
            </label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="input-field"
            >
              <option value="">All Classes</option>
              {uniqueClasses.map(cls => (
                <option key={cls} value={cls}>Class {cls}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Filter by Subject
            </label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="input-field"
            >
              <option value="">All Subjects</option>
              {subjects.map(subject => (
                <option key={subject._id} value={subject._id}>
                  {subject.code} - {subject.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Class & Subjects
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredStudents.map((student) => (
                    <tr key={student._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0 bg-blue-100 rounded-full flex items-center justify-center">
                            <FiUser className="h-5 w-5 text-blue-600" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {student.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              ID: {student.studentId}
                            </div>
                            <div className="text-xs text-gray-400">
                              Class: {student.class} | Dept: {student.department || 'N/A'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          Assigned Subjects: {student.subjects?.length || 0}
                        </div>
                        <div className="text-sm text-gray-500">
                          {student.subjects?.slice(0, 2).map(s => s.code).join(', ')}
                          {student.subjects?.length > 2 && '...'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                          Marks Pending
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEnterMarks(student)}
                            className="text-blue-600 hover:text-blue-900 px-2 py-1 rounded hover:bg-blue-50"
                            title="Enter Marks"
                          >
                            <FiEdit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleViewMarks(student)}
                            className="text-green-600 hover:text-green-900 px-2 py-1 rounded hover:bg-green-50"
                            title="View Marks"
                          >
                            <FiEye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteMarks(student._id)}
                            className="text-red-600 hover:text-red-900 px-2 py-1 rounded hover:bg-red-50"
                            title="Delete Marks"
                          >
                            <FiTrash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {filteredStudents.length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <FiUser className="h-12 w-12 mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No students found
                </h3>
                <p className="text-gray-500">
                  {search || selectedClass ? 'Try changing your filters' : 'No students in the system yet'}
                </p>
              </div>
            )}
          </>
        )}
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Recent Marks Activity</h3>
        </div>
        <div className="p-6">
          {marks.length > 0 ? (
            <div className="space-y-4">
              {marks.slice(0, 5).map((activity, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <FiEdit className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-900">
                        Marks updated for {activity.student?.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {activity.subject?.code}: {activity.marksObtained} marks
                      </p>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(activity.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No recent marks activity
            </div>
          )}
        </div>
      </div>

      {showMarksModal && selectedStudent && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-4 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  {editingMode ? 'Edit Marks' : 'Enter Marks'} for {selectedStudent.name}
                </h3>
                <p className="text-sm text-gray-500">
                  ID: {selectedStudent.studentId} | Class: {selectedStudent.class}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowMarksModal(false);
                  setCurrentMarks({});
                }}
                className="text-gray-400 hover:text-gray-500"
              >
                <FiX className="h-6 w-6" />
              </button>
            </div>

            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-medium">Student:</span> {selectedStudent.name}
                </div>
                <div>
                  <span className="font-medium">Student ID:</span> {selectedStudent.studentId}
                </div>
                <div>
                  <span className="font-medium">Class:</span> {selectedStudent.class}
                </div>
              </div>
            </div>

            <div className="overflow-y-auto max-h-96">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Subject
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Full Marks
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Pass Marks
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Marks Obtained
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {subjects.map((subject) => {
                    const marksValue = currentMarks[subject._id] || '';
                    const isPass = marksValue >= subject.passMarks;
                    
                    return (
                      <tr key={subject._id}>
                        <td className="px-4 py-3">
                          <div className="text-sm font-medium text-gray-900">
                            {subject.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {subject.code}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {subject.fullMarks}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {subject.passMarks}
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            min="0"
                            max={subject.fullMarks}
                            step="0.01"
                            value={marksValue}
                            onChange={(e) => handleMarksChange(subject._id, e.target.value)}
                            className="input-field w-24"
                            placeholder="0-100"
                          />
                        </td>
                        <td className="px-4 py-3">
                          {marksValue !== '' ? (
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              isPass 
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {isPass ? (
                                <>
                                  <FiCheck className="mr-1 h-3 w-3" />
                                  PASS
                                </>
                              ) : (
                                <>
                                  <FiX className="mr-1 h-3 w-3" />
                                  FAIL
                                </>
                              )}
                            </span>
                          ) : (
                            <span className="text-gray-400 text-sm">Not entered</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowMarksModal(false);
                  setCurrentMarks({});
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateMarks}
                className="btn-primary flex items-center"
              >
                <FiSave className="mr-2" />
                {editingMode ? 'Update Marks' : 'Save Marks'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MarksManagement;