const calculateResults = (marksArray, subjects) => {
  let totalMarks = 0;
  let totalFullMarks = 0;
  let passedSubjects = 0;
  let failedSubjects = 0;
  
  const subjectWiseResults = marksArray.map(mark => {
    const subject = subjects.find(s => s._id.toString() === mark.subject.toString());
    const fullMarks = subject?.fullMarks || 100;
    const passMarks = subject?.passMarks || 40;
    
    totalMarks += mark.marksObtained;
    totalFullMarks += fullMarks;
    
    const percentage = (mark.marksObtained / fullMarks) * 100;
    const isPass = mark.marksObtained >= passMarks;
    
    if (isPass) {
      passedSubjects++;
    } else {
      failedSubjects++;
    }
    
    const grade = calculateGrade(percentage);
    const status = isPass ? 'pass' : 'fail';
    
    return {
      subjectId: mark.subject,
      subjectCode: subject?.code,
      subjectName: subject?.name,
      marksObtained: mark.marksObtained,
      fullMarks,
      passMarks,
      percentage,
      grade,
      status,
      remark: getRemark(percentage)
    };
  });
  
  const overallPercentage = totalFullMarks > 0 ? (totalMarks / totalFullMarks) * 100 : 0;
  const overallGrade = calculateGrade(overallPercentage);
  const overallStatus = failedSubjects === 0 ? 'pass' : 'fail';
  
  let progressRemark = 'Excellent';
  if (overallPercentage >= 80) progressRemark = 'Excellent';
  else if (overallPercentage >= 60) progressRemark = 'Good';
  else if (overallPercentage >= 40) progressRemark = 'Average';
  else progressRemark = 'Needs Improvement';
  
  return {
    subjectWiseResults,
    summary: {
      totalMarks,
      totalFullMarks,
      overallPercentage: overallPercentage.toFixed(2),
      overallGrade,
      overallStatus,
      passedSubjects,
      failedSubjects,
      totalSubjects: marksArray.length,
      progressRemark
    }
  };
};

const calculateGrade = (percentage) => {
  if (percentage >= 90) return 'A+';
  if (percentage >= 80) return 'A';
  if (percentage >= 70) return 'B+';
  if (percentage >= 60) return 'B';
  if (percentage >= 50) return 'C+';
  if (percentage >= 40) return 'C';
  return 'F';
};

const getRemark = (percentage) => {
  if (percentage >= 80) return 'Excellent';
  if (percentage >= 60) return 'Good';
  if (percentage >= 40) return 'Average';
  return 'Needs Improvement';
};

module.exports = {
  calculateResults,
  calculateGrade,
  getRemark
};