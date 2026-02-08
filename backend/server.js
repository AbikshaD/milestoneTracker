const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const Student = require('./models/Student');
const Subject = require('./models/Subject');
const Mark = require('./models/Mark');
const studentRoutes = require('./routes/students');
const subjectRoutes = require('./routes/subjects');
const markRoutes = require('./routes/marks');
const reportRoutes = require('./routes/reports');
const { calculateCGPA } = require('./utils/calculator');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true
}));
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/engineering_college')
    .then(() => console.log('✅ MongoDB Connected Successfully'))
    .catch(err => {
        console.error('❌ MongoDB Connection Error:', err);
        process.exit(1);
    });

// Basic route
app.get('/', (req, res) => {
    res.json({ 
        message: "Engineering College Academic Tracker API",
        version: "4.0",
        status: "Running",
        features: "Complete Engineering College System"
    });
});

// Routes
app.use('/api/students', studentRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/marks', markRoutes);
app.use('/api/reports', reportRoutes);

// Test Data Route - ENGINEERING COLLEGE VERSION
app.get('/api/test-data', async (req, res) => {
    try {
        console.log('🚀 Loading Engineering College Test Data...');
        
        // Clear existing data
        await Student.deleteMany({});
        await Subject.deleteMany({});
        await Mark.deleteMany({});
        
        console.log('✅ Cleared existing data');
        
        // Engineering departments
        const departments = ['CSE', 'IT', 'ECE', 'EEE', 'MECH', 'CIVIL'];
        const academicYears = ['2023-2024', '2024-2025'];
        const sections = ['A', 'B'];
        
        // Create sample engineering students
        const sampleStudents = [];
        let studentCounter = 1;
        
        departments.forEach(dept => {
            academicYears.forEach(year => {
                for (let sem = 1; sem <= 4; sem++) { // Reduced to 4 semesters for testing
                    sections.forEach(section => {
                        for (let i = 0; i < 2; i++) { // 2 students per section
                            const yearCode = year.slice(2, 4);
                            const studentId = `${dept}${yearCode}A${String(studentCounter).padStart(3, '0')}`;
                            
                            sampleStudents.push({
                                studentId: studentId,
                                name: `Student ${studentCounter}`,
                                email: `student${studentCounter}@engineering.edu`,
                                phone: `98${String(1000000 + studentCounter).slice(1)}`,
                                department: dept,
                                semester: sem,
                                section: section,
                                academicYear: year,
                                dateOfBirth: new Date(2000 + Math.floor(Math.random() * 5), 
                                                    Math.floor(Math.random() * 12), 
                                                    Math.floor(Math.random() * 28)),
                                address: `Address ${studentCounter}, Engineering City`,
                                cgpa: parseFloat((5 + Math.random() * 5).toFixed(2)),
                                sgpa: parseFloat((5 + Math.random() * 5).toFixed(2)),
                                totalCredits: sem * 20,
                                earnedCredits: Math.floor(sem * 20 * 0.8),
                                grade: ['S', 'A', 'B', 'C'][Math.floor(Math.random() * 4)],
                                status: ['Active', 'Active', 'Active', 'Active'][Math.floor(Math.random() * 4)],
                                progressRemark: 'Good academic performance'
                            });
                            
                            studentCounter++;
                        }
                    });
                }
            });
        });
        
        console.log(`📝 Creating ${sampleStudents.length} students...`);
        const students = await Student.insertMany(sampleStudents);
        console.log(`✅ Created ${students.length} students`);
        
        // Create engineering subjects
        const engineeringSubjects = [
            // Common Subjects (Semester 1-2)
            { subjectCode: 'MAT101', name: 'Mathematics I', department: 'COMMON', semester: 1, credits: 4, type: 'Theory' },
            { subjectCode: 'PHY101', name: 'Physics', department: 'COMMON', semester: 1, credits: 4, type: 'Theory' },
            { subjectCode: 'CHE101', name: 'Chemistry', department: 'COMMON', semester: 1, credits: 3, type: 'Theory' },
            { subjectCode: 'ENG101', name: 'English', department: 'COMMON', semester: 1, credits: 3, type: 'Theory' },
            { subjectCode: 'MAT102', name: 'Mathematics II', department: 'COMMON', semester: 2, credits: 4, type: 'Theory' },
            
            // CSE Subjects
            { subjectCode: 'CSE101', name: 'Programming in C', department: 'CSE', semester: 1, credits: 4, type: 'Theory' },
            { subjectCode: 'CSE102', name: 'C Programming Lab', department: 'CSE', semester: 1, credits: 2, type: 'Lab' },
            { subjectCode: 'CSE201', name: 'Data Structures', department: 'CSE', semester: 3, credits: 4, type: 'Theory' },
            
            // ECE Subjects
            { subjectCode: 'ECE101', name: 'Basic Electronics', department: 'ECE', semester: 1, credits: 4, type: 'Theory' },
            { subjectCode: 'ECE102', name: 'Electronics Lab', department: 'ECE', semester: 1, credits: 2, type: 'Lab' },
            
            // MECH Subjects
            { subjectCode: 'MEC101', name: 'Engineering Mechanics', department: 'MECH', semester: 1, credits: 4, type: 'Theory' },
            { subjectCode: 'MEC102', name: 'Workshop Practice', department: 'MECH', semester: 1, credits: 2, type: 'Lab' },
            
            // CIVIL Subjects
            { subjectCode: 'CIV101', name: 'Engineering Drawing', department: 'CIVIL', semester: 1, credits: 4, type: 'Theory' },
            { subjectCode: 'CIV102', name: 'Surveying', department: 'CIVIL', semester: 1, credits: 2, type: 'Lab' },
            
            // IT Subjects
            { subjectCode: 'IT101', name: 'Programming Fundamentals', department: 'IT', semester: 1, credits: 4, type: 'Theory' },
            
            // EEE Subjects
            { subjectCode: 'EEE101', name: 'Electrical Circuits', department: 'EEE', semester: 1, credits: 4, type: 'Theory' }
        ];
        
        console.log(`📚 Creating ${engineeringSubjects.length} subjects...`);
        const subjects = await Subject.insertMany(engineeringSubjects);
        console.log(`✅ Created ${subjects.length} subjects`);
        
        // Create sample marks
        const sampleMarks = [];
        
        console.log('📊 Generating marks for students...');
        for (const student of students) {
            const studentSubjects = subjects.filter(subject => 
                subject.department === 'COMMON' || subject.department === student.department
            );
            
            for (const subject of studentSubjects) {
                if (subject.semester <= student.semester) {
                    const theoryMarks = Math.floor(Math.random() * 40) + 50;
                    const practicalMarks = subject.type === 'Lab' ? Math.floor(Math.random() * 40) + 50 : 0;
                    const internalMarks = Math.floor(Math.random() * 20) + 20;
                    const attendanceMarks = Math.floor(Math.random() * 6) + 4;
                    
                    const totalMarks = theoryMarks + practicalMarks + internalMarks + attendanceMarks;
                    
                    let grade, gradePoints;
                    if (totalMarks >= 90) { grade = 'S'; gradePoints = 10; }
                    else if (totalMarks >= 80) { grade = 'A'; gradePoints = 9; }
                    else if (totalMarks >= 70) { grade = 'B'; gradePoints = 8; }
                    else if (totalMarks >= 60) { grade = 'C'; gradePoints = 7; }
                    else if (totalMarks >= 55) { grade = 'D'; gradePoints = 6; }
                    else if (totalMarks >= 50) { grade = 'E'; gradePoints = 5; }
                    else { grade = 'F'; gradePoints = 0; }
                    
                    sampleMarks.push({
                        studentId: student._id,
                        subjectId: subject._id,
                        semester: subject.semester,
                        marks: {
                            theory: theoryMarks,
                            practical: practicalMarks,
                            internal: internalMarks,
                            attendance: attendanceMarks
                        },
                        totalMarks: totalMarks,
                        grade: grade,
                        gradePoints: gradePoints,
                        creditsEarned: grade !== 'F' ? subject.credits : 0,
                        result: grade !== 'F' ? 'Pass' : 'Fail'
                    });
                }
            }
        }
        
        console.log(`📝 Creating ${sampleMarks.length} marks...`);
        await Mark.insertMany(sampleMarks);
        console.log(`✅ Created ${sampleMarks.length} marks`);
        
        // Update student CGPA
        console.log('🔄 Calculating CGPA for students...');
        for (const student of students) {
            const studentMarks = await Mark.find({ studentId: student._id });
            
            if (studentMarks.length > 0) {
                let totalCredits = 0;
                let totalGradePoints = 0;
                
                for (const mark of studentMarks) {
                    const subject = await Subject.findById(mark.subjectId);
                    if (subject) {
                        totalCredits += subject.credits;
                        totalGradePoints += mark.gradePoints * subject.credits;
                    }
                }
                
                const cgpa = totalCredits > 0 ? totalGradePoints / totalCredits : 0;
                
                await Student.findByIdAndUpdate(student._id, {
                    cgpa: parseFloat(cgpa.toFixed(2)),
                    totalCredits: totalCredits,
                    earnedCredits: studentMarks
                        .filter(m => m.grade !== 'F')
                        .reduce(async (sum, m) => {
                            const subject = await Subject.findById(m.subjectId);
                            return sum + (subject ? subject.credits : 0);
                        }, 0)
                });
            }
        }
        
        console.log('✅ Test data loading completed!');
        
        res.json({
            message: 'Engineering College test data loaded successfully!',
            summary: {
                students: students.length,
                subjects: subjects.length,
                marks: sampleMarks.length,
                departments: departments.length
            },
            departments: departments,
            note: 'System is ready with engineering college data'
        });
    } catch (error) {
        console.error('❌ Error loading test data:', error);
        res.status(500).json({ 
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// Test Marks Route
app.get('/api/test-marks', async (req, res) => {
    try {
        const students = await Student.find().limit(5);
        const subjects = await Subject.find().limit(10);
        
        if (students.length === 0 || subjects.length === 0) {
            return res.status(400).json({ error: 'No students or subjects found. Load test data first.' });
        }
        
        // Clear existing marks
        await Mark.deleteMany({});
        
        const sampleMarks = [];
        
        students.forEach(student => {
            subjects.forEach(subject => {
                if (subject.semester <= student.semester) {
                    const theoryMarks = Math.floor(Math.random() * 40) + 50;
                    const practicalMarks = subject.type === 'Lab' ? Math.floor(Math.random() * 40) + 50 : 0;
                    const internalMarks = Math.floor(Math.random() * 20) + 20;
                    const attendanceMarks = Math.floor(Math.random() * 6) + 4;
                    
                    const totalMarks = theoryMarks + practicalMarks + internalMarks + attendanceMarks;
                    
                    let grade, gradePoints;
                    if (totalMarks >= 90) { grade = 'S'; gradePoints = 10; }
                    else if (totalMarks >= 80) { grade = 'A'; gradePoints = 9; }
                    else if (totalMarks >= 70) { grade = 'B'; gradePoints = 8; }
                    else if (totalMarks >= 60) { grade = 'C'; gradePoints = 7; }
                    else if (totalMarks >= 55) { grade = 'D'; gradePoints = 6; }
                    else if (totalMarks >= 50) { grade = 'E'; gradePoints = 5; }
                    else { grade = 'F'; gradePoints = 0; }
                    
                    sampleMarks.push({
                        studentId: student._id,
                        subjectId: subject._id,
                        semester: subject.semester,
                        marks: {
                            theory: theoryMarks,
                            practical: practicalMarks,
                            internal: internalMarks,
                            attendance: attendanceMarks
                        },
                        totalMarks: totalMarks,
                        grade: grade,
                        gradePoints: gradePoints,
                        creditsEarned: grade !== 'F' ? subject.credits : 0,
                        result: grade !== 'F' ? 'Pass' : 'Fail'
                    });
                }
            });
        });
        
        await Mark.insertMany(sampleMarks);
        
        // Update students' CGPA
        for (const student of students) {
            const studentMarks = await Mark.find({ studentId: student._id });
            const studentSubjects = await Subject.find({
                $or: [
                    { department: 'COMMON' },
                    { department: student.department }
                ]
            });
            
            const cgpaData = calculateCGPA(studentMarks, studentSubjects);
            
            await Student.findByIdAndUpdate(student._id, {
                cgpa: cgpaData.cgpa,
                sgpa: cgpaData.sgpa,
                totalCredits: cgpaData.totalCredits,
                earnedCredits: cgpaData.earnedCredits,
                grade: cgpaData.grade,
                status: cgpaData.status,
                progressRemark: cgpaData.progressRemark
            });
        }
        
        res.json({
            message: 'Test marks added successfully',
            marksAdded: sampleMarks.length,
            students: students.map(s => s.name),
            subjects: subjects.map(s => s.name)
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Statistics endpoint
app.get('/api/statistics', async (req, res) => {
    try {
        const totalStudents = await Student.countDocuments();
        const totalSubjects = await Subject.countDocuments();
        
        const students = await Student.find();
        const averageCGPA = students.length > 0 ? 
            students.reduce((sum, s) => sum + s.cgpa, 0) / students.length : 0;
        
        const graduatedStudents = await Student.countDocuments({ status: 'Graduated' });
        const activeStudents = await Student.countDocuments({ status: 'Active' });
        const passedStudents = await Student.countDocuments({ status: 'Passed' });
        const failedStudents = await Student.countDocuments({ status: 'Failed' });
        
        // Department statistics
        const departments = await Student.aggregate([
            { $group: { _id: '$department', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);
        
        res.json({
            totalStudents,
            totalSubjects,
            totalDepartments: departments.length,
            averageCGPA: parseFloat(averageCGPA.toFixed(2)),
            graduatedStudents,
            activeStudents,
            passedStudents,
            failedStudents,
            passPercentage: totalStudents > 0 ? 
                parseFloat(((passedStudents / totalStudents) * 100).toFixed(2)) : 0,
            departmentDistribution: departments
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        uptime: process.uptime()
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('🔥 Server Error:', err);
    res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📚 Engineering College Academic Tracker API v4.0`);
    console.log(`📊 Available Endpoints:`);
    console.log(`   GET  /api/test-data      - Load engineering college test data`);
    console.log(`   GET  /api/test-marks     - Add test marks`);
    console.log(`   GET  /api/statistics     - Get system statistics`);
    console.log(`   GET  /api/health         - Health check`);
    console.log(`   GET  /api/students       - Student management`);
    console.log(`   GET  /api/subjects       - Subject management`);
    console.log(`   GET  /api/marks          - Marks management`);
    console.log(`   GET  /api/reports        - Academic reports`);
});