const express = require('express');
const router = express.Router();
const Subject = require('../models/Subject');

// Get all subjects
router.get('/', async (req, res) => {
    try {
        const subjects = await Subject.find().sort({ name: 1 });
        res.json(subjects);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get single subject
router.get('/:id', async (req, res) => {
    try {
        const subject = await Subject.findById(req.params.id);
        if (!subject) {
            return res.status(404).json({ error: 'Subject not found' });
        }
        res.json(subject);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create subject
router.post('/', async (req, res) => {
    try {
        const subject = new Subject(req.body);
        await subject.save();
        res.status(201).json(subject);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Update subject
router.put('/:id', async (req, res) => {
    try {
        const subject = await Subject.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        
        if (!subject) {
            return res.status(404).json({ error: 'Subject not found' });
        }
        
        res.json(subject);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Delete subject
router.delete('/:id', async (req, res) => {
    try {
        const subject = await Subject.findByIdAndDelete(req.params.id);
        
        if (!subject) {
            return res.status(404).json({ error: 'Subject not found' });
        }
        
        // Delete associated marks
        await require('../models/Mark').deleteMany({ subjectId: req.params.id });
        
        res.json({ 
            message: 'Subject deleted successfully',
            deletedSubject: subject
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get subject statistics
router.get('/:id/statistics', async (req, res) => {
    try {
        const subject = await Subject.findById(req.params.id);
        if (!subject) {
            return res.status(404).json({ error: 'Subject not found' });
        }
        
        const marks = await require('../models/Mark').find({ subjectId: req.params.id })
            .populate('studentId', 'name studentId class');
        
        const statistics = {
            subject: {
                name: subject.name,
                code: subject.code
            },
            totalStudents: marks.length,
            averageMarks: marks.reduce((sum, m) => sum + m.marks, 0) / marks.length || 0,
            highestMarks: Math.max(...marks.map(m => m.marks), 0),
            lowestMarks: Math.min(...marks.map(m => m.marks), 100),
            passCount: marks.filter(m => m.marks >= 40).length,
            failCount: marks.filter(m => m.marks < 40).length,
            passPercentage: marks.length > 0 ? ((marks.filter(m => m.marks >= 40).length / marks.length) * 100).toFixed(2) : 0,
            topPerformers: marks
                .sort((a, b) => b.marks - a.marks)
                .slice(0, 5)
                .map(m => ({
                    name: m.studentId.name,
                    studentId: m.studentId.studentId,
                    class: m.studentId.class,
                    marks: m.marks,
                    grade: m.marks >= 90 ? 'A+' :
                           m.marks >= 80 ? 'A' :
                           m.marks >= 70 ? 'B+' :
                           m.marks >= 60 ? 'B' :
                           m.marks >= 50 ? 'C' :
                           m.marks >= 40 ? 'D' : 'F'
                }))
        };
        
        res.json(statistics);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;