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
    server: '<YOUR_WEBUNTIS_SERVER>',    // Your server (change if different)
    resourceId: '<YOUR_STUDENT_RESOURCE_ID>' // Your student resource ID (found in timetable URL)
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
        // Get homework list for next 2 days
        const api = getAPIInstance(UNTIS_CONFIG);
        const homeworkList = api.getHomeworkList(2, true, true); // Next 2 days, open only, exclude today
        
        // Only send notification if homework exists
        if (homeworkList) {
            const homeworkSummary = api.formatHomework(homeworkList, 2, true);
            
            // Send notification using callHomeAssistantAPI with telegram_bot.send_message
            const result = callHomeAssistantAPI(HA_CONFIG, 'telegram_bot.send_message', {
                config_entry_id: '<YOUR_TELEGRAM_CONFIG_ID>',
                message: homeworkSummary,
                target: '<YOUR_TELEGRAM_CHAT_ID>'
            });
            
            if (result.success) {
                console.log('✅ Home Assistant notification sent successfully!');
                console.log('📱 Notification details:', result.data);
                console.log(`📚 Found ${homeworkList.length} homework assignments`);
            } else {
                console.error('❌ Failed to send Home Assistant notification:', result.error);
            }
        } else {
            console.log('😎 No homework found for the next 2 days - notification not sent');
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

/**
 * Test: Sync timetable to calendar using new architecture
 */
function testTimetableSync() {
    console.log('📅 Testing timetable sync to calendar...');
    
    try {
        // Use cached API instance instead of creating new one
        const api = getAPIInstance(UNTIS_CONFIG);
        
        // Get today and next 7 days
        const today = new Date();
        const endDate = new Date();
        endDate.setDate(today.getDate() + 7);
        
        const startDateStr = WebUntisAPI.formatDateForAPI(today);
        const endDateStr = WebUntisAPI.formatDateForAPI(endDate);
        
        console.log(`📅 Getting timetable from ${startDateStr} to ${endDateStr}`);
        
        // Get timetable data
        const timetableData = api.getTimetableData(startDateStr, endDateStr);
        
        if (!timetableData) {
            console.log('📅 No timetable data found for the specified period.');
            return;
        }
        
        // Process the data
        const lessons = api.processTimetableData(timetableData, {
            skipCancelled: false,
            includeNotes: true
        });
        
        if (!lessons) {
            console.log('📅 No lessons found after processing.');
            return;
        }
        
        console.log(`📚 Found ${lessons.length} lessons to sync`);
        
        // Sync to calendar (you can specify a calendar ID if needed)
        // const calendarId = 'your-calendar-id@gmail.com'; // Optional
        const result = syncTimetableToCalendar(lessons /* , calendarId */);
        
        if (result.success) {
            console.log('✅ Timetable sync successful!');
            console.log(`📊 Results: ${result.added} added, ${result.updated} updated, ${result.deleted} deleted, ${result.skipped} skipped`);
        } else {
            console.error('❌ Timetable sync failed:', result.error);
        }
        
        // Keep session alive - don't logout (reuse cache)
        console.log('♻️ Keeping session alive for future use');
        
    } catch (error) {
        console.error('❌ Timetable sync test failed:', error.toString());
        // Clear cache on error
        clearAPIInstance();
    }
}

/**
 * Test: Get raw timetable data using new architecture
 */
function testGetTimetable() {
    console.log('📅 Testing timetable data retrieval...');
    
    try {
        // Use cached API instance instead of creating new one
        const api = getAPIInstance(UNTIS_CONFIG);
        
        // Get timetable for next 3 days
        const today = new Date();
        const threeDaysLater = new Date();
        threeDaysLater.setDate(today.getDate() + 3);
        
        const startDateStr = WebUntisAPI.formatDateForAPI(today);
        const endDateStr = WebUntisAPI.formatDateForAPI(threeDaysLater);
        
        console.log(`📅 Getting timetable from ${startDateStr} to ${endDateStr}`);
        
        // Get raw timetable data
        const timetableData = api.getTimetableData(startDateStr, endDateStr);
        
        if (!timetableData) {
            console.log('📅 No timetable data found for the specified period.');
            return;
        }
        
        console.log('📊 Raw Timetable Data Summary:');
        console.log(`   📅 Days: ${timetableData.days?.length || 0}`);
        
        // Process the data
        const lessons = api.processTimetableData(timetableData);
        
        if (lessons) {
            console.log(`📚 Processed ${lessons.length} lessons:`);
            
            // Group lessons by date
            const lessonsByDate = {};
            lessons.forEach(lesson => {
                if (!lessonsByDate[lesson.date]) {
                    lessonsByDate[lesson.date] = [];
                }
                lessonsByDate[lesson.date].push(lesson);
            });
            
            // Log summary for each date
            Object.keys(lessonsByDate).forEach(date => {
                console.log(`   📅 ${date}: ${lessonsByDate[date].length} lessons`);
                
                // Log first few lessons for this day
                lessonsByDate[date].slice(0, 3).forEach(lesson => {
                    const timeStart = lesson.startTime.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
                    const timeEnd = lesson.endTime.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
                    const status = lesson.isCancelled ? ' (CANCELLED)' : lesson.isAdditional ? ' (ADDITIONAL)' : '';
                    console.log(`     ${timeStart}-${timeEnd}: ${lesson.subject} - ${lesson.teacher} (${lesson.room})${status}`);
                });
            });
        }
        
        // Keep session alive - don't logout (reuse cache)
        console.log('♻️ Keeping session alive for future use');
        
    } catch (error) {
        console.error('❌ Timetable test failed:', error.toString());
        // Clear cache on error
        clearAPIInstance();
    }
}