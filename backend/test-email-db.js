// Test email with database integration
const emailService = require('./src/services/email.service');
const accountService = require('./src/services/account.service');
const { Candidate, User } = require('./src/models');

async function testEmailWithDB() {
  console.log('\n========================================');
  console.log('  TEST EMAIL WITH DATABASE');
  console.log('========================================\n');

  try {
    // Find candidate #6
    console.log('[1/4] Finding candidate #6...');
    const candidate = await Candidate.findByPk(6);
    
    if (!candidate) {
      console.error('❌ Candidate #6 not found!');
      return;
    }

    console.log(`      ✅ Found: ${candidate.first_name} ${candidate.last_name}`);
    console.log(`      Email: ${candidate.email}`);
    console.log(`      Current status: ${candidate.status}\n`);

    // Test PASS email
    console.log('[2/4] Testing PASS email (approval)...');
    const candidateName = `${candidate.first_name} ${candidate.last_name}`;
    
    // Check if account exists
    console.log('[3/4] Checking account...');
    const accountInfo = await accountService.createCandidateAccount(candidate);
    
    if (accountInfo) {
      console.log(`      ✅ Account created!`);
      console.log(`      Username: ${accountInfo.username}`);
      console.log(`      Password: ${accountInfo.password}\n`);
      
      // Send approval email
      console.log('[4/4] Sending approval email...');
      await emailService.sendApprovalEmail(
        candidate.email,
        candidateName,
        accountInfo.username,
        accountInfo.password
      );
      console.log(`      ✅ Email sent to: ${candidate.email}\n`);
    } else {
      console.log(`      ℹ️  Account already exists\n`);
      
      // Send email without credentials
      console.log('[4/4] Sending approval email (no new account)...');
      await emailService.sendApprovalEmail(
        candidate.email,
        candidateName,
        'Đã có sẵn',
        'Vui lòng dùng mật khẩu hiện tại'
      );
      console.log(`      ✅ Email sent to: ${candidate.email}\n`);
    }

    console.log('========================================');
    console.log('  ✅ TEST COMPLETED!');
    console.log(`  Check email: ${candidate.email}`);
    console.log('========================================\n');

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error(error);
  }

  process.exit(0);
}

testEmailWithDB();
