const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

// Create transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD
  },
  tls: {
    rejectUnauthorized: false
  }
});

// Verify transporter connection
transporter.verify(function (error, success) {
  if (error) {
    logger.error('Email transporter verification failed:', error);
  } else {
    logger.info('✅ Email server is ready to send messages');
  }
});

/**
 * Send email when candidate is APPROVED/HIRED (PASS)
 * Includes login credentials
 */
const sendApprovalEmail = async (candidateEmail, candidateName, username, password) => {
  try {
    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: candidateEmail,
      subject: '🎉 Chúc mừng! CV của bạn đã được chấp nhận',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; }
            .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
            .content { background-color: white; padding: 30px; border-radius: 0 0 5px 5px; }
            .credentials { background-color: #f0f8ff; padding: 15px; border-left: 4px solid #4CAF50; margin: 20px 0; }
            .credential-item { margin: 10px 0; }
            .credential-label { font-weight: bold; color: #555; }
            .credential-value { color: #000; font-family: 'Courier New', monospace; background: #fff; padding: 5px 10px; border: 1px solid #ddd; display: inline-block; margin-left: 10px; }
            .button { display: inline-block; padding: 12px 30px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
            .footer { text-align: center; margin-top: 20px; color: #777; font-size: 12px; }
            .warning { color: #ff6b6b; font-size: 14px; margin-top: 15px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Chúc mừng bạn đã đậu CV!</h1>
            </div>
            <div class="content">
              <p>Xin chào <strong>${candidateName}</strong>,</p>
              
              <p>Chúng tôi rất vui mừng thông báo rằng <strong>CV của bạn đã được chấp nhận</strong> và bạn đã vượt qua vòng screening đầu tiên!</p>
              
              <p>Chúng tôi đã tạo một tài khoản cho bạn để bạn có thể truy cập hệ thống tuyển dụng và thực hiện các bài test đánh giá năng lực.</p>
              
              <div class="credentials">
                <h3 style="margin-top: 0; color: #4CAF50;">🔐 Thông tin đăng nhập của bạn:</h3>
                <div class="credential-item">
                  <span class="credential-label">👤 Tên đăng nhập:</span>
                  <span class="credential-value">${username}</span>
                </div>
                <div class="credential-item">
                  <span class="credential-label">🔑 Mật khẩu:</span>
                  <span class="credential-value">${password}</span>
                </div>
                <p class="warning">⚠️ Vui lòng đổi mật khẩu ngay sau khi đăng nhập lần đầu để bảo mật tài khoản!</p>
              </div>
              
              <p><strong>Các bước tiếp theo:</strong></p>
              <ol>
                <li>Đăng nhập vào hệ thống bằng thông tin trên</li>
                <li>Hoàn thiện hồ sơ cá nhân của bạn</li>
                <li>Làm các bài test đánh giá năng lực (nếu có)</li>
                <li>Chờ thông báo về các vòng phỏng vấn tiếp theo</li>
              </ol>
              
              <div style="text-align: center;">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/login" class="button">
                  Đăng nhập ngay
                </a>
              </div>
              
              <p style="margin-top: 30px;">Nếu bạn có bất kỳ câu hỏi nào, vui lòng liên hệ với chúng tôi qua email này hoặc số điện thoại hỗ trợ.</p>
              
              <p>Chúc bạn thành công!</p>
              <p><strong>Phòng Nhân Sự</strong><br>
              CS.60 Recruitment System</p>
            </div>
            <div class="footer">
              <p>Email này được gửi tự động từ hệ thống tuyển dụng CS.60</p>
              <p>Vui lòng không trả lời email này</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    logger.info(`✅ Approval email sent to ${candidateEmail} - MessageID: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    logger.error(`❌ Failed to send approval email to ${candidateEmail}:`, error);
    throw error;
  }
};

/**
 * Send email when candidate is REJECTED (FAIL)
 */
const sendRejectionEmail = async (candidateEmail, candidateName, position = '') => {
  try {
    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: candidateEmail,
      subject: 'Thông báo về đơn ứng tuyển của bạn',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; }
            .header { background-color: #ff6b6b; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
            .content { background-color: white; padding: 30px; border-radius: 0 0 5px 5px; }
            .footer { text-align: center; margin-top: 20px; color: #777; font-size: 12px; }
            .message-box { background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Thông báo về đơn ứng tuyển</h1>
            </div>
            <div class="content">
              <p>Xin chào <strong>${candidateName}</strong>,</p>
              
              <p>Cảm ơn bạn đã quan tâm và gửi CV ứng tuyển ${position ? `vị trí <strong>${position}</strong>` : ''} tại công ty chúng tôi.</p>
              
              <div class="message-box">
                <p>Sau khi xem xét kỹ lưỡng, chúng tôi rất tiếc phải thông báo rằng <strong>hồ sơ của bạn chưa đáp ứng được yêu cầu</strong> cho vị trí này tại thời điểm hiện tại.</p>
              </div>
              
              <p>Quyết định này không có nghĩa là bạn không đủ năng lực. Có thể do:</p>
              <ul>
                <li>Yêu cầu công việc hiện tại khác với kinh nghiệm của bạn</li>
                <li>Vị trí này cần những kỹ năng chuyên môn cụ thể</li>
                <li>Chúng tôi nhận được nhiều ứng viên xuất sắc và phải lựa chọn phù hợp nhất</li>
              </ul>
              
              <p>Chúng tôi khuyến khích bạn:</p>
              <ul>
                <li>Tiếp tục theo dõi các cơ hội tuyển dụng khác tại công ty</li>
                <li>Cập nhật kỹ năng và kinh nghiệm của bạn</li>
                <li>Ứng tuyển lại trong tương lai khi có vị trí phù hợp hơn</li>
              </ul>
              
              <p style="margin-top: 30px;">Chúng tôi chân thành cảm ơn bạn đã dành thời gian ứng tuyển và chúc bạn thành công trong sự nghiệp!</p>
              
              <p><strong>Phòng Nhân Sự</strong><br>
              CS.60 Recruitment System</p>
            </div>
            <div class="footer">
              <p>Email này được gửi tự động từ hệ thống tuyển dụng CS.60</p>
              <p>Vui lòng không trả lời email này</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    logger.info(`✅ Rejection email sent to ${candidateEmail} - MessageID: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    logger.error(`❌ Failed to send rejection email to ${candidateEmail}:`, error);
    throw error;
  }
};

/**
 * Send general notification email
 */
const sendNotificationEmail = async (to, subject, htmlContent) => {
  try {
    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: to,
      subject: subject,
      html: htmlContent
    };

    const info = await transporter.sendMail(mailOptions);
    logger.info(`✅ Notification email sent to ${to} - MessageID: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    logger.error(`❌ Failed to send notification email to ${to}:`, error);
    throw error;
  }
};

module.exports = {
  sendApprovalEmail,
  sendRejectionEmail,
  sendNotificationEmail,
  transporter
};
