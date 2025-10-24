/**
 * Configuration Template for WebUntis Automation
 * 
 * Copy this file and rename it to `config.js`, then update with your actual credentials.
 * Add `config.js` to your .gitignore to keep credentials secure.
 */

// WebUntis Configuration
const UNTIS_CONFIG = {
    school: 'YOUR_SCHOOL_NAME',           // Your school identifier from WebUntis URL
    username: 'YOUR_USERNAME',            // Your WebUntis username  
    password: 'YOUR_PASSWORD',            // Your WebUntis password
    server: 'YOUR_WEBUNTIS_SERVER',       // Usually something like 'demo.webuntis.com' or 'your-school.webuntis.com'
    resourceId: 'YOUR_STUDENT_RESOURCE_ID' // Your student resource ID (found in timetable URL, usually a number)
};

// Home Assistant Configuration
const HA_CONFIG = {
    url: 'https://your-home-assistant.com',        // Your Home Assistant URL
    token: 'YOUR_LONG_LIVED_ACCESS_TOKEN',         // Long-lived access token from HA profile
    service: 'notify.your_notification_service',   // Your notification service (e.g., 'notify.mobile_app_phone', 'notify.telegram')
    daysAheadNotifications: 3,                     // How many days ahead to check for homework notifications
};

// Google Calendar Configuration (Calendar API and other Google services)
const CALENDAR_CONFIG = {
    // Homework configuration
    homework: {
        calendarId: null,                          // null for default calendar, or specific calendar ID for homework tasks
                                                   // Example: 'homework@group.calendar.google.com' for a dedicated homework calendar
        syncDaysAhead: 14,                         // How many days ahead to sync homework (default: 14 days)
    },
    
    // Timetable configuration
    timetable: {
        calendarId: null,                          // null for default calendar, or specific calendar ID for timetable/lectures
                                                   // Example: 'timetable@group.calendar.google.com' for a dedicated class schedule calendar
        syncDaysAhead: 7,                          // How many days ahead to sync timetable/lectures (default: 7 days)
    },
    
    // For Node.js only - Google Calendar API credentials
    calendarCredentials: {
        // Option 1: Service Account (recommended for automation)
        type: 'service_account',
        private_key: 'YOUR_SERVICE_ACCOUNT_PRIVATE_KEY',
        client_email: 'your-service-account@your-project.iam.gserviceaccount.com',
        
        // Option 2: OAuth2 (for user accounts)
        // clientId: 'YOUR_OAUTH_CLIENT_ID',
        // clientSecret: 'YOUR_OAUTH_CLIENT_SECRET',
        // refreshToken: 'YOUR_OAUTH_REFRESH_TOKEN'
    }
};

// Mail Notification Configuration (separated for better organization)
const MAIL_NOTIFICATION_CONFIG = {
    enabled: true,                                 // Set to false to disable email notifications
    email: 'your-email@gmail.com',                // Your email address for notifications
    homeworkDaysAhead: 3,                          // How many days ahead to check for homework in email notifications
    emailConfig: {
        // For Node.js email sending (using nodemailer)
        service: 'gmail',                          // Email service provider
        user: 'sender-email@gmail.com',            // Sender email address
        password: 'YOUR_APP_PASSWORD',             // Gmail app password (not regular password!)
        // Alternative OAuth2 setup:
        // clientId: 'YOUR_OAUTH_CLIENT_ID',
        // clientSecret: 'YOUR_OAUTH_CLIENT_SECRET',
        // refreshToken: 'YOUR_OAUTH_REFRESH_TOKEN'
    }
};

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { UNTIS_CONFIG, HA_CONFIG, CALENDAR_CONFIG, MAIL_NOTIFICATION_CONFIG };
}

/**
 * SETUP INSTRUCTIONS:
 * 
 * 1. WebUntis Setup:
 *    - Get your school name from the WebUntis URL
 *    - Use your regular WebUntis login credentials
 *    - Find resourceId in your timetable URL (the number after 'id=')
 * 
 * 2. Home Assistant Setup:
 *    - Go to Profile > Long-Lived Access Tokens in Home Assistant
 *    - Create a new token and copy it
 *    - Set up a notification service in HA (mobile app, telegram, etc.)
 * 
 * 3. Google Apps Script Setup:
 *    - No additional setup needed for Gmail/Calendar (uses built-in authorization)
 *    - Just update the email address and optionally calendar IDs
 *    - To use separate calendars:
 *      • Create new calendars in Google Calendar (e.g., "WebUntis Homework", "WebUntis Timetable")
 *      • Get calendar IDs from calendar settings (Calendar ID section)
 *      • Update homeworkCalendarId and timetableCalendarId with these IDs
 *      • Benefits: Keep homework tasks and class schedules organized separately
 *      • Example: homework tasks appear in one calendar, class schedule in another
 * 
 * 4. Node.js Setup:
 *    - For Gmail: Enable 2FA and create an app password
 *    - For Calendar: Set up Google Cloud Project with Calendar API enabled
 *    - Create Service Account or OAuth2 credentials
 *    - Download credentials JSON and extract the required fields
 * 
 * 5. Security:
 *    - Never commit actual credentials to version control
 *    - Add config.js to .gitignore
 *    - Use environment variables in production
 */