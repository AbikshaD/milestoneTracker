const Subject = require('../models/Subject');

// @desc    Create new subject
// @route   POST /api/subjects
// @access  Private/Admin
exports.createSubject = async (req, res) => {
  try {
    const { code, name, fullMarks, passMarks, department, year } = req.body;

    // Check if subject already exists
    const existingSubject = await Subject.findOne({ code });
    if (existingSubject) {
      return res.status(400).json({
        success: false,
        message: 'Subject with this code already exists'
      });
    }

    const subject = await Subject.create({
      code: code.toUpperCase(),
      name,
      fullMarks: fullMarks || 100,
      passMarks: passMarks || 40,
      department,
      year: year || 1
    });

    res.status(201).json({
      success: true,
      data: subject
    });
  } catch (error) {
    console.error('Create subject error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get all subjects
// @route   GET /api/subjects
// @access  Private
exports.getAllSubjects = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', department, year } = req.query;
    
    const query = {};
    
    if (search) {
      query.$or = [
        { code: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (department) {
      query.department = department;
    }
    
    if (year) {
      query.year = parseInt(year);
    }
    
    const subjects = await Subject.find(query)
      .sort({ code: 1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    
    const total = await Subject.countDocuments(query);
    
    res.json({
      success: true,
      data: subjects,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get subjects error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get single subject
// @route   GET /api/subjects/:id
// @access  Private
exports.getSubject = async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id);
    
    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found'
      });
    }
    
    res.json({
      success: true,
      data: subject
    });
  } catch (error) {
    console.error('Get subject error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Update subject
// @route   PUT /api/subjects/:id
// @access  Private/Admin
exports.updateSubject = async (req, res) => {
  try {
    let subject = await Subject.findById(req.params.id);
    
    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found'
      });
    }
    
    // Check for duplicate code
    if (req.body.code && req.body.code !== subject.code) {
      const existingCode = await Subject.findOne({ code: req.body.code.toUpperCase() });
      if (existingCode) {
        return res.status(400).json({
          success: false,
          message: 'Subject code already exists'
        });
      }
      req.body.code = req.body.code.toUpperCase();
    }
    
    subject = await Subject.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    res.json({
      success: true,
      data: subject
    });
  } catch (error) {
    console.error('Update subject error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Delete subject
// @route   DELETE /api/subjects/:id
// @access  Private/Admin
exports.deleteSubject = async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id);
    
    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found'
      });
    }
    
    await subject.deleteOne();
    
    res.json({
      success: true,
      message: 'Subject deleted successfully'
    });
  } catch (error) {
    console.error('Delete subject error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Bulk create subjects
// @route   POST /api/subjects/bulk
// @access  Private/Admin
exports.bulkCreateSubjects = async (req, res) => {
  try {
    const { subjects } = req.body;
    
    if (!Array.isArray(subjects) || subjects.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of subjects'
      });
    }
    
    const createdSubjects = [];
    const errors = [];
    
    for (let i = 0; i < subjects.length; i++) {
      const subjectData = subjects[i];
      
      try {
        // Check if subject already exists
        const existingSubject = await Subject.findOne({ 
          code: subjectData.code.toUpperCase() 
        });
        
        if (existingSubject) {
          errors.push(`Subject ${subjectData.code} already exists`);
          continue;
        }
        
        const subject = await Subject.create({
          code: subjectData.code.toUpperCase(),
          name: subjectData.name,
          fullMarks: subjectData.fullMarks || 100,
          passMarks: subjectData.passMarks || 40,
          department: subjectData.department || '',
          year: subjectData.year || 1
        });
        
        createdSubjects.push(subject);
      } catch (error) {
        errors.push(`Subject ${subjectData.code}: ${error.message}`);
      }
    }
    
    res.status(201).json({
      success: true,
      message: `${createdSubjects.length} subjects created, ${errors.length} errors`,
      data: createdSubjects,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Bulk create subjects error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};