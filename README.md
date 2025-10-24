# WebUntis Automation

A comprehensive WebUntis API wrapper with Google Apps Script and Home Assistant integration for automated homework notifications and timetable management.

## Features

- **WebUntis API Access**: Complete homework and timetable retrieval
- **Google Apps Script Integration**: Email notifications and calendar sync
- **Home Assistant Integration**: Smart home notifications and automation
- **Session Management**: Efficient API connection reuse
- **Flexible Deployment**: Works in both Node.js and Google Apps Script environments

## Quick Start

1. **Configure credentials** in the respective JavaScript files
2. **Choose your deployment method**:
   - **Google Apps Script**: See [Google Apps Script Deployment Guide](docs/GOOGLE_APPS_SCRIPT_DEPLOYMENT.md)
   - **Node.js**: Use the files directly with `node` command

## Common Issues

### Google Apps Script: "api.getHomeworkList is not a function"

**Solution**: You need to copy **both** `WebUntis.js` and `Google.js` content to your Google Apps Script project:

1. Create `WebUntis.gs` - copy entire content from `WebUntis.js`
2. Create `Google.gs` - copy entire content from `Google.js`
3. Both files must be in the same Google Apps Script project

**Why**: Google Apps Script functions need to be in the same project to call each other. The `sendHomeworkEmail()` function in `Google.js` depends on functions from `WebUntis.js`.

See the [full deployment guide](docs/GOOGLE_APPS_SCRIPT_DEPLOYMENT.md) for complete setup instructions.

## Files Structure

### Core API Files
- `WebUntis.js` - WebUntis API wrapper and session management
- `Google.js` - Google services integration (Gmail, Calendar)
- `HomeAssistant.js` - Home Assistant integration and automation
- `Examples.js` - Usage examples and automation functions

### Utility Files
- `StartAppsScript.js` - Google Apps Script starter and test functions
- `formatted_homework_example.js` - Example homework formatting

## Documentation

All documentation is located in the `docs/` directory:

- **[Project Structure](docs/PROJECT_STRUCTURE.md)** - Complete project architecture overview
- **[Google Apps Script Deployment](docs/GOOGLE_APPS_SCRIPT_DEPLOYMENT.md)** - Step-by-step deployment guide
- **[Formatted Homework Usage](docs/FORMATTED_HOMEWORK_USAGE.md)** - Homework formatting examples

## Key Features

- **Dual Environment Support** - Works in both Google Apps Script and Node.js
- **Smart Session Management** - Reuses authentication sessions for efficiency
- **Separate Calendar Organization** - Dedicated calendars for homework and timetable
- **Email Notifications** - HTML-formatted homework summaries
- **Home Assistant Integration** - Smart home notifications and automation
- **Error Handling** - Comprehensive error management and logging
- **Easy Configuration** - Template-based setup with clear instructions

## Configuration

Update the configuration objects in each file with your actual credentials:

```javascript
const MY_CONFIG = {
    school: 'your-school-name',
    username: 'your-username',
    password: 'your-password',
    server: 'your-webuntis-server',
    resourceId: 'your-student-resource-id' // For timetable functionality
};
```

## Usage Examples

### Basic Homework Retrieval
```javascript
const api = getWebUntisApiInstance(MY_CONFIG);
const homework = await api.getHomeworkList(7, true, true); // Next 7 days, open only, exclude today
console.log(homework);
```

### Google Apps Script Integration
```javascript
// Send homework email notifications
sendHomeworkEmail(MY_CONFIG, 'student@email.com', 5);

// Sync homework to calendar (full workflow)
syncHomeworkToCalendar(MY_CONFIG, CALENDAR_CONFIG.homework.calendarId, CALENDAR_CONFIG.homework.syncDaysAhead);

// Sync timetable to calendar (full workflow)
syncTimetableToCalendarWorkflow(MY_CONFIG, CALENDAR_CONFIG.timetable.calendarId, CALENDAR_CONFIG.timetable.syncDaysAhead);
```

### Home Assistant Integration
```javascript
// Send notification
await sendHomeworkToHomeAssistant(MY_CONFIG, HA_CONFIG, 3);
```

## Quick Start

### For Google Apps Script
1. Copy `WebUntis.js` and `Google.js` to Google Apps Script
2. Update configuration in `StartAppsScript.js`
3. Run `StartAppScript()` function

### For Node.js
1. Install dependencies: `npm install`
2. Update configuration in `StartNode.js`
3. Run: `node StartNode.js`

Available commands:
- `npm start` - Run full automation
- `npm test` - Test configuration
- `npm run quick` - Quick homework check

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## Support

For questions and support, please refer to the documentation in the `docs/` directory or create an issue on GitHub.