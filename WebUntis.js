/**
 * WebUntis API Wrapper
 * A simplified wrapper for the WebUntis API focused on homework retrieval
 */

class WebUntisAPI {
    constructor(config) {
        this.school = config.school;
        this.username = config.username;
        this.password = config.password;
        this.server = config.server || '<YOUR_WEBUNTIS_SERVER>';
        this.baseUrl = `https://${this.server}/WebUntis/jsonrpc.do`;
        this.apiBaseUrl = `https://${this.server}/WebUntis/api`;
        this.sessionId = null;
        this.personId = null;
        this.personType = null;
        this.bearerToken = null;
        
        // Store the full config for later use (like resourceId)
        this.config = config;
    }

    /**
     * Format a date for API use (YYYY-MM-DD format)
     * @param {Date} date - Date to format
     * @returns {string} Formatted date string
     */
    static formatDateForAPI(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    /**
     * Authenticate with WebUntis API
     * @returns {Promise<boolean>} Success status
     */
    async authenticate() {
        try {
            const response = await this.makeRequest('authenticate', {
                user: this.username,
                password: this.password,
                client: 'WebUntisAPI'
            });

            if (response.result) {
                this.sessionId = response.result.sessionId;
                this.personId = response.result.personId;
                this.personType = response.result.personType;
                
                console.log('Authentication successful');
                console.log(`Session ID: ${this.sessionId ? 'obtained' : 'missing'}`);
                console.log(`Person ID: ${this.personId || 'unknown'}`);
                console.log(`Person Type: ${this.personType || 'unknown'}`);
                
                // Try to get bearer token, but don't fail if it doesn't work
                const bearerResult = await this.getBearerToken();
                console.log(`Bearer token: ${bearerResult ? 'obtained' : 'using session-based auth'}`);
                
                return true;
            }
            return false;
        } catch (error) {
            console.error('Authentication failed:', error);
            return false;
        }
    }

    /**
     * Make a fetch request that works in both Google Apps Script and Node.js environments
     * @param {string} url - Request URL
     * @param {Object} options - Fetch options
     * @returns {Promise<Response>} Response object
     */
    async makeFetch(url, options = {}) {
        // Google Apps Script environment
        if (typeof UrlFetchApp !== 'undefined') {
            const gasOptions = {
                method: options.method || 'GET',
                headers: options.headers || {},
                muteHttpExceptions: true
            };
            
            if (options.body) {
                gasOptions.payload = options.body;
            }
            
            const response = UrlFetchApp.fetch(url, gasOptions);
            
            // Create a response-like object
            return {
                ok: response.getResponseCode() >= 200 && response.getResponseCode() < 300,
                status: response.getResponseCode(),
                text: () => Promise.resolve(response.getContentText()),
                json: () => Promise.resolve(JSON.parse(response.getContentText()))
            };
        }
        // Node.js/Browser environment
        else if (typeof fetch !== 'undefined') {
            return await fetch(url, options);
        }
        // Fallback error
        else {
            throw new Error('No fetch implementation available. This environment is not supported.');
        }
    }

    /**
     * Get Bearer Token for REST API access
     * @returns {Promise<boolean>} Success status
     */
    async getBearerToken() {
        try {
            const tokenUrl = `${this.apiBaseUrl}/token/new?school=${this.school}`;
            
            const response = await this.makeFetch(tokenUrl, {
                method: 'GET',
                headers: {
                    'Cookie': `JSESSIONID=${this.sessionId}`
                }
            });

            if (response.ok) {
                const tokenValue = (await response.text()).trim();
                if (tokenValue && tokenValue.length > 0) {
                    this.bearerToken = tokenValue;
                    console.log('Bearer token obtained successfully');
                    console.log(`Token length: ${tokenValue.length} characters`);
                    return true;
                } else {
                    console.log('Empty token response, will use session-based auth');
                    return false;
                }
            } else if (response.status === 403) {
                console.log('Bearer token access denied (403) - this is normal for some WebUntis configurations. Using session-based auth instead.');
                return false;
            } else {
                console.log(`Bearer token request failed with status ${response.status}, will use session-based auth`);
                return false;
            }
        } catch (error) {
            console.log('Bearer token request failed:', error.toString());
            console.log('This is often normal - will use session-based authentication instead.');
            return false;
        }
    }

    /**
     * Logout from WebUntis API
     * @returns {Promise<boolean>} Success status
     */
    async logout() {
        try {
            if (!this.sessionId) return true;
            
            await this.makeRequest('logout', {});
            this.sessionId = null;
            this.personId = null;
            this.personType = null;
            this.bearerToken = null;
            console.log('Logout successful');
            return true;
        } catch (error) {
            console.error('Logout failed:', error);
            return false;
        }
    }

    /**
     * Get homework via REST API
     * @param {string} startDate - Start date in YYYYMMDD format
     * @param {string} endDate - End date in YYYYMMDD format
     * @returns {Promise<Object>} Homework data with records, homeworks, teachers, and lessons
     */
    async getHomework(startDate, endDate) {
        if (!this.sessionId) {
            throw new Error('Not authenticated. Call authenticate() first.');
        }

        try {
            const url = `${this.apiBaseUrl}/homeworks/lessons?startDate=${startDate}&endDate=${endDate}`;
            
            const headers = {
                'Cookie': `JSESSIONID=${this.sessionId}`,
                'User-Agent': 'WebUntisAPI/1.0'
            };

            // Add bearer token if available
            if (this.bearerToken) {
                headers['Authorization'] = `Bearer ${this.bearerToken}`;
            }

            const response = await this.makeFetch(url, {
                method: 'GET',
                headers: headers
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data.data || data;
        } catch (error) {
            console.error('Failed to get homework:', error);
            throw error;
        }
    }

    /**
     * Get homework for today
     * @returns {Promise<Object>} Today's homework
     */
    async getTodaysEvents() {
        const today = WebUntisAPI.formatDate(new Date());
        return await this.getHomework(today, today);
    }

    /**
     * Get homework for this week
     * @returns {Promise<Object>} This week's homework
     */
    async getWeekEvents() {
        const now = new Date();
        const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
        const endOfWeek = new Date(now.setDate(now.getDate() - now.getDay() + 6));
        
        const startDate = WebUntisAPI.formatDate(startOfWeek);
        const endDate = WebUntisAPI.formatDate(endOfWeek);
        
        return await this.getHomework(startDate, endDate);
    }

    /**
     * Get homework for the next N days
     * @param {number} days - Number of days to look ahead (default: 7)
     * @param {boolean} onlyIncomplete - Only show incomplete homework (default: true)
     * @param {boolean} excludeToday - Exclude today from the results (default: false)
     * @returns {Promise<Array|null>} Array of homework objects or null if no homework found
     */
    async getHomeworkList(days = 7, onlyIncomplete = true, excludeToday = false) {
        const now = new Date();
        
        // If excludeToday is true, start from tomorrow
        const startDate = excludeToday 
            ? new Date(now.getTime() + (24 * 60 * 60 * 1000))  // Tomorrow
            : now;                                               // Today
            
        const future = new Date(startDate.getTime() + (days * 24 * 60 * 60 * 1000));
        
        const startDateStr = WebUntisAPI.formatDate(startDate);
        const endDateStr = WebUntisAPI.formatDate(future);
        
        try {
            const homeworkData = await this.getHomework(startDateStr, endDateStr);
            const homework = homeworkData.homeworks || [];
            const lessons = homeworkData.lessons || [];
            
            // Create lesson lookup map for subjects
            const lessonMap = new Map(lessons.map(l => [l.id, l.subject]));
            
            // Filter homework
            let filteredHomework = homework;
            if (onlyIncomplete) {
                filteredHomework = homework.filter(hw => !hw.completed);
            }
            
            // Sort by due date
            filteredHomework.sort((a, b) => {
                const dateA = parseInt(a.dueDate);
                const dateB = parseInt(b.dueDate);
                return dateA - dateB;
            });
            
            // Return null if no homework found
            if (filteredHomework.length === 0) {
                return null;
            }
            
            // Add subject information to homework objects
            return filteredHomework.map(hw => ({
                ...hw,
                subjectName: lessonMap.get(hw.lessonId) || hw.subject || 'Unknown Subject'
            }));
            
        } catch (error) {
            console.error('Failed to get homework list:', error);
            throw error;
        }
    }

    /**
     * Format homework list to readable string
     * @param {Array|null} homeworkList - Array of homework objects or null
     * @param {number} days - Number of days for display purposes
     * @param {boolean} onlyIncomplete - Whether only incomplete homework was requested
     * @returns {string} Formatted string with Subject, Due, Text
     */
    formatHomework(homeworkList, days = 7, onlyIncomplete = true) {
        if (!homeworkList || homeworkList.length === 0) {
            return `No ${onlyIncomplete ? 'open ' : ''}homework found for the next ${days} days.`;
        }
        
        // Format the homework
        let formattedString = `📚 HOMEWORK FOR NEXT ${days} DAYS (${homeworkList.length} ${onlyIncomplete ? 'open ' : ''}assignments)\n`;
        formattedString += "=".repeat(60) + "\n\n";
        
        homeworkList.forEach((hw, index) => {
            const dueDate = this.formatWebUntisDate(hw.dueDate);
            const subject = hw.subjectName || 'Unknown Subject';
            const text = hw.text || 'No description';
            const status = hw.completed ? '✅' : '📋';
            
            formattedString += `${index + 1}. ${status} ${subject}\n`;
            formattedString += `   📅 Due: ${dueDate}\n`;
            formattedString += `   📝 ${text}\n`;
            formattedString += "-".repeat(40) + "\n";
        });
        
        return formattedString;
    }

    /**
     * Get formatted homework for the next N days (legacy method for backward compatibility)
     * @param {number} days - Number of days to look ahead (default: 7)
     * @param {boolean} onlyIncomplete - Only show incomplete homework (default: true)
     * @param {boolean} excludeToday - Exclude today from the results (default: false)
     * @returns {Promise<string>} Formatted string with Subject, Due, Text
     */
    async getFormattedHomework(days = 7, onlyIncomplete = true, excludeToday = false) {
        const homeworkList = await this.getHomeworkList(days, onlyIncomplete, excludeToday);
        return this.formatHomework(homeworkList, days, onlyIncomplete);
    }

    /**
     * Get timetable data from WebUntis REST API
     * @param {Date|string} startDate - Start date as Date object or YYYY-MM-DD string
     * @param {Date|string} endDate - End date as Date object or YYYY-MM-DD string
     * @param {number} resourceId - Student/teacher resource ID (optional, uses config.resourceId if not provided)
     * @returns {Promise<Object|null>} Timetable data with days and entries, or null if no data found
     */
    async getTimetableData(startDate, endDate, resourceId = null) {
        if (!this.sessionId) {
            throw new Error('Not authenticated. Call authenticate() first.');
        }

        try {
            // Convert Date objects to strings if needed
            const startDateStr = startDate instanceof Date ? WebUntisAPI.formatDateForAPI(startDate) : startDate;
            const endDateStr = endDate instanceof Date ? WebUntisAPI.formatDateForAPI(endDate) : endDate;
            
            // Use provided resourceId or get from config
            const studentId = resourceId || this.config?.resourceId;
            
            if (!studentId || studentId === '<YOUR_STUDENT_RESOURCE_ID>') {
                throw new Error(`Student Resource ID is required for timetable access!`);
            }
            
            console.log(`📅 Getting timetable data from ${startDateStr} to ${endDateStr}`);
            
            // Get timetable data for the specified period
            const timetableData = await this.getTimetableDataForPeriod(startDateStr, endDateStr, studentId);
            
            if (!timetableData || !timetableData.days || timetableData.days.length === 0) {
                console.log('📅 No timetable data found for the specified period');
                return null;
            }
            
            console.log(`📅 Found ${timetableData.days.length} days with data`);
            return timetableData;
            
        } catch (error) {
            console.error('Failed to get timetable data:', error);
            throw error;
        }
    }

    /**
     * Get timetable data for a single period (internal method)
     * @param {string} startDate - Start date in YYYY-MM-DD format
     * @param {string} endDate - End date in YYYY-MM-DD format
     * @param {number} studentId - Student resource ID
     * @returns {Promise<Object|null>} Timetable data for the period
     */
    async getTimetableDataForPeriod(startDate, endDate, studentId) {
        const headers = {
            'Cookie': `JSESSIONID=${this.sessionId}`,
            'User-Agent': 'WebUntisAPI/1.0'
        };

        // Add bearer token if available
        if (this.bearerToken) {
            headers['Authorization'] = `Bearer ${this.bearerToken}`;
        }

        // Direct call to timetable entries endpoint
        const entriesUrl = `https://${this.server}/WebUntis/api/rest/view/v1/timetable/entries?start=${startDate}&end=${endDate}&format=2&resourceType=STUDENT&resources=${studentId}&periodTypes=&timetableType=MY_TIMETABLE`;
        
        console.log(`📡 Fetching timetable entries from: ${entriesUrl}`);

        const response = await this.makeFetch(entriesUrl, {
            method: 'GET',
            headers: headers
        });

        if (!response.ok) {
            console.error(`❌ Timetable HTTP error! status: ${response.status}`);
            const responseText = await response.text();
            console.error(`Timetable Response: ${responseText}`);
            throw new Error(`Timetable HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log(`📊 Timetable data: ${data.days?.length || 0} days found`);
        
        return data;
    }

    /**
     * Process timetable data and extract lessons
     * @param {Object|null} timetableData - Raw timetable data from getTimetableData
     * @param {Object} options - Processing options
     * @param {boolean} options.skipCancelled - Skip cancelled lessons (default: false)
     * @param {boolean} options.includeNotes - Include lesson notes (default: true)
     * @returns {Array|null} Array of processed lesson objects or null if no lessons
     */
    processTimetableData(timetableData, options = {}) {
        console.log('🔍 Processing timetable data...');
        
        if (!timetableData || !timetableData.days) {
            console.log('❌ No timetable data or days found');
            return null;
        }

        console.log(`📅 Processing ${timetableData.days.length} days`);

        const opts = {
            skipCancelled: false,
            includeNotes: true,
            ...options
        };

        console.log('⚙️ Processing options:', JSON.stringify(opts, null, 2));

        const lessons = [];
        let totalEntries = 0;
        let skippedCancelled = 0;
        let processedSuccessfully = 0;
        let processingErrors = 0;

        timetableData.days.forEach((day, dayIndex) => {
            console.log(`📅 Processing day ${dayIndex + 1}/${timetableData.days.length}: ${day.date}`);
            
            if (!day.gridEntries || !Array.isArray(day.gridEntries)) {
                console.log(`⚠️ No gridEntries found for day ${day.date}`);
                return;
            }
            
            console.log(`📊 Found ${day.gridEntries.length} grid entries for ${day.date}`);
            totalEntries += day.gridEntries.length;

            day.gridEntries.forEach((entry, entryIndex) => {
                console.log(`📚 Processing entry ${entryIndex + 1}/${day.gridEntries.length} for ${day.date}`);

                // Skip cancelled lessons if option is set
                if (opts.skipCancelled && entry.status === 'CANCELLED') {
                    console.log(`⏭️ Skipping cancelled lesson: ${entry.position2?.[0]?.current?.displayName || 'Unknown Subject'}`);
                    skippedCancelled++;
                    return;
                }

                try {
                    // Parse lesson information
                    const lesson = {
                        id: entry.ids?.[0] || null,
                        date: day.date,
                        startTime: new Date(entry.duration.start),
                        endTime: new Date(entry.duration.end),
                        type: entry.type,
                        status: entry.status,
                        teacher: entry.position1?.[0]?.current?.displayName || 'Unknown Teacher',
                        teacherLong: entry.position1?.[0]?.current?.longName || '',
                        subject: entry.position2?.[0]?.current?.displayName || 'Unknown Subject',
                        subjectLong: entry.position2?.[0]?.current?.longName || '',
                        room: entry.position3?.[0]?.current?.displayName || 'Unknown Room',
                        roomLong: entry.position3?.[0]?.current?.longName || '',
                        icons: entry.icons || [],
                        hasHomework: (entry.icons || []).includes('HOMEWORK'),
                        isExam: entry.type === 'EXAM',
                        isCancelled: entry.status === 'CANCELLED',
                        isAdditional: entry.status === 'ADDITIONAL',
                        notes: opts.includeNotes ? entry.notesAll || '' : '',
                        lessonInfo: opts.includeNotes ? entry.lessonInfo || '' : '',
                        texts: opts.includeNotes ? entry.texts || [] : [],
                        rawEntry: entry // Keep reference to original data
                    };

                    lessons.push(lesson);
                    processedSuccessfully++;
                    
                    console.log(`✅ Successfully processed lesson: ${lesson.subject} (${lesson.teacher}) at ${lesson.startTime.toLocaleTimeString()}`);

                } catch (error) {
                    console.error(`❌ Error processing lesson entry: ${error.toString()}`);
                    processingErrors++;
                }
            });
        });

        console.log('📊 Processing Summary:');
        console.log(`   📅 Days processed: ${timetableData.days.length}`);
        console.log(`   📋 Total entries found: ${totalEntries}`);
        console.log(`   ✅ Successfully processed: ${processedSuccessfully}`);
        console.log(`   ⏭️ Skipped cancelled: ${skippedCancelled}`);
        console.log(`   ❌ Processing errors: ${processingErrors}`);
        console.log(`   📚 Final lessons array length: ${lessons.length}`);

        if (lessons.length === 0) {
            console.log('⚠️ No lessons found after processing - returning null');
            return null;
        }

        console.log(`✅ Returning ${lessons.length} processed lessons`);
        return lessons;
    }

    /**
     * Format WebUntis date (YYYYMMDD) to readable format
     * @param {number} date - Date in YYYYMMDD format
     * @returns {string} Formatted date string (DD.MM.YYYY)
     */
    formatWebUntisDate(date) {
        if (!date) return 'Unknown Date';
        
        const dateStr = date.toString();
        const year = dateStr.substring(0, 4);
        const month = dateStr.substring(4, 6);
        const day = dateStr.substring(6, 8);
        
        return `${day}.${month}.${year}`;
    }

    /**
     * Make a request to the WebUntis JSON-RPC API
     * @param {string} method - API method name
     * @param {Object} params - Method parameters
     * @returns {Promise<Object>} API response
     */
    async makeRequest(method, params = {}) {
        const requestData = {
            id: Date.now().toString(),
            method: method,
            params: params,
            jsonrpc: '2.0'
        };

        const headers = {
            'Content-Type': 'application/json',
            'User-Agent': 'WebUntisAPI/1.0'
        };

        if (this.sessionId) {
            headers['Cookie'] = `JSESSIONID=${this.sessionId}`;
        }

        const url = method === 'authenticate' 
            ? `${this.baseUrl}?school=${this.school}`
            : `${this.baseUrl};jsessionid=${this.sessionId}?school=${this.school}`;

        const response = await this.makeFetch(url, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(requestData)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data.error) {
            throw new Error(`WebUntis API error: ${data.error.message} (Code: ${data.error.code})`);
        }

        return data;
    }

    /**
     * Format date to WebUntis format (YYYYMMDD)
     * @param {Date} date - Date object
     * @returns {string} Formatted date string
     */
    static formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}${month}${day}`;
    }
}

/**
 * Event Notification Manager
 * Manages notifications for WebUntis events
 */
class EventNotificationManager {
    constructor(webUntisAPI) {
        this.api = webUntisAPI;
        this.notificationCallbacks = [];
    }

    /**
     * Add a notification callback
     * @param {Function} callback - Function to call when events are found
     */
    addNotificationCallback(callback) {
        if (typeof callback === 'function') {
            this.notificationCallbacks.push(callback);
        }
    }

    /**
     * Check for upcoming events and trigger notifications
     * @param {number} hoursAhead - How many hours ahead to check
     */
    async checkUpcomingEvents(hoursAhead = 24) {
        try {
            const now = new Date();
            const future = new Date(now.getTime() + (hoursAhead * 60 * 60 * 1000));
            
            const startDate = WebUntisAPI.formatDate(now);
            const endDate = WebUntisAPI.formatDate(future);
            
            const homeworkData = await this.api.getHomework(startDate, endDate);
            const upcomingEvents = this.filterUpcomingHomework(homeworkData.homeworks || [], hoursAhead);
            
            if (upcomingEvents.length > 0) {
                this.triggerNotifications(upcomingEvents);
            }
            
            return upcomingEvents;
        } catch (error) {
            console.error('Failed to check upcoming events:', error);
            return [];
        }
    }

    /**
     * Filter homework that is due within the specified timeframe
     * @param {Array} homework - Array of homework
     * @param {number} hoursAhead - Hours ahead to filter
     * @returns {Array} Filtered upcoming homework
     */
    filterUpcomingHomework(homework, hoursAhead) {
        const now = new Date();
        const futureTime = now.getTime() + (hoursAhead * 60 * 60 * 1000);
        
        return homework.filter(hw => {
            // Convert WebUntis date format to JavaScript Date
            const dueDate = this.parseWebUntisDate(hw.dueDate);
            return dueDate && dueDate.getTime() <= futureTime && dueDate.getTime() > now.getTime() && !hw.completed;
        });
    }

    /**
     * Parse WebUntis date format (YYYYMMDD) to JavaScript Date
     * @param {number} date - Date in YYYYMMDD format
     * @returns {Date} JavaScript Date object
     */
    parseWebUntisDate(date) {
        if (!date) return null;
        
        const dateStr = date.toString();
        const year = parseInt(dateStr.substring(0, 4));
        const month = parseInt(dateStr.substring(4, 6)) - 1; // Month is 0-indexed
        const day = parseInt(dateStr.substring(6, 8));
        
        return new Date(year, month, day);
    }

    /**
     * Trigger all notification callbacks
     * @param {Array} events - Events to notify about
     */
    triggerNotifications(events) {
        this.notificationCallbacks.forEach(callback => {
            try {
                callback(events);
            } catch (error) {
                console.error('Notification callback error:', error);
            }
        });
    }

    /**
     * Start periodic checking for events
     * @param {number} intervalMinutes - Check interval in minutes
     * @param {number} hoursAhead - Hours ahead to check
     * @returns {number} Interval ID
     */
    startPeriodicCheck(intervalMinutes = 30, hoursAhead = 24) {
        return setInterval(async () => {
            await this.checkUpcomingEvents(hoursAhead);
        }, intervalMinutes * 60 * 1000);
    }

    /**
     * Stop periodic checking
     * @param {number} intervalId - Interval ID to clear
     */
    stopPeriodicCheck(intervalId) {
        clearInterval(intervalId);
    }
}

// Export classes for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { 
        WebUntisAPI, 
        EventNotificationManager,
        getWebUntisApiInstance,
        clearWebUntisApiInstance,
        testWebUntisAPI
    };
}

/**
 * Global API instance manager for reusing connections
 */
let globalAPIInstance = null;
let globalConfigHash = null;

/**
 * Get or create a WebUntis API instance with session reuse
 * @param {Object} config - WebUntis configuration object
 * @returns {Promise<WebUntisAPI>} API instance
 */
async function getWebUntisApiInstance(config) {
    if (!config) {
        throw new Error('Config parameter is required');
    }
    
    // Create a hash of the config to detect changes
    const configHash = JSON.stringify({
        school: config.school,
        username: config.username,
        password: config.password,
        server: config.server
    });
    
    // If config changed or no instance exists, create new one
    if (!globalAPIInstance || globalConfigHash !== configHash || !globalAPIInstance.sessionId) {
        console.log('🔄 Creating new API instance or config changed');
        globalAPIInstance = new WebUntisAPI(config);
        globalConfigHash = configHash;
        
        // Authenticate the new instance
        if (!(await globalAPIInstance.authenticate())) {
            throw new Error('Authentication failed');
        }
    } else {
        console.log('♻️ Reusing existing API instance');
    }
    
    return globalAPIInstance;
}

/**
 * Clear the global API instance (useful for cleanup or forcing re-authentication)
 */
async function clearWebUntisApiInstance() {
    if (globalAPIInstance) {
        try {
            await globalAPIInstance.logout();
        } catch (error) {
            console.warn('Warning during logout:', error.toString());
        }
    }
    globalAPIInstance = null;
    globalConfigHash = null;
    console.log('🧹 Cleared global API instance');
}

/**
 * Example usage functions
 */

/**
 * Test function
 * @param {Object} config - WebUntis configuration object
 * @param {boolean} forceLogout - Whether to force logout after test (default: false)
 */
async function testWebUntisAPI(config, forceLogout = false) {
    // Use provided config or default values for testing purposes
    if (!config) {
        console.warn('⚠️ No config provided - using default test config. Please provide your actual credentials for real usage.');
        config = {
            school: '<YOUR_SCHOOL_NAME>',        // Replace with your school name
            username: '<YOUR_USERNAME>',         // Replace with your username
            password: '<YOUR_PASSWORD>',         // Replace with your password
            server: '<YOUR_WEBUNTIS_SERVER>'     // Replace with your school's WebUntis server if different
        };
    }

    try {
        // Get or reuse API instance
        console.log('🔐 Getting API instance...');
        const api = await getWebUntisApiInstance(config);
        
        console.log('✅ Authentication successful!');
        
        // Get formatted homework for next 5 days
        const homework = await api.getFormattedHomework(5, true);
        console.log('📚 Homework for next 5 days:');
        console.log(homework);
        
        // Optionally logout if requested
        if (forceLogout) {
            await api.logout();
            await clearWebUntisApiInstance();
            console.log('🔓 Logged out and cleared instance');
        }
        
        console.log('✅ Test completed successfully!');
        
    } catch (error) {
        console.error('❌ Error:', error.toString());
        throw error;
    }
}