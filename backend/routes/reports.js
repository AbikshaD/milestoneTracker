const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const Subject = require('../models/Subject');
const Mark = require('../models/Mark');
const { calculateStudentProgress } = require('../utils/calculator');

// Generate student report card
router.get('/student/:id/report', async (req, res) => {
    try {
        const student = await Student.findById(req.params.id);
        if (!student) {
            return res.status(404).json({ error: 'Student not found' });
        }
        
        const marks = await Mark.find({ studentId: req.params.id })
            .populate('subjectId', 'name code');
        
        const report = {
            student: {
                id: student._id,
                studentId: student.studentId,
                name: student.name,
                class: student.class,
                department: student.department,
                email: student.email,
                phone: student.phone,
                address: student.address
            },
            academicYear: new Date().getFullYear(),
            reportDate: new Date().toISOString().split('T')[0],
            subjects: marks.map(mark => ({
                subject: mark.subjectId.name,
                code: mark.subjectId.code,
                marks: mark.marks,
                grade: mark.marks >= 90 ? 'A+' :
                       mark.marks >= 80 ? 'A' :
                       mark.marks >= 70 ? 'B+' :
                       mark.marks >= 60 ? 'B' :
                       mark.marks >= 50 ? 'C' :
                       mark.marks >= 40 ? 'D' : 'F',
                status: mark.marks >= 40 ? 'Pass' : 'Fail',
                examDate: mark.examDate
            })),
            summary: {
                totalMarks: student.totalMarks,
                average: student.average,
                grade: student.grade,
                overallStatus: student.status,
                progressRemark: student.progressRemark,
                totalSubjects: marks.length,
                passedSubjects: marks.filter(m => m.marks >= 40).length,
                failedSubjects: marks.filter(m => m.marks < 40).length
            },
            performanceAnalysis: {
                strongSubjects: marks.filter(m => m.marks >= 80).map(m => m.subjectId.name),
                averageSubjects: marks.filter(m => m.marks >= 60 && m.marks < 80).map(m => m.subjectId.name),
                weakSubjects: marks.filter(m => m.marks < 60).map(m => m.subjectId.name)
            }
        };
        
        res.json(report);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Generate class performance report
router.get('/class/:className/report', async (req, res) => {
    try {
        const students = await Student.find({ class: req.params.className })
            .sort({ average: -1 });
        
        const marks = await Mark.find()
            .populate('studentId')
            .populate('subjectId');
        
        const classMarks = marks.filter(mark => 
            mark.studentId && mark.studentId.class === req.params.className
        );
        
        const report = {
            className: req.params.className,
            reportDate: new Date().toISOString().split('T')[0],
            statistics: {
                totalStudents: students.length,
                averageClassScore: students.reduce((sum, s) => sum + s.average, 0) / students.length || 0,
                passPercentage: students.length > 0 ? 
                    ((students.filter(s => s.status === 'Pass').length / students.length) * 100).toFixed(2) : 0,
                topScorer: students.length > 0 ? {
                    name: students[0].name,
                    studentId: students[0].studentId,
                    average: students[0].average
                } : null,
                subjectAverages: {}
            },
            studentRankings: students.map((student, index) => ({
                rank: index + 1,
                name: student.name,
                studentId: student.studentId,
                average: student.average,
                grade: student.grade,
                status: student.status
            })),
            subjectWiseAnalysis: {}
        };
        
        // Calculate subject-wise averages
        const subjects = await Subject.find();
        subjects.forEach(subject => {
            const subjectMarks = classMarks.filter(m => 
                m.subjectId && m.subjectId._id.toString() === subject._id.toString()
            );
            if (subjectMarks.length > 0) {
                const avg = subjectMarks.reduce((sum, m) => sum + m.marks, 0) / subjectMarks.length;
                report.statistics.subjectAverages[subject.name] = avg.toFixed(2);
            }
        });
        
        res.json(report);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Generate department report
router.get('/department/:departmentName/report', async (req, res) => {
    try {
        const students = await Student.find({ department: req.params.departmentName });
        const classes = [...new Set(students.map(s => s.class))].sort();
        
        const report = {
            department: req.params.departmentName,
            reportDate: new Date().toISOString().split('T')[0],
            summary: {
                totalStudents: students.length,
                totalClasses: classes.length,
                averageScore: students.reduce((sum, s) => sum + s.average, 0) / students.length || 0,
                passPercentage: students.length > 0 ? 
                    ((students.filter(s => s.status === 'Pass').length / students.length) * 100).toFixed(2) : 0
            },
            classWisePerformance: classes.map(className => {
                const classStudents = students.filter(s => s.class === className);
                return {
                    class: className,
                    totalStudents: classStudents.length,
                    averageScore: classStudents.reduce((sum, s) => sum + s.average, 0) / classStudents.length || 0,
                    passPercentage: classStudents.length > 0 ? 
                        ((classStudents.filter(s => s.status === 'Pass').length / classStudents.length) * 100).toFixed(2) : 0
                };
            }),
            topStudents: students
                .filter(s => s.average > 0)
                .sort((a, b) => b.average - a.average)
                .slice(0, 10)
                .map(s => ({
                    name: s.name,
                    studentId: s.studentId,
                    class: s.class,
                    average: s.average,
                    grade: s.grade
                }))
        };
        
        res.json(report);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Generate overall institutional report
router.get('/institution/overall', async (req, res) => {
    try {
        const students = await Student.find();
        const subjects = await Subject.find();
        
        const report = {
            institutionName: "Learning Progress Monitor Institution",
            academicYear: new Date().getFullYear(),
            reportDate: new Date().toISOString().split('T')[0],
            overview: {
                totalStudents: students.length,
                totalSubjects: subjects.length,
                overallAverage: students.reduce((sum, s) => sum + s.average, 0) / students.length || 0,
                passPercentage: students.length > 0 ? 
                    ((students.filter(s => s.status === 'Pass').length / students.length) * 100).toFixed(2) : 0
            },
            departmentPerformance: await getDepartmentPerformance(),
            classPerformance: await getClassPerformance(),
            topAchievers: students
                .filter(s => s.average > 0)
                .sort((a, b) => b.average - a.average)
                .slice(0, 20)
                .map(s => ({
                    name: s.name,
                    studentId: s.studentId,
                    class: s.class,
                    department: s.department,
                    average: s.average,
                    grade: s.grade
                }))
        };
        
        res.json(report);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

async function getDepartmentPerformance() {
    const departments = await Student.distinct('department');
    const performance = [];
    
    for (const dept of departments) {
        if (!dept) continue;
        
        const deptStudents = await Student.find({ department: dept });
        const total = deptStudents.length;
        const passed = deptStudents.filter(s => s.status === 'Pass').length;
        
        performance.push({
            department: dept,
            totalStudents: total,
            passPercentage: total > 0 ? ((passed / total) * 100).toFixed(2) : 0,
            averageScore: deptStudents.reduce((sum, s) => sum + s.average, 0) / total || 0
        });
    }
    
    return performance.sort((a, b) => b.passPercentage - a.passPercentage);
}

async function getClassPerformance() {
    const classes = await Student.distinct('class');
    const performance = [];
    
    for (const className of classes) {
        if (!className) continue;
        
        const classStudents = await Student.find({ class: className });
        const total = classStudents.length;
        const passed = classStudents.filter(s => s.status === 'Pass').length;
        
        performance.push({
            class: className,
            totalStudents: total,
            passPercentage: total > 0 ? ((passed / total) * 100).toFixed(2) : 0,
            averageScore: classStudents.reduce((sum, s) => sum + s.average, 0) / total || 0
        });
    }
    
    return performance.sort((a, b) => b.passPercentage - a.passPercentage);
}

// Export reports to CSV
router.get('/export/:type/:id', async (req, res) => {
    try {
        const { type, id } = req.params;
        
        let csvData = '';
        
        if (type === 'student') {
            const report = await generateStudentReportCSV(id);
            csvData = report;
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename=student-report-${id}.csv`);
        } else if (type === 'class') {
            const report = await generateClassReportCSV(id);
            csvData = report;
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename=class-report-${id}.csv`);
        } else {
            return res.status(400).json({ error: 'Invalid report type' });
        }
        
        res.send(csvData);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

async function generateStudentReportCSV(studentId) {
    const student = await Student.findById(studentId);
    const marks = await Mark.find({ studentId })
        .populate('subjectId', 'name code');
    
    let csv = `Student Report Card\n\n`;
    csv += `Student ID,${student.studentId}\n`;
    csv += `Name,${student.name}\n`;
    csv += `Class,${student.class}\n`;
    csv += `Department,${student.department}\n`;
    csv += `Report Date,${new Date().toISOString().split('T')[0]}\n\n`;
    
    csv += `Subject,Code,Marks,Grade,Status\n`;
    marks.forEach(mark => {
        const grade = mark.marks >= 90 ? 'A+' :
                     mark.marks >= 80 ? 'A' :
                     mark.marks >= 70 ? 'B+' :
                     mark.marks >= 60 ? 'B' :
                     mark.marks >= 50 ? 'C' :
                     mark.marks >= 40 ? 'D' : 'F';
        const status = mark.marks >= 40 ? 'Pass' : 'Fail';
        csv += `${mark.subjectId.name},${mark.subjectId.code},${mark.marks},${grade},${status}\n`;
    });
    
    csv += `\nSummary\n`;
    csv += `Total Marks,${student.totalMarks}\n`;
    csv += `Average,${student.average}\n`;
    csv += `Overall Grade,${student.grade}\n`;
    csv += `Status,${student.status}\n`;
    csv += `Remark,${student.progressRemark}\n`;
    
    return csv;
}

async function generateClassReportCSV(className) {
    const students = await Student.find({ class: className })
        .sort({ average: -1 });
    
    let csv = `Class Performance Report - ${className}\n\n`;
    csv += `Report Date,${new Date().toISOString().split('T')[0]}\n`;
    csv += `Total Students,${students.length}\n\n`;
    
    csv += `Rank,Student ID,Name,Average,Grade,Status\n`;
    students.forEach((student, index) => {
        csv += `${index + 1},${student.studentId},${student.name},${student.average},${student.grade},${student.status}\n`;
    });
    
    const passed = students.filter(s => s.status === 'Pass').length;
    const averageScore = students.reduce((sum, s) => sum + s.average, 0) / students.length || 0;
    
    csv += `\nSummary\n`;
    csv += `Class Average,${averageScore.toFixed(2)}\n`;
    csv += `Pass Percentage,${((passed / students.length) * 100).toFixed(2)}%\n`;
    csv += `Total Passed,${passed}\n`;
    csv += `Total Failed,${students.length - passed}\n`;
    
    return csv;
}

module.exports = router;