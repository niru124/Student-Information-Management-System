const mongoose = require("mongoose");

const notesSchema = new mongoose.Schema({
    title: { type: String, required: true },
    fileUrl: { type: String, required: true },
    teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' },
    createdAt: { type: Date, default: Date.now() },
    department: { type: String, required: true }
})

const notesModel = mongoose.model('Note', notesSchema);
module.exports = notesModel;
