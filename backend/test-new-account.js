// Test creating new account for candidate
const emailService = require('./src/services/email.service');
const accountService = require('./src/services/account.service');
const { Candidate } = require('./src/models');

async function testNewAccount() {
  console.log('\n========================================');
  console.log('  TEST TẠO TÀI KHOẢN MỚI + GỬI EMAIL');
  console.log('========================================\n');

  try {
    // Find candidate #8
    console.log('[1/5] Tìm candidate #8...');
    const candidate = await Candidate.findByPk(8);
    
    if (!candidate) {
      console.error('❌ Không tìm thấy candidate #8!');
      return;
    }

    console.log(`      ✅ Tìm thấy: ${candidate.first_name} ${candidate.last_name}`);
    console.log(`      Email: ${candidate.email}`);
    console.log(`      User ID hiện tại: ${candidate.user_id || 'chưa có'}\n`);

    // Clear user_id for testing (to force create new account)
    if (candidate.user_id) {
      console.log('[2/5] Xóa user_id cũ để test tạo tài khoản mới...');
      await candidate.update({ user_id: null });
      console.log('      ✅ Đã xóa user_id\n');
    } else {
      console.log('[2/5] Candidate chưa có user_id (tốt cho test)\n');
    }

    // Create account
    console.log('[3/5] Tạo tài khoản mới...');
    const accountInfo = await accountService.createCandidateAccount(candidate);
    
    if (!accountInfo) {
      console.error('      ❌ Không tạo được tài khoản (có thể đã tồn tại)');
      return;
    }

    console.log(`      ✅ Tài khoản đã tạo!`);
    console.log(`      User ID: ${accountInfo.user_id}`);
    console.log(`      Username (Email): ${accountInfo.username}`);
    console.log(`      Password: ${accountInfo.password}\n`);

    // Send email
    console.log('[4/5] Gửi email với thông tin tài khoản...');
    const candidateName = `${candidate.first_name} ${candidate.last_name}`;
    
    await emailService.sendApprovalEmail(
      candidate.email,
      candidateName,
      accountInfo.username,
      accountInfo.password
    );
    
    console.log(`      ✅ Email đã gửi đến: ${candidate.email}\n`);

    console.log('[5/5] THÔNG TIN TÀI KHOẢN ĐÃ TẠO:');
    console.log('========================================');
    console.log(`📧 Email: ${candidate.email}`);
    console.log(`👤 Username: ${accountInfo.username}`);
    console.log(`🔑 Password: ${accountInfo.password}`);
    console.log('========================================');
    console.log(`\n✅ HOÀN TẤT! Kiểm tra email: ${candidate.email}\n`);

  } catch (error) {
    console.error('\n❌ LỖI:', error.message);
    console.error(error);
  }

  process.exit(0);
}

testNewAccount();
