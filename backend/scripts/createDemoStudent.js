const mongoose = require('mongoose');
const Student = require('../src/models/Student');
const User = require('../src/models/User');
const dotenv = require('dotenv');

dotenv.config();

const createDemoStudent = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected...');

    // Create demo student
    const demoStudent = await Student.create({
      studentId: 'ST001',
      name: 'John Doe',
      email: 'student@example.com',
      class: '10',
      department: 'Science',
      year: 1
    });

    console.log('✅ Demo student created:', demoStudent);

    // Create user account for demo student
    const demoUser = await User.create({
      email: 'student@example.com',
      password: '123456',
      role: 'student',
      studentId: demoStudent._id
    });

    console.log('✅ Demo user created:', demoUser);
    
    console.log('\n📋 Demo Student Credentials:');
    console.log('📧 Email: student@example.com');
    console.log('🔑 Password: 123456');
    console.log('🎓 Student ID: ST001');
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating demo student:', error);
    process.exit(1);
  }
};

createDemoStudent();