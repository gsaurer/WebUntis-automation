/**
 * Google Apps Script Integration for WebUntis
 * This file contains all Google-specific functionality (Gmail, Calendar)
 */

// ==========================================
// GOOGLE APPS SCRIPT EMAIL FUNCTIONS
// ==========================================

/**
 * Get homework and send email notification
 * This function can be set up as a trigger in Google Apps Script
 * @param {Object} config - WebUntis configuration object
 * @param {string} emailAddress - Email address to send to
 * @param {number} days - Number of days to look ahead (default: 3)
 * @param {string} emailPrefix - Optional prefix for email subject (default: null)
 */
function sendHomeworkEmail(config, emailAddress, days = 3, emailPrefix = null) {
    if (!config) {
        throw new Error('Config parameter is required');
    }
    
    if (!emailAddress) {
        throw new Error('Email address parameter is required');
    }

    try {
        const api = getAPIInstance(config);
        const homework = api.getFormattedHomework(days, true); // Next n days, open only
        
        if (!homework.includes('No open homework')) {
            // Convert plain text to HTML for better emoji support
            const htmlContent = convertToHtmlEmail(homework);
            
            // Create email title with optional prefix from parameter
            let emailTitle = 'Upcoming Homework Reminder';
            if (emailPrefix) {
                emailTitle = `${emailPrefix} ${emailTitle}`;
            }
            
            // Send email using Gmail API with HTML content
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
        } else {
            console.log(`🎉 No homework due in the next ${days} days!`);
        }
        
        // Note: We don't logout here as we're reusing the session
        
    } catch (error) {
        console.error('❌ Error sending homework email:', error.toString());
        throw error;
    }
}

/**
 * Convert plain text homework format to HTML for better email display
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

// ==========================================
// GOOGLE APPS SCRIPT CALENDAR FUNCTIONS
// ==========================================

/**
 * List all available calendars for the user
 * Useful for finding calendar IDs and names for the addHomeworkToCalendar function
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
 * Add homework to Google Calendar as tasks
 * Creates tasks for the day before the due date instead of events on the due date
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
function addHomeworkToCalendar(config, calendarId = null, days = 7, options = {}) {
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
        const api = getAPIInstance(config);
        const homeworkData = api.getHomework(
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