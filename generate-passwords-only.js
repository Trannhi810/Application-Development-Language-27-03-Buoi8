const mongoose = require('mongoose');
const User = require('./schemas/users');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/NNPTUD-C6');

// Generate password
function generateRandomPassword(length = 16) {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < length; i++) {
        password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
}

// Main function - chỉ tạo password, không gửi email
async function generatePasswords() {
    try {
        console.log('🔑 Generating passwords for all users...');
        
        // Get users
        const users = await User.find({});
        console.log(`📊 Found ${users.length} users`);

        // Create file to save passwords
        const fs = require('fs');
        let passwordList = 'Username,Email,Password\n';

        // Generate password for each user
        for (let i = 0; i < users.length; i++) {
            const user = users[i];
            const password = generateRandomPassword(16);
            
            // Update password in database
            user.password = password;
            await user.save();
            
            // Add to list
            passwordList += `${user.username},${user.email},${password}\n`;
            
            console.log(`✅ ${i + 1}/${users.length}: ${user.username} -> ${password}`);
        }

        // Save to file
        fs.writeFileSync('passwords.csv', passwordList);
        console.log(`\n🎉 Done! Passwords saved to passwords.csv`);
        console.log(`📊 Total users: ${users.length}`);
        console.log(`📄 Check passwords.csv file for all credentials`);

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        mongoose.connection.close();
    }
}

generatePasswords();
