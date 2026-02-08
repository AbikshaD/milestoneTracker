// Calculate grade based on marks (10-point system for engineering)
const calculateGrade = (marks) => {
    if (marks >= 90) return { grade: 'S', points: 10 };
    if (marks >= 80) return { grade: 'A', points: 9 };
    if (marks >= 70) return { grade: 'B', points: 8 };
    if (marks >= 60) return { grade: 'C', points: 7 };
    if (marks >= 55) return { grade: 'D', points: 6 };
    if (marks >= 50) return { grade: 'E', points: 5 };
    return { grade: 'F', points: 0 };
};

// Calculate CGPA (Cumulative Grade Point Average)
const calculateCGPA = (marksArray, subjects) => {
    if (!marksArray || marksArray.length === 0) {
        return {
            cgpa: 0,
            sgpa: {},
            totalCredits: 0,
            earnedCredits: 0,
            grade: 'N/A',
            status: 'Not Evaluated',
            progressRemark: 'No marks entered'
        };
    }

    // Group marks by semester
    const semesterData = {};
    marksArray.forEach(mark => {
        if (!semesterData[mark.semester]) {
            semesterData[mark.semester] = [];
        }
        semesterData[mark.semester].push(mark);
    });

    // Calculate SGPA for each semester
    const sgpaResults = {};
    let totalCredits = 0;
    let totalGradePoints = 0;

    Object.keys(semesterData).forEach(semester => {
        const semesterMarks = semesterData[semester];
        let semesterCredits = 0;
        let semesterGradePoints = 0;

        semesterMarks.forEach(mark => {
            const subject = subjects.find(s => s._id.toString() === mark.subjectId.toString());
            if (subject) {
                semesterCredits += subject.credits;
                semesterGradePoints += mark.gradePoints * subject.credits;
            }
        });

        const sgpa = semesterCredits > 0 ? semesterGradePoints / semesterCredits : 0;
        sgpaResults[semester] = {
            sgpa: parseFloat(sgpa.toFixed(2)),
            credits: semesterCredits,
            gradePoints: parseFloat(semesterGradePoints.toFixed(2))
        };

        totalCredits += semesterCredits;
        totalGradePoints += semesterGradePoints;
    });

    // Calculate CGPA
    const cgpa = totalCredits > 0 ? totalGradePoints / totalCredits : 0;
    const earnedCredits = marksArray.filter(m => m.grade !== 'F').reduce((sum, m) => {
        const subject = subjects.find(s => s._id.toString() === m.subjectId.toString());
        return sum + (subject ? subject.credits : 0);
    }, 0);

    // Determine overall grade and status
    let grade, status;
    if (cgpa >= 9) {
        grade = 'S';
        status = 'Graduated';
    } else if (cgpa >= 8) {
        grade = 'A';
        status = 'Passed';
    } else if (cgpa >= 7) {
        grade = 'B';
        status = 'Passed';
    } else if (cgpa >= 6) {
        grade = 'C';
        status = 'Passed';
    } else if (cgpa >= 5) {
        grade = 'D';
        status = 'Passed';
    } else if (cgpa > 0) {
        grade = 'E';
        status = 'Passed';
    } else {
        grade = 'F';
        status = 'Failed';
    }

    // Calculate progress remark
    const progressRemark = calculateEngineeringRemark(cgpa, earnedCredits, totalCredits);

    return {
        cgpa: parseFloat(cgpa.toFixed(2)),
        sgpa: sgpaResults,
        totalCredits,
        earnedCredits,
        grade,
        status,
        progressRemark
    };
};

// Calculate progress remark for engineering
const calculateEngineeringRemark = (cgpa, earnedCredits, totalCredits) => {
    const creditCompletion = totalCredits > 0 ? (earnedCredits / totalCredits) * 100 : 0;
    
    if (cgpa >= 9) {
        return 'Excellent - First Class with Distinction';
    } else if (cgpa >= 8) {
        return 'Very Good - First Class';
    } else if (cgpa >= 7) {
        return 'Good - Higher Second Class';
    } else if (cgpa >= 6) {
        return 'Above Average - Second Class';
    } else if (cgpa >= 5) {
        return 'Average - Pass Class';
    } else if (cgpa > 0) {
        return 'Below Average - Requires improvement';
    } else if (creditCompletion >= 75) {
        return 'Borderline - At risk of academic probation';
    } else {
        return 'Critical - Academic probation';
    }
};

// Calculate semester-wise performance
const calculateSemesterPerformance = (marks, subjects) => {
    const performance = {};
    
    marks.forEach(mark => {
        const semester = mark.semester;
        if (!performance[semester]) {
            performance[semester] = {
                totalSubjects: 0,
                passedSubjects: 0,
                failedSubjects: 0,
                totalCredits: 0,
                earnedCredits: 0,
                totalMarks: 0,
                averageMarks: 0
            };
        }
        
        const subject = subjects.find(s => s._id.toString() === mark.subjectId.toString());
        if (subject) {
            performance[semester].totalSubjects++;
            performance[semester].totalCredits += subject.credits;
            performance[semester].totalMarks += mark.totalMarks;
            
            if (mark.grade !== 'F') {
                performance[semester].passedSubjects++;
                performance[semester].earnedCredits += subject.credits;
            } else {
                performance[semester].failedSubjects++;
            }
        }
    });
    
    // Calculate averages
    Object.keys(performance).forEach(semester => {
        if (performance[semester].totalSubjects > 0) {
            performance[semester].averageMarks = 
                parseFloat((performance[semester].totalMarks / performance[semester].totalSubjects).toFixed(2));
        }
    });
    
    return performance;
};

module.exports = {
    calculateGrade,
    calculateCGPA,
    calculateEngineeringRemark,
    calculateSemesterPerformance
};