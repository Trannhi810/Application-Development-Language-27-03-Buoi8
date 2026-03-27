const XLSX = require('xlsx');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const User = require('./schemas/users');
const Role = require('./schemas/roles');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/NNPTUD-C6');

// Generate random password
function generateRandomPassword(length = 16) {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < length; i++) {
        password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
}

// Email configuration
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'your-email@gmail.com', // Thay bằng email Gmail của bạn
        pass: 'your-app-password'     // Thay bằng App Password của bạn
    }
});

// Send email function
async function sendPasswordEmail(email, username, password) {
    const mailOptions = {
        from: 'your-email@gmail.com',
        to: email,
        subject: 'Your Account Password',
        html: `
            <h2>Welcome to Our System</h2>
            <p>Dear ${username},</p>
            <p>Your account has been created successfully. Here are your login credentials:</p>
            <ul>
                <li><strong>Username:</strong> ${username}</li>
                <li><strong>Email:</strong> ${email}</li>
                <li><strong>Password:</strong> ${password}</li>
            </ul>
            <p>Please keep your password secure and change it after first login.</p>
            <p>Best regards,<br>System Administration</p>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Email sent to ${email}`);
    } catch (error) {
        console.error(`Error sending email to ${email}:`, error);
    }
}

// Main import function
async function importUsers() {
    try {
        console.log('Starting user import process...');

        // Read Excel file
        const workbook = XLSX.readFile('./user.xlsx');
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet);

        console.log(`Found ${data.length} users in Excel file`);

        // Find or create 'user' role
        let userRole = await Role.findOne({ name: 'user' });
        if (!userRole) {
            userRole = new Role({
                name: 'user',
                description: 'Regular user role'
            });
            await userRole.save();
            console.log('Created "user" role');
        }

        let successCount = 0;
        let errorCount = 0;

        // Process each user
        for (const row of data) {
            try {
                const username = row.username || row['username'] || row['Username'];
                const email = row.email || row['email'] || row['Email'];

                if (!username || !email) {
                    console.error('Missing username or email in row:', row);
                    errorCount++;
                    continue;
                }

                // Check if user already exists
                const existingUser = await User.findOne({
                    $or: [{ username }, { email }]
                });

                if (existingUser) {
                    console.log(`User ${username} or email ${email} already exists, skipping...`);
                    continue;
                }

                // Generate random password
                const password = generateRandomPassword(16);

                // Create new user
                const newUser = new User({
                    username,
                    email,
                    password,
                    role: userRole._id,
                    status: true
                });

                await newUser.save();
                console.log(`Created user: ${username}`);

                // Send password email
                await sendPasswordEmail(email, username, password);

                console.log(`Password for ${username}: ${password}`);
                successCount++;

            } catch (error) {
                console.error(`Error processing user:`, error);
                errorCount++;
            }
        }

        console.log(`\nImport completed:`);
        console.log(`- Successfully imported: ${successCount} users`);
        console.log(`- Errors: ${errorCount} users`);

    } catch (error) {
        console.error('Import failed:', error);
    } finally {
        mongoose.connection.close();
    }
}

// Run the import
importUsers();
