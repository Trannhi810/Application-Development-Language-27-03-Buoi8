require('dotenv').config();
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const User = require('./schemas/users');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/NNPTUD-C6');

// Gmail config - CẦN CẬP NHẬT
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'your-email@gmail.com',     // 👉 Thay email Gmail của bạn
        pass: 'your-app-password'          // 👉 Thay App Password 16 ký tự vừa tạo
    }
});

// Generate password
function generateRandomPassword(length = 16) {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < length; i++) {
        password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
}

// Send email
async function sendPasswordEmail(user, password) {
    const mailOptions = {
        from: 'your-email@gmail.com',
        to: user.email,
        subject: 'Your Account Password',
        html: `
            <h2>Hello ${user.username}</h2>
            <p>Your password: <strong>${password}</strong></p>
            <p>Please login and change your password.</p>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`✅ Email sent to: ${user.email}`);
        return true;
    } catch (error) {
        console.error(`❌ Error sending to ${user.email}:`, error.message);
        return false;
    }
}

// Main function
async function sendEmails() {
    try {
        console.log('🚀 Starting with Gmail...');
        
        // Test connection first
        await transporter.verify();
        console.log('✅ Gmail connected');
        
        // Get users that failed before
        const users = await User.find({});
        console.log(`📊 Found ${users.length} users`);

        let success = 0;
        let errors = 0;

        // Send to all users with 1 second delay
        for (let i = 0; i < users.length; i++) {
            const user = users[i];
            const password = generateRandomPassword(16);
            
            // Update password
            user.password = password;
            await user.save();
            
            // Send email
            const sent = await sendPasswordEmail(user, password);
            if (sent) success++;
            else errors++;
            
            // Small delay
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        console.log(`\n📧 Results:`);
        console.log(`✅ Success: ${success}`);
        console.log(`❌ Errors: ${errors}`);

    } catch (error) {
        console.error('❌ Main error:', error.message);
    } finally {
        mongoose.connection.close();
    }
}

sendEmails();
