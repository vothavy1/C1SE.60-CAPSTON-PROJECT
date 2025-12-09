/**
 * Test script để kiểm tra phân quyền theo công ty
 * Chạy: node test-company-permission.js
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api';

// ANSI colors
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testLogin(email, password) {
  try {
    log(`\n🔐 Testing login for: ${email}`, 'cyan');
    const response = await axios.post(`${API_BASE_URL}/auth/login`, {
      email,
      password
    });
    
    const { token, user } = response.data.data;
    log(`✅ Login successful!`, 'green');
    log(`   User: ${user.username} (${user.role})`, 'blue');
    log(`   Company ID: ${user.company_id || 'NONE'}`, user.company_id ? 'green' : 'red');
    
    return { token, user };
  } catch (error) {
    log(`❌ Login failed: ${error.response?.data?.message || error.message}`, 'red');
    return null;
  }
}

async function testGetCandidates(token, username) {
  try {
    log(`\n📋 Testing get candidates for: ${username}`, 'cyan');
    const response = await axios.get(`${API_BASE_URL}/candidates`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const candidates = response.data.data;
    log(`✅ Success! Found ${candidates.length} candidates`, 'green');
    
    // Group by company_id
    const byCompany = {};
    candidates.forEach(c => {
      const cid = c.company_id || 'NULL';
      byCompany[cid] = (byCompany[cid] || 0) + 1;
    });
    
    log(`   Distribution by company:`, 'blue');
    Object.entries(byCompany).forEach(([cid, count]) => {
      log(`     - Company ${cid}: ${count} candidates`, 'yellow');
    });
    
    return candidates;
  } catch (error) {
    const errorData = error.response?.data;
    log(`❌ Failed: ${errorData?.message || error.message}`, 'red');
    if (errorData?.error_code) {
      log(`   Error code: ${errorData.error_code}`, 'yellow');
    }
    return null;
  }
}

async function runTests() {
  log('\n╔════════════════════════════════════════════════════════╗', 'cyan');
  log('║      KIỂM TRA PHÂN QUYỀN THEO CÔNG TY               ║', 'cyan');
  log('╚════════════════════════════════════════════════════════╝', 'cyan');
  
  // Test 1: Recruiter CS60 (company_id = 1)
  log('\n\n━━━ TEST 1: Recruiter CS60 (company_id = 1) ━━━', 'yellow');
  const cs60Recruiter = await testLogin('recruiter@cs60.com', '123456');
  if (cs60Recruiter) {
    const cs60Candidates = await testGetCandidates(cs60Recruiter.token, cs60Recruiter.user.username);
    
    if (cs60Candidates) {
      // Verify all are company_id = 1
      const wrongCompany = cs60Candidates.filter(c => c.company_id !== 1);
      if (wrongCompany.length > 0) {
        log(`\n⚠️  WARNING: Found ${wrongCompany.length} candidates from other companies!`, 'red');
        wrongCompany.forEach(c => {
          log(`   - ${c.first_name} ${c.last_name} (company_id=${c.company_id})`, 'red');
        });
      } else {
        log(`\n✅ CORRECT: All candidates belong to company_id = 1`, 'green');
      }
    }
  }
  
  // Test 2: Recruiter Digital (company_id = 3)
  log('\n\n━━━ TEST 2: Recruiter Digital (company_id = 3) ━━━', 'yellow');
  const digitalRecruiter = await testLogin('Digital@cs60.com', '123456');
  if (digitalRecruiter) {
    const digitalCandidates = await testGetCandidates(digitalRecruiter.token, digitalRecruiter.user.username);
    
    if (digitalCandidates) {
      // Verify all are company_id = 3
      const wrongCompany = digitalCandidates.filter(c => c.company_id !== 3);
      if (wrongCompany.length > 0) {
        log(`\n⚠️  WARNING: Found ${wrongCompany.length} candidates from other companies!`, 'red');
        wrongCompany.forEach(c => {
          log(`   - ${c.first_name} ${c.last_name} (company_id=${c.company_id})`, 'red');
        });
      } else {
        log(`\n✅ CORRECT: All candidates belong to company_id = 3`, 'green');
      }
    }
  }
  
  // Test 3: Check if CS60 and Digital see different data
  if (cs60Recruiter && digitalRecruiter) {
    log('\n\n━━━ TEST 3: Verify Data Isolation ━━━', 'yellow');
    
    const cs60Data = await testGetCandidates(cs60Recruiter.token, 'CS60');
    const digitalData = await testGetCandidates(digitalRecruiter.token, 'Digital');
    
    if (cs60Data && digitalData) {
      const cs60Ids = cs60Data.map(c => c.candidate_id).sort();
      const digitalIds = digitalData.map(c => c.candidate_id).sort();
      
      const overlap = cs60Ids.filter(id => digitalIds.includes(id));
      
      if (overlap.length > 0) {
        log(`\n❌ FAILED: Found ${overlap.length} overlapping candidates!`, 'red');
        log(`   This means data isolation is broken!`, 'red');
      } else {
        log(`\n✅ PASSED: No overlap - Data is properly isolated!`, 'green');
      }
    }
  }
  
  // Summary
  log('\n\n╔════════════════════════════════════════════════════════╗', 'cyan');
  log('║                    KẾT QUẢ KIỂM TRA                  ║', 'cyan');
  log('╚════════════════════════════════════════════════════════╝', 'cyan');
  log('\nNếu tất cả test đều ✅ PASSED/CORRECT, phân quyền đã hoạt động đúng!', 'green');
  log('Nếu có ⚠️ WARNING hoặc ❌ FAILED, cần kiểm tra lại code hoặc database.\n', 'yellow');
}

// Run tests
runTests().catch(error => {
  log(`\n💥 Fatal error: ${error.message}`, 'red');
  process.exit(1);
});
