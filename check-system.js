const mongoose = require('mongoose');
const fs = require('fs');
const XLSX = require('xlsx');

// Check MongoDB
async function checkDatabase() {
    try {
        console.log('1️⃣ Checking MongoDB connection...');
        await mongoose.connect('mongodb://localhost:27017/NNPTUD-C6');
        console.log('✅ MongoDB connected');

        // Check users
        const User = require('./schemas/users');
        const userCount = await User.countDocuments();
        console.log(`📊 Total users in database: ${userCount}`);

        // Check sample users
        const sampleUsers = await User.find({}).limit(5);
        console.log('👥 Sample users:');
        sampleUsers.forEach(u => {
            console.log(`  - ${u.username} (${u.email}) - Password: ${u.password ? 'exists' : 'missing'}`);
        });

        return userCount;
    } catch (error) {
        console.error('❌ Database error:', error.message);
        return 0;
    }
}

// Check Excel file
function checkExcel() {
    try {
        console.log('\n2️⃣ Checking Excel file...');
        
        if (!fs.existsSync('./user.xlsx')) {
            console.log('❌ user.xlsx not found');
            return 0;
        }

        const workbook = XLSX.readFile('./user.xlsx');
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet);

        console.log(`📊 Total users in Excel: ${data.length}`);
        
        console.log('👥 Sample Excel users:');
        data.slice(0, 5).forEach((row, i) => {
            const username = row.username || row['username'] || row['Username'];
            const email = row.email || row['email'] || row['Email'];
            console.log(`  - ${username} (${email})`);
        });

        return data.length;
    } catch (error) {
        console.error('❌ Excel error:', error.message);
        return 0;
    }
}

// Check email config
function checkEmailConfig() {
    console.log('\n3️⃣ Checking email configuration...');
    
    try {
        require('dotenv').config();
        
        if (process.env.MAILTRAP_USER && process.env.MAILTRAP_PASS) {
            console.log('✅ Mailtrap config found');
            console.log(`   User: ${process.env.MAILTRAP_USER}`);
            console.log(`   Pass: ${process.env.MAILTRAP_PASS.substring(0, 4)}****`);
        } else {
            console.log('❌ Mailtrap config missing');
        }
    } catch (error) {
        console.error('❌ Email config error:', error.message);
    }
}

// Check generated files
function checkGeneratedFiles() {
    console.log('\n4️⃣ Checking generated files...');
    
    const files = ['passwords.csv', 'import-users.js', 'send-email-fixed.js', 'send-gmail.js'];
    
    files.forEach(file => {
        if (fs.existsSync(file)) {
            const stats = fs.statSync(file);
            console.log(`✅ ${file} (${Math.round(stats.size / 1024)}KB)`);
        } else {
            console.log(`❌ ${file} not found`);
        }
    });
}

// Main check function
async function fullCheck() {
    console.log('🔍 SYSTEM CHECK STARTING...\n');
    
    const dbCount = await checkDatabase();
    const excelCount = checkExcel();
    checkEmailConfig();
    checkGeneratedFiles();
    
    console.log('\n📋 SUMMARY:');
    console.log(`📊 Database users: ${dbCount}`);
    console.log(`📊 Excel users: ${excelCount}`);
    console.log(`📊 Match: ${dbCount === excelCount ? '✅' : '❌'}`);
    
    if (mongoose.connection.readyState === 1) {
        mongoose.connection.close();
    }
    
    console.log('\n🎯 RECOMMENDATIONS:');
    if (dbCount > 0) {
        console.log('✅ Users exist in database');
        console.log('💡 Run: node generate-passwords-only.js (fast, no email)');
        console.log('💡 Or: node send-simple.js (slow, with email)');
    } else {
        console.log('❌ No users in database');
        console.log('💡 Run: node import-users.js first');
    }
}

fullCheck();
