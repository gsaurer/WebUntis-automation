# WebUntis API for Google Apps Script - Setup Guide

## Overview
This guide shows you how to use the WebUntis API wrapper in Google Apps Script to automate homework notifications, calendar integration, and more.

## Setup Instructions

### 1. Create a New Google Apps Script Project

1. Go to [script.google.com](https://script.google.com)
2. Click "New Project"
3. Give your project a meaningful name like "WebUntis Homework Automation"
4. You'll see a default `Code.gs` file with a `myFunction()` - delete this content

### 2. Upload the Project Files

#### Option A: Manual Copy-Paste (Recommended for beginners)
1. **Add WebUntis.gs**:
   - In your Apps Script project, rename `Code.gs` to `WebUntis.gs`
   - Copy the entire contents of `WebUntis.gs` from this repository
   - Paste it into the editor, replacing any existing code

2. **Add Google.gs** (for email/calendar features):
   - Click the `+` button next to "Files"
   - Choose "Script" and name it `Google`
   - Copy the contents of `Google.gs` and paste it

3. **Add HomeAssistant.gs** (optional, for Home Assistant integration):
   - Add another script file named `HomeAssistant`
   - Copy the contents of `HomeAssistant.gs` and paste it

4. **Add Test.gs** (for testing):
   - Add another script file named `Test`
   - Copy the contents of `Test.gs` and paste it

#### Option B: Using Apps Script CLI (Advanced users)
1. Install the CLI: `npm install -g @google/clasp`
2. Login: `clasp login`
3. Create project: `clasp create --title "WebUntis Homework Automation"`
4. Push files: `clasp push`

### 3. Configure Your Credentials

Replace the placeholder values in the config object:

```javascript
const config = {
    school: 'your-school-name',        // Your WebUntis school identifier
    username: 'your-username',         // Your WebUntis username
    password: 'your-password',         // Your WebUntis password
    server: '<YOUR_WEBUNTIS_SERVER>'       // Your WebUntis server (change if different)
};
```

### 4. Test Your Setup

1. **Run a test function**:
   - Select the `quickTest` function from the dropdown
   - Click the "Run" button (▶️)
   - Check the "Execution log" for results

2. **Grant permissions**:
   - Google will ask for permissions the first time
   - Click "Review permissions" and accept all required permissions
   - ✅ **External requests**: To connect to WebUntis API
   - ✅ **Gmail**: To send email notifications (if using email features)
   - ✅ **Calendar**: To add homework events (if using calendar features)

## Setting Up Daily Automation

### Method 1: Time-based Triggers (Recommended)

1. **Access Triggers**:
   - In your Apps Script project, click the "Triggers" icon (⏰) in the left sidebar
   - Click "+ Add Trigger"

2. **Set up Daily Homework Email**:
   - **Function to run**: Select `sendHomeworkEmail` (or create a custom function)
   - **Deployment**: Choose "Head"
   - **Event source**: Select "Time-driven"
   - **Type of time based trigger**: Select "Day timer"
   - **Time of day**: Choose your preferred time (e.g., "8am to 9am")
   - Click "Save"

3. **Set up Weekly Calendar Sync** (optional):
   - Click "+ Add Trigger" again
   - **Function to run**: Select `addHomeworkToCalendar`
   - **Event source**: Select "Time-driven"
   - **Type of time based trigger**: Select "Week timer"
   - **Day of week**: Select "Sunday"
   - **Time of day**: Choose your preferred time (e.g., "9am to 10am")
   - Click "Save"

### Method 2: Custom Scheduling Function

Create a master function that runs daily and handles all your automation:

```javascript
function dailyHomeworkAutomation() {
    try {
        console.log('🚀 Starting daily homework automation...');
        
        // Update the config with your credentials
        const config = {
            school: '<YOUR_SCHOOL_NAME>',
            username: '<YOUR_USERNAME>',
            password: '<YOUR_PASSWORD>',
            server: '<YOUR_WEBUNTIS_SERVER>'
        };
        
        // Send email notification for next 3 days
        const emailAddress = '<YOUR_EMAIL@gmail.com>';
        sendHomeworkEmail(config, emailAddress, 3, 'Daily Homework Reminder: ');
        
        // Optional: Add to calendar every Sunday
        const today = new Date();
        if (today.getDay() === 0) { // Sunday
            addHomeworkToCalendar(config, null, 7); // Add next 7 days
        }
        
        // Optional: Send Home Assistant notification
        if (typeof sendHomeworkToHomeAssistant === 'function') {
            const haConfig = {
                url: '<YOUR_HOME_ASSISTANT_URL>',
                token: '<YOUR_HA_ACCESS_TOKEN>'
            };
            sendHomeworkToHomeAssistant(config, haConfig, 2);
        }
        
        console.log('✅ Daily automation completed successfully!');
        
    } catch (error) {
        console.error('❌ Daily automation failed:', error.toString());
        
        // Optional: Send error notification
        GmailApp.sendEmail(
            '<YOUR_EMAIL@gmail.com>',
            '⚠️ WebUntis Automation Error',
            `The daily homework automation failed with error: ${error.toString()}`
        );
    }
}
```

Then set up a trigger for this single function:
- **Function to run**: `dailyHomeworkAutomation`
- **Event source**: "Time-driven"
- **Type**: "Day timer"
- **Time of day**: Your preferred time

### Method 3: Multiple Specific Triggers

For more granular control, set up separate triggers:

```javascript
// Morning reminder - 7:30 AM
function morningHomeworkReminder() {
    const config = { /* your config */ };
    sendHomeworkEmail(config, '<YOUR_EMAIL@gmail.com>', 1, '🌅 Today: ');
}

// Evening preparation - 6:00 PM  
function eveningHomeworkPrep() {
    const config = { /* your config */ };
    sendHomeworkEmail(config, '<YOUR_EMAIL@gmail.com>', 2, '🌆 Tomorrow: ');
}

// Weekly planning - Sunday 10:00 AM
function weeklyHomeworkPlanning() {
    const config = { /* your config */ };
    sendHomeworkEmail(config, '<YOUR_EMAIL@gmail.com>', 7, '📅 This Week: ');
    addHomeworkToCalendar(config, null, 7);
}
```

### Trigger Management Tips

1. **Monitor Executions**:
   - Click "Executions" (📊) to see trigger history
   - Check for failures and debug issues

2. **Trigger Limits**:
   - Free accounts: 20 triggers per script
   - Each trigger has a 6-minute execution limit

3. **Error Handling**:
   - Always wrap your automation in try-catch blocks
   - Consider sending error notifications to yourself

4. **Testing Triggers**:
   - Use "Run" button to test functions manually
   - Check logs in "Executions" after automated runs

### Advanced Scheduling Options

#### Custom Time Ranges
```javascript
function smartHomeworkReminder() {
    const now = new Date();
    const hour = now.getHours();
    const day = now.getDay(); // 0 = Sunday, 6 = Saturday
    
    // Skip weekends
    if (day === 0 || day === 6) {
        console.log('Weekend - skipping homework reminder');
        return;
    }
    
    // Different behavior based on time
    if (hour < 12) {
        // Morning: Today's homework
        sendHomeworkEmail(config, email, 1, '🌅 Today: ');
    } else if (hour < 18) {
        // Afternoon: Tomorrow's homework
        sendHomeworkEmail(config, email, 2, '🌆 Tomorrow: ');
    } else {
        // Evening: Next 3 days
        sendHomeworkEmail(config, email, 3, '📚 Upcoming: ');
    }
}
```

#### Conditional Notifications
```javascript
function conditionalHomeworkReminder() {
    const config = { /* your config */ };
    
    // Get homework data using new method
    const api = getAPIInstance(config);
    const homeworkList = api.getHomeworkList(2, true, true); // Next 2 days, exclude today
    
    // Only send notification if homework exists
    if (homeworkList) {
        const formattedHomework = api.formatHomework(homeworkList, 2, true);
        sendHomeworkEmail(config, '<YOUR_EMAIL@gmail.com>', 2);
        console.log(`📧 Homework reminder sent for ${homeworkList.length} assignments`);
    } else {
        console.log('😎 No homework - notification skipped');
    }
    
    clearAPIInstance();
}
```

#### HTTP Requests
- **Node.js**: Uses `fetch()` API
- **Google Apps Script**: Uses `UrlFetchApp.fetch()`

#### Async/Await
- **Node.js**: Full async/await support
- **Google Apps Script**: Synchronous execution (no async/await needed)

#### Module Exports
- **Node.js**: Uses `module.exports`
- **Google Apps Script**: Functions are globally accessible

#### Error Handling
- **Node.js**: Promise-based error handling
- **Google Apps Script**: Traditional try-catch blocks

## Available Functions

### Core Functions

#### `testWebUntisAPI()`
Basic test function to verify API connectivity:
```javascript
function testWebUntisAPI() {
    // Tests authentication and homework retrieval
}
```

#### `sendHomeworkEmail()`
Automatically sends email notifications for upcoming homework:
```javascript
function sendHomeworkEmail() {
    // Sends Gmail with formatted homework list
}
```

#### `addHomeworkToCalendar()`
Adds homework assignments to Google Calendar:
```javascript
function addHomeworkToCalendar() {
    // Creates calendar events for homework due dates
}
```

### WebUntis API Methods

#### `authenticate()`
```javascript
const api = new WebUntisAPI(config);
const success = api.authenticate();
```

#### `getHomeworkList(days, onlyIncomplete, excludeToday)`
Get raw homework data as an array or null if no homework found:
```javascript
// Get homework list for next 7 days (excluding today)
const homeworkList = api.getHomeworkList(7, true, true);

if (homeworkList) {
    console.log(`Found ${homeworkList.length} homework assignments`);
    // Process homework list...
} else {
    console.log('No homework found');
}
```

#### `formatHomework(homeworkList, days, onlyIncomplete)`
Format homework list to readable string:
```javascript
const homeworkList = api.getHomeworkList(7, true, true);
const formattedText = api.formatHomework(homeworkList, 7, true);
console.log(formattedText);
```

#### `getFormattedHomework(days, onlyIncomplete, excludeToday)`
Legacy method that combines the above two methods:
```javascript
// Include today's homework
const homework = api.getFormattedHomework(7, true, false);

// Exclude today's homework (only future days)
const futureHomework = api.getFormattedHomework(7, true, true);
console.log(futureHomework);
```

#### `getHomework(startDate, endDate)`
```javascript
const startDate = WebUntisAPI.formatDate(new Date());
const endDate = WebUntisAPI.formatDate(new Date(Date.now() + 7*24*60*60*1000));
const data = api.getHomework(startDate, endDate);
```

## Setting Up Automated Triggers

### 1. Daily Homework Email
1. In Apps Script, go to "Triggers" (clock icon)
2. Click "Add Trigger"
3. Configure:
   - **Function**: `sendHomeworkEmail`
   - **Event source**: Time-driven
   - **Type**: Day timer
   - **Time**: Choose your preferred time (e.g., 8:00 AM)

### 2. Weekly Calendar Sync
1. Add another trigger
2. Configure:
   - **Function**: `addHomeworkToCalendar`
   - **Event source**: Time-driven
   - **Type**: Week timer
   - **Day**: Sunday
   - **Time**: 9:00 AM

## Required Permissions

When you first run the script, Google will ask for permissions:

- ✅ **External requests**: To connect to WebUntis API
- ✅ **Gmail**: To send email notifications (if using email features)
- ✅ **Calendar**: To add homework events (if using calendar features)

## Example Usage Patterns

### 1. Daily Homework Check
```javascript
function dailyHomeworkCheck() {
    const api = new WebUntisAPI(config);
    
    if (api.authenticate()) {
        const today = api.getFormattedHomework(1, true);
        console.log("Today's homework:", today);
        api.logout();
    }
}
```

### 2. Weekly Summary
```javascript
function weeklyHomeworkSummary() {
    const api = new WebUntisAPI(config);
    
    if (api.authenticate()) {
        const weekly = api.getFormattedHomework(7, true);
        
        // Send to multiple recipients
        const recipients = ['<PARENT_EMAIL@example.com>', '<STUDENT_EMAIL@example.com>'];
        recipients.forEach(email => {
            GmailApp.sendEmail(email, '📚 Weekly Homework Summary', weekly);
        });
        
        api.logout();
    }
}
```

### 3. Homework Reminder with Slack Integration
```javascript
function sendSlackHomeworkReminder() {
    const api = new WebUntisAPI(config);
    
    if (api.authenticate()) {
        const homework = api.getFormattedHomework(2, true);
        
        if (!homework.includes('No open homework')) {
            const payload = {
                text: `📚 Homework Due Soon!\n\`\`\`${homework}\`\`\``
            };
            
            UrlFetchApp.fetch('YOUR_SLACK_WEBHOOK_URL', {
                method: 'POST',
                contentType: 'application/json',
                payload: JSON.stringify(payload)
            });
        }
        
        api.logout();
    }
}
```

## Troubleshooting

### Common Issues

1. **Authentication Failed**
   - Check your username, password, and school name
   - Verify the server URL is correct

2. **Permission Denied**
   - Make sure you've granted all required permissions
   - Re-authorize if needed

3. **API Limits**
   - Google Apps Script has execution time limits (6 minutes)
   - Don't query too large date ranges

### Debugging Tips

1. **Use Logger**:
   ```javascript
   Logger.log('Debug info: ' + JSON.stringify(data));
   ```

2. **Check Execution Transcript**:
   - Go to "Executions" in Apps Script
   - View logs for detailed error information

3. **Test Individual Functions**:
   - Run `testWebUntisAPI()` first
   - Then test specific features

## Advanced Features

### Custom Notifications
```javascript
function customHomeworkNotification() {
    const api = new WebUntisAPI(config);
    
    if (api.authenticate()) {
        const homeworkData = api.getHomework(
            WebUntisAPI.formatDate(new Date()),
            WebUntisAPI.formatDate(new Date(Date.now() + 3*24*60*60*1000))
        );
        
        // Filter by subject
        const mathHomework = (homeworkData.homeworks || []).filter(hw => 
            hw.subject === 'M' && !hw.completed
        );
        
        if (mathHomework.length > 0) {
            // Send specific math homework reminders
            console.log('Math homework due soon!');
        }
        
        api.logout();
    }
}
```

### Integration with Google Sheets
```javascript
function updateHomeworkSheet() {
    const api = new WebUntisAPI(config);
    
    if (api.authenticate()) {
        const homeworkData = api.getHomework(
            WebUntisAPI.formatDate(new Date()),
            WebUntisAPI.formatDate(new Date(Date.now() + 14*24*60*60*1000))
        );
        
        const sheet = SpreadsheetApp.getActiveSheet();
        
        // Clear existing data
        sheet.clear();
        
        // Add headers
        sheet.getRange(1, 1, 1, 4).setValues([['Subject', 'Due Date', 'Description', 'Completed']]);
        
        // Add homework data
        (homeworkData.homeworks || []).forEach((hw, index) => {
            sheet.getRange(index + 2, 1, 1, 4).setValues([[
                hw.subject || 'Unknown',
                api.formatWebUntisDate(hw.dueDate),
                hw.text || 'No description',
                hw.completed ? 'Yes' : 'No'
            ]]);
        });
        
        api.logout();
    }
}
```

This Google Apps Script version provides the same functionality as the Node.js version but is optimized for the Google Apps Script environment with additional integration examples for Gmail, Calendar, and Sheets.