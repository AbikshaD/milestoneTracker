const mongoose = require('mongoose');

const markSchema = new mongoose.Schema({
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true
    },
    subjectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject',
        required: true
    },
    semester: {
        type: Number,
        required: true,
        min: 1,
        max: 8
    },
    marks: {
        theory: {
            type: Number,
            min: 0,
            max: 100,
            default: 0
        },
        practical: {
            type: Number,
            min: 0,
            max: 100,
            default: 0
        },
        internal: {
            type: Number,
            min: 0,
            max: 50,
            default: 0
        },
        attendance: {
            type: Number,
            min: 0,
            max: 10,
            default: 0
        }
    },
    totalMarks: {
        type: Number,
        required: true,
        min: 0,
        max: 100
    },
    grade: {
        type: String,
        enum: ['S', 'A', 'B', 'C', 'D', 'E', 'F', 'N/A'],
        default: 'N/A'
    },
    gradePoints: {
        type: Number,
        min: 0,
        max: 10
    },
    creditsEarned: {
        type: Number,
        default: 0
    },
    examType: {
        type: String,
        enum: ['Regular', 'Supplementary', 'Improvement'],
        default: 'Regular'
    },
    examDate: {
        type: Date,
        default: Date.now
    },
    result: {
        type: String,
        enum: ['Pass', 'Fail', 'Absent', 'Pending'],
        default: 'Pending'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

markSchema.index({ 
    studentId: 1, 
    subjectId: 1, 
    semester: 1 
}, { unique: true });

module.exports = mongoose.model('Mark', markSchema);