const express = require('express');
const router = express.Router();
const {
  createSubject,
  getAllSubjects,
  getSubject,
  updateSubject,
  deleteSubject,
  bulkCreateSubjects
} = require('../controllers/subjectController');
const auth = require('../middleware/auth');
const role = require('../middleware/role');

// Apply auth middleware to all routes
router.use(auth);

// Admin only routes
router.post('/', role('admin'), createSubject);
router.put('/:id', role('admin'), updateSubject);
router.delete('/:id', role('admin'), deleteSubject);
router.post('/bulk', role('admin'), bulkCreateSubjects);

// Both admin and student can access
router.get('/', getAllSubjects);
router.get('/:id', getSubject);

module.exports = router;