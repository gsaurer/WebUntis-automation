/**
 * WebUntis API Test Script
 * Replace the configuration below with your actual WebUntis credentials
 */

// Import the WebUntis API classes
const { WebUntisAPI, EventNotificationManager } = require('./WebUntis.js');

// Configuration - REPLACE WITH YOUR ACTUAL CREDENTIALS
const config = {
    school: '<YOUR_SCHOOL_NAME>',        // Replace with your school name
    username: '<YOUR_USERNAME>',         // Replace with your username
    password: '<YOUR_PASSWORD>',         // Replace with your password
    server: '<YOUR_WEBUNTIS_SERVER>'       // Replace with your school's WebUntis server if different
};

/**
 * Format and display homework in a readable format
 */
function displayHomework(homeworkData, title) {
    console.log(`\n${'='.repeat(50)}`);
    console.log(`${title.toUpperCase()}`);
    console.log(`${'='.repeat(50)}`);
    
    if (!homeworkData || !homeworkData.homeworks || homeworkData.homeworks.length === 0) {
        console.log('No homework found.');
        return;
    }
    
    const { homeworks, teachers, lessons } = homeworkData;
    
    // Create lookup maps
    const teacherMap = new Map(teachers.map(t => [t.id, t.name]));
    const lessonMap = new Map(lessons.map(l => [l.id, l.subject]));
    
    homeworks.forEach((homework, index) => {
        console.log(`\n${index + 1}. Homework Details:`);
        console.log(`   📝 ID: ${homework.id}`);
        console.log(`   📚 Subject: ${lessonMap.get(homework.lessonId) || 'Unknown'}`);
        console.log(`   👨‍🏫 Teacher: ${teacherMap.get(homework.teacherId) || 'Unknown'}`);
        console.log(`   📅 Assigned: ${formatDate(homework.date)}`);
        console.log(`   ⏰ Due: ${formatDate(homework.dueDate)}`);
        console.log(`   ✅ Completed: ${homework.completed ? 'Yes' : 'No'}`);
        console.log(`   📄 Text: ${homework.text || 'No description'}`);
        
        if (homework.remark) {
            console.log(`   💬 Remark: ${homework.remark}`);
        }
        
        if (homework.attachments && homework.attachments.length > 0) {
            console.log(`   📎 Attachments: ${homework.attachments.length} file(s)`);
        }
        
        console.log(`   ${'-'.repeat(40)}`);
    });
    
    console.log(`\n📊 HOMEWORK SUMMARY:`);
    console.log(`   Total assignments: ${homeworks.length}`);
    console.log(`   Completed: ${homeworks.filter(h => h.completed).length}`);
    console.log(`   Pending: ${homeworks.filter(h => !h.completed).length}`);
    console.log(`   Teachers involved: ${teachers.length}`);
    console.log(`   Subjects: ${lessons.length}`);
}

/**
 * Determine the type of event
 */
function getEventType(event) {
    if (event.examType) return 'Exam';
    if (event.homeworkId) return 'Homework';
    if (event.code) return 'Timetable Entry';
    return 'Event';
}

/**
 * Format WebUntis date (YYYYMMDD) to readable format
 */
function formatDate(dateNumber) {
    if (!dateNumber) return 'N/A';
    const dateStr = dateNumber.toString();
    const year = dateStr.substring(0, 4);
    const month = dateStr.substring(4, 6);
    const day = dateStr.substring(6, 8);
    return `${day}.${month}.${year}`;
}

/**
 * Format WebUntis time (HHMM) to readable format
 */
function formatTime(timeNumber) {
    if (!timeNumber) return 'N/A';
    const timeStr = timeNumber.toString().padStart(4, '0');
    const hour = timeStr.substring(0, 2);
    const minute = timeStr.substring(2, 4);
    return `${hour}:${minute}`;
}

/**
 * Get date range for testing
 */
function getDateRange(days = 7) {
    const today = new Date();
    const future = new Date();
    future.setDate(today.getDate() + days);
    
    return {
        start: WebUntisAPI.formatDate(today),
        end: WebUntisAPI.formatDate(future)
    };
}

/**
 * Main test function
 */
async function runTest() {
    console.log('WebUntis API Test Script');
    console.log('========================');
    
    // Check if credentials are configured
    if (config.school === 'YOUR_SCHOOL_NAME' || 
        config.username === 'YOUR_USERNAME' || 
        config.password === 'YOUR_PASSWORD') {
        console.log('\n❌ ERROR: Please configure your WebUntis credentials in the config object!');
        console.log('\nUpdate the following in test.js:');
        console.log('- school: Your school name (e.g., "gymnasium-example")');
        console.log('- username: Your WebUntis username');
        console.log('- password: Your WebUntis password');
        console.log('- server: Your WebUntis server (if different from <YOUR_WEBUNTIS_SERVER>)');
        return;
    }
    
    const api = new WebUntisAPI(config);
    
    try {
        console.log(`\n🔄 Connecting to ${config.server} for school "${config.school}"...`);
        
        // Authenticate
        console.log('🔐 Authenticating...');
        const authenticated = await api.authenticate();
        
        if (!authenticated) {
            console.log('❌ Authentication failed! Please check your credentials.');
            return;
        }
        
        console.log('✅ Authentication successful!');
        console.log(`👤 Logged in as: ${config.username}`);
        console.log(`🏫 School: ${config.school}`);
        console.log(`🆔 Person ID: ${api.personId}, Type: ${api.personType}`);
        
        // Debug: Get available API methods  
        console.log('\n🔍 Checking available API methods...');
        try {
            const methods = await api.getAvailableMethods();
            if (methods.length > 0) {
                console.log(`📋 Available methods: ${methods.join(', ')}`);
            } else {
                console.log('ℹ️  Could not retrieve method list');
            }
        } catch (error) {
            console.log('ℹ️  Could not check available methods:', error.message);
        }
        
        // Get school data
        console.log('\n🏫 Getting school information...');
        try {
            const schoolData = await api.getSchoolData();
            console.log(`📅 Current school year: ${schoolData.currentSchoolyear.name || 'N/A'}`);
            console.log(`📚 Classes available: ${schoolData.classes.length}`);
            console.log(`📖 Subjects: ${schoolData.subjects.length}`);
            console.log(`🏢 Rooms: ${schoolData.rooms.length}`);
            console.log(`👨‍🏫 Teachers: ${schoolData.teachers.length}`);
            console.log(`🏖️ Holidays: ${schoolData.holidays.length}`);
            
            // Try to get timetable for first available class
            if (schoolData.classes.length > 0) {
                const firstClass = schoolData.classes[0];
                console.log(`\n📅 Trying to get timetable for class: ${firstClass.name} (ID: ${firstClass.id})`);
                
                const dateRange = getDateRange(7);
                const classTimetable = await api.getClassTimetable(firstClass.id, dateRange.start, dateRange.end);
                
                if (classTimetable.length > 0) {
                    console.log(`✅ Got ${classTimetable.length} timetable entries for ${firstClass.name}`);
                    displayEvents(classTimetable, `TIMETABLE FOR CLASS ${firstClass.name.toUpperCase()}`);
                } else {
                    console.log(`ℹ️  No timetable entries found for ${firstClass.name}`);
                }
            }
            
        } catch (error) {
            console.log('❌ Error getting school information:', error.message);
        };
        
        // Get date range for the next week
        const dateRange = getDateRange(7);
        console.log(`\n📅 Fetching events from ${formatDate(parseInt(dateRange.start))} to ${formatDate(parseInt(dateRange.end))}...`);
        
        // Test 1: Get today's homework
        console.log('\n🔍 Fetching today\'s homework...');
        try {
            const todaysEvents = await api.getTodaysEvents();
            displayHomework(todaysEvents, 'TODAY\'S HOMEWORK');
        } catch (error) {
            console.log('❌ Error fetching today\'s homework:', error.message);
        }
        
        // Test 2: Get this week's homework
        console.log('\n🔍 Fetching this week\'s homework...');
        try {
            const weekEvents = await api.getWeekEvents();
            displayHomework(weekEvents, 'THIS WEEK\'S HOMEWORK');
        } catch (error) {
            console.log('❌ Error fetching week homework:', error.message);
        }
        
        // Test 3: Get homework for next 7 days
        console.log('\n🔍 Fetching homework for next 7 days...');
        try {
            const dateRange = getDateRange(7);
            const homeworkData = await api.getHomework(dateRange.start, dateRange.end);
            displayHomework(homeworkData, 'HOMEWORK (Next 7 Days)');
        } catch (error) {
            console.log('❌ Error fetching homework for date range:', error.message);
        }
        
        // Test 3.5: Test the new formatted homework method
        console.log('\n🎨 Testing formatted homework output...');
        try {
            // Get formatted homework for next 5 days (open only)
            const formattedHomework5Days = await api.getFormattedHomework(5, true);
            console.log('\n' + formattedHomework5Days);
            
            // Get formatted homework for next 10 days (all homework)
            const formattedHomework10Days = await api.getFormattedHomework(10, false);
            console.log('\n📚 ALL HOMEWORK (including completed):');
            console.log(formattedHomework10Days);
        } catch (error) {
            console.log('❌ Error fetching formatted homework:', error.message);
        }

        // Test 4: Event Notifications
        console.log('\n🔔 Testing Event Notifications...');
        try {
            const notificationManager = new EventNotificationManager(api);
            
            // Add a notification callback
            notificationManager.addNotificationCallback((events) => {
                console.log(`\n🔔 NOTIFICATION: ${events.length} upcoming events found!`);
                events.forEach(event => {
                    if (event.text) {
                        // This is homework
                        console.log(`   � Homework: ${event.text.substring(0, 50)}... due ${formatDate(event.dueDate)}`);
                    } else {
                        // This is other event
                        console.log(`   �📌 ${getEventType(event)}: ${event.subject || event.text || 'Event'} on ${formatDate(event.date)} at ${formatTime(event.startTime)}`);
                    }
                });
            });
            
            // Check for upcoming homework in next 24 hours
            const upcomingEvents = await notificationManager.checkUpcomingEvents(24);
            
            if (upcomingEvents.length === 0) {
                console.log('ℹ️  No events found in the next 24 hours.');
            }
        } catch (error) {
            console.log('❌ Error testing notifications:', error.message);
        }
        
        // Logout
        console.log('\n🔄 Logging out...');
        await api.logout();
        console.log('✅ Logout successful!');
        
        console.log('\n🎉 Test completed successfully!');
        
    } catch (error) {
        console.error('\n❌ Test failed with error:', error.message);
        
        if (error.message.includes('authentication')) {
            console.log('\n💡 Tips for authentication issues:');
            console.log('   - Check your username and password');
            console.log('   - Verify the school name (usually lowercase, no spaces)');
            console.log('   - Confirm the server URL is correct');
        }
        
        if (error.message.includes('HTTP error')) {
            console.log('\n💡 Tips for connection issues:');
            console.log('   - Check your internet connection');
            console.log('   - Verify the server URL is accessible');
            console.log('   - Make sure WebUntis is not under maintenance');
        }
    }
}

// Add helpful information
console.log(`
📋 CONFIGURATION REQUIRED:
Before running this test, update the 'config' object at the top of this file with:

1. school: Your school's WebUntis identifier (e.g., "gymnasium-example")
2. username: Your WebUntis login username
3. password: Your WebUntis login password  
4. server: Your WebUntis server URL (default: <YOUR_WEBUNTIS_SERVER>)

💡 To find your school identifier:
- Go to your school's WebUntis login page
- Look at the URL or ask your school's IT department

🚀 Run this test with: node test.js
`);

// Run the test
runTest().catch(console.error);