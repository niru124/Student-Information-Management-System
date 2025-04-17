const mongoose = require("mongoose")

const announcementSchema = new mongoose.Schema({
    department: ({ type: String, required: true }),
    title: ({ type: String, required: true }),
    description: ({ type: String, required: true }),
    createdAt: ({ type: Date, default: Date.now() }),
})

const announModel = mongoose.model('Announcement', announcementSchema);
module.exports = announModel;  
