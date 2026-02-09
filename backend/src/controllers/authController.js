const User = require('../models/User');
const Student = require('../models/Student');
const jwt = require('jsonwebtoken');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { email, password, role, studentId } = req.body;

    console.log('Registration attempt:', { email, role, studentId });

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'User already exists'
      });
    }

    // For student registration, verify student exists
    let student = null;
    if (role === 'student') {
      if (!studentId) {
        return res.status(400).json({
          success: false,
          message: 'Student ID is required for student registration'
        });
      }
      
     student = await Student.findOne({ studentId: studentId.trim() });
      console.log('Found student:', student);
      
      if (!student) {
        return res.status(404).json({
          success: false,
          message: 'Student not found. Please make sure your Student ID is correct and registered by admin.'
        });
      }
      
      // Check if student already has an account
      const existingStudentAccount = await User.findOne({ studentId: student._id });
      if (existingStudentAccount) {
        return res.status(400).json({
          success: false,
          message: 'Student already has an account'
        });
      }
       if (student.email.toLowerCase() !== email.toLowerCase()) {
        return res.status(400).json({
          success: false,
          message: 'Email does not match the student record. Please use the email registered with your student ID.'
        });
      }
    }

    // Create user
   const user = await User.create({
      email,
      password,
      role: role || 'student',
      studentId: student ? student._id : undefined
    });

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        studentId: user.studentId
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate email & password
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Check for user
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if password matches
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const token = generateToken(user._id);

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        studentId: user.studentId
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-password')
      .populate('studentId', 'name studentId class department');

    res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};