#!/usr/bin/env node

// Test admin login functionality using native fetch in Node.js 18+
const fetch = globalThis.fetch || (() => {
    try {
        return require('node-fetch');
    } catch {
        console.error('❌ Fetch not available. Please run from backend directory or use Node.js 18+');
        process.exit(1);
    }
})();

const TEST_CONFIG = {
    baseUrl: 'http://localhost:5000',
    adminCredentials: {
        email: 'admin@cs60.com',
        password: 'admin123456'  // Updated from .env file
    }
};

async function testAdminLogin() {
    console.log('🧪 Testing Admin Login Process...\n');
    
    try {
        console.log('📝 Step 1: Attempting admin login...');
        const loginResponse = await fetch(`${TEST_CONFIG.baseUrl}/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(TEST_CONFIG.adminCredentials)
        });
        
        const loginResult = await loginResponse.json();
        console.log('🔍 Login Response:', JSON.stringify(loginResult, null, 2));
        
        if (loginResponse.ok && loginResult.success) {
            console.log('✅ Admin login successful!');
            console.log(`📧 User Email: ${loginResult.user.email}`);
            console.log(`👤 User Role: ${loginResult.user.role}`);
            console.log(`🔑 Token received: ${loginResult.token ? 'Yes' : 'No'}`);
            
            // Test token validation
            if (loginResult.token) {
                console.log('\n📝 Step 2: Testing token validation...');
                
                const profileResponse = await fetch(`${TEST_CONFIG.baseUrl}/api/auth/profile`, {
                    headers: {
                        'Authorization': `Bearer ${loginResult.token}`
                    }
                });
                
                const profileResult = await profileResponse.json();
                console.log('🔍 Profile Response:', JSON.stringify(profileResult, null, 2));
                
                if (profileResponse.ok) {
                    console.log('✅ Token validation successful!');
                } else {
                    console.log('❌ Token validation failed');
                }
            }
            
            console.log('\n🎯 Recommended localStorage setup for frontend:');
            console.log(`localStorage.setItem('token', '${loginResult.token}');`);
            console.log(`localStorage.setItem('session_user', '${JSON.stringify(loginResult.user)}');`);
            console.log(`localStorage.setItem('login_timestamp', '${Date.now()}');`);
            
        } else {
            console.log('❌ Admin login failed!');
            console.log('Response:', loginResult);
        }
        
    } catch (error) {
        console.error('💥 Test failed with error:', error.message);
    }
}

// Run test
testAdminLogin().then(() => {
    console.log('\n🏁 Admin login test completed.');
});