require("dotenv").config(); // Load environment variables
const express = require("express");
const path = require("path");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const studentRouter = require("./routes/student");
const teacherRouter = require("./routes/teacher");
const db = require("./config/config");
const app = express();
const checkAuth = require("./middlewares/checkauth");
app.set("view engine", "ejs");
const socketio = require('socket.io');
const fs = require("fs")
const cors = require("cors");

app.use(cors());
// Middleware setup
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

// app.use('/students/uploads', checkAuth, express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, "public")));

// Session middleware
app.use(
    session({
        secret: process.env.JWT_KEY || "default_secret", // Fallback secret for development
        resave: false,
        saveUninitialized: false,
    }),
);

app.get("/", (req, res) => {
    res.render("homepage");
});

app.get("/register", (req, res) => {
    res.render("register");
});

app.get("/login", (req, res) => {
    res.render("login");
});

app.get("/profile", (req, res) => {
    res.render("profile");
});

// Mount routers
app.use("/students", studentRouter);
app.use("/teachers", teacherRouter);
// Start the server
const server = app.listen(8096, () => {
    console.log("Server has started on http://localhost:8096");
});
// app.get('/test-upload', (req, res) => {
//     res.sendFile(path.join(__dirname, 'uploads', '9f2778e8dc94a9e9ca29.pdf'), (err) => {
//         if (err) {
//             console.error(err);
//             res.status(err.status).end();
//         }
//     });
// });
// Set up Socket.IO

const io = socketio(server);
const filesUpload = path.join(__dirname, 'uploads');
let users = {}; // Object to store connected users
// Ensure the upload folder exists
if (!fs.existsSync(filesUpload)) {
    fs.mkdirSync(filesUpload);
}

io.on('connection', (socket) => {
    console.log('a user connected:', socket.id);

    // Handle user message
    socket.on('user-message', (message) => {
        io.emit('message', message); // Emit to all connected clients
        console.log('Message sent:', message);
    });

    // Handle image upload
    socket.on('image-upload', (image) => {
        const filename = `${Date.now()}.png`;
        fs.writeFile(path.join(filesUpload, filename), image, (err) => {
            if (err) {
                console.error('Error saving image:', err);
                return;
            }
            console.log('Image uploaded successfully');
        });

        // Broadcast image to all users
        const b64 = Buffer.from(image).toString('base64');
        const mimeType = 'image/png'; // Assume PNG for simplicity
        io.emit('image', `data:${mimeType};base64,${b64}`);
    });

    // Handle file upload
    socket.on('file-upload', (file) => {
        const { name, data } = file;
        const ext = path.extname(name);
        const filename = `${Date.now()}${ext}`;

        fs.writeFile(path.join(filesUpload, filename), data, (err) => {
            if (err) {
                console.error('Error saving file:', err);
                return;
            }
            console.log('File uploaded successfully');
        });

        const b64 = Buffer.from(data).toString('base64');
        let mimeType = 'application/octet-stream';

        switch (ext.toLowerCase()) {
            case '.pdf':
                mimeType = 'application/pdf';
                break;
            case '.txt':
                mimeType = 'text/plain';
                break;
        }

        io.emit('sendfile', {
            name: filename,
            data: `data:${mimeType};base64,${b64}`,
        });
    });

    // Handle disconnection
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});
