/**
 * TEST AUTO ACCOUNT CREATION & EMAIL SYSTEM
 * 
 * Hệ thống tự động:
 * 1. Tạo tài khoản cho ứng viên khi nhà tuyển dụng phê duyệt CV
 * 2. Username = Email của ứng viên
 * 3. Mật khẩu random 10 ký tự (chữ hoa, chữ thường, số, ký tự đặc biệt)
 * 4. Gửi email thông báo kèm thông tin đăng nhập
 */

require('dotenv').config();
const accountService = require('./src/services/account.service');
const emailService = require('./src/services/email.service');

console.log('\n========================================');
console.log('  TEST AUTO ACCOUNT CREATION & EMAIL');
console.log('========================================\n');

// Test 1: Generate Random Password
console.log('📝 Test 1: Generate Random Password');
console.log('─────────────────────────────────────');
for (let i = 1; i <= 5; i++) {
  const password = accountService.generateRandomPassword();
  console.log(`   Password ${i}: ${password}`);
}

// Test 2: Generate Username from Email
console.log('\n📝 Test 2: Generate Username from Email');
console.log('─────────────────────────────────────');
const testEmails = [
  'nguyenvana@gmail.com',
  'tranthib@dtu.edu.vn',
  'admin@cs60.com'
];

async function testUsernameGeneration() {
  for (const email of testEmails) {
    const username = await accountService.generateUsername(email);
    console.log(`   Email: ${email}`);
    console.log(`   → Username: ${username}\n`);
  }
}

testUsernameGeneration().then(() => {
  console.log('========================================');
  console.log('✅ TEST COMPLETED');
  console.log('========================================');
  console.log('\n📋 CÁCH SỬ DỤNG:');
  console.log('─────────────────────────────────────');
  console.log('1. Nhà tuyển dụng xem danh sách ứng viên');
  console.log('2. Click "Phê duyệt" (HIRED/OFFERED) trên CV ứng viên');
  console.log('3. Hệ thống TỰ ĐỘNG:');
  console.log('   ✓ Tạo tài khoản với username = email ứng viên');
  console.log('   ✓ Tạo mật khẩu random 10 ký tự');
  console.log('   ✓ Gửi email chúc mừng kèm thông tin đăng nhập');
  console.log('4. Ứng viên nhận email và đăng nhập');
  console.log('\n📧 EMAIL MẪU:');
  console.log('─────────────────────────────────────');
  console.log('Subject: 🎉 Chúc mừng! CV của bạn đã được chấp nhận');
  console.log('Content:');
  console.log('  - Thông báo đậu CV');
  console.log('  - 👤 Tên đăng nhập: [email]');
  console.log('  - 🔑 Mật khẩu: [random 10 ký tự]');
  console.log('  - Link đăng nhập: http://localhost:3000/login');
  console.log('  - Hướng dẫn các bước tiếp theo');
  console.log('\n========================================\n');
});
