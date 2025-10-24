/**
 * WebUntis API Wrapper for Google Apps Script
 * A simplified wrapper for the WebUntis API focused on homework retrieval
 * Compatible with Google Apps Script environment
 * 
 */
 

/**
 * WebUntis API Class for Google Apps Script
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
    }

    /**
     * Authenticate with WebUntis API
     * @returns {boolean} Success status
     */
    authenticate() {
        try {
            const response = this.makeRequest('authenticate', {
                user: this.username,
                password: this.password,
                client: 'WebUntisAPI'
            });

            if (response.result) {
                this.sessionId = response.result.sessionId;
                this.personId = response.result.personId;
                this.personType = response.result.personType;
                
                // Get bearer token for REST API
                this.getBearerToken();
                
                console.log('Authentication successful');
                return true;
            }
            return false;
        } catch (error) {
            console.error('Authentication failed:', error);
            return false;
        }
    }

    /**
     * Get Bearer Token for REST API access
     * @returns {boolean} Success status
     */
    getBearerToken() {
        try {
            const tokenUrl = `${this.apiBaseUrl}/token`;
            
            const options = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Cookie': `JSESSIONID=${this.sessionId}`
                },
                payload: `school=${this.school}`
            };

            const response = UrlFetchApp.fetch(tokenUrl, options);
            
            if (response.getResponseCode() === 200) {
                const data = JSON.parse(response.getContentText());
                this.bearerToken = data.access_token;
                console.log('Bearer token obtained successfully');
                return true;
            } else {
                console.log('Could not get bearer token, will use session-based auth');
                return false;
            }
        } catch (error) {
            console.log('Bearer token request failed:', error.toString());
            return false;
        }
    }

    /**
     * Logout from WebUntis API
     * @returns {boolean} Success status
     */
    logout() {
        try {
            if (!this.sessionId) return true;
            
            this.makeRequest('logout', {});
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
     * @returns {Object} Homework data with records, homeworks, teachers, and lessons
     */
    getHomework(startDate, endDate) {
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

            const options = {
                method: 'GET',
                headers: headers
            };

            const response = UrlFetchApp.fetch(url, options);

            if (response.getResponseCode() !== 200) {
                throw new Error(`HTTP error! status: ${response.getResponseCode()}`);
            }

            const data = JSON.parse(response.getContentText());
            return data.data || data;
        } catch (error) {
            console.error('Failed to get homework:', error);
            throw error;
        }
    }

    /**
     * Get homework for today
     * @returns {Object} Today's homework
     */
    getTodaysEvents() {
        const today = WebUntisAPI.formatDate(new Date());
        return this.getHomework(today, today);
    }

    /**
     * Get homework for this week
     * @returns {Object} This week's homework
     */
    getWeekEvents() {
        const now = new Date();
        const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
        const endOfWeek = new Date(now.setDate(now.getDate() - now.getDay() + 6));
        
        const startDate = WebUntisAPI.formatDate(startOfWeek);
        const endDate = WebUntisAPI.formatDate(endOfWeek);
        
        return this.getHomework(startDate, endDate);
    }

    /**
     * Get homework for the next N days
     * @param {number} days - Number of days to look ahead (default: 7)
     * @param {boolean} onlyIncomplete - Only show incomplete homework (default: true)
     * @param {boolean} excludeToday - Exclude today from the results (default: false)
     * @returns {Array|null} Array of homework objects or null if no homework found
     */
    getHomeworkList(days = 7, onlyIncomplete = true, excludeToday = false) {
        const now = new Date();
        
        // If excludeToday is true, start from tomorrow
        const startDate = excludeToday 
            ? new Date(now.getTime() + (24 * 60 * 60 * 1000))  // Tomorrow
            : now;                                               // Today
            
        const future = new Date(startDate.getTime() + (days * 24 * 60 * 60 * 1000));
        
        const startDateStr = WebUntisAPI.formatDate(startDate);
        const endDateStr = WebUntisAPI.formatDate(future);
        
        try {
            const homeworkData = this.getHomework(startDateStr, endDateStr);
            const homework = homeworkData.homeworks || [];
            const lessons = homeworkData.lessons || [];
            
            // Create lesson lookup map for subjects
            const lessonMap = {};
            lessons.forEach(l => {
                lessonMap[l.id] = l.subject;
            });
            
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
                subjectName: lessonMap[hw.lessonId] || hw.subject || 'Unknown Subject'
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
     * @returns {string} Formatted string with Subject, Due, Text
     */
    getFormattedHomework(days = 7, onlyIncomplete = true, excludeToday = false) {
        const homeworkList = this.getHomeworkList(days, onlyIncomplete, excludeToday);
        return this.formatHomework(homeworkList, days, onlyIncomplete);
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
     * @returns {Object} API response
     */
    makeRequest(method, params = {}) {
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

        const options = {
            method: 'POST',
            headers: headers,
            payload: JSON.stringify(requestData)
        };

        const response = UrlFetchApp.fetch(url, options);

        if (response.getResponseCode() !== 200) {
            throw new Error(`HTTP error! status: ${response.getResponseCode()}`);
        }

        const data = JSON.parse(response.getContentText());

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
 * Event Notification Manager for Google Apps Script
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
    checkUpcomingEvents(hoursAhead = 24) {
        try {
            const now = new Date();
            const future = new Date(now.getTime() + (hoursAhead * 60 * 60 * 1000));
            
            const startDate = WebUntisAPI.formatDate(now);
            const endDate = WebUntisAPI.formatDate(future);
            
            const homeworkData = this.api.getHomework(startDate, endDate);
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
}

/**
 * Global API instance manager for reusing connections
 */
let globalAPIInstance = null;
let globalConfigHash = null;

/**
 * Get or create a WebUntis API instance with session reuse
 * @param {Object} config - WebUntis configuration object
 * @returns {WebUntisAPI} API instance
 */
function getAPIInstance(config) {
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
        if (!globalAPIInstance.authenticate()) {
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
function clearAPIInstance() {
    if (globalAPIInstance) {
        try {
            globalAPIInstance.logout();
        } catch (error) {
            console.warn('Warning during logout:', error.toString());
        }
    }
    globalAPIInstance = null;
    globalConfigHash = null;
    console.log('🧹 Cleared global API instance');
}

/**
 * Example usage functions for Google Apps Script
 */

/**
 * Test function for Google Apps Script
 * @param {Object} config - WebUntis configuration object
 * @param {boolean} forceLogout - Whether to force logout after test (default: false)
 */
function testWebUntisAPI(config, forceLogout = false) {
    // Use provided config or default values for testing purposes
    if (!config) {
        console.warn('⚠️ No config provided - using default test config. Please provide your actual credentials for real usage.');
        config = {
            school: '<YOUR_SCHOOL_NAME>',        // Replace with your school name
            username: '<YOUR_USERNAME>',     // Replace with your username
            password: '<YOUR_PASSWORD>',     // Replace with your password
            server: '<YOUR_WEBUNTIS_SERVER>'       // Replace with your school's WebUntis server if different
        };
    }

    try {
        // Get or reuse API instance
        console.log('🔐 Getting API instance...');
        const api = getAPIInstance(config);
        
        console.log('✅ Authentication successful!');
        
        // Get formatted homework for next 5 days
        const homework = api.getFormattedHomework(5, true);
        console.log('📚 Homework for next 5 days:');
        console.log(homework);
        
        // Optionally logout if requested
        if (forceLogout) {
            api.logout();
            clearAPIInstance();
            console.log('🔓 Logged out and cleared instance');
        }
        
        console.log('✅ Test completed successfully!');
        
    } catch (error) {
        console.error('❌ Error:', error.toString());
        throw error;
    }
}