// Direct SMTP Test - No database needed
const nodemailer = require('nodemailer');

async function testSMTP() {
  console.log('========================================');
  console.log('  TESTING SMTP CONNECTION DIRECTLY');
  console.log('========================================\n');

  // Create transporter
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: 'vothavy1@dtu.edu.vn',
      pass: 'usljngpjzywrrkzj'
    }
  });

  try {
    // Test 1: Verify connection
    console.log('[1/3] Testing SMTP connection...');
    await transporter.verify();
    console.log('      ✅ SMTP connection successful!\n');

    // Test 2: Send test email
    console.log('[2/3] Sending test email...');
    const info = await transporter.sendMail({
      from: '"CS60 Recruitment" <vothavy1@dtu.edu.vn>',
      to: 'vothihavy792004@gmail.com',
      subject: 'TEST EMAIL - CS60 System',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f4f4f4;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px;">
            <h2 style="color: #4CAF50;">🎉 Test Email from CS60</h2>
            <p>Đây là email test để kiểm tra hệ thống gửi email tự động.</p>
            <p>Nếu bạn nhận được email này, có nghĩa là hệ thống <strong>SMTP đang hoạt động tốt</strong>!</p>
            <hr style="margin: 20px 0;">
            <p style="color: #666; font-size: 12px;">
              Thời gian gửi: ${new Date().toLocaleString('vi-VN')}
            </p>
          </div>
        </div>
      `
    });

    console.log('      ✅ Email sent successfully!');
    console.log('      Message ID:', info.messageId);
    console.log('      Response:', info.response);
    console.log('\n[3/3] Check inbox: vothihavy792004@gmail.com');
    console.log('\n========================================');
    console.log('  ✅ SMTP TEST PASSED!');
    console.log('  Hệ thống email hoạt động tốt.');
    console.log('========================================');

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error('Full error:', error);
    console.log('\n========================================');
    console.log('  ❌ SMTP TEST FAILED!');
    console.log('========================================');
  }
}

testSMTP();
