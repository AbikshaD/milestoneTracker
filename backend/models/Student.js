const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
    studentId: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true
    },
    class: {
        type: String,
        required: true
    },
    department: {
        type: String,
        required: true
    },
    totalMarks: {
        type: Number,
        default: 0
    },
    average: {
        type: Number,
        default: 0
    },
    grade: {
        type: String,
        default: 'N/A'
    },
    status: {
        type: String,
        default: 'Not Evaluated'
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

module.exports = mongoose.model('Student', studentSchema);