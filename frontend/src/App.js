import React, { useState, useEffect } from 'react';
import './App.css';
import MarksEntry from './components/MarksEntry';

function App() {
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [newStudent, setNewStudent] = useState({ 
    studentId: '', 
    name: '', 
    class: '', 
    department: '' 
  });
  const [newSubject, setNewSubject] = useState({ 
    code: '', 
    name: '' 
  });
  const [activeTab, setActiveTab] = useState('students');
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState(null);

  useEffect(() => {
    fetchData();
    fetchStatistics();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [studentsRes, subjectsRes] = await Promise.all([
        fetch('http://localhost:5000/api/students'),
        fetch('http://localhost:5000/api/subjects')
      ]);
      
      const studentsData = await studentsRes.json();
      const subjectsData = await subjectsRes.json();
      
      setStudents(studentsData);
      setSubjects(subjectsData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/statistics');
      const data = await response.json();
      setStatistics(data);
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  };

  const handleAddStudent = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:5000/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newStudent)
      });
      
      if (!response.ok) throw new Error('Failed to add student');
      
      const data = await response.json();
      setStudents([...students, data]);
      setNewStudent({ studentId: '', name: '', class: '', department: '' });
      alert('✅ Student added successfully!');
      fetchStatistics();
    } catch (error) {
      alert('❌ Error adding student: ' + error.message);
    }
  };

  const handleAddSubject = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:5000/api/subjects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSubject)
      });
      
      if (!response.ok) throw new Error('Failed to add subject');
      
      const data = await response.json();
      setSubjects([...subjects, data]);
      setNewSubject({ code: '', name: '' });
      alert('✅ Subject added successfully!');
    } catch (error) {
      alert('❌ Error adding subject: ' + error.message);
    }
  };

  const loadTestData = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/test-data');
      const data = await response.json();
      alert(`✅ ${data.message}`);
      fetchData();
      fetchStatistics();
    } catch (error) {
      alert('❌ Error loading test data: ' + error.message);
    }
  };

  const loadTestMarks = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/test-marks');
      const data = await response.json();
      alert(`✅ ${data.message}\nStudents: ${data.students.join(', ')}`);
      fetchData();
      fetchStatistics();
    } catch (error) {
      alert('❌ Error loading test marks: ' + error.message);
    }
  };

  const handleDeleteStudent = async (studentId) => {
    if (window.confirm('Are you sure you want to delete this student?')) {
      try {
        // Note: In Phase 4, we'll add proper DELETE endpoint
        alert('Delete functionality will be added in Phase 4');
        // For now, just show the alert
      } catch (error) {
        alert('❌ Error deleting student: ' + error.message);
      }
    }
  };

  if (loading && students.length === 0) {
    return (
      <div className="App">
        <div className="loading-screen">
          <div className="spinner"></div>
          <h2>Loading Learning Progress Monitor...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      <header className="App-header">
        <h1>📚 Learning Progress Monitor</h1>
        <p>Track and manage student academic performance</p>
        
        {statistics && (
          <div className="header-stats">
            <div className="stat-item">
              <span className="stat-number">{statistics.totalStudents || 0}</span>
              <span className="stat-label">Total Students</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{statistics.totalSubjects || 0}</span>
              <span className="stat-label">Subjects</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{statistics.passedStudents || 0}</span>
              <span className="stat-label">Passed</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{statistics.failedStudents || 0}</span>
              <span className="stat-label">Failed</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{statistics.passPercentage || '0'}%</span>
              <span className="stat-label">Pass Rate</span>
            </div>
          </div>
        )}
      </header>

      <nav className="tabs">
        <button 
          className={activeTab === 'students' ? 'active' : ''} 
          onClick={() => setActiveTab('students')}
        >
          👨‍🎓 Students ({students.length})
        </button>
        <button 
          className={activeTab === 'subjects' ? 'active' : ''} 
          onClick={() => setActiveTab('subjects')}
        >
          📖 Subjects ({subjects.length})
        </button>
        <button 
          className={activeTab === 'marks' ? 'active' : ''} 
          onClick={() => setActiveTab('marks')}
        >
          📝 Marks Entry
        </button>
        <div className="test-buttons">
          <button 
            className="test-btn"
            onClick={loadTestData}
          >
            🔄 Load Test Data
          </button>
          <button 
            className="test-btn marks-btn"
            onClick={loadTestMarks}
          >
            📊 Add Test Marks
          </button>
        </div>
      </nav>

      <main className="App-main">
        {activeTab === 'students' && (
          <div className="section">
            <h2>👨‍🎓 Student Management</h2>
            
            {/* Add Student Form */}
            <div className="form-container">
              <h3>Add New Student</h3>
              <form onSubmit={handleAddStudent}>
                <div className="form-group">
                  <input
                    type="text"
                    placeholder="Student ID (optional)"
                    value={newStudent.studentId}
                    onChange={(e) => setNewStudent({...newStudent, studentId: e.target.value})}
                  />
                  <input
                    type="text"
                    placeholder="Full Name *"
                    value={newStudent.name}
                    onChange={(e) => setNewStudent({...newStudent, name: e.target.value})}
                    required
                  />
                  <input
                    type="text"
                    placeholder="Class *"
                    value={newStudent.class}
                    onChange={(e) => setNewStudent({...newStudent, class: e.target.value})}
                    required
                  />
                  <input
                    type="text"
                    placeholder="Department *"
                    value={newStudent.department}
                    onChange={(e) => setNewStudent({...newStudent, department: e.target.value})}
                    required
                  />
                  <button type="submit">➕ Add Student</button>
                </div>
              </form>
            </div>

            {/* Student List */}
            <div className="list-container">
              <div className="list-header">
                <h3>Student List</h3>
                <div className="list-stats">
                  <span>Total: {students.length}</span>
                  <span>Passed: {students.filter(s => s.status === 'Pass').length}</span>
                  <span>Failed: {students.filter(s => s.status === 'Fail').length}</span>
                </div>
              </div>
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Class</th>
                    <th>Department</th>
                    <th>Average</th>
                    <th>Grade</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map(student => (
                    <tr key={student._id}>
                      <td>{student.studentId}</td>
                      <td>{student.name}</td>
                      <td>{student.class}</td>
                      <td>{student.department}</td>
                      <td>
                        <span className={
                          student.average >= 80 ? 'excellent' :
                          student.average >= 70 ? 'good' :
                          student.average >= 60 ? 'average' :
                          student.average >= 50 ? 'below-average' : 'poor'
                        }>
                          {student.average}
                        </span>
                      </td>
                      <td>
                        <span className={`grade-badge grade-${student.grade.toLowerCase().replace('+', 'plus')}`}>
                          {student.grade}
                        </span>
                      </td>
                      <td>
                        <span className={`status-badge ${student.status === 'Pass' ? 'pass' : 'fail'}`}>
                          {student.status}
                        </span>
                      </td>
                      <td>
                        <button className="btn-edit">✏️ Edit</button>
                        <button 
                          className="btn-delete"
                          onClick={() => handleDeleteStudent(student._id)}
                        >
                          🗑️ Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'subjects' && (
          <div className="section">
            <h2>📖 Subject Management</h2>
            
            {/* Add Subject Form */}
            <div className="form-container">
              <h3>Add New Subject</h3>
              <form onSubmit={handleAddSubject}>
                <div className="form-group">
                  <input
                    type="text"
                    placeholder="Subject Code *"
                    value={newSubject.code}
                    onChange={(e) => setNewSubject({...newSubject, code: e.target.value})}
                    required
                  />
                  <input
                    type="text"
                    placeholder="Subject Name *"
                    value={newSubject.name}
                    onChange={(e) => setNewSubject({...newSubject, name: e.target.value})}
                    required
                  />
                  <button type="submit">➕ Add Subject</button>
                </div>
              </form>
            </div>

            {/* Subject List */}
            <div className="list-container">
              <h3>Subject List</h3>
              <table>
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Name</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {subjects.map(subject => (
                    <tr key={subject._id}>
                      <td><strong>{subject.code}</strong></td>
                      <td>{subject.name}</td>
                      <td>
                        <button className="btn-edit">✏️ Edit</button>
                        <button className="btn-delete">🗑️ Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'marks' && (
          <div className="section">
            <MarksEntry 
              students={students}
              subjects={subjects}
              onMarkAdded={() => {
                fetchData();
                fetchStatistics();
              }}
            />
          </div>
        )}
      </main>

      <footer className="App-footer">
        <p>Learning Progress Monitor v3.0 | Phase 3: Marks Entry & Progress Calculation</p>
        <p className="footer-links">
          <span>Students: {students.length}</span> • 
          <span>Subjects: {subjects.length}</span> • 
          <span>Pass Rate: {statistics ? statistics.passPercentage + '%' : '0%'}</span>
        </p>
      </footer>
    </div>
  );
}

export default App;