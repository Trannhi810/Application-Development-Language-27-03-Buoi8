require('dotenv').config();
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const User = require('./schemas/users');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/NNPTUD-C6');

// Email config
const transporter = nodemailer.createTransport({
    host: 'sandbox.smtp.mailtrap.io',
    port: 2525,
    auth: {
        user: process.env.MAILTRAP_USER,
        pass: process.env.MAILTRAP_PASS
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
        from: 'system@example.com',
        to: user.email,
        subject: 'Your Password',
        html: `
            <h2>Hello ${user.username}</h2>
            <p>Your password: <strong>${password}</strong></p>
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
        console.log('🚀 Starting...');
        
        // Get users
        const users = await User.find({});
        console.log(`📊 Found ${users.length} users`);

        let success = 0;
        let errors = 0;

        // Send to all users
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
            
            // Delay - 10 seconds for Mailtrap strict free plan
            await new Promise(resolve => setTimeout(resolve, 10000));
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
