/**
 * Google Services Integration for WebUntis
 * This file contains all Google-specific functionality (Gmail, Calendar) 
 * 
 * For Google Apps Script:
 * - Copy this content to a Google Apps Script project
 * - The functions will work directly with Google's built-in services
 * 
 * For Node.js:
 * - Install required packages: npm install googleapis nodemailer
 * - Set up OAuth2 credentials for Google APIs
 * - Use the Node.js versions of these functions (see README.md)
 */

// ==========================================
// GOOGLE APPS SCRIPT EMAIL FUNCTIONS
// ==========================================

/**
 * Get homework and send email notification
 * This function can be set up as a trigger in Google Apps Script
 * 
 * For Google Apps Script: 
 * - Copy WebUntis.js content to your Google Apps Script project first
 * - Then copy this function
 * 
 * For Node.js: Use sendHomeworkEmailNodejs() instead
 * 
 * @param {Object} config - WebUntis configuration object
 * @param {string} emailAddress - Email address to send to
 * @param {number} days - Number of days to look ahead (default: 3)
 * @param {string} emailPrefix - Optional prefix for email subject (default: null)
 */
async function sendHomeworkEmail(config, emailAddress, days = 3, emailPrefix = null) {
    if (!config) {
        throw new Error('Config parameter is required');
    }
    
    if (!emailAddress) {
        throw new Error('Email address parameter is required');
    }

    try {
        // Get API instance using the global function from WebUntis.js
        const api = await getWebUntisApiInstance(config);
        const homeworkList = await api.getHomeworkList(days, true); // Next n days, open only
        
        // Only send email if homework exists
        if (homeworkList) {
            const homework = api.formatHomework(homeworkList, days, true);
            
            // Convert plain text to HTML for better emoji support
            const htmlContent = convertToHtmlEmail(homework);
            
            // Create email title with optional prefix from parameter
            let emailTitle = 'Upcoming Homework Reminder';
            if (emailPrefix) {
                emailTitle = `${emailPrefix} ${emailTitle}`;
            }
            
            // Send email using Gmail API with HTML content
            // Note: This is Google Apps Script specific - see sendHomeworkEmailNodejs() for Node.js version
            GmailApp.sendEmail(
                emailAddress,
                emailTitle,
                homework, // Plain text fallback
                {
                    htmlBody: htmlContent,
                    from: Session.getActiveUser().getEmail()
                }
            );
            console.log(`📧 Homework email sent successfully to ${emailAddress}!`);
            console.log(`📚 Found ${homeworkList.length} homework assignments`);
        } else {
            console.log(`😎 No homework found for the next ${days} days - email not sent`);
        }
        
        // Note: We don't logout here as we're reusing the session
        
    } catch (error) {
        console.error('❌ Error sending homework email:', error.toString());
        throw error;
    }
}

/**
 * Node.js version of sendHomeworkEmail using nodemailer
 * Requires: npm install nodemailer
 * 
 * @param {Object} config - WebUntis configuration object
 * @param {string} emailAddress - Email address to send to
 * @param {number} days - Number of days to look ahead (default: 3)
 * @param {string} emailPrefix - Optional prefix for email subject (default: null)
 * @param {Object} emailConfig - Email configuration for nodemailer
 */
async function sendHomeworkEmailNodejs(config, emailAddress, days = 3, emailPrefix = null, emailConfig) {
    if (!config) {
        throw new Error('Config parameter is required');
    }
    
    if (!emailAddress) {
        throw new Error('Email address parameter is required');
    }
    
    if (!emailConfig) {
        throw new Error('Email configuration is required for Node.js version');
    }

    try {
        const api = await getWebUntisApiInstance(config);
        const homeworkList = await api.getHomeworkList(days, true);
        
        if (homeworkList) {
            const homework = api.formatHomework(homeworkList, days, true);
            const htmlContent = convertToHtmlEmail(homework);
            
            let emailTitle = 'Upcoming Homework Reminder';
            if (emailPrefix) {
                emailTitle = `${emailPrefix} ${emailTitle}`;
            }
            
            // For Node.js - requires nodemailer setup
            const nodemailer = require('nodemailer');
            const transporter = nodemailer.createTransporter(emailConfig);
            
            await transporter.sendMail({
                from: emailConfig.from,
                to: emailAddress,
                subject: emailTitle,
                text: homework,
                html: htmlContent
            });
            
            console.log(`📧 Homework email sent successfully to ${emailAddress}!`);
            console.log(`📚 Found ${homeworkList.length} homework assignments`);
        } else {
            console.log(`😎 No homework found for the next ${days} days - email not sent`);
        }
        
    } catch (error) {
        console.error('❌ Error sending homework email:', error.toString());
        throw error;
    }
}

/**
 * Convert plain text homework format to HTML for better email display
 * Works in both Google Apps Script and Node.js
 * 
 * @param {string} plainText - The plain text homework string
 * @returns {string} HTML formatted string
 */
function convertToHtmlEmail(plainText) {
    // Define emoji mappings to avoid encoding issues
    const emojis = {
        books: '&#x1F4DA;',      // 📚
        clipboard: '&#x1F4CB;',   // 📋
        calendar: '&#x1F4C5;',    // 📅
        memo: '&#x1F4DD;',        // 📝
        robot: '&#x1F916;'        // 🤖
    };
    
    // Start with basic HTML structure
    let html = `<!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            body { 
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; 
                line-height: 1.6; 
                color: #333; 
                margin: 20px; 
                background-color: #f9f9f9;
            }
            .container { 
                max-width: 600px; 
                margin: 0 auto; 
                background-color: white; 
                padding: 30px; 
                border-radius: 10px; 
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            h1 { 
                color: #2c3e50; 
                border-bottom: 3px solid #3498db; 
                padding-bottom: 15px; 
                margin-bottom: 25px;
                font-size: 24px;
            }
            .homework-item { 
                background-color: #f8f9fa; 
                border-left: 4px solid #3498db; 
                margin: 20px 0; 
                padding: 20px; 
                border-radius: 8px;
                box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            }
            .subject { 
                font-weight: bold; 
                font-size: 18px; 
                color: #2c3e50; 
                margin-bottom: 8px;
            }
            .due-date { 
                color: #e74c3c; 
                font-weight: bold; 
                margin-bottom: 12px; 
                font-size: 16px;
            }
            .description { 
                color: #555; 
                line-height: 1.6; 
                background-color: white;
                padding: 12px;
                border-radius: 4px;
                border: 1px solid #e9ecef;
            }
            .emoji { 
                font-size: 1.3em; 
                margin-right: 8px;
            }
            .separator { 
                border-top: 1px solid #ddd; 
                margin: 25px 0; 
            }
            .footer {
                margin-top: 40px; 
                padding-top: 20px; 
                border-top: 2px solid #ddd; 
                color: #666; 
                font-size: 13px;
                text-align: center;
            }
        </style>
    </head>
    <body>
    <div class="container">
    `;
    
    // Split the text into lines and process
    const lines = plainText.split('\n');
    let inHomeworkSection = false;
    let homeworkItemOpen = false;
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        if (line.includes('HOMEWORK FOR NEXT')) {
            // Main header - remove any problematic characters and add emoji safely
            const cleanLine = line.replace(/[^\w\s\d\(\)]/g, '').trim();
            html += `<h1>${emojis.books} ${cleanLine}</h1>\n`;
            inHomeworkSection = true;
        } else if (line.startsWith('=') && line.length > 10) {
            // Skip separator lines
            continue;
        } else if (line.match(/^\d+\./)) {
            // Close previous homework item if open
            if (homeworkItemOpen) {
                html += `</div>\n`;
            }
            
            // Homework item start
            html += `<div class="homework-item">\n`;
            homeworkItemOpen = true;
            
            // Extract subject from the line, handling emoji issues
            let subject = line.substring(line.indexOf('.') + 1).trim();
            // Remove status emojis that might not display properly
            subject = subject.replace(/^[^\w\s]*\s*/, '').trim();
            html += `<div class="subject">${emojis.clipboard} ${subject}</div>\n`;
        } else if (line.includes('Due:')) {
            // Due date
            const dueText = line.replace(/^[^\w\s]*\s*/, '').trim();
            html += `<div class="due-date">${emojis.calendar} ${dueText}</div>\n`;
        } else if (line.length > 3 && !line.startsWith('-') && !line.startsWith('No ')) {
            // Description - remove leading emoji characters that might be problematic
            let description = line.replace(/^[^\w\s]*\s*/, '').trim();
            if (description.length > 0) {
                html += `<div class="description">${emojis.memo} ${description}</div>\n`;
            }
        } else if (line.startsWith('-') && line.length > 10) {
            // End of homework item marker - we'll close when we start a new one
            continue;
        }
    }
    
    // Close any open homework item
    if (homeworkItemOpen) {
        html += `</div>\n`;
    }
    
    // Add footer and close HTML structure
    html += `
    <div class="footer">
        <p>${emojis.robot} This email was automatically generated by WebUntis API</p>
    </div>
    </div>
    </body>
    </html>
    `;
    
    return html;
}

/**
 * Sync homework to Google Calendar as tasks
 * Creates tasks for the day before the due date instead of events on the due date
 * Google Apps Script version - use as-is
 * For Node.js version, see syncHomeworkToCalendarNodejs()
 * 
 * @param {Object} config - WebUntis configuration object
 * @param {string|null} calendarId - Calendar ID, calendar name, or null for default
 * @param {number} days - Number of days to look ahead (default: 7)
 * @param {Object} options - Additional options for calendar integration
 * @param {string} options.eventColor - Event color (optional)
 * @param {boolean} options.createCalendarIfNotExists - Create calendar if it doesn't exist (default: false)
 * @param {string} options.calendarName - Name for new calendar if creating (default: 'WebUntis Homework')
 * @param {boolean} options.createAsTask - Create as task instead of event (default: true)
 * @param {number} options.reminderDaysBefore - Days before due date to create reminder (default: 1)
 */
async function syncHomeworkToCalendar(config, calendarId = null, days = 7, options = {}) {
    if (!config) {
        throw new Error('Config parameter is required');
    }

    // Set default options
    const opts = {
        eventColor: null,
        createCalendarIfNotExists: false,
        calendarName: 'WebUntis Homework',
        createAsTask: true,
        reminderDaysBefore: 1,
        ...options
    };

    try {
        const api = await getWebUntisApiInstance(config);
        const homeworkData = await api.getHomework(
            WebUntisAPI.formatDate(new Date()),
            WebUntisAPI.formatDate(new Date(Date.now() + days * 24 * 60 * 60 * 1000))
        );
            
        // Get calendar with enhanced logic
        let calendar = null;
        
        if (!calendarId) {
            // Use default calendar
            calendar = CalendarApp.getDefaultCalendar();
            console.log('📅 Using default calendar');
        } else if (calendarId.includes('@')) {
            // Calendar ID provided (email format)
            try {
                calendar = CalendarApp.getCalendarById(calendarId);
                if (calendar) {
                    console.log(`📅 Using calendar by ID: ${calendarId}`);
                }
            } catch (error) {
                console.warn(`⚠️ Calendar ID ${calendarId} not found or no access`);
            }
        } else {
            // Calendar name provided - search for it
            const calendars = CalendarApp.getAllCalendars();
            calendar = calendars.find(cal => cal.getName() === calendarId);
            if (calendar) {
                console.log(`📅 Found calendar by name: ${calendarId}`);
            }
        }
        
        // If calendar still not found, try to create it or fall back
        if (!calendar) {
            if (opts.createCalendarIfNotExists) {
                try {
                    const calendarName = typeof calendarId === 'string' && !calendarId.includes('@') 
                        ? calendarId 
                        : opts.calendarName;
                    calendar = CalendarApp.createCalendar(calendarName);
                    console.log(`✅ Created new calendar: ${calendarName}`);
                } catch (error) {
                    console.warn('⚠️ Could not create calendar, using default');
                    calendar = CalendarApp.getDefaultCalendar();
                }
            } else {
                console.warn('⚠️ Specified calendar not found, using default');
                calendar = CalendarApp.getDefaultCalendar();
            }
        }
        
        if (!calendar) {
            console.error('❌ No calendar available');
            return;
        }
        
        let addedCount = 0;
        let updatedCount = 0;
        
        (homeworkData.homeworks || []).forEach(hw => {
            if (!hw.completed) {
                const dueDate = api.formatWebUntisDate(hw.dueDate);
                const dueDateObj = new Date(dueDate.split('.').reverse().join('-')); // Convert DD.MM.YYYY to Date
                
                // Calculate reminder date (due date - reminderDaysBefore)
                const reminderDate = new Date(dueDateObj);
                reminderDate.setDate(reminderDate.getDate() - opts.reminderDaysBefore);
                
                // Don't create reminders for past dates
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                if (reminderDate < today) {
                    console.log(`⏰ Skipping past reminder date for homework due ${dueDate}`);
                    return;
                }
                
                // Get subject from lessons data
                const lessons = homeworkData.lessons || [];
                const lessonMap = {};
                lessons.forEach(l => {
                    lessonMap[l.id] = l.subject;
                });
                
                const subject = lessonMap[hw.lessonId] || hw.subject || 'Homework';
                
                if (opts.createAsTask) {
                    // Create as task (all-day reminder)
                    const taskTitle = `📝 ${subject} - Due Tomorrow`;
                    const taskNotes = `Subject: ${subject}\nDue Date: ${dueDate}\nReminder: ${opts.reminderDaysBefore} day(s) before due date\n\n${hw.text || 'No description'}\n\nAdded by WebUntis API`;
                    
                    // Check if task already exists for this reminder date
                    const existingEvents = calendar.getEventsForDay(reminderDate);
                    const existingTask = existingEvents.find(event => 
                        event.getTitle().includes(taskTitle) && 
                        event.getDescription().includes(hw.text || 'No description')
                    );
                    
                    if (!existingTask) {
                        // Create new all-day task/event
                        const eventOptions = {
                            description: taskNotes
                        };
                        
                        // Add color if specified
                        if (opts.eventColor) {
                            eventOptions.color = opts.eventColor;
                        }
                        
                        // Create as all-day event (task-like)
                        const task = calendar.createAllDayEvent(taskTitle, reminderDate, eventOptions);
                        const reminderDateFormatted = api.formatWebUntisDate(parseInt(WebUntisAPI.formatDate(reminderDate)));
                        console.log(`✅ Added task: ${taskTitle} on ${reminderDateFormatted}`);
                        addedCount++;
                    } else {
                        // Update existing task if description changed
                        if (!existingTask.getDescription().includes(taskNotes)) {
                            existingTask.setDescription(taskNotes);
                            console.log(`🔄 Updated task: ${taskTitle}`);
                            updatedCount++;
                        }
                    }
                } else {
                    // Create as event (original behavior - on due date)
                    const title = `📚 ${subject} - Homework Due`;
                    const description = `Subject: ${subject}\nDue: ${dueDate}\n\n${hw.text || 'No description'}\n\nAdded by WebUntis API`;
                    
                    // Check if event already exists
                    const existingEvents = calendar.getEventsForDay(dueDateObj);
                    const existingEvent = existingEvents.find(event => 
                        event.getTitle().includes(title) && 
                        event.getDescription().includes(hw.text || 'No description')
                    );
                    
                    if (!existingEvent) {
                        // Create new event
                        const eventOptions = {
                            description: description
                        };
                        
                        // Add color if specified
                        if (opts.eventColor) {
                            eventOptions.color = opts.eventColor;
                        }
                        
                        const event = calendar.createEvent(title, dueDateObj, dueDateObj, eventOptions);
                        console.log(`📅 Added to calendar: ${title} on ${dueDate}`);
                        addedCount++;
                    } else {
                        // Update existing event if description changed
                        if (!existingEvent.getDescription().includes(description)) {
                            existingEvent.setDescription(description);
                            console.log(`🔄 Updated calendar event: ${title}`);
                            updatedCount++;
                        }
                    }
                }
            }
        });
        
        console.log(`✅ Calendar sync complete: ${addedCount} added, ${updatedCount} updated`);
        console.log(`📅 Calendar used: ${calendar.getName()}`);
        // Note: We don't logout here as we're reusing the session
        
        return {
            success: true,
            calendar: calendar.getName(),
            calendarId: calendar.getId(),
            added: addedCount,
            updated: updatedCount
        };
        
    } catch (error) {
        console.error('❌ Error adding homework to calendar:', error.toString());
        return {
            success: false,
            error: error.toString()
        };
    }
}

/**
 * Node.js version of syncHomeworkToCalendar using Google Calendar API
 * Requires: npm install googleapis
 * 
 * @param {Object} config - WebUntis configuration object
 * @param {Object} auth - Google OAuth2 client
 * @param {string|null} calendarId - Calendar ID or null for primary
 * @param {number} days - Number of days to look ahead (default: 7)
 * @param {Object} options - Additional options for calendar integration
 * @returns {Promise<Object>} Result object
 */
async function syncHomeworkToCalendarNodejs(config, auth, calendarId = 'primary', days = 7, options = {}) {
    const opts = {
        createAsTask: true,
        reminderDaysBefore: 1,
        ...options
    };

    try {
        const api = await getWebUntisApiInstance(config);
        const homeworkData = await api.getHomework(
            WebUntisAPI.formatDate(new Date()),
            WebUntisAPI.formatDate(new Date(Date.now() + days * 24 * 60 * 60 * 1000))
        );

        const { google } = require('googleapis');
        const calendar = google.calendar({ version: 'v3', auth });

        let addedCount = 0;
        let updatedCount = 0;

        for (const hw of (homeworkData.homeworks || [])) {
            if (!hw.completed) {
                const dueDate = api.formatWebUntisDate(hw.dueDate);
                const dueDateObj = new Date(dueDate.split('.').reverse().join('-'));
                
                const reminderDate = new Date(dueDateObj);
                reminderDate.setDate(reminderDate.getDate() - opts.reminderDaysBefore);
                
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                if (reminderDate < today) {
                    continue;
                }

                const lessons = homeworkData.lessons || [];
                const lessonMap = {};
                lessons.forEach(l => {
                    lessonMap[l.id] = l.subject;
                });
                
                const subject = lessonMap[hw.lessonId] || hw.subject || 'Homework';

                const eventData = {
                    summary: `📝 ${subject} - Due Tomorrow`,
                    start: { date: reminderDate.toISOString().split('T')[0] },
                    end: { date: reminderDate.toISOString().split('T')[0] },
                    description: `Subject: ${subject}\nDue Date: ${dueDate}\nReminder: ${opts.reminderDaysBefore} day(s) before due date\n\n${hw.text || 'No description'}\n\nAdded by WebUntis API`
                };

                try {
                    await calendar.events.insert({
                        calendarId: calendarId,
                        resource: eventData
                    });
                    console.log(`✅ Added task: ${eventData.summary}`);
                    addedCount++;
                } catch (error) {
                    console.error(`❌ Error adding homework event: ${error.toString()}`);
                }
            }
        }

        return {
            success: true,
            added: addedCount,
            updated: updatedCount
        };

    } catch (error) {
        console.error('❌ Error adding homework to calendar:', error.toString());
        return {
            success: false,
            error: error.toString()
        };
    }
}

// ==========================================
// GOOGLE APPS SCRIPT CALENDAR FUNCTIONS
// ==========================================

/**
 * List all available calendars for the user
 * Google Apps Script version - use as-is
 * For Node.js version, see listAvailableCalendarsNodejs()
 * 
 * @param {boolean} showDetails - Whether to show detailed information (default: false)
 * @returns {Array} Array of calendar objects with name and id
 */
function listAvailableCalendars(showDetails = false) {
    try {
        const calendars = CalendarApp.getAllCalendars();
        const calendarList = [];
        
        console.log('📅 Available Calendars:');
        console.log('========================');
        
        calendars.forEach((calendar, index) => {
            const calendarInfo = {
                name: calendar.getName(),
                id: calendar.getId(),
                isDefault: calendar.getId() === CalendarApp.getDefaultCalendar().getId()
            };
            
            if (showDetails) {
                calendarInfo.description = calendar.getDescription();
                calendarInfo.timeZone = calendar.getTimeZone();
                calendarInfo.color = calendar.getColor();
            }
            
            calendarList.push(calendarInfo);
            
            const defaultLabel = calendarInfo.isDefault ? ' (DEFAULT)' : '';
            console.log(`${index + 1}. ${calendarInfo.name}${defaultLabel}`);
            console.log(`   ID: ${calendarInfo.id}`);
            
            if (showDetails) {
                console.log(`   Description: ${calendarInfo.description || 'None'}`);
                console.log(`   Time Zone: ${calendarInfo.timeZone}`);
                console.log(`   Color: ${calendarInfo.color}`);
            }
            console.log('');
        });
        
        console.log(`Total calendars found: ${calendars.length}`);
        return calendarList;
    } catch (error) {
        console.error('❌ Error listing calendars:', error.toString());
        return [];
    }
}

/**
 * Node.js version of listAvailableCalendars using Google Calendar API
 * Requires: npm install googleapis
 * 
 * @param {Object} auth - Google OAuth2 client
 * @param {boolean} showDetails - Whether to show detailed information (default: false)
 * @returns {Promise<Array>} Array of calendar objects with name and id
 */
async function listAvailableCalendarsNodejs(auth, showDetails = false) {
    try {
        const { google } = require('googleapis');
        const calendar = google.calendar({ version: 'v3', auth });
        
        const response = await calendar.calendarList.list();
        const calendars = response.data.items || [];
        
        console.log('📅 Available Calendars:');
        console.log('========================');
        
        const calendarList = [];
        
        calendars.forEach((cal, index) => {
            const calendarInfo = {
                name: cal.summary,
                id: cal.id,
                isDefault: cal.primary || false
            };
            
            if (showDetails) {
                calendarInfo.description = cal.description;
                calendarInfo.timeZone = cal.timeZone;
                calendarInfo.backgroundColor = cal.backgroundColor;
            }
            
            calendarList.push(calendarInfo);
            
            const defaultLabel = calendarInfo.isDefault ? ' (DEFAULT)' : '';
            console.log(`${index + 1}. ${calendarInfo.name}${defaultLabel}`);
            console.log(`   ID: ${calendarInfo.id}`);
            
            if (showDetails) {
                console.log(`   Description: ${calendarInfo.description || 'None'}`);
                console.log(`   Time Zone: ${calendarInfo.timeZone}`);
                console.log(`   Background Color: ${calendarInfo.backgroundColor}`);
            }
            console.log('');
        });
        
        console.log(`Total calendars found: ${calendars.length}`);
        return calendarList;
    } catch (error) {
        console.error('❌ Error listing calendars:', error.toString());
        return [];
    }
}

/**
 * Sync processed timetable lessons to Google Calendar
 * Google Apps Script version - use as-is
 * For Node.js version, see syncTimetableToCalendarNodejs()
 * 
 * @param {Array} lessons - Processed lesson objects from WebUntis
 * @param {string|null} calendarId - Calendar ID, calendar name, or null for default
 * @param {Object} options - Additional options for calendar integration
 */
function syncTimetableToCalendar(lessons, calendarId = null, options = {}) {
    // Set default options
    const opts = {
        createCalendarIfNotExists: true,
        calendarName: 'WebUntis Timetable',
        updateExisting: true,
        includeNotes: true,
        ...options
    };

    try {
        // Handle null/empty lessons
        if (!lessons || !Array.isArray(lessons) || lessons.length === 0) {
            console.log('📅 No lessons to sync');
            return { 
                success: true, 
                message: 'No lessons found',
                added: 0,
                updated: 0,
                deleted: 0,
                skipped: 0
            };
        }

        console.log(`📅 Syncing ${lessons.length} lessons to calendar...`);

        // Get or create calendar (Google Apps Script specific)
        let calendar = null;
        
        if (!calendarId) {
            calendar = CalendarApp.getDefaultCalendar();
            console.log('📅 Using default calendar');
        } else if (calendarId.includes('@')) {
            try {
                calendar = CalendarApp.getCalendarById(calendarId);
                if (calendar) {
                    console.log(`📅 Using calendar by ID: ${calendarId}`);
                }
            } catch (error) {
                console.warn(`⚠️ Calendar ID ${calendarId} not found or no access`);
            }
        } else {
            const calendars = CalendarApp.getAllCalendars();
            calendar = calendars.find(cal => cal.getName() === calendarId);
            if (calendar) {
                console.log(`📅 Found calendar by name: ${calendarId}`);
            }
        }
        
        if (!calendar) {
            if (opts.createCalendarIfNotExists) {
                try {
                    const calendarName = typeof calendarId === 'string' && !calendarId.includes('@') 
                        ? calendarId 
                        : opts.calendarName;
                    calendar = CalendarApp.createCalendar(calendarName);
                    console.log(`✅ Created new calendar: ${calendarName}`);
                } catch (error) {
                    console.warn('⚠️ Could not create calendar, using default');
                    calendar = CalendarApp.getDefaultCalendar();
                }
            } else {
                console.warn('⚠️ Specified calendar not found, using default');
                calendar = CalendarApp.getDefaultCalendar();
            }
        }
        
        if (!calendar) {
            throw new Error('No calendar available');
        }

        let addedCount = 0;
        let updatedCount = 0;
        let skippedCount = 0;
        let deletedCount = 0;

        // Process each lesson
        lessons.forEach((lesson, index) => {
            try {
                console.log(`📚 Processing lesson ${index + 1}/${lessons.length}: ${lesson.subject}`);

                // Check if event already exists
                const existingEvents = calendar.getEventsForDay(lesson.startTime);
                const existingEvent = existingEvents.find(event => {
                    const eventStart = event.getStartTime();
                    const eventEnd = event.getEndTime();
                    return Math.abs(eventStart.getTime() - lesson.startTime.getTime()) < 60000 && // Within 1 minute
                           Math.abs(eventEnd.getTime() - lesson.endTime.getTime()) < 60000 &&
                           event.getTitle().includes(lesson.subject);
                });

                // Handle cancelled lessons - delete from calendar
                if (lesson.isCancelled) {
                    if (existingEvent) {
                        existingEvent.deleteEvent();
                        console.log(`🗑️ Deleted cancelled lesson: ${lesson.subject} at ${lesson.startTime.toLocaleTimeString()}`);
                        deletedCount++;
                    } else {
                        console.log(`⏭️ Skipped cancelled lesson (no existing event): ${lesson.subject}`);
                        skippedCount++;
                    }
                    return;
                }

                // Create event title and description
                let eventTitle = `${lesson.subject}`;
                if (lesson.isExam) {
                    eventTitle = `📝 ${eventTitle} (EXAM)`;
                } else if (lesson.isAdditional) {
                    eventTitle = `➕ ${eventTitle} (ADDITIONAL)`;
                }

                if (lesson.hasHomework) {
                    eventTitle += ' 📚';
                }

                let description = `Subject: ${lesson.subjectLong || lesson.subject}\nTeacher: ${lesson.teacher}`;
                if (lesson.teacherLong && lesson.teacherLong !== lesson.teacher) {
                    description += ` (${lesson.teacherLong})`;
                }
                description += `\nRoom: ${lesson.room}`;
                if (lesson.roomLong && lesson.roomLong !== lesson.room) {
                    description += ` (${lesson.roomLong})`;
                }
                description += `\nType: ${lesson.type}\nStatus: ${lesson.status}`;

                if (lesson.lessonInfo && opts.includeNotes) {
                    description += `\n\nLesson Info: ${lesson.lessonInfo}`;
                }

                if (lesson.notes && opts.includeNotes) {
                    description += `\n\nNotes: ${lesson.notes}`;
                }

                description += `\n\nCreated by WebUntis API`;

                if (existingEvent && opts.updateExisting) {
                    existingEvent.setTitle(eventTitle);
                    existingEvent.setDescription(description);
                    existingEvent.setTime(lesson.startTime, lesson.endTime);
                    console.log(`🔄 Updated: ${eventTitle} at ${lesson.startTime.toLocaleTimeString()}`);
                    updatedCount++;
                } else if (!existingEvent) {
                    const eventOptions = { description: description };

                    if (lesson.isExam) {
                        eventOptions.color = CalendarApp.EventColor.RED;
                    } else if (lesson.isAdditional) {
                        eventOptions.color = CalendarApp.EventColor.GREEN;
                    } else if (lesson.hasHomework) {
                        eventOptions.color = CalendarApp.EventColor.ORANGE;
                    }

                    calendar.createEvent(eventTitle, lesson.startTime, lesson.endTime, eventOptions);
                    console.log(`✅ Added: ${eventTitle} at ${lesson.startTime.toLocaleTimeString()}`);
                    addedCount++;
                } else {
                    console.log(`⏭️ Skipped (exists): ${eventTitle}`);
                    skippedCount++;
                }

            } catch (error) {
                console.error(`❌ Error processing lesson: ${error.toString()}`);
                skippedCount++;
            }
        });

        const result = {
            success: true,
            calendar: calendar.getName(),
            calendarId: calendar.getId(),
            added: addedCount,
            updated: updatedCount,
            deleted: deletedCount,
            skipped: skippedCount,
            totalProcessed: addedCount + updatedCount + deletedCount + skippedCount
        };

        console.log(`✅ Timetable sync complete:`);
        console.log(`   📅 Calendar: ${result.calendar}`);
        console.log(`   ➕ Added: ${result.added}`);
        console.log(`   🔄 Updated: ${result.updated}`);
        console.log(`   🗑️ Deleted: ${result.deleted}`);
        console.log(`   ⏭️ Skipped: ${result.skipped}`);

        return result;

    } catch (error) {
        console.error('❌ Error syncing timetable to calendar:', error.toString());
        return {
            success: false,
            error: error.toString(),
            added: 0,
            updated: 0,
            deleted: 0,
            skipped: 0
        };
    }
}

/**
 * Node.js version of syncTimetableToCalendar using Google Calendar API
 * Requires: npm install googleapis
 * 
 * @param {Array} lessons - Processed lesson objects from WebUntis
 * @param {Object} auth - Google OAuth2 client
 * @param {string|null} calendarId - Calendar ID or null for primary
 * @param {Object} options - Additional options for calendar integration
 * @returns {Promise<Object>} Sync result object
 */
async function syncTimetableToCalendarNodejs(lessons, auth, calendarId = 'primary', options = {}) {
    const opts = {
        updateExisting: true,
        includeNotes: true,
        ...options
    };

    try {
        if (!lessons || !Array.isArray(lessons) || lessons.length === 0) {
            console.log('📅 No lessons to sync');
            return { 
                success: true, 
                message: 'No lessons found',
                added: 0,
                updated: 0,
                deleted: 0,
                skipped: 0
            };
        }

        const { google } = require('googleapis');
        const calendar = google.calendar({ version: 'v3', auth });

        console.log(`📅 Syncing ${lessons.length} lessons to calendar...`);

        let addedCount = 0;
        let updatedCount = 0;
        let skippedCount = 0;
        let deletedCount = 0;

        for (const lesson of lessons) {
            try {
                // Create event data
                const eventData = {
                    summary: lesson.isExam ? `📝 ${lesson.subject} (EXAM)` : 
                            lesson.isAdditional ? `➕ ${lesson.subject} (ADDITIONAL)` : 
                            lesson.subject + (lesson.hasHomework ? ' 📚' : ''),
                    start: {
                        dateTime: lesson.startTime.toISOString(),
                        timeZone: 'Europe/Vienna'
                    },
                    end: {
                        dateTime: lesson.endTime.toISOString(),
                        timeZone: 'Europe/Vienna'
                    },
                    description: `Subject: ${lesson.subjectLong || lesson.subject}\nTeacher: ${lesson.teacher}\nRoom: ${lesson.room}\nType: ${lesson.type}\nStatus: ${lesson.status}` +
                                (lesson.lessonInfo && opts.includeNotes ? `\n\nLesson Info: ${lesson.lessonInfo}` : '') +
                                (lesson.notes && opts.includeNotes ? `\n\nNotes: ${lesson.notes}` : '') +
                                '\n\nCreated by WebUntis API'
                };

                // Check for existing events
                const timeMin = new Date(lesson.startTime.getTime() - 30 * 60 * 1000).toISOString();
                const timeMax = new Date(lesson.endTime.getTime() + 30 * 60 * 1000).toISOString();
                
                const existingEvents = await calendar.events.list({
                    calendarId: calendarId,
                    timeMin: timeMin,
                    timeMax: timeMax,
                    q: lesson.subject
                });

                const existingEvent = existingEvents.data.items?.find(event => 
                    event.summary?.includes(lesson.subject)
                );

                if (lesson.isCancelled) {
                    if (existingEvent) {
                        await calendar.events.delete({
                            calendarId: calendarId,
                            eventId: existingEvent.id
                        });
                        console.log(`🗑️ Deleted cancelled lesson: ${lesson.subject}`);
                        deletedCount++;
                    } else {
                        console.log(`⏭️ Skipped cancelled lesson (no existing event): ${lesson.subject}`);
                        skippedCount++;
                    }
                    continue;
                }

                if (existingEvent && opts.updateExisting) {
                    await calendar.events.update({
                        calendarId: calendarId,
                        eventId: existingEvent.id,
                        resource: eventData
                    });
                    console.log(`🔄 Updated: ${eventData.summary}`);
                    updatedCount++;
                } else if (!existingEvent) {
                    await calendar.events.insert({
                        calendarId: calendarId,
                        resource: eventData
                    });
                    console.log(`✅ Added: ${eventData.summary}`);
                    addedCount++;
                } else {
                    console.log(`⏭️ Skipped (exists): ${eventData.summary}`);
                    skippedCount++;
                }

            } catch (error) {
                console.error(`❌ Error processing lesson: ${error.toString()}`);
                skippedCount++;
            }
        }

        const result = {
            success: true,
            added: addedCount,
            updated: updatedCount,
            deleted: deletedCount,
            skipped: skippedCount,
            totalProcessed: addedCount + updatedCount + deletedCount + skippedCount
        };

        console.log(`✅ Timetable sync complete:`);
        console.log(`   ➕ Added: ${result.added}`);
        console.log(`   🔄 Updated: ${result.updated}`);
        console.log(`   🗑️ Deleted: ${result.deleted}`);
        console.log(`   ⏭️ Skipped: ${result.skipped}`);

        return result;

    } catch (error) {
        console.error('❌ Error syncing timetable to calendar:', error.toString());
        return {
            success: false,
            error: error.toString(),
            added: 0,
            updated: 0,
            deleted: 0,
            skipped: 0
        };
    }
}

// Export functions for Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        sendHomeworkEmailNodejs,
        convertToHtmlEmail,
        syncHomeworkToCalendarNodejs,
        listAvailableCalendarsNodejs,
        syncTimetableToCalendarNodejs
    };
}