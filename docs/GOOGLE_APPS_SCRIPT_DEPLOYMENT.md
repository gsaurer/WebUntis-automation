# WebUntis Automation - Google Apps Script Deployment Guide

This guide explains how to deploy the WebUntis automation files to Google Apps Script for easy Google services integration.

## Overview

The root directory contains standalone JavaScript files that work in both Node.js and Google Apps Script environments:

- `WebUntis.js` - Core WebUntis API wrapper with timetable functionality
- `Google.js` - Google services integration (Gmail, Calendar) 
- `Code.gs` - Complete automation starter with configuration
- `AppsScript-Test.js` - Test functions and examples
- `HomeAssistant.js` - Home Assistant integration (optional)

## Google Apps Script Deployment

### Step 1: Create a New Google Apps Script Project

1. Go to [Google Apps Script](https://script.google.com)
2. Click "New Project"
3. Give your project a name (e.g., "WebUntis Automation")

### Step 2: Add the Files

**IMPORTANT**: For Google Apps Script, you must copy the content of both files to make functions available to each other.

#### Required Setup Order:
1. **Create WebUntis.gs**: Copy the entire content from `WebUntis.js` into a new file named `WebUntis.gs`
2. **Create Google.gs**: Copy the entire content from `Google.js` into a new file named `Google.gs`  
3. **Create Code.gs**: Copy content from `Code.gs` into a new file named `Code.gs` (main automation)
4. **Create Test.gs**: Copy content from `AppsScript-Test.js` and rename to `Test.gs` (optional, for testing)

#### Why Multiple Files Are Needed:
- `WebUntis.gs` contains the core API functions like `getWebUntisApiInstance()` and `WebUntisAPI` class
- `Google.gs` contains the email and calendar functions that depend on the WebUntis functions
- `Code.gs` contains the main automation workflows and configuration
- In Google Apps Script, all files in the same project share the same global scope

#### File Structure in Google Apps Script:
```
Your Google Apps Script Project/
├── WebUntis.gs          (Copy content from WebUntis.js)
├── Google.gs            (Copy content from Google.js)
├── Code.gs              (Copy content from Code.gs - main automation)
└── Test.gs              (Copy content from AppsScript-Test.js - optional)
```

### Step 3: Configure Your Credentials

Update the configuration objects in `Code.gs`:

```javascript
const UNTIS_CONFIG = {
    school: 'your-school-name',           // Your school identifier
    username: 'your-username',           // Your WebUntis username  
    password: 'your-password',           // Your WebUntis password
    server: 'your-webuntis-server',      // Your server (change if different)
    resourceId: 'your-student-resource-id' // Your student resource ID (found in timetable URL)
};

const MAIL_NOTIFICATION_CONFIG = {
    enabled: true,
    email: 'your-email@gmail.com',
    homeworkDaysAhead: 3,
    titlePrefix: null,           // Optional prefix for email subject (e.g., "📚 School:", "Student Name:")
    emailConfig: null            // Not needed for Google Apps Script
};

const CALENDAR_CONFIG = {
    homework: {
        calendarId: null,        // null for default calendar
        syncDaysAhead: 14,       // Days ahead to sync homework
    },
    timetable: {
        calendarId: null,        // null for default calendar  
        syncDaysAhead: 7,        // Days ahead to sync timetable
    },
};
```
    password: 'your-password',           // Your WebUntis password
    server: 'your-server.webuntis.com',  // Your WebUntis server
    resourceId: 12345                    // Your student resource ID
};
```

### Step 4: Test Your Setup

1. **Run a test function**:
   - Select `quickTest` from the function dropdown
   - Click the "Run" button (▶️)
   - Check the execution log for results

2. **Run complete automation**:
   - Select `runDaily` from the function dropdown
   - Click "Run" to test email + calendar sync
   - Check logs for success messages

### Step 5: Set Up Automated Triggers (Optional)

For daily automated homework reminders:

1. In Google Apps Script, go to "Triggers" (clock icon)
2. Click "Add Trigger"
3. Choose function: `runDaily`
4. Event source: Time-driven
5. Type: Day timer
6. Time: Choose your preferred time (e.g., 8:00 AM)

### Step 6: Grant Permissions

When you first run functions, Google will ask for permissions:

- **Gmail API**: For sending homework emails
- **Calendar API**: For timetable sync
- **External requests**: For WebUntis API calls

Click "Allow" for each permission request.

### Step 6: Using Async Functions

**Important**: The main functions in `Google.js` like `sendHomeworkEmail()` are async functions. In Google Apps Script:

- Use `await` when calling these functions from other async functions
- For triggers and manual execution, Google Apps Script handles async functions automatically

Example usage:
```javascript
// In a trigger function
async function dailyHomeworkReminder() {
    const config = {
        school: 'your-school',
        username: 'your-username', 
        password: 'your-password',
        server: 'your-server.webuntis.com'
    };
    
    await sendHomeworkEmail(config, 'your-email@gmail.com', 3);
}
```

## Key Differences: Node.js vs Google Apps Script

### Authentication
- **Google Apps Script**: Automatic OAuth for Google services
- **Node.js**: Manual OAuth setup required

### Email Sending
```javascript
// Google Apps Script
GmailApp.sendEmail(emailAddress, subject, body, options);

// Node.js (requires nodemailer)
const nodemailer = require('nodemailer');
await transporter.sendMail(mailOptions);
```

### Calendar Integration
```javascript
// Google Apps Script
CalendarApp.createEvent(title, startTime, endTime, options);

// Node.js (requires googleapis)
const { google } = require('googleapis');
await calendar.events.insert({ calendarId, resource: eventData });
```

### Module Imports
```javascript
// Google Apps Script - No imports needed
function myFunction() { ... }

// Node.js - Requires imports
const { WebUntisAPI } = require('./WebUntis.js');
```

## Available Functions

### Main Automation Functions
- `runDaily()` - Complete daily automation (email + calendar sync)
- `sendNotifications()` - Send homework email notifications
- `syncHomework()` - Sync homework to calendar
- `syncTimetable()` - Sync timetable to calendar

### Individual Functions
- `sendHomeworkEmail()` - Send homework reminders via email
- `syncHomeworkToCalendar()` - Add homework as calendar events (full workflow)
- `syncTimetableToCalendarWorkflow()` - Sync timetable to calendar (full workflow)

### Test Functions
- `quickTest()` - Basic API functionality test
- `homeAssistantNotification()` - Test Home Assistant integration
- `listAvailableCalendars()` - Show all available calendars

### Utility Functions
- `syncTimetableToCalendar()` - Low-level calendar sync (expects processed lessons)
- `getWebUntisApiInstance()` - Get authenticated API instance

## Configuration Examples

### Email Configuration (Node.js)
```javascript
const emailConfig = {
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
        user: 'your-email@gmail.com',
        pass: 'your-app-password'  // Use App Password for Gmail
    },
    from: 'your-email@gmail.com'
};
```

### Home Assistant Configuration
```javascript
const HA_CONFIG = {
    url: 'http://your-home-assistant.local:8123',
    token: 'your-long-lived-access-token',
    service: 'notify.your_notification_service'
};
```

### Calendar Options
```javascript
const calendarOptions = {
    createCalendarIfNotExists: true,
    calendarName: 'WebUntis Timetable',
    updateExisting: true,
    includeNotes: true
};
```

## Troubleshooting

### Common Issues

#### "api.getHomeworkList is not a function" Error
**Cause**: The `WebUntis.js` content is not available in your Google Apps Script project.

**Solution**: 
1. Ensure you have copied the entire content of `WebUntis.js` into a file named `WebUntis.gs` in your Google Apps Script project
2. Both `WebUntis.gs` and `Google.gs` must be in the same Google Apps Script project
3. Save both files and try running the function again

#### Authentication Errors
- Verify your WebUntis credentials
- Check school name (usually lowercase, no spaces)
- Confirm server URL is correct

#### Permission Errors  
- Re-run the authorization flow
- Check if APIs are enabled in Google Cloud Console
- Verify calendar/email permissions

#### Bearer Token Issues
- Bearer token 403 errors are normal for many schools
- The system automatically falls back to session-based auth
- No action needed if you see "using session-based auth"

#### Timetable Access
- Ensure you have the correct `resourceId` (student ID)
- Check that you have timetable access permissions
- Verify the date range is valid

### Finding Your Resource ID

Your student resource ID can be found in the WebUntis timetable URL:
```
https://server.webuntis.com/WebUntis/...?type=1&elementType=1&elementId=12345
                                                                        ^^^^^
                                                                    This is your resourceId
```

## Advanced Usage

### Custom Triggers
Set up multiple triggers for different functions:
- Daily homework reminders at 8:00 AM
- Weekly timetable sync on Sunday evenings  
- Homework calendar updates every 6 hours

### Multiple Recipients
Use the `sendHomeworkToMultipleEmails()` function for family notifications:
```javascript
const recipients = [
    'student@family.com',
    'parent1@family.com', 
    'parent2@family.com'
];
```

### Calendar Integration
Create separate calendars for different types of events:
- "WebUntis Homework" for homework reminders
- "WebUntis Timetable" for lessons
- "WebUntis Exams" for exam-specific events

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review the test functions for examples
3. Verify your configuration matches the examples
4. Check Google Apps Script execution logs for detailed error messages

## Security Notes

- Never share your WebUntis credentials
- Use App Passwords for Gmail in Node.js
- Keep Home Assistant tokens secure
- Regularly review and update permissions