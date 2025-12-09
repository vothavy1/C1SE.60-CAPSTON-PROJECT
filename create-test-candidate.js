const { User, Role, Candidate } = require('./backend/src/models');
const bcrypt = require('bcryptjs');

async function createTestCandidate() {
    try {
        console.log('🔄 Creating test candidate account...');
        
        // Get candidate role
        const candidateRole = await Role.findOne({ where: { role_name: 'CANDIDATE' } });
        if (!candidateRole) {
            console.error('❌ CANDIDATE role not found');
            return;
        }
        
        // Check if test candidate already exists
        const existingUser = await User.findOne({ where: { email: 'candidate@test.com' } });
        if (existingUser) {
            console.log('✅ Test candidate already exists');
            console.log('Email: candidate@test.com');
            console.log('Password: password123');
            return;
        }
        
        // Hash password
        const hashedPassword = await bcrypt.hash('password123', 12);
        
        // Create user
        const user = await User.create({
            username: 'test_candidate',
            email: 'candidate@test.com',
            password: hashedPassword,
            full_name: 'Test Candidate',
            role_id: candidateRole.role_id,
            is_active: true,
            company_id: 1 // Default company
        });
        
        // Create candidate profile
        const candidate = await Candidate.create({
            user_id: user.user_id,
            first_name: 'Test',
            last_name: 'Candidate',
            email: 'candidate@test.com',
            phone: '0123456789',
            address: 'Test Address',
            date_of_birth: '1995-01-01',
            company_id: 1
        });
        
        console.log('✅ Test candidate created successfully!');
        console.log('Email: candidate@test.com');
        console.log('Password: password123');
        console.log('User ID:', user.user_id);
        console.log('Candidate ID:', candidate.candidate_id);
        
    } catch (error) {
        console.error('❌ Error creating test candidate:', error);
    }
}

createTestCandidate();