const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

dotenv.config();

// Models
const User = require('../src/models/User');
const Student = require('../src/models/Student');
const Subject = require('../src/models/Subject');
const Mark = require('../src/models/Mark');

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Student.deleteMany({});
    await Subject.deleteMany({});
    await Mark.deleteMany({});
    console.log('🗑️  Cleared existing data');

    // Create admin user
    const adminPassword = await bcrypt.hash('admin123', 10);
    const adminUser = await User.create({
      email: 'admin@example.com',
      password: adminPassword,
      role: 'admin'
    });
    console.log('👑 Admin user created');

    // Create sample students
    const students = [
      {
        studentId: 'S001',
        name: 'John Doe',
        email: 'john@example.com',
        class: '10A',
        department: 'Science',
        year: 10
      },
      {
        studentId: 'S002',
        name: 'Jane Smith',
        email: 'jane@example.com',
        class: '10A',
        department: 'Science',
        year: 10
      },
      {
        studentId: 'S003',
        name: 'Bob Johnson',
        email: 'bob@example.com',
        class: '11B',
        department: 'Commerce',
        year: 11
      }
    ];

    const createdStudents = await Student.insertMany(students);
    console.log(`👥 ${createdStudents.length} students created`);

    // Create student users
    for (const student of createdStudents) {
      const studentPassword = await bcrypt.hash('student123', 10);
      await User.create({
        email: student.email,
        password: studentPassword,
        role: 'student',
        studentId: student._id
      });
    }
    console.log('👤 Student users created');

    // Create sample subjects
    const subjects = [
      { code: 'MATH101', name: 'Mathematics', fullMarks: 100, passMarks: 40, year: 10 },
      { code: 'PHY101', name: 'Physics', fullMarks: 100, passMarks: 40, year: 10 },
      { code: 'CHEM101', name: 'Chemistry', fullMarks: 100, passMarks: 40, year: 10 },
      { code: 'ENG101', name: 'English', fullMarks: 100, passMarks: 40, year: 10 },
      { code: 'COMP101', name: 'Computer Science', fullMarks: 100, passMarks: 40, year: 11 }
    ];

    const createdSubjects = await Subject.insertMany(subjects);
    console.log(`📚 ${createdSubjects.length} subjects created`);

    // Assign subjects to students
    for (const student of createdStudents) {
      const studentSubjects = createdSubjects.filter(sub => sub.year === student.year);
      student.subjects = studentSubjects.map(sub => sub._id);
      await student.save();
    }
    console.log('📝 Subjects assigned to students');

    // Create sample marks
    const marks = [];
    for (const student of createdStudents) {
      for (const subject of student.subjects) {
        const marksObtained = Math.floor(Math.random() * 50) + 50; // 50-100
        marks.push({
          student: student._id,
          subject: subject,
          marksObtained,
          examType: 'final',
          enteredBy: adminUser._id,
          calculatedFields: {
            totalMarks: marksObtained,
            percentage: (marksObtained / 100) * 100,
            grade: marksObtained >= 90 ? 'A+' : 
                   marksObtained >= 80 ? 'A' : 
                   marksObtained >= 70 ? 'B+' : 
                   marksObtained >= 60 ? 'B' : 
                   marksObtained >= 50 ? 'C+' : 
                   marksObtained >= 40 ? 'C' : 'F',
            status: marksObtained >= 40 ? 'pass' : 'fail',
            remark: marksObtained >= 80 ? 'Excellent' : 
                    marksObtained >= 60 ? 'Good' : 
                    marksObtained >= 40 ? 'Average' : 'Needs Improvement'
          }
        });
      }
    }

    await Mark.insertMany(marks);
    console.log(`📊 ${marks.length} marks entries created`);

    console.log(`
🎉 Database seeding completed!
─────────────────────────────
👑 Admin Credentials:
• Email: admin@example.com
• Password: admin123

👤 Student Credentials:
• Email: john@example.com / jane@example.com / bob@example.com
• Password: student123
─────────────────────────────
    `);

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
};

seedDatabase();