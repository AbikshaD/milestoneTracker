const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const { calculateCGPA, calculateSemesterPerformance } = require('../utils/calculator');

// Get all engineering students with filters
router.get('/', async (req, res) => {
    try {
        const { 
            search, 
            department, 
            semester, 
            academicYear,
            status,
            page = 1, 
            limit = 10 
        } = req.query;
        
        let query = {};
        
        // Search functionality
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { studentId: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }
        
        // Filter by department
        if (department) {
            query.department = department;
        }
        
        // Filter by semester
        if (semester) {
            query.semester = parseInt(semester);
        }
        
        // Filter by academic year
        if (academicYear) {
            query.academicYear = academicYear;
        }
        
        // Filter by status
        if (status) {
            query.status = status;
        }
        
        // Pagination
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;
        
        // Get total count for pagination
        const total = await Student.countDocuments(query);
        
        // Get students with pagination
        const students = await Student.find(query)
            .sort({ studentId: 1 })
            .skip(skip)
            .limit(limitNum);
        
        res.json({
            students,
            pagination: {
                total,
                page: pageNum,
                pages: Math.ceil(total / limitNum),
                limit: limitNum
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create new engineering student
router.post('/', async (req, res) => {
    try {
        const studentData = req.body;
        
        // Validate department
        const validDepartments = ['CSE', 'IT', 'ECE', 'EEE', 'MECH', 'CIVIL', 'CHEMICAL', 'AERO'];
        if (!validDepartments.includes(studentData.department)) {
            return res.status(400).json({ 
                error: 'Invalid department. Valid departments: CSE, IT, ECE, EEE, MECH, CIVIL, CHEMICAL, AERO' 
            });
        }
        
        // Generate student ID if not provided (format: DEPTYYADMNO)
        if (!studentData.studentId) {
            const year = new Date().getFullYear().toString().slice(-2);
            const deptCode = studentData.department.toUpperCase();
            const count = await Student.countDocuments({ 
                department: studentData.department,
                academicYear: studentData.academicYear 
            });
            studentData.studentId = `${deptCode}${year}A${String(count + 1).padStart(3, '0')}`;
        }
        
        // Validate academic year format
        if (studentData.academicYear && !/^\d{4}-\d{4}$/.test(studentData.academicYear)) {
            return res.status(400).json({ 
                error: 'Academic year must be in format: YYYY-YYYY' 
            });
        }
        
        const student = new Student(studentData);
        await student.save();
        
        res.status(201).json(student);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Get student academic performance
router.get('/:id/academic-performance', async (req, res) => {
    try {
        const student = await Student.findById(req.params.id);
        if (!student) {
            return res.status(404).json({ error: 'Student not found' });
        }
        
        const marks = await require('../models/Mark').find({ studentId: req.params.id })
            .populate('subjectId', 'name subjectCode credits type');
        
        const subjects = await require('../models/Subject').find();
        
        const performance = calculateSemesterPerformance(marks, subjects);
        const cgpaData = calculateCGPA(marks, subjects);
        
        res.json({
            student: {
                id: student._id,
                studentId: student.studentId,
                name: student.name,
                department: student.department,
                semester: student.semester,
                academicYear: student.academicYear
            },
            cgpa: student.cgpa,
            sgpa: student.sgpa,
            totalCredits: student.totalCredits,
            earnedCredits: student.earnedCredits,
            status: student.status,
            semesterPerformance: performance,
            marksBreakdown: marks.map(mark => ({
                subject: mark.subjectId.name,
                code: mark.subjectId.subjectCode,
                credits: mark.subjectId.credits,
                type: mark.subjectId.type,
                marks: mark.marks,
                totalMarks: mark.totalMarks,
                grade: mark.grade,
                gradePoints: mark.gradePoints,
                semester: mark.semester,
                result: mark.result
            }))
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get department statistics
router.get('/department/:dept/statistics', async (req, res) => {
    try {
        const students = await Student.find({ department: req.params.dept });
        
        if (students.length === 0) {
            return res.json({
                department: req.params.dept,
                message: 'No students found in this department'
            });
        }
        
        const statistics = {
            department: req.params.dept,
            totalStudents: students.length,
            semesterDistribution: {},
            averageCGPA: students.reduce((sum, s) => sum + s.cgpa, 0) / students.length,
            passedStudents: students.filter(s => s.status === 'Passed').length,
            activeStudents: students.filter(s => s.status === 'Active').length,
            failedStudents: students.filter(s => s.status === 'Failed').length,
            dropoutStudents: students.filter(s => s.status === 'Dropout').length,
            academicYearDistribution: {},
            topPerformers: students
                .filter(s => s.cgpa > 0)
                .sort((a, b) => b.cgpa - a.cgpa)
                .slice(0, 10)
                .map(s => ({
                    name: s.name,
                    studentId: s.studentId,
                    semester: s.semester,
                    cgpa: s.cgpa,
                    grade: s.grade
                }))
        };
        
        // Calculate semester distribution
        students.forEach(student => {
            const sem = student.semester;
            statistics.semesterDistribution[sem] = (statistics.semesterDistribution[sem] || 0) + 1;
            
            const year = student.academicYear;
            statistics.academicYearDistribution[year] = (statistics.academicYearDistribution[year] || 0) + 1;
        });
        
        res.json(statistics);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get distinct values for filters
router.get('/filters/options', async (req, res) => {
    try {
        const departments = await Student.distinct('department');
        const semesters = await Student.distinct('semester');
        const academicYears = await Student.distinct('academicYear');
        const statuses = await Student.distinct('status');
        
        res.json({
            departments: departments.filter(d => d).sort(),
            semesters: semesters.filter(s => s).sort((a, b) => a - b),
            academicYears: academicYears.filter(y => y).sort(),
            statuses: statuses.filter(s => s).sort()
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get student by ID with full details
router.get('/:id', async (req, res) => {
    try {
        const student = await Student.findById(req.params.id);
        if (!student) {
            return res.status(404).json({ error: 'Student not found' });
        }
        
        // Get marks and subjects for this student
        const marks = await require('../models/Mark').find({ studentId: req.params.id })
            .populate('subjectId', 'name subjectCode credits semester');
        
        const subjects = await require('../models/Subject').find({
            department: { $in: [student.department, 'COMMON'] }
        });
        
        res.json({
            student,
            academicRecords: {
                totalMarksEntered: marks.length,
                currentSemester: student.semester,
                sgpa: student.sgpa,
                cgpa: student.cgpa,
                creditsProgress: `${student.earnedCredits}/${student.totalCredits}`
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;