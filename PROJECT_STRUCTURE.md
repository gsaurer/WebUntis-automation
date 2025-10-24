# WebUntis API Project Structure

## Overview
This project provides WebUntis API wrappers for both Node.js and Google Apps Script environments.

## File Structure

```
WebUntis/
├── WebUntis.js                           # Main Node.js API wrapper
├── test.js                               # Node.js test script
├── formatted_homework_example.js          # Node.js usage example
├── FORMATTED_HOMEWORK_USAGE.md           # Documentation for formatted homework method
└── GoogleAppsScript/                     # Google Apps Script files
    ├── WebUntis.gs                       # Main Google Apps Script API wrapper
    ├── Test.gs                           # Google Apps Script test functions
    ├── Examples.gs                       # Advanced usage examples
    └── README.md                         # Google Apps Script setup guide
```

## Node.js Files

### `WebUntis.js`
- Main API wrapper class for Node.js
- Includes WebUntisAPI and EventNotificationManager classes
- Uses fetch() API and async/await
- Exports modules for require()

### `test.js`
- Comprehensive test script for Node.js
- Tests authentication, homework retrieval, and formatted output
- Includes credential configuration section

### `formatted_homework_example.js`
- Simple example showing formatted homework usage
- Demonstrates different time horizons (3, 7, 14 days)
- Shows both open and completed homework filtering

### `FORMATTED_HOMEWORK_USAGE.md`
- Complete documentation for the getFormattedHomework() method
- Usage examples and parameter explanations
- Integration patterns for notification systems

## Google Apps Script Files

### `GoogleAppsScript/WebUntis.gs`
- Main API wrapper adapted for Google Apps Script
- Uses UrlFetchApp instead of fetch()
- Synchronous execution (no async/await)
- Includes example functions for email and calendar integration

### `GoogleAppsScript/Test.gs`
- Simple test functions for Google Apps Script
- Demonstrates parameterized function usage
- Examples for email and calendar automation

### `GoogleAppsScript/Examples.gs`
- Advanced usage examples
- Family notification systems
- Multiple calendar integration
- Automation functions for triggers
- Configuration validation

### `GoogleAppsScript/README.md`
- Complete setup guide for Google Apps Script
- Step-by-step instructions
- Trigger setup examples
- Troubleshooting guide

## Key Features

### Core Functionality
- ✅ WebUntis authentication (JSON-RPC)
- ✅ Homework retrieval (REST API)
- ✅ Bearer token management
- ✅ Date formatting utilities
- ✅ Error handling and logging

### Formatted Output
- ✅ Clean, readable homework formatting
- ✅ Subject, due date, and description display
- ✅ Completion status indicators (✅ / 📋)
- ✅ Customizable time horizons
- ✅ Filtering for open/completed assignments

### Google Apps Script Integration
- ✅ Gmail email notifications
- ✅ Google Calendar event creation
- ✅ Automated triggers (daily/weekly)
- ✅ Multiple recipient support
- ✅ Custom calendar integration

### Node.js Features
- ✅ Module export system
- ✅ Async/await support
- ✅ Event notification system
- ✅ Periodic checking capabilities
- ✅ Callback-based notifications

## Getting Started

### For Node.js
1. Update credentials in `test.js`
2. Run: `node test.js`
3. Use `WebUntis.js` in your projects

### For Google Apps Script
1. Go to [script.google.com](https://script.google.com)
2. Create new project
3. Copy content from `GoogleAppsScript/WebUntis.gs`
4. Follow setup guide in `GoogleAppsScript/README.md`

## Recent Changes
- ✅ Renamed EventNotification.js → WebUntis.js
- ✅ Moved all Google Apps Script files to GoogleAppsScript/ folder
- ✅ Removed Google Apps Script prefixes/suffixes from filenames
- ✅ Updated all import statements and references
- ✅ Maintained full functionality across both environments

This structure provides a clean separation between Node.js and Google Apps Script implementations while maintaining the same core functionality in both environments.