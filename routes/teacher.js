const express = require('express');
const multer = require("multer")
const router = express.Router();
const teacherModel = require('../models/teacherModel');
const notesModel = require('../models/notesModel')
const cookieParser = require('cookie-parser');
const session = require('express-session');
const { generateToken } = require('../utils/generateToken');
const app = express();
const crypto = require('crypto');
const path = require("path")
const Subject = require("../models/subjectModel");
const studentModel = require('../models/studentModel');
const attendenceModel = require('../models/attendenceModel');
const Attendance = require('../models/attendenceModel');
const http = require("http")
const { SocketAddress } = require("net");
const server = http.createServer(app);
const { Server } = require("socket.io");
const uploadDir = "uploads";
const fs = require("fs")
const announceModel = require("../models/announceModel")

app.use(
    session({
        secret: process.env.JWT_KEY,
        resave: false,
        saveUninitialized: true,
    })
);

const hardcodedSubjects = [
    { department: 'CSE', subjects: ['Mathematics', 'Physics', 'Computer Science', 'Data Structures'] },
    { department: 'Electrical', subjects: ['Circuits', 'Electrical Machines', 'Power Systems', 'Control Systems'] },
    { department: 'Mechanical', subjects: ['Thermodynamics', 'Fluid Mechanics', 'Machine Design', 'Manufacturing'] }
];

app.use(cookieParser())

router.get("/", (req, res) => {
    res.send("Teacher route");
});

router.get("/register", (req, res) => {
    res.render("register");
});

router.post("/register", async (req, res) => {
    try {
        const { username, name, email, phone, department, password } = req.body;
        console.log(req.body)
        if (await teacherModel.findOne({ email })) {
            return res.status(400).send("User already exists");
        }

        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);

        const teacher = new teacherModel({
            name,
            email,
            phone,
            department,
            username,
            password: hash
        });

        await teacher.save();
        const token = generateToken(teacher);
        res.cookie("jwt", token);
        res.redirect("/teachers/register/congrats");
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

        const teacher = await teacherModel.findOne({ email: email });
        if (!teacher) return res.status(400).send("User not found");

        const validate = await bcrypt.compare(password, teacher.password);
        if (!validate) return res.status(400).send("Invalid credentials");

        req.session.teacher = { id: teacher._id, email: teacher.email };
        res.redirect("/teachers/spage");
    } catch (error) {
        console.error(error);
        return res.status(400).send("Login failed");
    }
});

router.get("/register/congrats", (req, res) => {
    res.render("congrats");
});


router.get("/spage", (req, res) => {
    if (!req.session.teacher) {
        return res.redirect("/teachers/login");
    }
    console.log(req.session.teacher)
    res.render("spage", { user: "teacher" });
});


router.get("/profile", (req, res) => {
    if (!req.session.teacher) {
        return res.redirect("/teachers/login");
    }
    console.log(req.session.teacher)
    res.render("profile");
});


const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const rando = crypto.randomBytes(10).toString('hex');
        const extension = path.extname(file.originalname);
        const filename = `${rando}${extension}`;
        cb(null, filename);
    }
});

const upload = multer({ storage: storage });

router.post("/tnotes", upload.single('file'), async (req, res) => {
    console.log("+++++++++++++++++++++++++++++++++++++++++++++++")
    if (!req.session.teacher) {
        return res.redirect("/teacher/login");
    }
    console.log("-----------------------------------------------")
    console.log(req.session.teacher.id);
    const { title, department } = req.body;
    console.log("Title: " + req.body.title);
    console.log(req.body.department);
    // Handle any errors that occurred during the upload
    if (!req.file) {
        return res.status(400).send("No file uploaded.");
    }

    const note = new notesModel({
        title,
        teacherId: req.session.teacher.id,
        department,
        fileUrl: req.file.path
    })

    console.log(note);
    await note.save();
    res.redirect("/teachers/spage")
});

app.use((err, req, res, next) => {
    console.error(err);
    dres.status(500).send("Internal server error");
});

router.get("/tprofile", async (req, res) => {
    console.log("Profile came here");
    if (!req.session.teacher) {
        return res.redirect("/teachers/login");
    }

    try {
        const userDetails = await teacherModel.findOne({ email: req.session.teacher.email });
        if (!userDetails) {
            return res.status(404).send("User not found");
        }
        res.render("tprofile", { details: [userDetails] }); // Pass user details as an array
    } catch (error) {
        console.error(error);
        res.status(500).send("Server error");
    }
});


router.get("/ctprofile", async (req, res) => {
    console.log("ctprofile came here")
    if (!req.session.teacher) {
        return res.redirect("/teachers/login");
    }

    try {
        console.log("printing.....")
        const userDetails = await teacherModel.findOne({ email: req.session.teacher.email });
        if (!userDetails) {
            return res.status(404).send("User not found");
        }
        res.render("ctprofile", { details: [userDetails] }); // Pass user details as an array
    } catch (error) {
        console.error(error);
        res.status(500).send("Server error");
    }
});

router.post("/edit", async (req, res) => {
    if (!req.session.teacher) res.redirect("/teachers/login")

    try {
        const { username, name, email, phone, department, password } = req.body;
        console.log(req.body)
        const userDetails = await teacherModel.findOne({ email: req.session.teacher.email });
        userDetails.username = username
        userDetails.name = name
        userDetails.phone = phone

        if (password !== "" && password.trim() !== "") {
            const bcrypt = require('bcrypt');
            const hashedPassword = await bcrypt.hash(password, 10); // Hash with salt rounds
            userDetails.password = hashedPassword;
        }
        await userDetails.save()
        res.redirect("/teachers/tprofile")
    }
    catch {
        res.status(500).send("Server error")
    }
})



router.get("/tnotes", async (req, res) => {
    res.render("tnotes")
})

const insertHardcodedSubjects = async () => {
    try {
        for (const data of hardcodedSubjects) {
            const existingSubject = await Subject.findOne({ department: data.department });

            if (!existingSubject) {
                const newSubject = new Subject({
                    department: data.department,
                    subjects: data.subjects
                });
                await newSubject.save();
                console.log(`Added subjects for ${data.department}`);
            } else {
                console.log(`${data.department} already exists in the database.`);
            }
        }
    } catch (error) {
        console.error('Error inserting hardcoded subjects:', error);
    }
};

// Call this function at server startup
insertHardcodedSubjects();

router.get("/attendance", async (req, res) => {
    try {
        const user = await teacherModel.findOne({ email: req.session.teacher.email })
        const teacherDept = user.department;  // Get teacher's department
        console.log(teacherDept);
        const subjectRecord = await Subject.findOne({ department: teacherDept });

        if (subjectRecord) {
            console.log(`Subjects for ${teacherDept}:`, subjectRecord.subjects);
            // Assuming you have a function to fetch students by department
            const students = await studentModel.find({ department: teacherDept });  // Fetch students in the same department

            res.render("attendence", { subjectRecord, students });
        } else {
            console.log(`No subjects found for ${teacherDept}`);
            res.render("attendence", { subjectRecord: null, students: [] });
        }
    } catch (error) {
        console.error('Error fetching subjects or students:', error);
        res.status(500).send("Error fetching subjects or students");
    }
});



router.post("/submit-attendance", async (req, res) => {
    if (!req.session.teacher) return res.redirect("/teachers/login");
    try {
        // Fetch the teacher's information and department
        const user = await teacherModel.findOne({ email: req.session.teacher.email });
        if (!user) {
            return res.status(404).send("Teacher not found.");
        }

        console.log(req.body);
        const teacherDept = user.department;

        // Flatten attendance records into the expected schema format
        const attendanceRecords = [];
        for (let subject in req.body.attendance) {
            for (let studentId in req.body.attendance[subject]) {
                attendanceRecords.push({
                    studentId,
                    subject: subject,
                    present: parseInt(req.body.attendance[subject][studentId], 10)
                });
            }
        }

        // {
        //   attendance: {
        //     Mathematics: {
        //       '672a6f38cba23542e6c76d61': '1',
        //       '672a6fc4cba23542e6c76d67': '1'
        //     },
        //     Physics: {
        //       '672a6f38cba23542e6c76d61': '0',
        //       '672a6fc4cba23542e6c76d67': '1'
        //     },
        //     'Computer Science': {
        //       '672a6f38cba23542e6c76d61': '0',
        //       '672a6fc4cba23542e6c76d67': '1'
        //     },
        //     'Data Structures': {
        //       '672a6f38cba23542e6c76d61': '1',
        //       '672a6fc4cba23542e6c76d67': '0'
        //     }
        //   }
        // }
        // Attendance recorded successfully.  

        // Create a new Attendance record
        const newDayAtten = new Attendance({
            teacherId: req.session.teacher.id,
            department: teacherDept,
            subjects: await Subject.find({ department: teacherDept }).select('_id'),  // Selects subject IDs
            attendance: attendanceRecords
        });

        await newDayAtten.save();
        console.log("Attendance recorded successfully.");

        // Redirect to the specified page
        res.redirect("/teachers/spage");
    } catch (error) {
        console.error("Error in submit-attendance:", error);
        res.status(500).send("Error in submit-attendance");
    }
});

const io = new Server(server)

// Ensure 'uploads' directory exists
// if (!fs.existsSync(filesUpload)) {
//     console.log("Created 'uploads' directory as it did not exist.");
//     fs.mkdirSync(filesUpload);
// }

router.get('/chat', async (req, res) => {
    if (!req.session.teacher) {
        return res.redirect('/teachers/login');
    }

    const teacher = await teacherModel.findOne({ email: req.session.teacher.email });
    const students = await studentModel.find({ department: teacher.department });
    res.render('teacherChat', { students });
});

router.get('/chat/:studentId', async (req, res) => {
    if (!req.session.teacher) {
        return res.redirect('/teachers/login');
    }

    const teacher = await teacherModel.findOne({ email: req.session.teacher.email });
    const student = await studentModel.findById(req.params.studentId);

    if (!student) {
        return res.status(404).send('Student not found');
    }

    res.render('schatRoom', { student, teacher });
});

router.get("/announcement", async (req, res) => {
    let tempdept = await teacherModel.findOne({ email: req.session.teacher.email })
    let dept = tempdept.department;
    let announcements = await announceModel.find({ department: dept })
    res.render("tannounce", ({ announcements }))
})

// Route to remove an announcement by ID
router.get("/remove/:id", async (req, res) => {
    try {
        const { id } = req.params;
        let deletion = await announceModel.deleteOne({ _id: id });

        if (deletion.deletedCount === 0) {
            return res.status(404).send("Announcement not found.");
        }
        res.redirect("/teachers/announcement");  // Redirect to the announcements page after deletion
    } catch (error) {
        console.error("Error deleting announcement:", error);
        res.status(500).send("Server error. Please try again later.");
    }
});

router.post("/announcement", async (req, res) => {
    try {
        let tempdept = await teacherModel.findOne({ email: req.session.teacher.email })
        let dept = tempdept.department;
        const { title, description } = req.body;
        let students = await studentModel.findOne({ department: dept })
        let announce = new announceModel({
            department: dept,
            title,
            description,
            teacherId: req.session.Id
        })
        console.log(announce)
        await announce.save();
        res.redirect("/teachers/spage")
    } catch (error) {
        console.error("Error creating announcement:", error);
        res.status(500).send("Server error. Please try again later.");
    }
})

module.exports = router; // Make sure to export the router