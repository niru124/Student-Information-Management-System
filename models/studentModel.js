const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
    username: { type: String, required: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    password: { type: String, required: true },
    department: { type: String, required: true },  // Ensure this is required
    DOB: { type: Date, required: true }
});

const studentModel = mongoose.model('Student', studentSchema); // Ensure the model is created

module.exports = studentModel; // Make sure to export the model

