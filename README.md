# Project: prot - Educational Portal

## Description

This is a web-based educational portal designed to facilitate interaction and resource sharing between students and teachers within an institution. It provides role-based access, allowing students and teachers to manage profiles, share notes, track attendance, communicate via chat, run code snippets, and view/post announcements.

## Features

* **User Authentication:** Secure registration and login for both students and teachers. Session-based authentication to protect routes.
* **Role-Based Access:** Distinct dashboards, features, and permissions for students and teachers.
* **Profile Management:** Users can view and update their profile information (name, username, phone, password).
* **Notes Sharing:**
  * Teachers can upload notes (e.g., PDFs) specific to their department.
  * Students can access and view notes relevant to their enrolled department.
* **Attendance Tracking:**
  * Teachers can mark daily attendance for students in their department across different subjects.
  * Students can view their attendance records, overall percentage, and monthly attendance trends visualized in a graph.
* **Code Execution Sandbox:**
  * Students can write and execute code snippets in various languages (C, C++, Python, Node.js).
  * Execution is handled on the server-side with basic timeout mechanisms.
* **Real-time Chat:**
  * Students can initiate chats with teachers from their department.
  * Teachers can chat with students from their department.
  * (Uses Socket.IO for real-time communication - basic implementation shown).
* **Announcements:**
  * Teachers can create announcements for their specific department.
  * Students can view announcements relevant to their department.
  * Teachers can delete their previously posted announcements.

## Technology Stack

* **Backend:** Node.js, Express.js
* **Database:** MongoDB (with Mongoose ODM)
* **Templating Engine:** EJS
* **Authentication:** bcrypt (Password Hashing), express-session (Session Management)
* **File Uploads:** Multer
* **Real-time Communication:** Socket.IO
* **Environment Variables:** dotenv
* **Middleware:** cookie-parser, cors
* **Utilities:** path, fs, crypto

## Prerequisites

* Node.js (v14 or later recommended)
* npm (Node Package Manager)
* MongoDB (Running instance - local or cloud-based like MongoDB Atlas)

## Installation & Setup

1. **Clone the repository:**
   
   ```bash
   git clone https://github.com/niru124/Student-Information-Management-System.git
   cd prot
   ```

2. **Install dependencies:**
   
   ```bash
   npm install
   ```

3. **Set up Environment Variables:**
   Create a `.env` file in the root directory (`prot/`) and add the following variables:
   
   ```dotenv
   MONGODB_URI=<your_mongodb_connection_string>
   JWT_KEY=<your_secret_key_for_session>
   BASE_URL=http://localhost:8096 # Or your deployment URL (used for code execution frontend)
   ```
   
   * Replace `<your_mongodb_connection_string>` with your actual MongoDB connection string.
   * Replace `<your_secret_key_for_session>` with a strong, random secret key.

4. **Ensure Uploads Directory:**
   The application uses an `uploads` directory for storing notes and potentially chat files. While the Socket.IO setup in `index.js` checks/creates this, ensure it exists or has the correct permissions if needed.
   
   ```bash
   mkdir uploads
   ```
   
   *(Note: The teacher route also defines `uploadDir = "uploads"`)*

## Running the Application

1. **Start the server:**
   
   ```bash
   npm start
   ```
   
   or
   
   ```bash
   node index.js
   ```

2. **Access the application:**
   Open your web browser and navigate to `http://localhost:8096` (or the port configured if different).

## Folder Structure (Simplified)

## Key API Routes

* `/` : Homepage
* `/students/register`: Student registration page/POST endpoint.
* `/students/login`: Student login page/POST endpoint.
* `/students/spage`: Student dashboard page.
* `/students/profile`: View student profile.
* `/students/cprofile`: Edit student profile page.
* `/students/snotes`: View notes for the student's department.
* `/students/attendance`: View student attendance details.
* `/students/run-code`: Code execution page/POST endpoint.
* `/students/chat`: List teachers for chat / Specific chat room.
* `/students/announcement`: View announcements.
* `/students/uploads/:filename`: Serves uploaded files (requires login).
* `/teachers/register`: Teacher registration page/POST endpoint.
* `/teachers/login`: Teacher login page/POST endpoint.
* `/teachers/spage`: Teacher dashboard page.
* `/teachers/tprofile`: View teacher profile.
* `/teachers/ctprofile`: Edit teacher profile page.
* `/teachers/tnotes`: Upload notes page/POST endpoint.
* `/teachers/attendance`: Mark attendance page.
* `/teachers/submit-attendance`: POST endpoint for submitting attendance.
* `/teachers/chat`: List students for chat / Specific chat room.
* `/teachers/announcement`: View/Manage announcements page/POST endpoint.
* `/teachers/remove/:id`: DELETE endpoint for removing an announcement.

*(Note: Many GET routes render EJS pages, while POST routes handle form submissions or API actions.)*
