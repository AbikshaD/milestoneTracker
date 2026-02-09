const mongoose = require('mongoose');
const Student = require('../src/models/Student');
const Subject = require('../src/models/Subject');
const Mark = require('../src/models/Mark');
const dotenv = require('dotenv');

dotenv.config();

const createTestMarks = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected...');

    // Find demo student
    const student = await Student.findOne({ studentId: 'ST001' });
    if (!student) {
      console.error('Demo student not found. Run createDemoStudent.js first.');
      process.exit(1);
    }
    console.log('Found student:', student.name);

    // Create test subjects if they don't exist
    const subjectsData = [
      { code: 'MAT101', name: 'Mathematics', fullMarks: 100, passMarks: 40 },
      { code: 'PHY101', name: 'Physics', fullMarks: 100, passMarks: 40 },
      { code: 'CHE101', name: 'Chemistry', fullMarks: 100, passMarks: 40 },
      { code: 'ENG101', name: 'English', fullMarks: 100, passMarks: 40 },
      { code: 'BIO101', name: 'Biology', fullMarks: 100, passMarks: 40 }
    ];

    const subjects = [];
    for (const subData of subjectsData) {
      let subject = await Subject.findOne({ code: subData.code });
      if (!subject) {
        subject = await Subject.create(subData);
        console.log('Created subject:', subject.name);
      }
      subjects.push(subject);
    }

    console.log(`Found/created ${subjects.length} subjects`);

    // Create test marks
    const testMarks = [
      { subject: subjects[0], marks: 85 }, // Math
      { subject: subjects[1], marks: 78 }, // Physics
      { subject: subjects[2], marks: 92 }, // Chemistry
      { subject: subjects[3], marks: 65 }, // English
      { subject: subjects[4], marks: 88 }  // Biology
    ];

    let createdMarks = 0;
    for (const testMark of testMarks) {
      // Check if mark already exists
      const existingMark = await Mark.findOne({
        student: student._id,
        subject: testMark.subject._id
      });

      if (!existingMark) {
        await Mark.create({
          student: student._id,
          subject: testMark.subject._id,
          marksObtained: testMark.marks,
          examType: 'final',
          enteredBy: student._id, // Using student ID as placeholder
          calculatedFields: {
            totalMarks: testMark.marks,
            percentage: (testMark.marks / testMark.subject.fullMarks) * 100,
            grade: calculateGrade((testMark.marks / testMark.subject.fullMarks) * 100),
            status: testMark.marks >= testMark.subject.passMarks ? 'pass' : 'fail',
            remark: getRemark((testMark.marks / testMark.subject.fullMarks) * 100)
          }
        });
        createdMarks++;
        console.log(`Created mark for ${testMark.subject.name}: ${testMark.marks}`);
      }
    }

    // Assign subjects to student if not already assigned
    const subjectIds = subjects.map(s => s._id);
    const uniqueSubjects = [...new Set([...student.subjects.map(s => s.toString()), ...subjectIds.map(id => id.toString())])];
    
    if (uniqueSubjects.length > student.subjects.length) {
      student.subjects = uniqueSubjects;
      await student.save();
      console.log(`Assigned ${subjects.length} subjects to student`);
    }

    console.log('\n✅ Test marks created successfully!');
    console.log(`🎓 Student: ${student.name} (${student.studentId})`);
    console.log(`📚 Subjects: ${subjects.length} subjects with marks`);
    console.log(`📊 Created ${createdMarks} new marks`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating test marks:', error);
    process.exit(1);
  }
};

// Helper functions
function calculateGrade(percentage) {
  if (percentage >= 90) return 'A+';
  if (percentage >= 80) return 'A';
  if (percentage >= 70) return 'B+';
  if (percentage >= 60) return 'B';
  if (percentage >= 50) return 'C+';
  if (percentage >= 40) return 'C';
  return 'F';
}

function getRemark(percentage) {
  if (percentage >= 80) return 'Excellent';
  if (percentage >= 60) return 'Good';
  if (percentage >= 40) return 'Average';
  return 'Needs Improvement';
}

createTestMarks();