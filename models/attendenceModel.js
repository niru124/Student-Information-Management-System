const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema({
    teacherId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Teacher',
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    department: {
        type: String,
        required: true
    },
    attendance: [{
        studentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Student',
            required: true
        },
        subject: {
            type: String,  // Store the subject as a simple string to avoid nested references
            required: true
        },
        present: {
            type: Number,
            required: true
        }
    }],
    totalDays: {
        type: Number,
        default: 300
    }
});

const Attendance = mongoose.model("Attendance", attendanceSchema);

module.exports = Attendance;


