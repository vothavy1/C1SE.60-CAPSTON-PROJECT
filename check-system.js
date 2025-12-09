const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 CS60 System Health Check');
console.log('============================');

// 1. Check file structure
console.log('\n1. 📁 Checking file structure...');
const requiredFiles = [
    'backend/package.json',
    'backend/.env', 
    'backend/src/server.js',
    'backend/src/config/database.js',
    'backend/src/models/index.js',
    'frontend/package.json',
    'frontend/server.js',
    'frontend/index.html',
    'frontend/config.js',
    'docker-compose.yml',
    'start-all.ps1'
];

let filesOK = true;
requiredFiles.forEach(file => {
    if (fs.existsSync(file)) {
        console.log(`✅ ${file}`);
    } else {
        console.log(`❌ ${file} - MISSING`);
        filesOK = false;
    }
});

// 2. Check package.json dependencies
console.log('\n2. 📦 Checking dependencies...');
try {
    const backendPkg = JSON.parse(fs.readFileSync('backend/package.json', 'utf8'));
    const frontendPkg = JSON.parse(fs.readFileSync('frontend/package.json', 'utf8'));
    
    console.log(`✅ Backend: ${backendPkg.name}@${backendPkg.version}`);
    console.log(`✅ Frontend: ${frontendPkg.name}@${frontendPkg.version}`);
    
    // Check critical backend dependencies
    const criticalDeps = ['express', 'sequelize', 'mysql2', 'jsonwebtoken', 'bcryptjs'];
    criticalDeps.forEach(dep => {
        if (backendPkg.dependencies[dep]) {
            console.log(`✅ ${dep}: ${backendPkg.dependencies[dep]}`);
        } else {
            console.log(`❌ ${dep} - MISSING`);
        }
    });
} catch (error) {
    console.log('❌ Error reading package.json files:', error.message);
}

// 3. Check environment configuration
console.log('\n3. ⚙️ Checking environment configuration...');
try {
    const envContent = fs.readFileSync('backend/.env', 'utf8');
    const envVars = ['PORT', 'DB_HOST', 'DB_DATABASE', 'DB_USER', 'DB_PASSWORD', 'JWT_SECRET'];
    
    envVars.forEach(envVar => {
        if (envContent.includes(`${envVar}=`)) {
            const value = envContent.match(new RegExp(`${envVar}=(.+)`))?.[1];
            if (envVar.includes('PASSWORD') || envVar.includes('SECRET')) {
                console.log(`✅ ${envVar}: [HIDDEN]`);
            } else {
                console.log(`✅ ${envVar}: ${value}`);
            }
        } else {
            console.log(`❌ ${envVar} - NOT SET`);
        }
    });
} catch (error) {
    console.log('❌ Error reading .env file:', error.message);
}

// 4. Test database connection
console.log('\n4. 🗄️ Testing database connection...');
async function testDatabase() {
    try {
        const sequelize = require('./backend/src/config/database');
        await sequelize.authenticate();
        console.log('✅ Database connection successful');
        
        // Test some models
        const { User, Candidate, Test, Question } = require('./backend/src/models');
        
        const userCount = await User.count();
        const candidateCount = await Candidate.count();
        const testCount = await Test.count();
        const questionCount = await Question.count();
        
        console.log(`📊 Database stats:`);
        console.log(`   Users: ${userCount}`);
        console.log(`   Candidates: ${candidateCount}`);
        console.log(`   Tests: ${testCount}`);
        console.log(`   Questions: ${questionCount}`);
        
        await sequelize.close();
        
    } catch (error) {
        console.log('❌ Database connection failed:', error.message);
    }
}

// 5. Check ports
console.log('\n5. 🌐 Checking ports...');
function checkPort(port, service) {
    return new Promise((resolve) => {
        exec(`netstat -an | findstr :${port}`, (error, stdout) => {
            if (stdout.trim()) {
                console.log(`⚠️  Port ${port} (${service}) is in use`);
                resolve(false);
            } else {
                console.log(`✅ Port ${port} (${service}) is available`);
                resolve(true);
            }
        });
    });
}

// 6. Check Docker
console.log('\n6. 🐳 Checking Docker...');
function checkDocker() {
    return new Promise((resolve) => {
        exec('docker --version', (error, stdout) => {
            if (error) {
                console.log('❌ Docker not installed or not accessible');
                resolve(false);
            } else {
                console.log(`✅ Docker available: ${stdout.trim()}`);
                
                // Check if MySQL container is running
                exec('docker ps --filter "name=cs60_mysql" --format "table {{.Names}}\\t{{.Status}}"', (error, stdout) => {
                    if (stdout.includes('cs60_mysql')) {
                        console.log('✅ MySQL container is running');
                    } else {
                        console.log('⚠️  MySQL container is not running');
                        console.log('   Run: cd database && docker-compose up -d');
                    }
                    resolve(true);
                });
            }
        });
    });
}

// Run all checks
async function runAllChecks() {
    await testDatabase();
    await checkPort(3000, 'Frontend');
    await checkPort(5000, 'Backend');
    await checkPort(3306, 'MySQL');
    await checkDocker();
    
    console.log('\n🎯 Summary:');
    console.log('==================');
    if (filesOK) {
        console.log('✅ File structure is complete');
    } else {
        console.log('❌ Some files are missing');
    }
    
    console.log('\n📋 Next steps:');
    console.log('1. Ensure Docker Desktop is running');
    console.log('2. Start database: cd database && docker-compose up -d');
    console.log('3. Install dependencies: cd backend && npm install');
    console.log('4. Start system: .\\start-all.ps1');
    console.log('\n🚀 Quick start: .\\start-all.ps1');
}

runAllChecks().catch(console.error);