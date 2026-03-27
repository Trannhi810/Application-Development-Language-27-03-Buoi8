require('dotenv').config();
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const User = require('./schemas/users');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/NNPTUD-C6');

// Mailtrap config (đã có sẵn)
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
        html: `<h2>Hello ${user.username}</h2><p>Your password: <strong>${password}</strong></p>`
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`✅ Email sent to: ${user.email}`);
        return true;
    } catch (error) {
        console.error(`❌ Error: ${error.message.substring(0, 50)}...`);
        return false;
    }
}

// Main function
async function sendEmails() {
    try {
        console.log('🚀 Starting simple send...');
        
        // Test connection
        await transporter.verify();
        console.log('✅ Mailtrap connected');
        
        // Get users
        const users = await User.find({});
        console.log(`📊 Sending to ${users.length} users with 60s delay...`);

        let success = 0;
        let errors = 0;

        // Send with 60 second delay (1 minute per email)
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
            
            // Show progress
            console.log(`📈 Progress: ${i + 1}/${users.length} (${Math.round((i + 1) / users.length * 100)}%)`);
            
            // 60 second delay
            if (i < users.length - 1) {
                console.log('⏳ Waiting 60 seconds...');
                await new Promise(resolve => setTimeout(resolve, 60000));
            }
        }

        console.log(`\n🎉 FINAL RESULTS:`);
        console.log(`✅ Success: ${success} emails`);
        console.log(`❌ Errors: ${errors} emails`);
        console.log(`📊 Success rate: ${Math.round(success / users.length * 100)}%`);

    } catch (error) {
        console.error('❌ Main error:', error.message);
    } finally {
        mongoose.connection.close();
    }
}

sendEmails();
