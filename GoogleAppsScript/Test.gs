/**
 * Simple Test for Google Apps Script WebUntis API
 * 
 * Instructions:
 * 1. Copy WebUntis.gs content to a new Google Apps Script project
 * 2. Update the config object below with your credentials
 * 3. Run this test function to verify everything works
 */

// Test configurations
const UNTIS_CONFIG = {
    school: '<YOUR_SCHOOL_NAME>',        // Your school identifier
    username: '<YOUR_USERNAME>',         // Your WebUntis username  
    password: '<YOUR_PASSWORD>',         // Your WebUntis password
    server: '<YOUR_WEBUNTIS_SERVER>'       // Your server (change if different)
};

const HA_CONFIG = {
    url: '<YOUR_HOME_ASSISTANT_URL>',              // Replace with your Home Assistant URL
    token: '<YOUR_HA_ACCESS_TOKEN>',              // Replace with your long-lived access token
    service: 'notify.signal_me'                         // Replace with your notification service
};

function quickTest() {
    console.log('🚀 Starting WebUntis API test...');
    
    // Test with the new parameterized function
    testWebUntisAPI(UNTIS_CONFIG);
}

/**
 * Example: Send daily homework email with parameters
 */
function dailyHomeworkReminder() {
    const emailAddress = '<YOUR_EMAIL@gmail.com>'; // REPLACE WITH YOUR EMAIL
    const daysAhead = 3; // Look 3 days ahead
    
    // Use the new parameterized function
    sendHomeworkEmail(UNTIS_CONFIG, emailAddress, daysAhead);
}

/**
 * Test: Send Home Assistant notification with homework summary
 */
function testHomeAssistantNotification() {
    console.log('🏠 Testing Home Assistant homework notification...');
    
    try {
        // Get homework summary for next 2 days
        const api = getAPIInstance(UNTIS_CONFIG);
        const homeworkSummary = api.getFormattedHomework(2, true); // Next 2 days, open only
        
        // Send notification using callHomeAssistantAPI with telegram_bot.send_message
        const result = callHomeAssistantAPI(HA_CONFIG, 'telegram_bot.send_message', {
            config_entry_id: '<YOUR_TELEGRAM_CONFIG_ID>',
            message: homeworkSummary,
            target: '<YOUR_TELEGRAM_CHAT_ID>'
        });
        
        if (result.success) {
            console.log('✅ Home Assistant notification sent successfully!');
            console.log('📱 Notification details:', result.data);
        } else {
            console.error('❌ Failed to send Home Assistant notification:', result.error);
        }
        
        // Clean up session
        clearAPIInstance();
        
    } catch (error) {
        console.error('❌ Test failed:', error.toString());
        clearAPIInstance();
    }
}

/**
 * Example: Add homework to calendar with parameters
 */
function syncHomeworkToCalendar() {
    const calendarId = null; // Use default calendar (or specify a calendar ID)
    const daysAhead = 7; // Look 7 days ahead
    
    // Use the new parameterized function
    addHomeworkToCalendar(UNTIS_CONFIG, calendarId, daysAhead);
}

/**
 * Advanced example: Multiple email recipients
 */
function sendHomeworkToMultipleEmails() {
    const recipients = [
        '<STUDENT_EMAIL@example.com>',
        '<PARENT_EMAIL@example.com>',
        '<TUTOR_EMAIL@example.com>'
    ];
    
    recipients.forEach(email => {
        console.log(`📧 Sending homework reminder to ${email}`);
        sendHomeworkEmail(UNTIS_CONFIG, email, 5); // 5 days ahead
    });
}

/**
 * Advanced example: Custom calendar integration
 */
function syncToSpecificCalendar() {
    // You can specify a specific calendar ID if you have multiple calendars
    const homeworkCalendarId = '<YOUR_HOMEWORK_CALENDAR_ID@group.calendar.google.com>';
    
    try {
        addHomeworkToCalendar(UNTIS_CONFIG, homeworkCalendarId, 14); // 14 days ahead
        console.log('✅ Homework synced to specific calendar!');
    } catch (error) {
        console.log('⚠️ Specific calendar not found, trying default calendar...');
        addHomeworkToCalendar(UNTIS_CONFIG, null, 14); // Fall back to default
    }
}