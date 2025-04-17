const mongoose = require('mongoose');

// Define the Subject Schema
const subjectSchema = new mongoose.Schema({
    department: {
        type: String,
        required: true
    }, // Department name (e.g., CSE, Electrical, etc.)
    subjects: [{
        type: String,
        required: true
    }] // Array of subjects for that department
});

// Create the Subject model
const Subject = mongoose.model('Subject', subjectSchema);
module.exports = Subject;

