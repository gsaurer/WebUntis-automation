/**
 * Simple test for timetable functionality
 * This test checks if the three-step initialization and timetable retrieval works
 * even when bearer tokens are not available (403 error)
 */

// Test with session-based authentication only
function testTimetableWithSessionAuth() {
    console.log('🔍 Testing timetable with session-based authentication...');
    
    const config = {
        school: '<YOUR_SCHOOL_NAME>',
        username: '<YOUR_USERNAME>',
        password: '<YOUR_PASSWORD>',
        server: '<YOUR_WEBUNTIS_SERVER>',
        resourceId: '<YOUR_STUDENT_RESOURCE_ID>'
    };
    
    try {
        // Get API instance (will use session auth due to 403 bearer token error)
        const api = getAPIInstance(config);
        
        console.log('✅ Authentication successful with session-based auth');
        console.log(`🔐 Session ID: ${api.sessionId ? 'present' : 'missing'}`);
        console.log(`🎫 Bearer token: ${api.bearerToken ? 'present' : 'not available (expected)'}`);
        
        // Test timetable for next 2 days
        const today = new Date();
        const twoDaysLater = new Date();
        twoDaysLater.setDate(today.getDate() + 2);
        
        const startDate = WebUntisAPI.formatDateForAPI(today);
        const endDate = WebUntisAPI.formatDateForAPI(twoDaysLater);
        
        console.log(`📅 Testing timetable from ${startDate} to ${endDate}`);
        
        // This should work with session-based auth and three-step initialization
        const timetableData = api.getTimetableData(startDate, endDate);
        
        if (timetableData) {
            console.log(`✅ Timetable data retrieved successfully`);
            console.log(`📊 Found ${timetableData.days?.length || 0} days`);
            
            // Process the lessons
            const lessons = api.processTimetableData(timetableData);
            
            if (lessons) {
                console.log(`📚 Successfully processed ${lessons.length} lessons`);
                
                // Show sample lesson
                if (lessons.length > 0) {
                    const firstLesson = lessons[0];
                    console.log('📖 Sample lesson:');
                    console.log(`   Subject: ${firstLesson.subject}`);
                    console.log(`   Teacher: ${firstLesson.teacher}`);
                    console.log(`   Room: ${firstLesson.room}`);
                    console.log(`   Time: ${firstLesson.startTime.toLocaleTimeString()} - ${firstLesson.endTime.toLocaleTimeString()}`);
                    console.log(`   Status: ${firstLesson.status}`);
                }
                
                return {
                    success: true,
                    lessonsFound: lessons.length,
                    authMethod: 'session-based',
                    bearerTokenAvailable: !!api.bearerToken
                };
            } else {
                console.log('⚠️ No lessons found after processing');
                return {
                    success: true,
                    lessonsFound: 0,
                    authMethod: 'session-based',
                    bearerTokenAvailable: !!api.bearerToken
                };
            }
        } else {
            console.log('❌ No timetable data found');
            return {
                success: false,
                error: 'No timetable data found',
                authMethod: 'session-based',
                bearerTokenAvailable: !!api.bearerToken
            };
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.toString());
        return {
            success: false,
            error: error.toString(),
            authMethod: 'session-based',
            bearerTokenAvailable: false
        };
    }
}

// Run the test
console.log('🚀 Starting timetable test with session-based authentication...');
const result = testTimetableWithSessionAuth();
console.log('📊 Test Result:', JSON.stringify(result, null, 2));