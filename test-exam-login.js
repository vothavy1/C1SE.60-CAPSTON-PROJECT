// Quick test to verify user login and get a token
const fetch = require('node-fetch');

const API_BASE_URL = 'http://localhost:5000/api';

async function testLogin() {
    try {
        console.log('🔐 Testing login...');
        
        // Test with candidate credentials
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: 'candidate@test.com',
                password: 'password123'
            })
        });

        console.log('Response status:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Login failed:', response.status, errorText);
            return;
        }

        const result = await response.json();
        console.log('✅ Login successful!');
        console.log('Token:', result.token);
        console.log('User:', result.user);
        
        // Test the token with /tests endpoint
        console.log('\n🧪 Testing /tests endpoint with token...');
        const testsResponse = await fetch(`${API_BASE_URL}/tests`, {
            headers: {
                'Authorization': `Bearer ${result.token}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('Tests response status:', testsResponse.status);
        if (testsResponse.ok) {
            const testsData = await testsResponse.json();
            console.log('✅ Tests API working!');
            console.log('Tests found:', testsData.data?.tests?.length || testsData.length || 0);
        } else {
            const errorText = await testsResponse.text();
            console.error('❌ Tests API failed:', testsResponse.status, errorText);
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testLogin();