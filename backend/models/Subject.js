const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
    subjectCode: {
        type: String,
        required: true,
        unique: true,
        uppercase: true
    },
    name: {
        type: String,
        required: true
    },
    department: {
        type: String,
        required: true,
        enum: ['COMMON', 'CSE', 'IT', 'ECE', 'EEE', 'MECH', 'CIVIL', 'CHEMICAL', 'AERO']
    },
    semester: {
        type: Number,
        required: true,
        min: 1,
        max: 8
    },
    credits: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    type: {
        type: String,
        enum: ['Theory', 'Lab', 'Project', 'Seminar', 'Elective'],
        default: 'Theory'
    },
    maxMarks: {
        type: Number,
        default: 100
    },
    minPassingMarks: {
        type: Number,
        default: 40
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Subject', subjectSchema);