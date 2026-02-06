// Calculate grade based on marks
const calculateGrade = (marks) => {
    if (marks >= 90) return 'A+';
    if (marks >= 80) return 'A';
    if (marks >= 70) return 'B+';
    if (marks >= 60) return 'B';
    if (marks >= 50) return 'C';
    if (marks >= 40) return 'D';
    return 'F';
};

// Calculate status (Pass/Fail)
const calculateStatus = (marks) => {
    return marks >= 40 ? 'Pass' : 'Fail';
};

// Calculate progress remark
const calculateRemark = (average) => {
    if (average >= 80) return 'Excellent - Keep it up!';
    if (average >= 70) return 'Very Good - Well done!';
    if (average >= 60) return 'Good - Keep improving';
    if (average >= 50) return 'Average - Needs improvement';
    if (average >= 40) return 'Below Average - Requires attention';
    return 'Poor - Needs serious improvement';
};

// Calculate overall student progress
const calculateStudentProgress = (marksArray) => {
    if (!marksArray || marksArray.length === 0) {
        return {
            totalMarks: 0,
            average: 0,
            grade: 'N/A',
            status: 'Not Evaluated',
            progressRemark: 'No marks entered'
        };
    }

    const totalMarks = marksArray.reduce((sum, mark) => sum + mark.marks, 0);
    const average = totalMarks / marksArray.length;
    const grade = calculateGrade(average);
    const status = calculateStatus(average);
    const progressRemark = calculateRemark(average);

    return {
        totalMarks,
        average: parseFloat(average.toFixed(2)),
        grade,
        status,
        progressRemark
    };
};

module.exports = {
    calculateGrade,
    calculateStatus,
    calculateRemark,
    calculateStudentProgress
};