const mongoose = require('mongoose');

const markSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: true
  },
  marksObtained: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  examType: {
    type: String,
    enum: ['midterm', 'final', 'quiz', 'assignment'],
    default: 'final'
  },
  examDate: {
    type: Date,
    default: Date.now
  },
  enteredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  calculatedFields: {
    totalMarks: Number,
    percentage: Number,
    grade: String,
    status: {
      type: String,
      enum: ['pass', 'fail'],
      default: 'pass'
    },
    remark: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for efficient queries
markSchema.index({ student: 1, subject: 1, examType: 1 }, { unique: true });

module.exports = mongoose.model('Mark', markSchema);