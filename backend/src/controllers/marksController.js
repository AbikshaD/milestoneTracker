const Mark = require('../models/Mark');
const Student = require('../models/Student');
const Subject = require('../models/Subject');
const { calculateResults } = require('../utils/calculate');

// @desc    Enter marks for student
// @route   POST /api/marks
// @access  Private/Admin
exports.enterMarks = async (req, res) => {
  try {
    const { studentId, subjectId, marksObtained, examType, examDate } = req.body;

    // Check if student exists
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Check if subject exists
    const subject = await Subject.findById(subjectId);
    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found'
      });
    }

    // Check if marks already entered for this exam
    const existingMark = await Mark.findOne({
      student: studentId,
      subject: subjectId,
      examType
    });

    if (existingMark) {
      return res.status(400).json({
        success: false,
        message: 'Marks already entered for this exam type'
      });
    }

    // Calculate percentage and grade
    const percentage = (marksObtained / subject.fullMarks) * 100;
    const grade = calculateGrade(percentage);
    const status = marksObtained >= subject.passMarks ? 'pass' : 'fail';
    const remark = getRemark(percentage);

    const mark = await Mark.create({
      student: studentId,
      subject: subjectId,
      marksObtained,
      examType,
      examDate: examDate || new Date(),
      enteredBy: req.user.id,
      calculatedFields: {
        totalMarks: marksObtained,
        percentage,
        grade,
        status,
        remark
      }
    });

    res.status(201).json({
      success: true,
      data: mark
    });
  } catch (error) {
    console.error('Enter marks error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get marks for student
// @route   GET /api/marks/student/:studentId
// @access  Private
exports.getStudentMarks = async (req, res) => {
  try {
    const studentId = req.params.studentId;
    console.log('Getting marks for student ID:', studentId);
    console.log('User role:', req.user.role);
    console.log('User studentId:', req.user.studentId);

    // First, find the student
    let student = await Student.findById(studentId);
    if (!student) {
      // Try to find by studentId if not found by _id
      student = await Student.findOne({ studentId: studentId });
      if (!student) {
        return res.status(404).json({
          success: false,
          message: 'Student not found'
        });
      }
    }

    // Check authorization
    if (req.user.role === 'student') {
      if (!req.user.studentId) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized - no student ID linked to your account'
        });
      }
      
      const userStudent = await Student.findById(req.user.studentId);
      if (!userStudent || userStudent._id.toString() !== student._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to view these marks'
        });
      }
    }

    // Get marks for this student
    const marks = await Mark.find({ student: student._id })
      .populate('subject', 'code name fullMarks passMarks')
      .sort({ examDate: -1 });

    console.log('Found marks:', marks.length);

    // If no marks, return empty result
    if (marks.length === 0) {
      return res.json({
        success: true,
        data: {
          student: {
            id: student._id,
            name: student.name,
            studentId: student.studentId,
            class: student.class,
            department: student.department
          },
          marks: [],
          summary: {
            totalMarks: 0,
            totalFullMarks: 0,
            overallPercentage: '0.00',
            overallGrade: 'N/A',
            overallStatus: 'pending',
            passedSubjects: 0,
            failedSubjects: 0,
            totalSubjects: 0,
            progressRemark: 'No marks recorded yet'
          }
        }
      });
    }

    // Calculate results
    const subjectWiseResults = marks.map(mark => {
      const subject = mark.subject;
      const fullMarks = subject?.fullMarks || 100;
      const passMarks = subject?.passMarks || 40;
      const percentage = (mark.marksObtained / fullMarks) * 100;
      const isPass = mark.marksObtained >= passMarks;
      
      const grade = calculateGrade(percentage);
      const status = isPass ? 'pass' : 'fail';
      const remark = getRemark(percentage);

      return {
        subjectId: mark.subject._id,
        subjectCode: subject?.code,
        subjectName: subject?.name,
        marksObtained: mark.marksObtained,
        fullMarks,
        passMarks,
        percentage,
        grade,
        status,
        remark
      };
    });

    // Calculate summary
    let totalMarks = 0;
    let totalFullMarks = 0;
    let passedSubjects = 0;
    let failedSubjects = 0;

    subjectWiseResults.forEach(result => {
      totalMarks += result.marksObtained;
      totalFullMarks += result.fullMarks;
      if (result.status === 'pass') {
        passedSubjects++;
      } else {
        failedSubjects++;
      }
    });

    const overallPercentage = totalFullMarks > 0 ? (totalMarks / totalFullMarks) * 100 : 0;
    const overallGrade = calculateGrade(overallPercentage);
    const overallStatus = failedSubjects === 0 ? 'pass' : 'fail';
    
    let progressRemark = 'No data';
    if (subjectWiseResults.length > 0) {
      if (overallPercentage >= 80) progressRemark = 'Excellent';
      else if (overallPercentage >= 60) progressRemark = 'Good';
      else if (overallPercentage >= 40) progressRemark = 'Average';
      else progressRemark = 'Needs Improvement';
    }

    const summary = {
      totalMarks,
      totalFullMarks,
      overallPercentage: overallPercentage.toFixed(2),
      overallGrade,
      overallStatus,
      passedSubjects,
      failedSubjects,
      totalSubjects: subjectWiseResults.length,
      progressRemark
    };

    res.json({
      success: true,
      data: {
        student: {
          id: student._id,
          name: student.name,
          studentId: student.studentId,
          class: student.class,
          department: student.department
        },
        marks: subjectWiseResults,
        summary
      }
    });
  } catch (error) {
    console.error('Get student marks error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get marks for subject
// @route   GET /api/marks/subject/:subjectId
// @access  Private/Admin
exports.getSubjectMarks = async (req, res) => {
  try {
    const { examType } = req.query;
    
    const query = { subject: req.params.subjectId };
    if (examType) {
      query.examType = examType;
    }
    
    const marks = await Mark.find(query)
      .populate('student', 'name studentId class')
      .populate('subject', 'code name')
      .sort({ marksObtained: -1 });
    
    // Calculate statistics
    const statistics = {
      totalStudents: marks.length,
      averageMarks: 0,
      highestMarks: 0,
      lowestMarks: 100,
      passCount: 0,
      failCount: 0
    };
    
    if (marks.length > 0) {
      let totalMarks = 0;
      statistics.highestMarks = marks[0].marksObtained;
      statistics.lowestMarks = marks[0].marksObtained;
      
      marks.forEach(mark => {
        totalMarks += mark.marksObtained;
        
        if (mark.marksObtained > statistics.highestMarks) {
          statistics.highestMarks = mark.marksObtained;
        }
        
        if (mark.marksObtained < statistics.lowestMarks) {
          statistics.lowestMarks = mark.marksObtained;
        }
        
        if (mark.calculatedFields.status === 'pass') {
          statistics.passCount++;
        } else {
          statistics.failCount++;
        }
      });
      
      statistics.averageMarks = totalMarks / marks.length;
    }
    
    res.json({
      success: true,
      data: marks,
      statistics
    });
  } catch (error) {
    console.error('Get subject marks error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Update marks
// @route   PUT /api/marks/:id
// @access  Private/Admin
exports.updateMarks = async (req, res) => {
  try {
    const { marksObtained } = req.body;
    
    let mark = await Mark.findById(req.params.id)
      .populate('subject');
    
    if (!mark) {
      return res.status(404).json({
        success: false,
        message: 'Mark record not found'
      });
    }
    
    const subject = mark.subject;
    const percentage = (marksObtained / subject.fullMarks) * 100;
    const grade = calculateGrade(percentage);
    const status = marksObtained >= subject.passMarks ? 'pass' : 'fail';
    const remark = getRemark(percentage);
    
    mark.marksObtained = marksObtained;
    mark.calculatedFields = {
      totalMarks: marksObtained,
      percentage,
      grade,
      status,
      remark
    };
    
    await mark.save();
    
    res.json({
      success: true,
      data: mark
    });
  } catch (error) {
    console.error('Update marks error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Delete marks
// @route   DELETE /api/marks/:id
// @access  Private/Admin
exports.deleteMarks = async (req, res) => {
  try {
    const mark = await Mark.findById(req.params.id);
    
    if (!mark) {
      return res.status(404).json({
        success: false,
        message: 'Mark record not found'
      });
    }
    
    await mark.deleteOne();
    
    res.json({
      success: true,
      message: 'Marks deleted successfully'
    });
  } catch (error) {
    console.error('Delete marks error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Bulk enter marks
// @route   POST /api/marks/bulk
// @access  Private/Admin
exports.bulkEnterMarks = async (req, res) => {
  try {
    const { marksData } = req.body;
    
    if (!Array.isArray(marksData) || marksData.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of marks data'
      });
    }
    
    const createdMarks = [];
    const errors = [];
    
    for (let i = 0; i < marksData.length; i++) {
      const markData = marksData[i];
      
      try {
        // Validate required fields
        if (!markData.studentId || !markData.subjectId || !markData.marksObtained || !markData.examType) {
          errors.push(`Row ${i + 1}: Missing required fields`);
          continue;
        }
        
        // Check if student exists
        const student = await Student.findById(markData.studentId);
        if (!student) {
          errors.push(`Row ${i + 1}: Student not found`);
          continue;
        }
        
        // Check if subject exists
        const subject = await Subject.findById(markData.subjectId);
        if (!subject) {
          errors.push(`Row ${i + 1}: Subject not found`);
          continue;
        }
        
        // Check if marks already entered
        const existingMark = await Mark.findOne({
          student: markData.studentId,
          subject: markData.subjectId,
          examType: markData.examType
        });
        
        if (existingMark) {
          errors.push(`Row ${i + 1}: Marks already entered for this exam`);
          continue;
        }
        
        // Calculate results
        const percentage = (markData.marksObtained / subject.fullMarks) * 100;
        const grade = calculateGrade(percentage);
        const status = markData.marksObtained >= subject.passMarks ? 'pass' : 'fail';
        const remark = getRemark(percentage);
        
        const mark = await Mark.create({
          student: markData.studentId,
          subject: markData.subjectId,
          marksObtained: markData.marksObtained,
          examType: markData.examType,
          examDate: markData.examDate || new Date(),
          enteredBy: req.user.id,
          calculatedFields: {
            totalMarks: markData.marksObtained,
            percentage,
            grade,
            status,
            remark
          }
        });
        
        createdMarks.push(mark);
      } catch (error) {
        errors.push(`Row ${i + 1}: ${error.message}`);
      }
    }
    
    res.status(201).json({
      success: true,
      message: `${createdMarks.length} marks entered, ${errors.length} errors`,
      data: createdMarks,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Bulk enter marks error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get dashboard statistics
// @route   GET /api/marks/dashboard
// @access  Private/Admin
exports.getDashboardStats = async (req, res) => {
  try {
    // Get total students
    const totalStudents = await Student.countDocuments();
    
    // Get total subjects
    const totalSubjects = await Subject.countDocuments();
    
    // Get total marks entries
    const totalMarksEntries = await Mark.countDocuments();
    
    // Get pass/fail statistics
    const marks = await Mark.find();
    let passCount = 0;
    let failCount = 0;
    
    marks.forEach(mark => {
      if (mark.calculatedFields.status === 'pass') {
        passCount++;
      } else {
        failCount++;
      }
    });
    
    // Get recent activities
    const recentMarks = await Mark.find()
      .populate('student', 'name studentId')
      .populate('subject', 'code name')
      .sort({ createdAt: -1 })
      .limit(10);
    
    // Get class-wise statistics
    const studentsByClass = await Student.aggregate([
      {
        $group: {
          _id: '$class',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);
    
    res.json({
      success: true,
      data: {
        totalStudents,
        totalSubjects,
        totalMarksEntries,
        passCount,
        failCount,
        recentActivities: recentMarks,
        classDistribution: studentsByClass
      }
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Helper functions
const calculateGrade = (percentage) => {
  if (percentage >= 90) return 'A+';
  if (percentage >= 80) return 'A';
  if (percentage >= 70) return 'B+';
  if (percentage >= 60) return 'B';
  if (percentage >= 50) return 'C+';
  if (percentage >= 40) return 'C';
  return 'F';
};

const getRemark = (percentage) => {
  if (percentage >= 80) return 'Excellent';
  if (percentage >= 60) return 'Good';
  if (percentage >= 40) return 'Average';
  return 'Needs Improvement';
};