const mysql = require('mysql2/promise');

const jobs = [
  {
    company: "Trung tâm Công nghệ Phần mềm (Đại học Duy Tân)",
    position: "Chuyên Viên Quản Lý Hạ Tầng CNTT (System Admin)",
    location: "Tầng 16 - 03 Quang Trung, Hải Châu I, Hải Châu, Đà Nẵng",
    department: "it"
  },
  {
    company: "Công ty Cổ phần Thực phẩm Đông Lạnh Kido",
    position: "Nhân viên Bán hàng Kênh GT (Dầu Tường An)",
    location: "Đà Nẵng, Hà Nội, Hải Phòng, Quảng Trị, Thanh Hóa",
    department: "marketing"
  },
  {
    company: "Công Ty TNHH SupremeTech",
    position: "Trưởng Nhóm Kỹ Thuật - Technical Leader",
    location: "Đà Nẵng",
    department: "it"
  },
  {
    company: "Công ty Cổ phần Regal Group",
    position: "Trường Phòng Kinh Doanh",
    location: "Đà Nẵng, Hà Nội",
    department: "finance"
  },
  {
    company: "Công ty TNHH Tích hợp hệ thống NHT",
    position: "Kỹ Sư Thiết Kế Điện - Điện Nhẹ",
    location: "An Giang, Đà Nẵng",
    department: "construction"
  },
  {
    company: "CodeComplete Solutions",
    position: "Scrum Master",
    location: "Đà Nẵng",
    department: "it"
  },
  {
    company: "Công ty TNHH Tích hợp hệ thống NHT",
    position: "Cán Bộ Hồ Sơ/ Thanh Quyết Toán Dự Án",
    location: "An Giang, Đà Nẵng, Hồ Chí Minh",
    department: "construction"
  },
  {
    company: "Công ty Cổ phần Regal Group",
    position: "Chuyên Viên Graphic Designer",
    location: "Đà Nẵng",
    department: "marketing"
  },
  {
    company: "Công Ty TNHH SupremeTech",
    position: "Quản Lý Dự Án - Project Manager",
    location: "Đà Nẵng",
    department: "it"
  }
];

async function seedJobs() {
  let connection;
  
  try {
    // Kết nối database
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'cs60user',
      password: 'cs60password',
      database: 'cs60_recruitment'
    });

    console.log('✅ Kết nối database thành công');

    // Thêm cột location và job_type nếu chưa có
    try {
      await connection.execute(`
        ALTER TABLE job_positions 
        ADD COLUMN IF NOT EXISTS location VARCHAR(255) DEFAULT NULL,
        ADD COLUMN IF NOT EXISTS job_type VARCHAR(50) DEFAULT 'Full-time'
      `);
      console.log('✅ Đã thêm cột location và job_type');
    } catch (error) {
      console.log('ℹ️ Cột location và job_type đã tồn tại');
    }

    // Xóa dữ liệu cũ (trừ position_id = 1, 2, 3)
    await connection.execute('DELETE FROM job_positions WHERE position_id > 3');
    console.log('🗑️ Đã xóa dữ liệu cũ');

    // Insert từng công việc
    let count = 0;
    for (const job of jobs) {
      const sql = `
        INSERT INTO job_positions 
        (title, department, description, requirements, location, job_type, deadline, is_active, created_by, company_id) 
        VALUES (?, ?, ?, ?, ?, 'Full-time', DATE_ADD(NOW(), INTERVAL 30 DAY), TRUE, 26, 1)
      `;
      
      await connection.execute(sql, [
        job.position,
        job.department,
        `Tuyển dụng vị trí ${job.position} tại ${job.company}. Nơi làm việc: ${job.location}`,
        `Địa điểm: ${job.location}`,
        job.location
      ]);
      
      count++;
      console.log(`✅ Đã thêm: ${job.position} - Ngành: ${job.department} - ${job.location}`);
    }

    console.log(`\n🎉 Hoàn thành! Đã thêm ${count} việc làm vào database`);

  } catch (error) {
    console.error('❌ Lỗi:', error.message);
    console.error(error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('✅ Đã đóng kết nối database');
    }
  }
}

// Chạy script
seedJobs();
