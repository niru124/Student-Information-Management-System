const mongoose = require("mongoose");
const dbgr = require("debug")("development:mongoose");

// Fetch the MongoDB URI from environment variables
const mongoUri = process.env.MONGODB_URI || "mongodb://localhost:27017"; // Default to local if not set in .env

// Connect to the database using mongoose
mongoose.connect(`${mongoUri}/information`)
    .then(function () {
        dbgr("Connecting to db");
    })
    .catch(err => dbgr("Error in connecting to db: " + err));

module.exports = mongoose.connection;

