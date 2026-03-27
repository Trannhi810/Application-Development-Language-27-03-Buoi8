require("dotenv").config();

const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const User = require('./schemas/users');
const Role = require('./schemas/roles');

// Get all users (without populate to avoid errors)
const users = await User.find({});

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/NNPTUD-C6');

// ✅ Mailtrap config
const transporter = nodemailer.createTransport({
    host: "sandbox.smtp.mailtrap.io",
    port: 2525,
    auth: {
        user: process.env.MAILTRAP_USER,
        pass: process.env.MAILTRAP_PASS
    }
});

// Send password email function
async function sendPasswordEmail(user, plainPassword) {
    const mailOptions = {
        from: "test@mailtrap.io", // 🔥 không dùng emailConfig nữa
        to: user.email,
        subject: 'Your Account Password - NNPTUD System',
        html: `
            <h3>Username: ${user.username}</h3>
            <p>Password: ${plainPassword}</p>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`✅ Email sent to: ${user.email}`);
        return true;
    } catch (error) {
        console.error(`❌ Error sending email:`, error.message);
        return false;
    }
}