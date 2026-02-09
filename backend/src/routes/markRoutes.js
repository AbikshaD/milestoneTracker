const express = require('express');
const router = express.Router();
const {
  enterMarks,
  getStudentMarks,
  getSubjectMarks,
  updateMarks,
  deleteMarks,
  bulkEnterMarks,
  getDashboardStats
} = require('../controllers/marksController');
const auth = require('../middleware/auth');
const role = require('../middleware/role');

// Apply auth middleware to all routes
router.use(auth);

// Admin only routes
router.post('/', role('admin'), enterMarks);
router.put('/:id', role('admin'), updateMarks);
router.delete('/:id', role('admin'), deleteMarks);
router.post('/bulk', role('admin'), bulkEnterMarks);
router.get('/dashboard', role('admin'), getDashboardStats);
router.get('/subject/:subjectId', role('admin'), getSubjectMarks);

// Both admin and student can access (with restrictions)
router.get('/student/:studentId', getStudentMarks);

module.exports = router;