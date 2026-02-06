const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const Student = require('./models/Student');
const Subject = require('./models/Subject');
const marksRoutes = require('./routes/marks');
const { calculateStudentProgress } = require('./utils/calculator');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('✅ MongoDB Connected Successfully'))
    .catch(err => console.error('❌ MongoDB Connection Error:', err));

// Routes
app.get('/', (req, res) => {
    res.json({ 
        message: "Learning Progress Monitor API v3.0",
        status: "OK",
        database: "MongoDB Connected",
        features: "Marks Entry & Progress Calculation"
    });
});

// Students Routes
app.get('/api/students', async (req, res) => {
    try {
        const students = await Student.find().sort({ createdAt: -1 });
        res.json(students);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/students', async (req, res) => {
    try {
        const { studentId, name, class: studentClass, department } = req.body;
        
        // Generate student ID if not provided
        const finalStudentId = studentId || `STU${Date.now()}`;
        
        const student = new Student({
            studentId: finalStudentId,
            name,
            class: studentClass,
            department
        });
        
        await student.save();
        res.status(201).json(student);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Subjects Routes
app.get('/api/subjects', async (req, res) => {
    try {
        const subjects = await Subject.find().sort({ name: 1 });
        res.json(subjects);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/subjects', async (req, res) => {
    try {
        const { code, name } = req.body;
        
        const subject = new Subject({
            code: code.toUpperCase(),
            name
        });
        
        await subject.save();
        res.status(201).json(subject);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Marks Routes
app.use('/api/marks', marksRoutes);

// Test Data Routes
app.get('/api/test-data', async (req, res) => {
    try {
        // Clear existing test data
        await Student.deleteMany({});
        await Subject.deleteMany({});
        
        // Add sample students
        const sampleStudents = [
            { studentId: 'STU001', name: 'John Doe', class: '10', department: 'Science' },
            { studentId: 'STU002', name: 'Jane Smith', class: '11', department: 'Commerce' },
            { studentId: 'STU003', name: 'Bob Johnson', class: '12', department: 'Arts' },
            { studentId: 'STU004', name: 'Alice Brown', class: '10', department: 'Science' },
            { studentId: 'STU005', name: 'Charlie Wilson', class: '11', department: 'Commerce' }
        ];
        
        const students = await Student.insertMany(sampleStudents);
        
        // Add sample subjects
        const sampleSubjects = [
            { code: 'MATH101', name: 'Mathematics' },
            { code: 'SCI101', name: 'Science' },
            { code: 'ENG101', name: 'English' },
            { code: 'HIST101', name: 'History' },
            { code: 'CS101', name: 'Computer Science' }
        ];
        
        const subjects = await Subject.insertMany(sampleSubjects);
        
        res.json({
            message: 'Sample data added successfully',
            students: students.length,
            subjects: subjects.length
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/test-marks', async (req, res) => {
    try {
        // Get students and subjects
        const students = await Student.find().limit(3);
        const subjects = await Subject.find().limit(4);
        
        if (students.length === 0 || subjects.length === 0) {
            return res.status(400).json({ error: 'No students or subjects found' });
        }

        // Clear existing marks
        await mongoose.connection.collection('marks').deleteMany({});

        // Add sample marks for each student
        const sampleMarks = [];
        
        students.forEach(student => {
            subjects.forEach(subject => {
                // Generate random marks (40 and above for better demonstration)
                const marks = Math.floor(Math.random() * 30) + 60; // 60-89
                sampleMarks.push({
                    studentId: student._id,
                    subjectId: subject._id,
                    marks: marks
                });
            });
        });

        await mongoose.connection.collection('marks').insertMany(sampleMarks);

        // Update all students' progress
        for (const student of students) {
            const marks = await mongoose.connection.collection('marks')
                .find({ studentId: student._id })
                .toArray();
            
            const progress = calculateStudentProgress(marks);
            
            await Student.findByIdAndUpdate(student._id, {
                totalMarks: progress.totalMarks,
                average: progress.average,
                grade: progress.grade,
                status: progress.status,
                progressRemark: progress.progressRemark
            });
        }

        res.json({
            message: 'Sample marks added successfully',
            students: students.map(s => s.name),
            marksAdded: sampleMarks.length,
            subjects: subjects.map(s => s.name)
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Student Progress Route
app.get('/api/student-progress/:studentId', async (req, res) => {
    try {
        const student = await Student.findById(req.params.studentId);
        if (!student) {
            return res.status(404).json({ error: 'Student not found' });
        }
        
        const marks = await mongoose.connection.collection('marks')
            .find({ studentId: student._id })
            .toArray();
        
        // Populate subject names
        const marksWithSubjects = await Promise.all(
            marks.map(async (mark) => {
                const subject = await Subject.findById(mark.subjectId);
                return {
                    ...mark,
                    subjectName: subject ? subject.name : 'Unknown',
                    subjectCode: subject ? subject.code : 'N/A'
                };
            })
        );
        
        res.json({
            student: {
                id: student._id,
                studentId: student.studentId,
                name: student.name,
                class: student.class,
                department: student.department
            },
            marks: marksWithSubjects,
            progress: {
                totalMarks: student.totalMarks,
                average: student.average,
                grade: student.grade,
                status: student.status,
                progressRemark: student.progressRemark
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Overall Statistics
app.get('/api/statistics', async (req, res) => {
    try {
        const totalStudents = await Student.countDocuments();
        const totalSubjects = await Subject.countDocuments();
        const passedStudents = await Student.countDocuments({ status: 'Pass' });
        const failedStudents = await Student.countDocuments({ status: 'Fail' });
        
        // Get top 5 students by average
        const topStudents = await Student.find()
            .sort({ average: -1 })
            .limit(5)
            .select('name studentId average grade status');
        
        res.json({
            totalStudents,
            totalSubjects,
            passedStudents,
            failedStudents,
            passPercentage: totalStudents > 0 ? ((passedStudents / totalStudents) * 100).toFixed(2) : 0,
            topStudents
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
    console.log(`✅ Test endpoints:`);
    console.log(`   http://localhost:${PORT}/api/test-data`);
    console.log(`   http://localhost:${PORT}/api/test-marks`);
    console.log(`   http://localhost:${PORT}/api/statistics`);
});