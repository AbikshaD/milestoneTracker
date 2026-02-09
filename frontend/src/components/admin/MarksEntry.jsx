import React, { useState, useEffect } from 'react';
import { studentAPI, subjectAPI, markAPI } from '../../services/api';
import { toast } from 'react-hot-toast';
import {
  FiSearch,
  FiUser,
  FiBook,
  FiEdit,
  FiCheck,
  FiX,
  FiCalendar,
  FiSave,
  FiRefresh
} from 'react-icons/fi';

const MarksEntry = () => {
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [existingMarks, setExistingMarks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [marksData, setMarksData] = useState({});
  const [examType, setExamType] = useState('final');
  const [examDate, setExamDate] = useState(new Date());

  useEffect(() => {
    fetchStudents();
    fetchSubjects();
  }, []);

  const fetchStudents = async () => {
    try {
      const response = await studentAPI.getAll({ limit: 100 });
      if (response.data.success) {
        setStudents(response.data.data);
      }
    } catch (error) {
      toast.error('Failed to load students');
    }
  };

  const fetchSubjects = async () => {
    try {
      const response = await subjectAPI.getAll({ limit: 100 });
      if (response.data.success) {
        setSubjects(response.data.data);
      }
    } catch (error) {
      toast.error('Failed to load subjects');
    }
  };

  const handleStudentSelect = async (studentId) => {
    if (!studentId) {
      setSelectedStudent(null);
      setExistingMarks([]);
      setMarksData({});
      return;
    }

    try {
      setLoading(true);
      const student = students.find(s => s._id === studentId);
      setSelectedStudent(student);

      // Load existing marks for this student
      const response = await markAPI.getStudentMarks(studentId);
      if (response.data.success) {
        const marks = response.data.data.marks || [];
        setExistingMarks(marks);
        
        // Pre-fill marks data
        const initialMarks = {};
        marks.forEach(mark => {
          initialMarks[mark.subjectId] = mark.marksObtained;
        });
        setMarksData(initialMarks);
      }
    } catch (error) {
      console.error('Load marks error:', error);
      setExistingMarks([]);
      setMarksData({});
    } finally {
      setLoading(false);
    }
  };

  const handleMarkChange = (subjectId, value) => {
    setMarksData(prev => ({
      ...prev,
      [subjectId]: parseFloat(value) || 0
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedStudent) {
      toast.error('Please select a student');
      return;
    }

    // Validate marks
    for (const [subjectId, markValue] of Object.entries(marksData)) {
      const subject = subjects.find(s => s._id === subjectId);
      if (subject && (markValue < 0 || markValue > subject.fullMarks)) {
        toast.error(`Marks for ${subject.name} must be between 0 and ${subject.fullMarks}`);
        return;
      }
    }

    try {
      setLoading(true);
      const marksArray = Object.entries(marksData).map(([subjectId, marksObtained]) => ({
        studentId: selectedStudent._id,
        subjectId,
        marksObtained,
        examType,
        examDate
      }));

      // Use bulk entry for efficiency
      const response = await markAPI.bulkEnterMarks(marksArray);
      
      if (response.data.success) {
        toast.success('Marks saved successfully!');
        
        // Refresh existing marks
        const marksResponse = await markAPI.getStudentMarks(selectedStudent._id);
        if (marksResponse.data.success) {
          setExistingMarks(marksResponse.data.data.marks || []);
        }
        
        // Student will see updated marks immediately on their dashboard
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save marks');
    } finally {
      setLoading(false);
    }
  };

  const getExistingMark = (subjectId) => {
    return existingMarks.find(mark => mark.subjectId === subjectId);
  };

  const filteredStudents = search.trim() === '' 
    ? students 
    : students.filter(student => 
        student.name.toLowerCase().includes(search.toLowerCase()) ||
        student.studentId.toLowerCase().includes(search.toLowerCase())
      );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Enter Marks</h1>
        <p className="text-gray-600">Record student marks - Students will see updates immediately</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Student Selection */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Select Student</h3>
            
            {/* Search */}
            <div className="mb-4">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiSearch className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search students..."
                  className="input-field pl-10"
                />
              </div>
            </div>

            {/* Student List */}
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredStudents.map((student) => (
                <button
                  key={student._id}
                  onClick={() => handleStudentSelect(student._id)}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    selectedStudent?._id === student._id
                      ? 'bg-blue-50 border border-blue-200'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center">
                    <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <FiUser className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">{student.name}</p>
                      <p className="text-xs text-gray-500">
                        {student.studentId} | Class {student.class}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Exam Details */}
          {selectedStudent && (
            <div className="bg-white rounded-lg shadow p-6 mt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Exam Details</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Exam Type
                  </label>
                  <select
                    value={examType}
                    onChange={(e) => setExamType(e.target.value)}
                    className="input-field"
                  >
                    <option value="final">Final Exam</option>
                    <option value="midterm">Midterm</option>
                    <option value="quiz">Quiz</option>
                    <option value="assignment">Assignment</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Exam Date
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiCalendar className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="date"
                      value={examDate.toISOString().split('T')[0]}
                      onChange={(e) => setExamDate(new Date(e.target.value))}
                      className="input-field pl-10"
                    />
                  </div>
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={loading || Object.keys(marksData).length === 0}
                  className="w-full btn-primary flex items-center justify-center"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <FiSave className="mr-2" />
                      Save All Marks
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Marks Entry */}
        <div className="lg:col-span-2">
          {selectedStudent ? (
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      Enter Marks for {selectedStudent.name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      ID: {selectedStudent.studentId} | Class: {selectedStudent.class}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedStudent(null);
                      setMarksData({});
                    }}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    Change Student
                  </button>
                </div>
              </div>

              <div className="p-6">
                {subjects.length > 0 ? (
                  <div className="space-y-4">
                    {subjects.map((subject) => {
                      const existingMark = getExistingMark(subject._id);
                      const currentMark = marksData[subject._id] || '';
                      const isPass = currentMark >= subject.passMarks;
                      
                      return (
                        <div key={subject._id} className="p-4 border border-gray-200 rounded-lg">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h4 className="font-medium text-gray-900">{subject.name}</h4>
                              <p className="text-sm text-gray-500">{subject.code}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-gray-600">
                                Full: {subject.fullMarks} | Pass: {subject.passMarks}
                              </p>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Marks Obtained
                              </label>
                              <div className="flex items-center">
                                <input
                                  type="number"
                                  min="0"
                                  max={subject.fullMarks}
                                  step="0.01"
                                  value={currentMark}
                                  onChange={(e) => handleMarkChange(subject._id, e.target.value)}
                                  className="input-field"
                                  placeholder="Enter marks"
                                />
                                <span className="ml-2 text-gray-500">/ {subject.fullMarks}</span>
                              </div>
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Percentage
                              </label>
                              <div className="p-2 bg-gray-50 rounded">
                                <span className="font-medium">
                                  {currentMark ? ((currentMark / subject.fullMarks) * 100).toFixed(2) : '0.00'}%
                                </span>
                              </div>
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Status
                              </label>
                              {currentMark !== '' ? (
                                <div className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${
                                  isPass 
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {isPass ? (
                                    <>
                                      <FiCheck className="mr-1.5 h-4 w-4" />
                                      PASS
                                    </>
                                  ) : (
                                    <>
                                      <FiX className="mr-1.5 h-4 w-4" />
                                      FAIL
                                    </>
                                  )}
                                </div>
                              ) : (
                                <span className="text-gray-400 text-sm">Not entered</span>
                              )}
                            </div>
                          </div>
                          
                          {existingMark && (
                            <div className="mt-3 pt-3 border-t border-gray-100">
                              <p className="text-sm text-gray-500">
                                Previously: {existingMark.marksObtained} marks ({existingMark.grade})
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FiBook className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500">No subjects available</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <FiUser className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Student</h3>
              <p className="text-gray-500">
                Choose a student from the list to enter their marks
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MarksEntry;