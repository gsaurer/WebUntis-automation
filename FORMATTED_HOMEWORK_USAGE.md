# WebUntis API - Formatted Homework Method

## Overview
The `getFormattedHomework()` method provides a clean, formatted string output of homework assignments for a specified number of days ahead.

## Method Signature
```javascript
async getFormattedHomework(days = 7, onlyIncomplete = true)
```

## Parameters
- **days** (number, optional): Number of days to look ahead (default: 7)
- **onlyIncomplete** (boolean, optional): Whether to show only incomplete homework (default: true)

## Return Value
Returns a **Promise\<string\>** containing formatted homework information with:
- Subject
- Due date (DD.MM.YYYY format)
- Homework text/description
- Completion status (✅ or 📋)

## Usage Examples

### Example 1: Get open homework for next 3 days
```javascript
const homework = await api.getFormattedHomework(3, true);
console.log(homework);
```

**Output:**
```
📚 HOMEWORK FOR NEXT 3 DAYS (2 open assignments)
============================================================

1. 📋 E1
   📅 Due: 24.10.2025
   📝 Write a different ending to the story (about 120 words)
----------------------------------------
2. 📋 D
   📅 Due: 24.10.2025
   📝 Verbesserung der Fehler der Sage sowie ihre Reinschrift am PC
----------------------------------------
```

### Example 2: Get all homework (including completed) for next week
```javascript
const homework = await api.getFormattedHomework(7, false);
console.log(homework);
```

### Example 3: Get open homework for next 2 weeks
```javascript
const homework = await api.getFormattedHomework(14, true);
console.log(homework);
```

### Example 4: Simple daily homework check
```javascript
const todayHomework = await api.getFormattedHomework(1, true);
if (todayHomework.includes('No open homework')) {
    console.log('🎉 No homework due today!');
} else {
    console.log('📝 Today\'s homework:');
    console.log(todayHomework);
}
```

## Features
- **Automatic sorting**: Homework is sorted by due date (earliest first)
- **Subject mapping**: Shows proper subject names (E1, D, M, etc.)
- **Completion status**: - **Visual status indicators**: Visual indicators (✅ completed, 📋 pending)
- **Clean formatting**: Easy-to-read output with proper spacing
- **Flexible filtering**: Choose to include or exclude completed assignments
- **Date formatting**: Displays dates in DD.MM.YYYY format

## Error Handling
The method will throw an error if:
- Authentication has not been performed
- Network request fails
- Invalid date range is specified

Always wrap calls in try-catch blocks:
```javascript
try {
    const homework = await api.getFormattedHomework(5);
    console.log(homework);
} catch (error) {
    console.error('Failed to get homework:', error.message);
}
```

## Integration with Notification Systems
This method works well with notification systems, chat bots, or daily summary scripts:

```javascript
// Daily homework reminder
async function sendDailyHomeworkReminder() {
    const homework = await api.getFormattedHomework(3, true);
    
    if (!homework.includes('No open homework')) {
        // Send to notification system
        sendNotification('📚 Upcoming Homework', homework);
    }
}
```