/**
 * Node.js Starter for WebUntis Automation
 * 
 * This file demonstrates how to use the WebUntis API in a Node.js environment
 * with proper imports and configuration for email, calendar, and Home Assistant integration.
 * 
 * Instructions:
 * 1. Install dependencies: npm install nodemailer googleapis
 * 2. Update the configuration objects below with your credentials
 * 3. Run: node StartNode.js
 */

// Import for Node.js
const { WebUntisAPI, getWebUntisApiInstance, clearWebUntisApiInstance } = require('./WebUntis.js');
const { sendHomeworkEmailNodejs, syncHomeworkToCalendarNodejs, syncTimetableToCalendarNodejs } = require('./Google.js');
const { sendHomeworkToHomeAssistant } = require('./HomeAssistant.js');

// ==========================================
// CONFIGURATION
// ==========================================

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
    service: 'notify.signal_me',                   // Replace with your notification service
    daysAheadNotifications: 3,                     // How many days ahead to check for homework notifications
};

const MAIL_NOTIFICATION_CONFIG = {
    enabled: true,                                 // Set to false to disable email notifications
    email: '<YOUR_EMAIL@gmail.com>',               // Your email address for notifications
    homeworkDaysAhead: 3,                          // How many days ahead to check for homework in email notifications
    titlePrefix: null,                             // Optional prefix for email subject (e.g., "📚 School:", "Student Name:")
    emailConfig: {
        // For Node.js email sending (using nodemailer)
        service: 'gmail',                          // Email service (gmail, outlook, etc.)
        user: '<YOUR_SENDER_EMAIL@gmail.com>',     // Sender email
        password: '<YOUR_APP_PASSWORD>',           // App password (not regular password!)
        from: '<YOUR_SENDER_EMAIL@gmail.com>',     // From address (usually same as user)
        // Alternative OAuth2 configuration:
        // clientId: '<YOUR_OAUTH_CLIENT_ID>',
        // clientSecret: '<YOUR_OAUTH_CLIENT_SECRET>',
        // refreshToken: '<YOUR_OAUTH_REFRESH_TOKEN>'
    }
};

const CALENDAR_CONFIG = {
    // Homework configuration
    homework: {
        calendarId: null,                          // null for default calendar, or specific calendar ID for homework
        syncDaysAhead: 14,                         // How many days ahead to sync homework (default: 14 days)
    },
    
    // Timetable configuration
    timetable: {
        calendarId: null,                          // null for default calendar, or specific calendar ID for timetable/lectures
        syncDaysAhead: 7,                          // How many days ahead to sync timetable/lectures (default: 7 days)
    },
    
    // Google Calendar API credentials (service account or OAuth2)
    calendarCredentials: {
        // Option 1: Service Account (recommended for automation)
        type: 'service_account',
        private_key: '<YOUR_SERVICE_ACCOUNT_PRIVATE_KEY>',
        client_email: '<YOUR_SERVICE_ACCOUNT_EMAIL>',
        // Option 2: OAuth2 (for user accounts)
        // clientId: '<YOUR_OAUTH_CLIENT_ID>',
        // clientSecret: '<YOUR_OAUTH_CLIENT_SECRET>',
        // refreshToken: '<YOUR_OAUTH_REFRESH_TOKEN>'
    }
};

// WebUntis Configuration
// STARTER FUNCTIONS
// ==========================================

/**
 * Node.js Starter - Complete automation setup
 * Run this function to set up all your automated workflows
 */
async function StartNode() {
    console.log('🚀 Starting Node.js WebUntis Automation...');
    
    try {
        // 1. Test basic API connection
        console.log('1️⃣ Testing WebUntis API connection...');
        const api = await getWebUntisApiInstance(UNTIS_CONFIG);
        const homework = await api.getFormattedHomework(MAIL_NOTIFICATION_CONFIG.homeworkDaysAhead, true);
        console.log('✅ WebUntis API connection successful!');
        console.log('📚 Sample homework:', homework.substring(0, 100) + '...');
        
        // 2. Send homework email notification (Node.js version)
        console.log('\n2️⃣ Sending homework email notification...');
        if (MAIL_NOTIFICATION_CONFIG.enabled && 
            MAIL_NOTIFICATION_CONFIG.email && !MAIL_NOTIFICATION_CONFIG.email.includes('<YOUR_EMAIL') && 
            MAIL_NOTIFICATION_CONFIG.emailConfig && !MAIL_NOTIFICATION_CONFIG.emailConfig.user.includes('<YOUR_SENDER_EMAIL')) {
            try {
                await sendHomeworkEmailNodejs(UNTIS_CONFIG, MAIL_NOTIFICATION_CONFIG.email, MAIL_NOTIFICATION_CONFIG.homeworkDaysAhead, MAIL_NOTIFICATION_CONFIG.titlePrefix, MAIL_NOTIFICATION_CONFIG.emailConfig);
                console.log('✅ Homework email sent successfully!');
            } catch (error) {
                console.log('⚠️ Email sending failed:', error.message);
            }
        } else {
            console.log('⚠️ Email not configured - skipping email notification');
            console.log('💡 Tip: Configure MAIL_NOTIFICATION_CONFIG.email and MAIL_NOTIFICATION_CONFIG.emailConfig');
        }
        
        // 3. Sync homework to Google Calendar (Node.js version)
        console.log('\n3️⃣ Syncing homework to Google Calendar...');
        if (CALENDAR_CONFIG.calendarCredentials && 
            (CALENDAR_CONFIG.calendarCredentials.private_key || CALENDAR_CONFIG.calendarCredentials.refreshToken)) {
            try {
                const result = await syncHomeworkToCalendarNodejs(
                    UNTIS_CONFIG, 
                    CALENDAR_CONFIG.calendarCredentials, 
                    CALENDAR_CONFIG.homework.syncDaysAhead, // Use configured days
                    { 
                        calendarId: CALENDAR_CONFIG.homework.calendarId,
                        createAsTask: true,
                        reminderDaysBefore: 1 
                    }
                );
                console.log('✅ Homework synced to calendar successfully!');
                console.log(`📊 Results: ${result.added} added, ${result.updated} updated`);
            } catch (error) {
                console.log('⚠️ Calendar sync failed:', error.message);
            }
        } else {
            console.log('⚠️ Google Calendar not configured - skipping calendar sync');
            console.log('💡 Tip: Configure CALENDAR_CONFIG.calendarCredentials');
        }
        
        // 4. Send Home Assistant notification
        console.log('\n4️⃣ Sending Home Assistant notification...');
        if (HA_CONFIG.url && !HA_CONFIG.url.includes('<YOUR_HOME_ASSISTANT')) {
            try {
                await sendHomeworkToHomeAssistant(UNTIS_CONFIG, HA_CONFIG, HA_CONFIG.daysAheadNotifications, {
                    title: 'WebUntis Homework Update',
                    includeDetails: true
                });
                console.log('✅ Home Assistant notification sent successfully!');
            } catch (error) {
                console.log('⚠️ Home Assistant notification failed:', error.message);
            }
        } else {
            console.log('⚠️ Home Assistant not configured - skipping HA notification');
            console.log('💡 Tip: Configure HA_CONFIG.url and HA_CONFIG.token');
        }
        
        // 5. Sync timetable to Google Calendar (Node.js version)
        console.log('\n5️⃣ Syncing timetable to Google Calendar...');
        if (CALENDAR_CONFIG.calendarCredentials && 
            (CALENDAR_CONFIG.calendarCredentials.private_key || CALENDAR_CONFIG.calendarCredentials.refreshToken)) {
            try {
                // Get timetable for configured days ahead
                const today = new Date();
                const endDate = new Date();
                endDate.setDate(today.getDate() + CALENDAR_CONFIG.timetable.syncDaysAhead);
                
                const timetableData = await api.getTimetableData(today, endDate);
                if (timetableData) {
                    const lessons = api.processTimetableData(timetableData, {
                        skipCancelled: false,
                        includeNotes: true
                    });
                    
                    if (lessons && lessons.length > 0) {
                        const result = await syncTimetableToCalendarNodejs(
                            lessons,
                            CALENDAR_CONFIG.calendarCredentials,
                            {
                                calendarId: CALENDAR_CONFIG.timetable.calendarId,
                                deleteOldEvents: false,
                                eventColor: null
                            }
                        );
                        console.log(`✅ Timetable sync successful! ${result.added} added, ${result.updated} updated, ${result.deleted} deleted`);
                    } else {
                        console.log(`📅 No timetable lessons found for the next ${CALENDAR_CONFIG.timetable.syncDaysAhead} days`);
                    }
                } else {
                    console.log('📅 No timetable data available');
                }
            } catch (error) {
                console.log('⚠️ Timetable sync failed:', error.message);
            }
        } else {
            console.log('⚠️ Google Calendar not configured - skipping timetable sync');
        }
        
        console.log('\n🎉 Node.js automation completed successfully!');
        console.log('💡 Tip: Set up a cron job or scheduled task to run this automatically');
        
        // Clean up
        await clearWebUntisApiInstance();
        
    } catch (error) {
        console.error('❌ Node.js automation failed:', error.toString());
        await clearWebUntisApiInstance();
    }
}

/**
 * Simple test function to verify everything is working
 */
async function testNodeSetup() {
    console.log('🔍 Testing Node.js setup...');
    
    try {
        // Test WebUntis API
        const api = await getWebUntisApiInstance(UNTIS_CONFIG);
        const homework = await api.getFormattedHomework(1, true);
        console.log('✅ WebUntis API test passed');
        
        // Test configuration
        console.log('\n📋 Configuration Status:');
        console.log(`   WebUntis: ${UNTIS_CONFIG.school !== '<YOUR_SCHOOL_NAME>' ? '✅' : '❌'} Configured`);
        console.log(`   Email: ${MAIL_NOTIFICATION_CONFIG.emailConfig && !MAIL_NOTIFICATION_CONFIG.emailConfig.user.includes('<YOUR_SENDER_EMAIL') ? '✅' : '❌'} Configured`);
        console.log(`   Calendar: ${CALENDAR_CONFIG.calendarCredentials && (CALENDAR_CONFIG.calendarCredentials.private_key || CALENDAR_CONFIG.calendarCredentials.refreshToken) ? '✅' : '❌'} Configured`);
        console.log(`   Homework Calendar: ${CALENDAR_CONFIG.homework.calendarId ? '📅 Custom' : '📅 Default'} (${CALENDAR_CONFIG.homework.syncDaysAhead} days ahead)`);
        console.log(`   Timetable Calendar: ${CALENDAR_CONFIG.timetable.calendarId ? '📅 Custom' : '📅 Default'} (${CALENDAR_CONFIG.timetable.syncDaysAhead} days ahead)`);
        console.log(`   Home Assistant: ${HA_CONFIG.url && !HA_CONFIG.url.includes('<YOUR_HOME_ASSISTANT') ? '✅' : '❌'} Configured`);
        
        await clearWebUntisApiInstance();
        console.log('\n🎉 Node.js setup test completed!');
        
    } catch (error) {
        console.error('❌ Node.js setup test failed:', error.toString());
        await clearWebUntisApiInstance();
    }
}

/**
 * Quick homework check function
 */
async function quickHomeworkCheck() {
    console.log('📚 Quick homework check...');
    
    try {
        const api = await getWebUntisApiInstance(UNTIS_CONFIG);
        const homework = await api.getFormattedHomework(3, true);
        console.log('\n📋 Homework for next 3 days:');
        console.log(homework);
        
        await clearWebUntisApiInstance();
        
    } catch (error) {
        console.error('❌ Homework check failed:', error.toString());
        await clearWebUntisApiInstance();
    }
}

// ==========================================
// EXPORTS AND EXECUTION
// ==========================================

// Export functions for use as module
module.exports = {
    StartNode,
    testNodeSetup,
    quickHomeworkCheck,
    UNTIS_CONFIG,
    HA_CONFIG,
    CALENDAR_CONFIG
};

// Auto-run if called directly
if (require.main === module) {
    console.log('🚀 WebUntis Node.js Automation Starter');
    console.log('📝 Available commands:');
    console.log('   node StartNode.js test     - Test setup');
    console.log('   node StartNode.js quick    - Quick homework check');
    console.log('   node StartNode.js start    - Run full automation');
    console.log('');
    
    const command = process.argv[2] || 'start';
    
    switch (command.toLowerCase()) {
        case 'test':
            testNodeSetup();
            break;
        case 'quick':
            quickHomeworkCheck();
            break;
        case 'start':
        default:
            StartNode();
            break;
    }
}