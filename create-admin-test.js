// Script to create admin user via API or direct login test
console.log('🔧 Creating test admin user...');

// Test admin credentials
const testAdminData = {
    username: 'admin_cs60',
    email: 'admin@cs60.com',
    password: 'admin123456',
    full_name: 'CS60 Administrator',
    role: 'admin'
};

// Try to create admin user via registration API
async function createAdminUser() {
    try {
        const response = await fetch('http://localhost:5000/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(testAdminData)
        });

        const result = await response.json();
        console.log('Admin user creation result:', result);

        if (result.success) {
            console.log('✅ Admin user created successfully!');
            console.log('📧 Email:', testAdminData.email);
            console.log('🔑 Password:', testAdminData.password);
        } else {
            console.log('ℹ️ User might already exist or registration failed');
            console.log('Try using existing credentials:');
            console.log('📧 Email: admin@cs60.com or test@admin.com');
            console.log('🔑 Password: admin123456 or admin123');
        }
    } catch (error) {
        console.error('Error creating admin user:', error);
        console.log('💡 Fallback: Use test@admin.com / admin123 in login form');
    }
}

// Also test login directly
async function testAdminLogin() {
    try {
        console.log('🧪 Testing admin login...');
        
        const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: 'admin@cs60.com',
                password: 'admin123456'
            })
        });

        const loginResult = await loginResponse.json();
        console.log('Login test result:', loginResult);

        if (loginResult.success && loginResult.user) {
            console.log('✅ Found existing admin user!');
            console.log('👤 User:', loginResult.user);
        }
    } catch (error) {
        console.error('Login test error:', error);
    }
}

// Run both functions
createAdminUser().then(() => testAdminLogin());