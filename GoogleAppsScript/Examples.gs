/**
 * Usage Examples for Updated Google Apps Script WebUntis API
 * This file demonstrates how to use the new parameterized functions
 * 
 * Note: Home Assistant integration examples are in HomeAssistant.gs
 * Note: Google Apps Script functions (Gmail, Calendar) are in Google.gs
 */

// ==========================================
// CONFIGURATION
// ==========================================

// Define your WebUntis configuration once
const MY_CONFIG = {
    school: '<YOUR_SCHOOL_NAME>',        // Replace with your school
    username: '<YOUR_USERNAME>',         // Replace with your username
    password: '<YOUR_PASSWORD>',         // Replace with your password
    server: '<YOUR_WEBUNTIS_SERVER>'       // Replace if different
};

// ==========================================
// BASIC USAGE EXAMPLES
// ==========================================

/**
 * Example 1: Basic test
 */
function runBasicTest() {
    // Now you can pass config as a parameter
    testWebUntisAPI(MY_CONFIG);
}

/**
 * Example 2: Send homework email to yourself
 */
function sendHomeworkToMe() {
    const myEmail = 'your-email@gmail.com'; // Replace with your email
    sendHomeworkEmail(MY_CONFIG, myEmail, 3); // 3 days ahead
}

/**
 * Example 3: Add homework to your calendar
 */
function addHomeworkToMyCalendar() {
    addHomeworkToCalendar(MY_CONFIG, null, 7); // Default calendar, 7 days ahead
}

// ==========================================
// ADVANCED USAGE EXAMPLES
// ==========================================

/**
 * Example 4: Family homework notifications
 */
function sendFamilyHomeworkUpdate() {
    const familyEmails = [
        'student@family.com',
        'mom@family.com', 
        'dad@family.com'
    ];
    
    familyEmails.forEach((email, index) => {
        console.log(`📧 Sending homework update ${index + 1}/${familyEmails.length} to ${email}`);
        sendHomeworkEmail(MY_CONFIG, email, 5); // 5 days ahead
        
        // Add a small delay to avoid rate limiting
        Utilities.sleep(1000);
    });
    
    console.log('✅ Family homework updates sent!');
}

/**
 * Example 5: Different time horizons for different purposes
 */
function customHomeworkSchedules() {
    // Urgent - tomorrow's homework
    console.log('📅 Checking urgent homework (tomorrow)...');
    sendHomeworkEmail(MY_CONFIG, 'urgent@email.com', 1);
    
    // Weekly planning - next week's homework
    console.log('📅 Checking weekly homework (7 days)...');
    sendHomeworkEmail(MY_CONFIG, 'planning@email.com', 7);
    
    // Long-term - next two weeks
    console.log('📅 Checking long-term homework (14 days)...');
    sendHomeworkEmail(MY_CONFIG, 'longterm@email.com', 14);
}

/**
 * Example 6: Calendar integration with different calendars
 */
function syncToMultipleCalendars() {
    // Sync to default calendar
    console.log('📅 Syncing to default calendar...');
    addHomeworkToCalendar(MY_CONFIG, null, 7);
    
    // Sync to a specific homework calendar (if you have one)
    // Replace with your actual calendar ID
    const homeworkCalendarId = 'homework@group.calendar.google.com';
    
    try {
        console.log('📅 Syncing to homework calendar...');
        addHomeworkToCalendar(MY_CONFIG, homeworkCalendarId, 14);
    } catch (error) {
        console.log('⚠️ Homework calendar not found, using default only');
    }
}

/**
 * Example 7: Enhanced calendar usage with tasks (reminder day before due date)
 */
function syncToCalendarAsTasks() {
    console.log('📅 Example: Adding homework as tasks (day before due date)');
    
    // Add to a calendar named "School Homework" as tasks
    addHomeworkToCalendar(MY_CONFIG, 'School Homework', 14, {
        createCalendarIfNotExists: true,
        createAsTask: true,
        reminderDaysBefore: 1,
        eventColor: CalendarApp.EventColor.BLUE
    });
}

/**
 * Example 8: Enhanced calendar usage with specific calendar by name (traditional events)
 */
function syncToCalendarByName() {
    console.log('📅 Example: Adding homework to calendar by name (traditional events)');
    
    // Add to a calendar named "School Homework" as events on due date
    addHomeworkToCalendar(MY_CONFIG, 'School Homework', 14, {
        createCalendarIfNotExists: true,
        createAsTask: false,
        eventColor: CalendarApp.EventColor.BLUE
    });
}

/**
 * Example 9: Enhanced calendar usage with specific calendar by ID
 */
function syncToCalendarById() {
    console.log('📅 Example: Adding homework to calendar by ID');
    
    // First list calendars to find the ID you want
    const calendars = listAvailableCalendars();
    
    if (calendars.length > 0) {
        // Use the first non-default calendar if available
        const targetCalendar = calendars.find(cal => !cal.isDefault) || calendars[0];
        
        addHomeworkToCalendar(MY_CONFIG, targetCalendar.id, 7, {
            createAsTask: true,
            reminderDaysBefore: 2, // 2 days before due date
            eventColor: CalendarApp.EventColor.GREEN
        });
    }
}

/**
 * Example 10: Creating a dedicated WebUntis calendar with custom reminder timing
 */
function createDedicatedCalendarWithCustomReminders() {
    console.log('📅 Example: Creating dedicated WebUntis calendar with custom reminders');
    
    // This will create a new calendar if it doesn't exist
    addHomeworkToCalendar(MY_CONFIG, 'WebUntis Homework', 30, {
        createCalendarIfNotExists: true,
        calendarName: 'WebUntis Homework',
        createAsTask: true,
        reminderDaysBefore: 3, // 3 days before due date
        eventColor: CalendarApp.EventColor.ORANGE
    });
}

/**
 * Example 11: Listing all available calendars
 */
function exampleListCalendars() {
    console.log('📅 Example: Listing all available calendars');
    
    // Simple list
    console.log('\n--- Simple List ---');
    listAvailableCalendars();
    
    // Detailed list
    console.log('\n--- Detailed List ---');
    listAvailableCalendars(true);
}

// ==========================================
// AUTOMATION FUNCTIONS
// ==========================================

/**
 * Daily automation - Set this up as a daily trigger
 */
function dailyAutomation() {
    console.log('🤖 Running daily homework automation...');
    
    try {
        // Send daily reminder - will authenticate if needed
        sendHomeworkEmail(MY_CONFIG, 'daily@email.com', 2);
        
        // Update calendar - will reuse session
        addHomeworkToCalendar(MY_CONFIG, null, 3, {
            createAsTask: true,
            reminderDaysBefore: 1
        });
        
        // Clean up session after automation
        clearAPIInstance();
        
        console.log('✅ Daily automation completed!');
        
    } catch (error) {
        console.error('❌ Daily automation failed:', error.toString());
        clearAPIInstance(); // Clean up on error
        throw error;
    }
}

/**
 * Weekly automation - Set this up as a weekly trigger
 */
function weeklyAutomation() {
    console.log('🤖 Running weekly homework automation...');
    
    try {
        // Send weekly summary - will authenticate if needed
        sendHomeworkEmail(MY_CONFIG, 'weekly@email.com', 7);
        
        // Sync longer-term calendar with 2-day advance notice - will reuse session
        addHomeworkToCalendar(MY_CONFIG, null, 14, {
            createAsTask: true,
            reminderDaysBefore: 2
        });
        
        // Clean up session after automation
        clearAPIInstance();
        
        console.log('✅ Weekly automation completed!');
        
    } catch (error) {
        console.error('❌ Weekly automation failed:', error.toString());
        clearAPIInstance(); // Clean up on error
        throw error;
    }
}

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

/**
 * Test all functions at once
 */
function testAllFunctions() {
    console.log('🧪 Testing all functions...');
    
    try {
        // Validate config first
        if (!validateConfiguration()) {
            throw new Error('Configuration validation failed');
        }
        
        // Test basic functionality
        console.log('1. Testing basic API...');
        testWebUntisAPI(MY_CONFIG, false); // Don't logout, keep session
        
        // Test calendar listing
        console.log('2. Testing calendar listing...');
        listAvailableCalendars();
        
        // Test email (replace with your email) - will reuse session
        console.log('3. Testing email...');
        sendHomeworkEmail(MY_CONFIG, 'test@email.com', 3);
        
        // Test calendar - will reuse session
        console.log('4. Testing calendar...');
        addHomeworkToCalendar(MY_CONFIG, null, 5);
        
        // Clear session at the end
        console.log('5. Cleaning up...');
        clearAPIInstance();
        
        console.log('✅ All tests completed!');
        
    } catch (error) {
        console.error('❌ Test failed:', error.toString());
        clearAPIInstance(); // Clean up on error too
        throw error; // Re-throw to ensure calling code knows about the failure
    }
}

/**
 * Example of session reuse efficiency
 */
function exampleSessionReuse() {
    console.log('⚡ Example: Demonstrating session reuse efficiency');
    
    try {
        // First call - will authenticate
        console.log('\n--- First call (will authenticate) ---');
        sendHomeworkEmail(MY_CONFIG, 'test1@email.com', 3);
        
        // Second call - will reuse session
        console.log('\n--- Second call (will reuse session) ---');
        addHomeworkToCalendar(MY_CONFIG, null, 7);
        
        // Third call - will reuse session
        console.log('\n--- Third call (will reuse session) ---');
        testWebUntisAPI(MY_CONFIG, false);
        
        // Clean up
        console.log('\n--- Cleaning up ---');
        clearAPIInstance();
        
        console.log('✅ Session reuse example completed!');
        
    } catch (error) {
        console.error('❌ Session reuse example failed:', error.toString());
        clearAPIInstance();
    }
}

/**
 * Example of proper error handling when config is missing
 */
function exampleErrorHandling() {
    console.log('🔍 Testing error handling...');
    
    try {
        // This should throw an error because config is null
        sendHomeworkEmail(null, 'test@email.com', 3);
    } catch (error) {
        console.log('✅ Expected error caught:', error.message);
    }
    
    try {
        // This should throw an error because email is missing
        sendHomeworkEmail(MY_CONFIG, null, 3);
    } catch (error) {
        console.log('✅ Expected error caught:', error.message);
    }
    
    try {
        // This should throw an error because config is missing
        addHomeworkToCalendar(null);
    } catch (error) {
        console.log('✅ Expected error caught:', error.message);
    }
    
    console.log('✅ Error handling test completed!');
}

/**
 * Configuration validator
 */
function validateConfiguration() {
    console.log('🔍 Validating configuration...');
    
    const required = ['school', 'username', 'password', 'server'];
    const missing = required.filter(key => !MY_CONFIG[key] || MY_CONFIG[key].includes('your-'));
    
    if (missing.length > 0) {
        console.error('❌ Missing or placeholder values in config:', missing);
        console.log('⚠️ Please update MY_CONFIG with your actual credentials');
        return false;
    }
    
    console.log('✅ Configuration looks good!');
    return true;
}

// ==========================================
// QUICK START
// ==========================================

/**
 * Quick start function - run this first!
 */
function quickStart() {
    console.log('🚀 WebUntis Google Apps Script - Quick Start');
    console.log('==========================================');
    
    // Validate config first
    if (!validateConfiguration()) {
        return;
    }
    
    // Run basic test
    console.log('Running basic test...');
    testWebUntisAPI(MY_CONFIG);
    
    console.log('🎉 Quick start completed! You can now use the other functions.');
}