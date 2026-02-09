const express = require('express');
const router = express.Router();
const multer = require('multer');
const {
  createStudent,
  getAllStudents,
  getStudent,
  updateStudent,
  deleteStudent,
  bulkUploadStudents,
  assignSubjects
} = require('../controllers/studentController');
const auth = require('../middleware/auth');
const role = require('../middleware/role');

// Configure multer for file upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.mimetype === 'application/vnd.ms-excel') {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  }
});

// Apply auth middleware to all routes
router.use(auth);

// Admin only routes
router.post('/', role('admin'), createStudent);
router.get('/', role('admin'), getAllStudents);
router.put('/:id', role('admin'), updateStudent);
router.delete('/:id', role('admin'), deleteStudent);
router.post('/bulk', role('admin'), upload.single('file'), bulkUploadStudents);
router.post('/:id/subjects', role('admin'), assignSubjects);

// Both admin and student can access (with restrictions)
router.get('/:id', getStudent);

module.exports = router;