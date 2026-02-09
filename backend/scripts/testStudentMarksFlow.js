const mongoose = require('mongoose');
const Student = require('../src/models/Student');
const Subject = require('../src/models/Subject');
const Mark = require('../src/models/Mark');
const User = require('../src/models/User');
const dotenv = require('dotenv');

dotenv.config();

const testStudentMarksFlow = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected...\n');

    // 1. Create test student
    console.log('1. Creating test student...');
    const student = await Student.create({
      studentId: 'ST2024001',
      name: 'Rahul Sharma',
      email: 'rahul.sharma@example.com',
      class: '10',
      department: 'Science',
      year: 1
    });
    console.log(`   ✅ Created: ${student.name} (${student.studentId})`);

    // 2. Create test subjects
    console.log('\n2. Creating test subjects...');
    const subjects = [
      { code: 'MAT101', name: 'Mathematics', fullMarks: 100, passMarks: 40 },
      { code: 'PHY101', name: 'Physics', fullMarks: 100, passMarks: 40 },
      { code: 'ENG101', name: 'English', fullMarks: 100, passMarks: 40 }
    ];

    const createdSubjects = [];
    for (const subData of subjects) {
      const subject = await Subject.create(subData);
      createdSubjects.push(subject);
      console.log(`   ✅ Created: ${subject.code} - ${subject.name}`);
    }

    // 3. Assign subjects to student
    console.log('\n3. Assigning subjects to student...');
    student.subjects = createdSubjects.map(s => s._id);
    await student.save();
    console.log(`   ✅ Assigned ${createdSubjects.length} subjects to ${student.name}`);

    // 4. Create student user account
    console.log('\n4. Creating student user account...');
    const studentUser = await User.create({
      email: student.email,
      password: '123456',
      role: 'student',
      studentId: student._id
    });
    console.log(`   ✅ Created user: ${studentUser.email} (Password: 123456)`);

    // 5. Create teacher/admin user
    console.log('\n5. Creating teacher account...');
    const teacherUser = await User.findOneAndUpdate(
      { email: 'teacher@example.com' },
      {
        email: 'teacher@example.com',
        password: '123456',
        role: 'admin'
      },
      { upsert: true, new: true }
    );
    console.log(`   ✅ Teacher: ${teacherUser.email} (Password: 123456)`);

    // 6. Enter sample marks
    console.log('\n6. Entering sample marks...');
    const sampleMarks = [
      { subject: createdSubjects[0], marks: 85 },
      { subject: createdSubjects[1], marks: 72 },
      { subject: createdSubjects[2], marks: 90 }
    ];

    for (const sample of sampleMarks) {
      await Mark.create({
        student: student._id,
        subject: sample.subject._id,
        marksObtained: sample.marks,
        examType: 'final',
        enteredBy: teacherUser._id,
        calculatedFields: {
          totalMarks: sample.marks,
          percentage: (sample.marks / sample.subject.fullMarks) * 100,
          grade: calculateGrade((sample.marks / sample.subject.fullMarks) * 100),
          status: sample.marks >= sample.subject.passMarks ? 'pass' : 'fail',
          remark: getRemark((sample.marks / sample.subject.fullMarks) * 100)
        }
      });
      console.log(`   ✅ Marks for ${sample.subject.name}: ${sample.marks}/100`);
    }

    console.log('\n🎉 TEST DATA CREATED SUCCESSFULLY!');
    console.log('\n📋 TEST CREDENTIALS:');
    console.log('=====================');
    console.log('👨‍🏫 Teacher Login:');
    console.log('   Email: teacher@example.com');
    console.log('   Password: 123456');
    console.log('\n👨‍🎓 Student Login:');
    console.log('   Email: rahul.sharma@example.com');
    console.log('   Password: 123456');
    console.log('   Student ID: ST2024001');
    console.log('\n📊 Student Marks:');
    console.log('   Mathematics: 85/100');
    console.log('   Physics: 72/100');
    console.log('   English: 90/100');
    console.log('\n🔗 Student Dashboard URL:');
    console.log('   http://localhost:3000/ (after login)');
    console.log('\n📝 Teacher can update marks at:');
    console.log('   http://localhost:3000/admin/marks');
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

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

testStudentMarksFlow();