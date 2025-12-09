// Load environment variables from backend directory
require('dotenv').config({ path: './backend/.env' });
const { User, Candidate } = require('./backend/src/models');
const sequelize = require('./backend/src/config/database');

async function fixCandidateProfile() {
    try {
        console.log('🔍 Checking candidate profile...');
        
        // Find the test candidate user
        const user = await User.findOne({ 
            where: { email: 'candidate@test.com' },
            include: [Candidate]
        });
        
        if (!user) {
            console.error('❌ Test candidate user not found');
            console.log('📝 Creating test candidate user...');
            
            // Create test candidate user first
            const newUser = await User.create({
                username: 'candidate_test',
                email: 'candidate@test.com',
                password_hash: '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password: password
                role_id: 3, // candidate role
                company_id: 1,
                status: 'ACTIVE'
            });
            
            console.log('✅ Test candidate user created:', {
                id: newUser.user_id,
                username: newUser.username,
                email: newUser.email,
                role_id: newUser.role_id,
                company_id: newUser.company_id
            });
            
            // Create candidate profile for new user
            const candidate = await Candidate.create({
                user_id: newUser.user_id,
                first_name: 'Test',
                last_name: 'Candidate',
                email: 'candidate@test.com',
                phone: '0123456789',
                current_position: 'Software Developer',
                position: 'Full Stack Developer',
                company_name: 'Previous Company',
                years_of_experience: 3,
                experience_years: '3-5 years',
                education: 'Bachelor of Computer Science',
                skills: 'JavaScript, Node.js, React, MySQL',
                source: 'Website',
                company_id: 1,
                status: 'NEW',
                notes: 'Test candidate profile created automatically'
            });
            
            console.log('✅ Candidate profile created:', {
                id: candidate.candidate_id,
                name: `${candidate.first_name} ${candidate.last_name}`,
                email: candidate.email,
                company_id: candidate.company_id,
                status: candidate.status
            });
            
            return;
        }
        
        console.log('✅ User found:', {
            id: user.user_id,
            username: user.username,
            email: user.email,
            role_id: user.role_id,
            company_id: user.company_id
        });
        
        if (user.Candidate) {
            console.log('✅ Candidate profile already exists:', {
                id: user.Candidate.candidate_id,
                name: `${user.Candidate.first_name} ${user.Candidate.last_name}`,
                email: user.Candidate.email,
                company_id: user.Candidate.company_id,
                status: user.Candidate.status
            });
            
            // Update candidate profile if needed
            await user.Candidate.update({
                company_id: user.company_id || 1,
                updated_at: new Date()
            });
            
            console.log('✅ Candidate profile updated with company_id');
            return;
        }
        
        // Create candidate profile
        console.log('📝 Creating candidate profile...');
        const candidate = await Candidate.create({
            user_id: user.user_id,
            first_name: 'Test',
            last_name: 'Candidate',
            email: user.email,
            phone: '0123456789',
            current_position: 'Software Developer',
            position: 'Full Stack Developer', 
            company_name: 'Previous Company',
            years_of_experience: 3,
            experience_years: '3-5 years',
            education: 'Bachelor of Computer Science',
            skills: 'JavaScript, Node.js, React, MySQL',
            source: 'Website',
            company_id: user.company_id || 1,
            status: 'NEW',
            notes: 'Test candidate profile created automatically'
        });
        
        console.log('✅ Candidate profile created successfully:', {
            id: candidate.candidate_id,
            name: `${candidate.first_name} ${candidate.last_name}`,
            email: candidate.email,
            company_id: candidate.company_id,
            status: candidate.status
        });
        
    } catch (error) {
        console.error('❌ Error fixing candidate profile:', error);
        console.error('Error details:', error.message);
        if (error.original) {
            console.error('Database error:', error.original.message);
        }
        throw error;
    }
}

// Function to check and fix multiple test accounts
async function checkAllTestAccounts() {
    try {
        console.log('🔍 Checking all test accounts...');
        
        const testEmails = [
            'candidate@test.com',
            'havy@test.com'
        ];
        
        for (const email of testEmails) {
            console.log(`\n🔍 Checking account: ${email}`);
            
            const user = await User.findOne({
                where: { email },
                include: [Candidate]
            });
            
            if (!user) {
                console.log(`❌ User ${email} not found, skipping...`);
                continue;
            }
            
            console.log(`✅ User found: ${user.username} (${email})`);
            
            if (!user.Candidate) {
                console.log(`📝 Creating candidate profile for ${email}...`);
                
                const candidate = await Candidate.create({
                    user_id: user.user_id,
                    first_name: email.includes('havy') ? 'Vo Thi' : 'Test',
                    last_name: email.includes('havy') ? 'Havy' : 'Candidate',
                    email: user.email,
                    phone: '0123456789',
                    current_position: 'Software Developer',
                    position: 'Full Stack Developer',
                    company_name: 'Previous Company',
                    years_of_experience: 3,
                    experience_years: '3-5 years',
                    education: 'Bachelor of Computer Science',
                    skills: 'JavaScript, Node.js, React, MySQL',
                    source: 'Website',
                    company_id: user.company_id || 1,
                    status: 'NEW',
                    notes: 'Test candidate profile created automatically'
                });
                
                console.log(`✅ Candidate profile created for ${email}:`, {
                    id: candidate.candidate_id,
                    name: `${candidate.first_name} ${candidate.last_name}`
                });
            } else {
                console.log(`✅ Candidate profile already exists for ${email}`);
            }
        }
        
        console.log('\n🎉 All test accounts checked successfully!');
        
    } catch (error) {
        console.error('❌ Error checking test accounts:', error);
        throw error;
    }
}

// Main execution function
async function main() {
    try {
        // Test database connection
        await sequelize.authenticate();
        console.log('✅ Database connection established successfully.');
        
        // Fix candidate profile
        await fixCandidateProfile();
        
        // Check all test accounts
        await checkAllTestAccounts();
        
        console.log('\n🎉 All operations completed successfully!');
        
    } catch (error) {
        console.error('❌ Main execution failed:', error);
        process.exit(1);
    } finally {
        // Close database connection
        await sequelize.close();
        console.log('🔌 Database connection closed.');
    }
}

// Run if this file is executed directly
if (require.main === module) {
    main();
}

module.exports = {
    fixCandidateProfile,
    checkAllTestAccounts,
    main
};