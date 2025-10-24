/**
 * Home Assistant Integration for WebUntis Google Apps Script
 * This file contains all Home Assistant related functionality
 */

// ==========================================
// HOME ASSISTANT API FUNCTIONS
// ==========================================

/**
 * Send homework notification to Home Assistant
 * This function can be set up as a trigger to notify through Home Assistant
 * @param {Object} config - WebUntis configuration object
 * @param {Object} haConfig - Home Assistant configuration object
 * @param {string} haConfig.url - Home Assistant URL (e.g., 'https://your-ha.com')
 * @param {string} haConfig.token - Home Assistant Long-Lived Access Token
 * @param {string} haConfig.service - Home Assistant service to call (e.g., 'notify.mobile_app_phone')
 * @param {number} days - Number of days to look ahead (default: 3)
 * @param {Object} options - Additional options for Home Assistant integration
 * @param {string} options.title - Custom notification title
 * @param {Object} options.data - Additional data to send with notification
 */
function sendHomeworkToHomeAssistant(config, haConfig, days = 3, options = {}) {
    if (!config) {
        throw new Error('Config parameter is required');
    }
    
    if (!haConfig || !haConfig.url || !haConfig.token || !haConfig.service) {
        throw new Error('Home Assistant config with url, token, and service is required');
    }

    try {
        const api = getAPIInstance(config);
        const homework = api.getFormattedHomework(days, true); // Next n days, open only
        
        if (!homework.includes('No open homework')) {
            // Prepare notification data
            const opts = {
                title: 'Upcoming Homework Reminder',
                data: {},
                ...options
            };
            
            // Call Home Assistant API
            const result = callHomeAssistantAPI(haConfig, haConfig.service, {
                title: opts.title,
                message: homework,
                ...opts.data
            });
            
            if (result.success) {
                console.log(`🏠 Homework notification sent to Home Assistant successfully!`);
            } else {
                console.error(`❌ Failed to send notification to Home Assistant: ${result.error}`);
            }
            
            return result;
        } else {
            console.log(`🎉 No homework due in the next ${days} days! (No notification sent)`);
            return { success: true, message: 'No homework to notify' };
        }
        
        // Note: We don't logout here as we're reusing the session
        
    } catch (error) {
        console.error('❌ Error sending homework to Home Assistant:', error.toString());
        throw error;
    }
}

/**
 * Call Home Assistant API to perform an action
 * @param {Object} haConfig - Home Assistant configuration object
 * @param {string} haConfig.url - Home Assistant URL
 * @param {string} haConfig.token - Home Assistant Long-Lived Access Token
 * @param {string} action - The action/service to call (e.g., 'notify.mobile_app_phone', 'light.turn_on')
 * @param {Object} data - Data to send with the action
 * @returns {Object} Result object with success status and response data
 */
function callHomeAssistantAPI(haConfig, action, data = {}) {
    if (!haConfig || !haConfig.url || !haConfig.token) {
        throw new Error('Home Assistant config with url and token is required');
    }
    
    if (!action) {
        throw new Error('Action parameter is required');
    }
    
    try {
        // Parse the action to get domain and service
        const actionParts = action.split('.');
        if (actionParts.length !== 2) {
            throw new Error('Action must be in format "domain.service" (e.g., "notify.mobile_app_phone")');
        }
        
        const [domain, service] = actionParts;
        
        // Prepare the API URL
        const apiUrl = `${haConfig.url.replace(/\/$/, '')}/api/services/${domain}/${service}`;
        
        // Prepare headers
        const headers = {
            'Authorization': `Bearer ${haConfig.token}`,
            'Content-Type': 'application/json'
        };
        
        // Prepare the request
        const options = {
            method: 'POST',
            headers: headers,
            payload: JSON.stringify(data),
            muteHttpExceptions: true  // This allows us to handle HTTP errors gracefully
        };
        
        console.log(`🏠 Calling Home Assistant API: ${action}`);
        console.log(`🌐 URL: ${apiUrl}`);
        console.log(`📦 Payload:`, JSON.stringify(data, null, 2));
        
        // Make the request
        const response = UrlFetchApp.fetch(apiUrl, options);
        const responseCode = response.getResponseCode();
        const responseText = response.getContentText();
        
        console.log(`📡 Response Code: ${responseCode}`);
        
        if (responseCode >= 200 && responseCode < 300) {
            console.log(`✅ Home Assistant API call successful (${responseCode})`);
            
            let responseData = {};
            try {
                responseData = JSON.parse(responseText);
            } catch (parseError) {
                responseData = { raw: responseText };
            }
            
            return {
                success: true,
                statusCode: responseCode,
                data: responseData
            };
        } else {
            console.error(`❌ Home Assistant API call failed (${responseCode})`);
            console.error(`📄 Response: ${responseText}`);
            
            // Try to parse error response for more details
            let errorDetails = responseText;
            try {
                const errorJson = JSON.parse(responseText);
                errorDetails = errorJson;
            } catch (parseError) {
                // Keep as text if not JSON
            }
            
            return {
                success: false,
                statusCode: responseCode,
                error: errorDetails,
                fullResponse: responseText
            };
        }
        
    } catch (error) {
        console.error('❌ Error calling Home Assistant API:', error.toString());
        return {
            success: false,
            error: error.toString()
        };
    }
}

// ==========================================
// HOME ASSISTANT EXAMPLE FUNCTIONS
// ==========================================

/**
 * Example: Send homework to Home Assistant using the global config
 */
function sendHomeworkToMyHomeAssistant() {
    sendHomeworkToHomeAssistant(MY_CONFIG, MY_HA_CONFIG, 3); // 3 days ahead
}

/**
 * Example: Multi-platform notifications (Email + Home Assistant)
 */
function sendMultiPlatformNotifications() {
    console.log('📢 Sending homework notifications to multiple platforms...');
    
    try {
        // Send to email
        console.log('📧 Sending email notification...');
        sendHomeworkEmail(MY_CONFIG, 'student@family.com', 3);
        
        // Send to Home Assistant
        console.log('🏠 Sending Home Assistant notification...');
        sendHomeworkToHomeAssistant(MY_CONFIG, MY_HA_CONFIG, 3, {
            title: 'School Homework Alert',
            data: {
                priority: 'high',
                tag: 'homework',
                actions: [
                    {
                        action: 'view_homework',
                        title: 'View Details'
                    }
                ]
            }
        });
        
        // Add to calendar
        console.log('📅 Adding to calendar...');
        addHomeworkToCalendar(MY_CONFIG, null, 7);
        
        console.log('✅ Multi-platform notifications completed!');
        
    } catch (error) {
        console.error('❌ Multi-platform notification failed:', error.toString());
        clearAPIInstance(); // Clean up on error
    }
}

/**
 * Example: Home Assistant automation trigger
 */
function triggerHomeAssistantAutomation() {
    console.log('🏠 Triggering Home Assistant automation...');
    
    try {
        // Example: Turn on a light when homework is due
        const result = callHomeAssistantAPI(MY_HA_CONFIG, 'light.turn_on', {
            entity_id: 'light.study_room',
            brightness: 255,
            color_name: 'orange'
        });
        
        if (result.success) {
            console.log('💡 Study room light turned on for homework time!');
        }
        
        // Example: Set a scene
        callHomeAssistantAPI(MY_HA_CONFIG, 'scene.turn_on', {
            entity_id: 'scene.homework_time'
        });
        
        console.log('✅ Home Assistant automation triggered!');
        
    } catch (error) {
        console.error('❌ Home Assistant automation failed:', error.toString());
    }
}

/**
 * Example: Advanced Home Assistant integration with multiple services
 */
function advancedHomeAssistantIntegration() {
    console.log('🏠 Running advanced Home Assistant integration...');
    
    try {
        // 1. Check for homework first
        const api = getAPIInstance(MY_CONFIG);
        const homework = api.getFormattedHomework(3, true);
        
        if (homework.includes('No open homework')) {
            console.log('🎉 No homework due - turning on celebration lights!');
            
            // Turn on celebration scene
            callHomeAssistantAPI(MY_HA_CONFIG, 'scene.turn_on', {
                entity_id: 'scene.celebration'
            });
            
            return;
        }
        
        console.log('📚 Homework found - setting up study environment...');
        
        // 2. Set up study environment
        const environmentResults = [
            // Turn on study lights
            callHomeAssistantAPI(MY_HA_CONFIG, 'light.turn_on', {
                entity_id: 'light.study_room',
                brightness: 200,
                color_temp: 350 // Warm white for concentration
            }),
            
            // Start focus music
            callHomeAssistantAPI(MY_HA_CONFIG, 'media_player.play_media', {
                entity_id: 'media_player.study_speaker',
                media_content_id: 'focus_playlist',
                media_content_type: 'playlist'
            }),
            
            // Set temperature for comfort
            callHomeAssistantAPI(MY_HA_CONFIG, 'climate.set_temperature', {
                entity_id: 'climate.study_room',
                temperature: 22
            })
        ];
        
        // 3. Send notification with homework details
        const notificationResult = sendHomeworkToHomeAssistant(MY_CONFIG, MY_HA_CONFIG, 3, {
            title: '📚 Study Time - Homework Due Soon!',
            data: {
                priority: 'high',
                tag: 'homework_reminder',
                channel: 'homework',
                actions: [
                    {
                        action: 'mark_done',
                        title: 'Mark as Done'
                    },
                    {
                        action: 'snooze',
                        title: 'Remind Later'
                    }
                ],
                icon: 'mdi:school',
                color: '#3498db'
            }
        });
        
        // 4. Log results
        const successCount = environmentResults.filter(r => r.success).length;
        console.log(`✅ Study environment setup: ${successCount}/${environmentResults.length} actions successful`);
        
        if (notificationResult.success) {
            console.log('📱 Homework notification sent successfully');
        }
        
        console.log('🎯 Advanced Home Assistant integration completed!');
        
    } catch (error) {
        console.error('❌ Advanced Home Assistant integration failed:', error.toString());
        clearAPIInstance();
    }
}

/**
 * Example: Home Assistant timer for homework sessions
 */
function createHomeworkTimer() {
    console.log('⏰ Creating homework timer in Home Assistant...');
    
    try {
        // Start a 25-minute Pomodoro timer
        const timerResult = callHomeAssistantAPI(MY_HA_CONFIG, 'timer.start', {
            entity_id: 'timer.homework_session',
            duration: '00:25:00' // 25 minutes
        });
        
        if (timerResult.success) {
            console.log('⏰ 25-minute homework timer started!');
            
            // Send confirmation notification
            callHomeAssistantAPI(MY_HA_CONFIG, MY_HA_CONFIG.service, {
                title: '⏰ Homework Timer Started',
                message: 'Focus time! 25 minutes of productive studying ahead. You got this! 💪',
                data: {
                    priority: 'normal',
                    tag: 'homework_timer',
                    actions: [
                        {
                            action: 'stop_timer',
                            title: 'Stop Timer'
                        }
                    ]
                }
            });
        }
        
    } catch (error) {
        console.error('❌ Error creating homework timer:', error.toString());
    }
}

/**
 * Example: Home Assistant automation for homework reminders
 */
function scheduleHomeworkReminders() {
    console.log('🔔 Scheduling homework reminders in Home Assistant...');
    
    try {
        // Get homework for the next week
        const api = getAPIInstance(MY_CONFIG);
        const homeworkData = api.getHomework(
            WebUntisAPI.formatDate(new Date()),
            WebUntisAPI.formatDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000))
        );
        
        const homework = homeworkData.homeworks || [];
        const lessons = homeworkData.lessons || [];
        
        // Create lesson lookup
        const lessonMap = {};
        lessons.forEach(l => {
            lessonMap[l.id] = l.subject;
        });
        
        // Schedule reminders for each homework
        homework.filter(hw => !hw.completed).forEach((hw, index) => {
            const subject = lessonMap[hw.lessonId] || 'Unknown Subject';
            const dueDate = api.formatWebUntisDate(hw.dueDate);
            
            // Calculate reminder date (1 day before due date)
            const dueDateObj = new Date(dueDate.split('.').reverse().join('-'));
            const reminderDate = new Date(dueDateObj);
            reminderDate.setDate(reminderDate.getDate() - 1);
            
            // Only schedule future reminders
            if (reminderDate > new Date()) {
                setTimeout(() => {
                    callHomeAssistantAPI(MY_HA_CONFIG, MY_HA_CONFIG.service, {
                        title: `📚 Homework Reminder: ${subject}`,
                        message: `Don't forget! ${hw.text || 'Homework'} is due tomorrow (${dueDate})`,
                        data: {
                            priority: 'high',
                            tag: `homework_${hw.id}`,
                            persistent: true
                        }
                    });
                }, Math.max(0, reminderDate.getTime() - Date.now()));
                
                console.log(`🔔 Scheduled reminder for ${subject} on ${api.formatWebUntisDate(parseInt(WebUntisAPI.formatDate(reminderDate)))}`);
            }
        });
        
        console.log('✅ Homework reminders scheduled!');
        
    } catch (error) {
        console.error('❌ Error scheduling homework reminders:', error.toString());
    }
}

// ==========================================
// HOME ASSISTANT AUTOMATION FUNCTIONS
// ==========================================

/**
 * Daily Home Assistant automation - Set this up as a daily trigger
 */
function dailyHomeAssistantAutomation() {
    console.log('🤖 Running daily Home Assistant homework automation...');
    
    try {
        // Check for homework and set up study environment if needed
        const api = getAPIInstance(MY_CONFIG);
        const homework = api.getFormattedHomework(2, true); // Next 2 days
        
        if (!homework.includes('No open homework')) {
            // Send daily reminder
            sendHomeworkToHomeAssistant(MY_CONFIG, MY_HA_CONFIG, 2, {
                title: '📅 Daily Homework Check',
                data: {
                    priority: 'normal',
                    tag: 'daily_homework',
                    channel: 'homework'
                }
            });
            
            // Set up study room if homework is due tomorrow
            callHomeAssistantAPI(MY_HA_CONFIG, 'scene.turn_on', {
                entity_id: 'scene.homework_ready'
            });
        } else {
            // No homework - send positive message
            callHomeAssistantAPI(MY_HA_CONFIG, MY_HA_CONFIG.service, {
                title: '🎉 No Homework Today!',
                message: 'Great job staying on top of your homework! Enjoy your free time! 😊',
                data: {
                    priority: 'low',
                    tag: 'no_homework'
                }
            });
        }
        
        clearAPIInstance();
        console.log('✅ Daily Home Assistant automation completed!');
        
    } catch (error) {
        console.error('❌ Daily Home Assistant automation failed:', error.toString());
        clearAPIInstance();
    }
}

/**
 * Evening Home Assistant automation - Prepare for next day
 */
function eveningHomeAssistantAutomation() {
    console.log('🌙 Running evening Home Assistant homework preparation...');
    
    try {
        // Check tomorrow's homework
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const api = getAPIInstance(MY_CONFIG);
        const homeworkData = api.getHomework(
            WebUntisAPI.formatDate(tomorrow),
            WebUntisAPI.formatDate(tomorrow)
        );
        
        const tomorrowHomework = (homeworkData.homeworks || []).filter(hw => !hw.completed);
        
        if (tomorrowHomework.length > 0) {
            const lessons = homeworkData.lessons || [];
            const lessonMap = {};
            lessons.forEach(l => {
                lessonMap[l.id] = l.subject;
            });
            
            // Prepare homework summary for tomorrow
            let summary = `📚 Tomorrow's Homework (${tomorrowHomework.length} assignments):\n\n`;
            tomorrowHomework.forEach((hw, index) => {
                const subject = lessonMap[hw.lessonId] || 'Unknown Subject';
                summary += `${index + 1}. ${subject}: ${hw.text || 'No description'}\n`;
            });
            
            // Send evening preparation notification
            callHomeAssistantAPI(MY_HA_CONFIG, MY_HA_CONFIG.service, {
                title: '🌙 Tomorrow\'s Homework Prep',
                message: summary,
                data: {
                    priority: 'normal',
                    tag: 'evening_prep',
                    channel: 'homework',
                    actions: [
                        {
                            action: 'set_alarm',
                            title: 'Set Study Alarm'
                        },
                        {
                            action: 'prepare_bag',
                            title: 'Pack School Bag'
                        }
                    ]
                }
            });
            
            // Set up evening study scene
            callHomeAssistantAPI(MY_HA_CONFIG, 'scene.turn_on', {
                entity_id: 'scene.evening_study'
            });
        }
        
        clearAPIInstance();
        console.log('✅ Evening Home Assistant automation completed!');
        
    } catch (error) {
        console.error('❌ Evening Home Assistant automation failed:', error.toString());
        clearAPIInstance();
    }
}