const csv = require('csv-parser');
const { Readable } = require('stream');

const parseCSV = (buffer) => {
  return new Promise((resolve, reject) => {
    const results = [];
    const stream = Readable.from(buffer.toString());
    
    stream
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', (error) => reject(error));
  });
};

const validateStudentCSV = (data) => {
  const errors = [];
  const validData = [];
  
  data.forEach((row, index) => {
    const rowNumber = index + 2; // +2 because CSV has header and index starts from 0
    
    // Check required fields
    if (!row.studentId || !row.name || !row.email || !row.class || !row.year) {
      errors.push(`Row ${rowNumber}: Missing required fields`);
      return;
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(row.email)) {
      errors.push(`Row ${rowNumber}: Invalid email format`);
      return;
    }
    
    // Validate year
    const year = parseInt(row.year);
    if (isNaN(year) || year < 1 || year > 5) {
      errors.push(`Row ${rowNumber}: Year must be between 1 and 5`);
      return;
    }
    
    validData.push({
      studentId: row.studentId.trim(),
      name: row.name.trim(),
      email: row.email.trim().toLowerCase(),
      class: row.class.trim(),
      department: row.department?.trim() || '',
      year: year
    });
  });
  
  return { validData, errors };
};

module.exports = {
  parseCSV,
  validateStudentCSV
};