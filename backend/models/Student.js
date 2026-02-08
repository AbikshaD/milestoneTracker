const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
    studentId: {
        type: String,
        required: true,
        unique: true,
        uppercase: true
    },
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        lowercase: true,
        unique: true
    },
    phone: {
        type: String
    },
    department: {
        type: String,
        required: true,
        enum: ['CSE', 'IT', 'ECE', 'EEE', 'MECH', 'CIVIL', 'CHEMICAL', 'AERO']
    },
    semester: {
        type: Number,
        required: true,
        min: 1,
        max: 8
    },
    section: {
        type: String,
        uppercase: true,
        maxlength: 1
    },
    academicYear: {
        type: String,
        required: true,
        match: /^\d{4}-\d{4}$/
    },
    dateOfBirth: {
        type: Date
    },
    admissionDate: {
        type: Date,
        default: Date.now
    },
    address: {
        type: String
    },
    cgpa: {
        type: Number,
        default: 0,
        min: 0,
        max: 10
    },
    sgpa: {
        type: Number,
        default: 0,
        min: 0,
        max: 10
    },
    totalCredits: {
        type: Number,
        default: 0
    },
    earnedCredits: {
        type: Number,
        default: 0
    },
    grade: {
        type: String,
        default: 'N/A'
    },
    status: {
        type: String,
        default: 'Active',
        enum: ['Active', 'Passed', 'Failed', 'Not Evaluated', 'Dropout', 'Graduated']
    },
    progressRemark: {
        type: String,
        default: 'No marks entered'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

studentSchema.index({ 
    name: 'text', 
    studentId: 'text', 
    department: 'text',
    email: 'text'
});

module.exports = mongoose.model('Student', studentSchema);