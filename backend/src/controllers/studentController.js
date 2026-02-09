const Student = require('../models/Student');
const User = require('../models/User');
const { validateStudentCSV } = require('../utils/csvParser');

// @desc    Create new student
// @route   POST /api/students
// @access  Private/Admin
exports.createStudent = async (req, res) => {
  try {
    const { studentId, name, email, class: studentClass, department, year } = req.body;

    // Check if student already exists
    const existingStudent = await Student.findOne({ 
      $or: [{ studentId }, { email }] 
    });

    if (existingStudent) {
      return res.status(400).json({
        success: false,
        message: 'Student with this ID or email already exists'
      });
    }

    const student = await Student.create({
      studentId,
      name,
      email,
      class: studentClass,
      department,
      year
    });

    res.status(201).json({
      success: true,
      data: student
    });
  } catch (error) {
    console.error('Create student error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get all students
// @route   GET /api/students
// @access  Private/Admin
exports.getAllStudents = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', class: studentClass, department } = req.query;
    
    const query = {};
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { studentId: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (studentClass) {
      query.class = studentClass;
    }
    
    if (department) {
      query.department = department;
    }
    
    const students = await Student.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('subjects', 'code name');
    
    const total = await Student.countDocuments(query);
    
    res.json({
      success: true,
      data: students,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get students error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get single student
// @route   GET /api/students/:id
// @access  Private
exports.getStudent = async (req, res) => {
  try {
    const studentId = req.params.id;
    console.log('Fetching student with ID:', studentId);
    console.log('User role:', req.user.role);
    console.log('User studentId:', req.user.studentId);

    // Try to find by ID first
    let student = await Student.findById(studentId)
      .populate('subjects', 'code name fullMarks passMarks');
    
    // If not found by ID and user is student, try to find by studentId field
    if (!student && req.user.role === 'student') {
      student = await Student.findOne({ studentId: studentId })
        .populate('subjects', 'code name fullMarks passMarks');
    }
    
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }
    
    // Check if user is authorized to view this student
    if (req.user.role === 'student') {
      console.log('Comparing student IDs:', req.user.studentId.toString(), student._id.toString());
      if (req.user.studentId.toString() !== student._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to view this student'
        });
      }
    }
    
    res.json({
      success: true,
      data: student
    });
  } catch (error) {
    console.error('Get student error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};
// @desc    Update student
// @route   PUT /api/students/:id
// @access  Private/Admin
exports.updateStudent = async (req, res) => {
  try {
    let student = await Student.findById(req.params.id);
    
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }
    
    // Check for duplicate email or studentId
    if (req.body.email && req.body.email !== student.email) {
      const existingEmail = await Student.findOne({ email: req.body.email });
      if (existingEmail) {
        return res.status(400).json({
          success: false,
          message: 'Email already exists'
        });
      }
    }
    
    if (req.body.studentId && req.body.studentId !== student.studentId) {
      const existingStudentId = await Student.findOne({ studentId: req.body.studentId });
      if (existingStudentId) {
        return res.status(400).json({
          success: false,
          message: 'Student ID already exists'
        });
      }
    }
    
    student = await Student.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    res.json({
      success: true,
      data: student
    });
  } catch (error) {
    console.error('Update student error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Delete student
// @route   DELETE /api/students/:id
// @access  Private/Admin
exports.deleteStudent = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }
    
    // Also delete associated user account
    await User.deleteOne({ studentId: student._id });
    
    await student.deleteOne();
    
    res.json({
      success: true,
      message: 'Student deleted successfully'
    });
  } catch (error) {
    console.error('Delete student error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Bulk upload students from CSV
// @route   POST /api/students/bulk
// @access  Private/Admin
exports.bulkUploadStudents = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a CSV file'
      });
    }
    
    const csvData = req.file.buffer.toString('utf-8');
    const rows = csvData.split('\n').filter(row => row.trim());
    
    if (rows.length <= 1) {
      return res.status(400).json({
        success: false,
        message: 'CSV file is empty or has only headers'
      });
    }
    
    const students = [];
    const errors = [];
    
    // Parse CSV data
    const headers = rows[0].split(',').map(h => h.trim());
    
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const values = row.split(',');
      
      if (values.length !== headers.length) {
        errors.push(`Row ${i + 1}: Column count mismatch`);
        continue;
      }
      
      const studentData = {};
      headers.forEach((header, index) => {
        studentData[header] = values[index]?.trim();
      });
      
      // Validate required fields
      if (!studentData.studentId || !studentData.name || !studentData.email || !studentData.class || !studentData.year) {
        errors.push(`Row ${i + 1}: Missing required fields`);
        continue;
      }
      
      // Check if student already exists
      const existingStudent = await Student.findOne({
        $or: [
          { studentId: studentData.studentId },
          { email: studentData.email.toLowerCase() }
        ]
      });
      
      if (existingStudent) {
        errors.push(`Row ${i + 1}: Student with ID ${studentData.studentId} or email ${studentData.email} already exists`);
        continue;
      }
      
      students.push({
        studentId: studentData.studentId,
        name: studentData.name,
        email: studentData.email.toLowerCase(),
        class: studentData.class,
        department: studentData.department || '',
        year: parseInt(studentData.year) || 1
      });
    }
    
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Some rows have errors',
        errors,
        validCount: students.length
      });
    }
    
    // Insert all students
    const createdStudents = await Student.insertMany(students);
    
    res.status(201).json({
      success: true,
      message: `${createdStudents.length} students created successfully`,
      data: createdStudents
    });
  } catch (error) {
    console.error('Bulk upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Assign subjects to student
// @route   POST /api/students/:id/subjects
// @access  Private/Admin
exports.assignSubjects = async (req, res) => {
  try {
    const { subjectIds } = req.body;
    
    const student = await Student.findById(req.params.id);
    
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }
    
    // Add subjects if not already assigned
    subjectIds.forEach(subjectId => {
      if (!student.subjects.includes(subjectId)) {
        student.subjects.push(subjectId);
      }
    });
    
    await student.save();
    
    res.json({
      success: true,
      message: 'Subjects assigned successfully',
      data: student
    });
  } catch (error) {
    console.error('Assign subjects error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};