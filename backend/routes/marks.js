const express = require('express');
const router = express.Router();
const Mark = require('../models/Mark');
const Student = require('../models/Student');
const { calculateStudentProgress } = require('../utils/calculator');

// Get all marks
router.get('/', async (req, res) => {
    try {
        const marks = await Mark.find()
            .populate('studentId', 'name studentId class')
            .populate('subjectId', 'name code')
            .sort({ createdAt: -1 });
        res.json(marks);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Add marks for a student
router.post('/', async (req, res) => {
    try {
        const { studentId, subjectId, marks } = req.body;

        // Check if marks already exist for this student-subject combination
        const existingMark = await Mark.findOne({ studentId, subjectId });
        
        if (existingMark) {
            // Update existing marks
            existingMark.marks = marks;
            await existingMark.save();
        } else {
            // Create new marks entry
            const mark = new Mark({
                studentId,
                subjectId,
                marks: parseInt(marks)
            });
            await mark.save();
        }

        // Calculate and update student progress
        await updateStudentProgress(studentId);

        const updatedMark = await Mark.findOne({ studentId, subjectId })
            .populate('studentId', 'name studentId')
            .populate('subjectId', 'name code');

        res.status(201).json({
            message: 'Marks saved successfully',
            data: updatedMark
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Get marks by student ID
router.get('/student/:studentId', async (req, res) => {
    try {
        const marks = await Mark.find({ studentId: req.params.studentId })
            .populate('subjectId', 'name code')
            .sort({ createdAt: -1 });
        
        const student = await Student.findById(req.params.studentId);
        
        if (!student) {
            return res.status(404).json({ error: 'Student not found' });
        }
        
        res.json({
            student: {
                id: student._id,
                studentId: student.studentId,
                name: student.name,
                class: student.class,
                department: student.department
            },
            marks,
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

// Get marks by subject ID
router.get('/subject/:subjectId', async (req, res) => {
    try {
        const marks = await Mark.find({ subjectId: req.params.subjectId })
            .populate('studentId', 'name studentId class')
            .sort({ marks: -1 });
        res.json(marks);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete marks
router.delete('/:id', async (req, res) => {
    try {
        const mark = await Mark.findByIdAndDelete(req.params.id);
        if (!mark) {
            return res.status(404).json({ error: 'Mark not found' });
        }
        
        // Update student progress after deletion
        await updateStudentProgress(mark.studentId);
        
        res.json({ message: 'Mark deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update student progress function
const updateStudentProgress = async (studentId) => {
    try {
        const marks = await Mark.find({ studentId })
            .populate('subjectId');
        
        const student = await Student.findById(studentId);
        const progress = calculateStudentProgress(marks);
        
        student.totalMarks = progress.totalMarks;
        student.average = progress.average;
        student.grade = progress.grade;
        student.status = progress.status;
        student.progressRemark = progress.progressRemark;
        
        await student.save();
    } catch (error) {
        console.error('Error updating student progress:', error);
    }
};

module.exports = router;