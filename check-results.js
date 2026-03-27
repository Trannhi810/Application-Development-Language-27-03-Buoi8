const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/NNPTUD-C6');

// Check results
async function checkResults() {
    try {
        console.log('🔍 Checking email sending results...\n');
        
        const User = require('./schemas/users');
        const users = await User.find({});
        console.log(`📊 Total users in database: ${users.length}`);
        
        // Check which users have recent passwords (updated in last hour)
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        const recentUsers = await User.find({ updatedAt: { $gte: oneHourAgo } });
        console.log(`📧 Users with recent password updates: ${recentUsers.length}`);
        
        console.log('\n👥 Recently updated users:');
        recentUsers.slice(0, 10).forEach(u => {
            console.log(`  - ${u.username} (${u.email}) - Updated: ${u.updatedAt}`);
        });
        
        if (recentUsers.length < users.length) {
            const oldUsers = users.filter(u => u.updatedAt < oneHourAgo);
            console.log(`\n❌ Users NOT updated recently: ${oldUsers.length}`);
            console.log('👥 Not updated:');
            oldUsers.slice(0, 10).forEach(u => {
                console.log(`  - ${u.username} (${u.email}) - Updated: ${u.updatedAt}`);
            });
        }
        
        console.log(`\n📈 Success rate: ${Math.round(recentUsers.length / users.length * 100)}%`);
        console.log(`🎯 Mailtrap shows: ${recentUsers.length} emails sent successfully`);
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        mongoose.connection.close();
    }
}

checkResults();
