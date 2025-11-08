// Test account creation with fake candidate
const bcrypt = require('bcryptjs');
const emailService = require('./src/services/email.service');
const accountService = require('./src/services/account.service');

async function testAccountCreation() {
  console.log('\n========================================');
  console.log('  TEST TẠO TÀI KHOẢN - USERNAME = EMAIL');
  console.log('========================================\n');

  // Create fake candidate object
  const fakeCandidate = {
    candidate_id: 999,
    user_id: null,
    first_name: 'Test',
    last_name: 'User',
    email: 'testuser@example.com',
    update: async function(data) {
      console.log(`      📝 Mock update: user_id = ${data.user_id}`);
      this.user_id = data.user_id;
    }
  };

  console.log('[1/4] Thông tin candidate test:');
  console.log(`      Tên: ${fakeCandidate.first_name} ${fakeCandidate.last_name}`);
  console.log(`      Email: ${fakeCandidate.email}\n`);

  try {
    // Test generate username
    console.log('[2/4] Test generate username...');
    const username = await accountService.generateUsername(fakeCandidate.email);
    console.log(`      ✅ Username: ${username}`);
    console.log(`      👉 Username = Email: ${username === fakeCandidate.email ? '✅ ĐÚNG' : '❌ SAI'}\n`);

    // Test generate password
    console.log('[3/4] Test generate password...');
    const password = accountService.generateRandomPassword();
    console.log(`      ✅ Password: ${password}`);
    console.log(`      Độ dài: ${password.length} ký tự`);
    console.log(`      Có chữ hoa: ${/[A-Z]/.test(password) ? '✅' : '❌'}`);
    console.log(`      Có chữ thường: ${/[a-z]/.test(password) ? '✅' : '❌'}`);
    console.log(`      Có số: ${/[0-9]/.test(password) ? '✅' : '❌'}`);
    console.log(`      Có ký tự đặc biệt: ${/[@#$%]/.test(password) ? '✅' : '❌'}\n`);

    // Test email template
    console.log('[4/4] Test gửi email với username = email...');
    const candidateName = `${fakeCandidate.first_name} ${fakeCandidate.last_name}`;
    
    await emailService.sendApprovalEmail(
      'vothihavy792004@gmail.com', // Send to real email for testing
      candidateName,
      username, // username = email
      password
    );
    
    console.log(`      ✅ Email đã gửi!\n`);

    console.log('========================================');
    console.log('  ✅ TEST HOÀN TẤT!');
    console.log('========================================');
    console.log(`📧 Email: vothihavy792004@gmail.com`);
    console.log(`👤 Username: ${username}`);
    console.log(`🔑 Password: ${password}`);
    console.log('========================================');
    console.log('\n💡 Kiểm tra email để xem thông tin đăng nhập!\n');

  } catch (error) {
    console.error('\n❌ LỖI:', error.message);
    console.error(error);
  }

  process.exit(0);
}

testAccountCreation();
