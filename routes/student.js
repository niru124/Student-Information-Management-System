const express = require('express');
const path = require("path")
const router = express.Router();
const studentModel = require('../models/studentModel');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const { generateToken } = require('../utils/generateToken');
const app = express();
const multer = require("multer")
const notesModel = require("../models/notesModel")
// const checkAuth = require("../middlewares/checkauth")
const attendenceModel = require("../models/attendenceModel")
const subjectModel = require("../models/attendenceModel");
const { parse } = require('dotenv');
const fs = require('fs');
const docker = require('dockerode');
const dockerClient = new docker();
const cors = require("cors");
const http = require("http")
const { SocketAddress } = require("net");
const server = http.createServer(app);
app.use(cors());
const { Server } = require("socket.io");
const teacherModel = require("../models/teacherModel")
const announceModel = require("../models/announceModel")

app.use(
    session({
        secret: process.env.JWT_KEY,
        resave: false,
        saveUninitialized: true,
    })
);

// app.use('/uploads', checkAuth, express.static(path.join(__dirname, '../uploads')));
console.log(path.join(__dirname, '../uploads'));
app.use(cookieParser())
app.use(express.json());


router.get("/uploads/:filename", (req, res) => {
    if (!req.session.student) {
        return res.redirect("/students/login");
    }
    console.log("hello"); // This should print if the route is hit
    const filename = req.params.filename;
    const filePath = path.join(__dirname, '../uploads', filename);

    res.sendFile(filePath, (err) => {
        if (err) {
            console.error(err);
            res.status(err.status).end();
        }
    });
});


router.get("/", (req, res) => {
    res.send("Student route");
});

router.get("/register", (req, res) => {
    res.render("register");
});

router.get("/register/congrats", (req, res) => {
    res.render("congrats");
});

router.post("/register", async (req, res) => {
    try {
        const { username, name, email, phone, department, password, DOB } = req.body;

        if (await studentModel.findOne({ email })) {
            return res.status(400).send("User already exists");
        }

        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);

        const student = new studentModel({
            name,
            email,
            phone,
            department,
            DOB,
            username,
            password: hash
        });

        await student.save();
        const token = generateToken(student);
        res.cookie("jwt", token);
        res.redirect("/students/register/congrats");
    } catch (error) {
        console.error(error);
        return res.status(400).send("Invalid data");
    }
});

router.get("/login", (req, res) => {
    res.render("login");
});

router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log(req.body)
        const student = await studentModel.findOne({ email: email });
        if (!student) return res.status(400).send("User not found");

        const validate = await bcrypt.compare(password, student.password);
        if (!validate) return res.status(400).send("Invalid credentials");

        req.session.student = { id: student._id, email: student.email };
        res.redirect("/students/spage");
    } catch (error) {
        console.error(error);
        return res.status(400).send("Login failed");
    }
});

router.get("/spage", (req, res) => {
    if (!req.session.student) {
        return res.redirect("/students/login");
    }
    res.render("spage", { user: "student" });
});

router.get("/profile", async (req, res) => {
    console.log("This is student and profile came here")
    if (!req.session.student) {
        return res.redirect("/students/login");
    }

    try {
        const userDetails = await studentModel.findOne({ email: req.session.student.email });
        if (!userDetails) {
            return res.status(404).send("User not found");
        }
        res.render("profile", { details: [userDetails] }); // Pass user details as an array
    } catch (error) {
        console.error(error);
        res.status(500).send("Server error");
    }
});

//
// app.use('/students/uploads', (req, res, next) => {
//     console.log(`Request for: ${req.url}`);
//     next();
// }, express.static(path.join(__dirname, 'uploads')));
//

router.get("/snotes", async (req, res) => {
    if (!req.session.student) {
        return res.redirect("/students/login");
    }
    // res.render("snotes");
    const userDetails = await studentModel.findOne({ email: req.session.student.email });
    const studentDepartment = userDetails.department;
    console.log(studentDepartment)

    try {
        // Fetch notes that match the student's department
        const notes = await notesModel.find({ department: studentDepartment }).populate('teacherId', 'name');
        console.log(notes);
        res.render("snotes", { notes });
    } catch (error) {
        console.error(error);
        res.status(500).send("Error fetching notes: " + error.message);
    }
});

// router.get("/cprofile", (req, res) => {
//     res.render("cprofile")
// })

router.get("/cprofile", async (req, res) => {
    if (!req.session.student) {
        return res.redirect("/students/login");
    }

    try {
        const userDetails = await studentModel.findOne({ email: req.session.student.email });
        if (!userDetails) {
            return res.status(404).send("User not found");
        }
        res.render("cprofile", { details: [userDetails] }); // Pass user details as an array
    } catch (error) {
        console.error(error);
        res.status(500).send("Server error");
    }
});

router.post("/edit", async (req, res) => {
    if (!req.session.student) res.redirect("/students/login")

    try {
        const { username, name, email, phone, department, password } = req.body;
        console.log(req.body)
        const userDetails = await studentModel.findOne({ email: req.session.student.email });
        userDetails.username = username
        userDetails.name = name
        userDetails.phone = phone

        if (password !== "" && password.trim() !== "") {
            const bcrypt = require('bcrypt');
            const hashedPassword = await bcrypt.hash(password, 10); // Hash with salt rounds
            userDetails.password = hashedPassword;
        }
        await userDetails.save()
        res.redirect("/students/profile")
    }
    catch {
        res.status(500).send("Server error")
    }
})

router.get("/attendance", async (req, res) => {
    if (!req.session.student) {
        return res.redirect("/students/login");
    }

    const studentId = req.session.student.id;
    const dept = await studentModel.findOne({ email: req.session.student.email })
    const department = dept.department;

    console.log(studentId + "  " + department)
    try {
        // Find attendance records for the student's department and student ID
        const attendanceRecords = await attendenceModel.find({
            department,
            'attendance.studentId': studentId
        }).populate('attendance.studentId').populate('attendance.subject');

        console.log("Attendance Records:", attendanceRecords); // Debug log

        // Extract attendance data for the current student
        const attendanceData = [];
        let totalPresent = 0;
        let monthlyPresent;
        let totalDays = 0;
        const graphData = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

        attendanceRecords.forEach(record => {
            totalDays = record.totalDays; // Assuming totalDays is the same for each record in the department
            record.attendance.forEach(att => {
                if (att.studentId.equals(studentId)) {
                    attendanceData.push({
                        studentId: att.studentId.name,  // Logging student ID
                        subject: att.subject,  // Logging subject name directly
                        present: att.present,
                        date: record.createdAt
                    });
                    let toi = record.createdAt.getMonth() + 1;
                    toi -= 1;
                    console.log(typeof (toi))
                    if (att.present) {
                        if (graphData[toi] === 0) { graphData[toi] = 1; monthlyPresent = 1; }
                        else {
                            monthlyPresent = monthlyPresent + 1
                            graphData[toi] = monthlyPresent;
                            console.log(monthlyPresent, "in the month ", toi)
                        }
                        totalPresent += 1;
                    }
                }
            });
        });

        console.log("Extracted Attendance Data:", attendanceData); // Debug log

        console.log("Graph Data is " + graphData)
        const attendancePercentage = ((totalPresent / totalDays) * 100).toFixed(2);

        // Render the EJS page with the extracted data
        res.render("studentAttendance", {
            department,
            attendanceData,
            totalDays,
            totalPresent,
            attendancePercentage,
            graphData
        });
    } catch (error) {
        console.error("Error fetching attendance:", error);
        res.status(500).send("Server error");
    }
});

// async function executeCodeInDocker(code, language) {
//     return new Promise((resolve, reject) => {
//         let dockerCommand;
//
//         // Handle C++ language
//         if (language === "cpp") {
//             const escapedCode = code.replace(/"/g, '\\"').replace(/\n/g, '\\n');
//             dockerCommand = echo -e "${escapedCode}" | docker run --rm -i gcc:latest sh -c "mkdir /tmp/myfolder && g++ -o /tmp/myfolder/output -x c++ /dev/stdin && /tmp/myfolder/output";
//
//             // Handle C language
//         } else if (language === "c") {
//             const escapedCode = code.replace(/"/g, '\\"').replace(/\n/g, '\\n');
//             dockerCommand = echo -e "${escapedCode}" | docker run --rm -i gcc:latest sh -c "mkdir /tmp/myfolder && gcc -o /tmp/myfolder/output -x c /dev/stdin && /tmp/myfolder/output";
//
//             // Handle Python language
//         } else if (language === "python") {
//             dockerCommand = docker run --rm python:3.9 python -c "${code.replace(/"/g, '\\"')}";
//             // Handle Node.js language
//         } else if (language === "node") {
//             dockerCommand = docker run --rm -i node:16 sh -c "mkdir -p /tmp/myfolder && echo '${code.replace(/"/g, '\\"')}' > /tmp/myfolder/app.js && node /tmp/myfolder/app.js";
//             console.log('Executing Docker command for Node.js:', dockerCommand);  // Log the Docker command for debugging
//         }
//
//         else {
//             reject("Unsupported language");
//             return;
//         }
//
//         exec(dockerCommand, (error, stdout, stderr) => {
//             if (error) {
//                 reject(stderr || "Error executing code.");
//             } else {
//                 const cleanOutput = stdout.replace(/[^\x20-\x7E\n]/g, '').trim();
//                 resolve(cleanOutput);
//             }
//         });
//     });
// }
//
// // Route to run code
// router.post("/run-code", async (req, res) => {
//     if (!req.session.student) res.redirect("/students/login")
//     console.log("Hello")
//     const { code, language } = req.body;
//     console.log(req.body);
//     try {
//         console.log("Hello2")
//         const result = await executeCodeInDocker(code, language);
//         res.json({ output: result });
//     } catch (error) {
//         console.error("Execution error:", error);
//         res.status(500).json({ output: Error executing code.+${error} });
//     }
// });

//limit memory and timing of the users
// const { exec } = require('child_process');
// const fs = require('fs');
// const path = require('path');
// const crypto = require('crypto');
//
// // Function to execute code with time and memory limits
// async function executeCodeWithLimits(code, language) {
//     return new Promise((resolve, reject) => {
//         const tempDir = path.join(__dirname, 'temp');
//         if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);
//
//         // Generate a unique file name
//         const fileName = crypto.randomBytes(16).toString('hex');
//         let command;
//         let filePath;
//
//         // Set file path based on language
//         if (language === 'cpp' || language === 'c') {
//             const extension = language === 'cpp' ? 'cpp' : 'c';
//             filePath = path.join(tempDir, `${fileName}.${extension}`);
//             fs.writeFileSync(filePath, code);
//
//             const compiler = language === 'cpp' ? 'g++' : 'gcc';
//             // Using ulimit to set execution time (2 seconds) and memory limit (64MB)
//             command = `ulimit -t 2 -v 64000 && ${compiler} ${filePath} -o ${tempDir}/program && ${tempDir}/program`;
//         } else if (language === 'python') {
//             filePath = path.join(tempDir, `${fileName}.py`);
//             fs.writeFileSync(filePath, code);
//
//             // Limit execution time to 2 seconds
//             command = `ulimit -t 2 && python3 ${filePath}`;
//         } else if (language === 'node') {
//             filePath = path.join(tempDir, `${fileName}.js`);
//             fs.writeFileSync(filePath, code);
//
//             // Limit execution time to 2 seconds
//             command = `ulimit -t 2 && node ${filePath}`;
//         } else {
//             return reject("Unsupported language");
//         }
//
//         exec(command, (error, stdout, stderr) => {
//             // Clean up files after execution
//             if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
//
//             if (error) {
//                 reject(stderr || `Error executing code: ${error}`);
//             } else {
//                 resolve(stdout.trim());
//             }
//         });
//     });
// }

const projectDir = path.join(__dirname); // Current directory where the script is running
const { exec, spawn } = require('child_process');
// Function to execute code in different languages
async function executeCode(code, language) {
    return new Promise((resolve, reject) => {
        let command;
        let filePath;
        const tempDir = path.join(__dirname, 'temp');  // Ensure it's a safe directory

        // Create temp directory if it doesn't exist
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir);
        }

        // Handle different languages
        if (language === "cpp" || language === "c") {
            const extension = language === "cpp" ? "cpp" : "c";
            filePath = path.join(tempDir, `program.${extension}`);
            fs.writeFileSync(filePath, code);

            const compiler = language === "cpp" ? "g++" : "gcc";
            command = `${compiler} ${filePath} -o ${tempDir}/program && ${tempDir}/program`;
        } else if (language === "python") {
            command = `python3 -c "${code.replace(/"/g, '\\"')}"`;
        } else if (language === "node") {
            filePath = path.join(tempDir, 'app.js');
            fs.writeFileSync(filePath, code);
            command = `node ${filePath}`;
        } else {
            return reject("Unsupported language");
        }

        // Execute the command
        const child = exec(command, (error, stdout, stderr) => {
            // Cleanup files
            if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);
            if (fs.existsSync(path.join(tempDir, 'program'))) fs.unlinkSync(path.join(tempDir, 'program'));

            if (error) {
                reject(stderr || `Error executing code: ${error}`);
            } else {
                const cleanOutput = stdout.replace(/[^\x20-\x7E\n]/g, '').trim();
                resolve(cleanOutput);
            }
        });

        // Timeout for long-running processes (e.g., infinite loops)
        setTimeout(() => {
            child.kill();
            reject('Execution timed out.');
        }, 5000);  // Adjust timeout as necessary
    });
}

// Route to run code
router.post("/run-code", async (req, res) => {
    // if (!req.session.student) res.redirect("/students/login")
    console.log("Hello")
    const { code, language } = req.body;
    console.log(req.body);
    try {
        console.log("Hello2")
        const result = await executeCode(code, language);
        res.json({ output: result });
    } catch (error) {
        console.error("Execution error:", error);
        res.status(500).json({ output: `Error executing code: ${error}` });
    }
});


router.get("/run-code", (req, res) => {
    // if (!req.session.student) res.redirect("/students/login");

    // Pass the BASE_URL to the EJS template
    res.render("index", { baseUrl: process.env.BASE_URL });
});

// Route to run code
router.post("/run-code", async (req, res) => {
    // if (!req.session.student) res.redirect("/students/login")
    console.log("Hello")
    const { code, language } = req.body;
    console.log(req.body);
    try {
        console.log("Hello2")
        const result = await executeCode(code, language);
        res.json({ output: result });
    } catch (error) {
        console.error("Execution error:", error);
        res.status(500).json({ output: `Error executing code: ${error}` });
    }
});


router.get("/run-code", (req, res) => {
    // if (!req.session.student) res.redirect("/students/login")
    res.render("index")
})

//
// router.get("/chat", (req, res) => {
//     if (!req.session.student) res.redirect("/students/login")
//     res.render("chat");
// })
//
const io = new Server(server)
// Route to display the list of teachers a student can chat with
router.get('/chat', async (req, res) => {
    if (!req.session.student) { // Fixed this line, should be `req.session.student`
        return res.redirect('/students/login');
    }

    const student = await studentModel.findOne({ email: req.session.student.email });
    const teachers = await teacherModel.find({ department: student.department }); // `teachers` instead of `teacher` to reflect the list of teachers
    res.render('studentChat', { teachers }); // Render a list of teachers
});

// Route to display the chat room with a specific teacher
router.get('/chat/:teacherId', async (req, res) => {
    if (!req.session.student) {
        return res.redirect('/students/login');
    }

    const student = await studentModel.findOne({ email: req.session.student.email });
    const teacher = await teacherModel.findById(req.params.teacherId);

    if (!teacher) {
        return res.status(404).send('Teacher not found'); // Corrected error message
    }

    res.render('schatRoom', { student, teacher });
});

router.get("/announcement", async (req, res) => {

    const studenti = await studentModel.findOne({ email: req.session.student.email });
    console.log(studenti)
    const dept = studenti.department;

    const announcements = await announceModel.find({ department: dept });
    console.log(announcements)
    res.render("sannounce", ({ announcements }))
})

module.exports = router; // Make sure to export the router
