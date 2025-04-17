const mongoose = require('mongoose')

const teacherSchema = new mongoose.Schema({
    username: { type: String, required: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    department: { type: String, required: true },
    password: { type: String, required: true }
});


const teacherModel = mongoose.model('Teacher', teacherSchema); // Ensure the model is created

module.exports = teacherModel; // Make sure to export the model

