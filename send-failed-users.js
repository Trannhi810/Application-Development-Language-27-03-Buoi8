require('dotenv').config();
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const User = require('./schemas/users');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/NNPTUD-C6');

// Mailtrap config
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
        html: `<h2>Hello ${user.username}</h2><p>Password: <strong>${password}</strong></p>`
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

// Main function - retry failed users with 30 second delay
async function retryFailedUsers() {
    try {
        console.log('🔄 Retrying failed users with 30s delay...');
        
        const users = await User.find({});
        console.log(`📊 Found ${users.length} users`);

        let success = 0;
        let errors = 0;

        // Send with 30 second delay
        for (let i = 0; i < users.length; i++) {
            const user = users[i];
            const password = generateRandomPassword(16);
            
            user.password = password;
            await user.save();
            
            const sent = await sendPasswordEmail(user, password);
            if (sent) success++;
            else errors++;
            
            // 30 second delay for Mailtrap
            console.log(`⏳ Waiting 30 seconds... (${i + 1}/${users.length})`);
            await new Promise(resolve => setTimeout(resolve, 30000));
        }

        console.log(`\n📧 Final Results:`);
        console.log(`✅ Success: ${success}`);
        console.log(`❌ Errors: ${errors}`);

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        mongoose.connection.close();
    }
}

retryFailedUsers();
