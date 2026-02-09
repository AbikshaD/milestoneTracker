const mongoose = require('mongoose');
const User = require('../src/models/User');
const Student = require('../src/models/Student');
const dotenv = require('dotenv');

dotenv.config();

const linkStudents = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected...');

    // Get all students
    const students = await Student.find({});
    console.log(`Found ${students.length} students`);

    let linkedCount = 0;
    let createdCount = 0;

    for (const student of students) {
      // Check if user already exists for this student
      const existingUser = await User.findOne({ 
        email: student.email,
        role: 'student' 
      });

      if (existingUser) {
        // Update existing user with student ID
        if (!existingUser.studentId || existingUser.studentId.toString() !== student._id.toString()) {
          existingUser.studentId = student._id;
          await existingUser.save();
          linkedCount++;
          console.log(`Linked existing user for ${student.name}`);
        }
      } else {
        // Create new user for student
        const user = await User.create({
          email: student.email,
          password: '123456', // Default password
          role: 'student',
          studentId: student._id
        });
        createdCount++;
        console.log(`Created user for ${student.name}`);
      }
    }

    console.log('\n✅ Linking completed!');
    console.log(`🔗 Linked: ${linkedCount} existing users`);
    console.log(`➕ Created: ${createdCount} new users`);
    console.log(`👥 Total students: ${students.length}`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error linking students:', error);
    process.exit(1);
  }
};

linkStudents();