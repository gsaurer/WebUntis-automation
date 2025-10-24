/**
 * Example: Using getFormattedHomework() method
 * This script demonstrates how to use the new formatted homework method
 */

const { WebUntisAPI } = require('./WebUntis.js');

// Your WebUntis configuration
const config = {
    school: '<YOUR_SCHOOL_NAME>',        // Replace with your school
    username: '<YOUR_USERNAME>',         // Replace with your username
    password: '<YOUR_PASSWORD>',         // Replace with your password
    server: '<YOUR_WEBUNTIS_SERVER>'       // Replace if different
};

async function demonstrateFormattedHomework() {
    const api = new WebUntisAPI(config);
    
    try {
        // Authenticate
        console.log('🔐 Authenticating...');
        const authenticated = await api.authenticate();
        if (!authenticated) {
            console.error('❌ Authentication failed');
            return;
        }
        
        console.log('✅ Authentication successful!\n');
        
        // Example 1: Get open homework for next 3 days
        console.log('📋 EXAMPLE 1: Open homework for next 3 days');
        console.log('=' .repeat(50));
        const homework3Days = await api.getFormattedHomework(3, true);
        console.log(homework3Days);
        
        // Example 2: Get all homework (including completed) for next week
        console.log('\n📋 EXAMPLE 2: All homework for next 7 days');
        console.log('=' .repeat(50));
        const homeworkWeek = await api.getFormattedHomework(7, false);
        console.log(homeworkWeek);
        
        // Example 3: Get open homework for next 2 weeks
        console.log('\n📋 EXAMPLE 3: Open homework for next 14 days');
        console.log('=' .repeat(50));
        const homework2Weeks = await api.getFormattedHomework(14, true);
        console.log(homework2Weeks);
        
        // Logout
        await api.logout();
        console.log('\n✅ Logout successful!');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

// Run the demonstration
demonstrateFormattedHomework().catch(console.error);