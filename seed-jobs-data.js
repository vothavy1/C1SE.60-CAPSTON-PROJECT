const mysql = require('mysql2/promise');

async function seedRealJobs() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '123456',
    database: 'cs60'
  });

  try {
    console.log('🔄 Đang thêm dữ liệu công ty và việc làm thực tế...\n');

    // Insert companies
    const companies = [
      {
        companyName: 'Trung tâm Công nghệ Phần mềm (Đại học Duy Tân)',
        companyCode: 'DTU_CNPM',
        address: 'Tầng 16 - 03 Quang Trung, Hải Châu I, Hải Châu, Đà Nẵng',
        email: 'hr@duytan.edu.vn',
        phone: '0236.3650403'
      },
      {
        companyName: 'Công ty Cổ phần Thực phẩm Đông Lạnh Kido',
        companyCode: 'KIDO',
        address: 'Đà Nẵng',
        email: 'hr@kido.com.vn',
        phone: '0236.3888888'
      },
      {
        companyName: 'Công Ty TNHH SupremeTech',
        companyCode: 'SUPREMETECH',
        address: 'Đà Nẵng',
        email: 'careers@supremetech.vn',
        phone: '0236.3999999'
      },
      {
        companyName: 'Công ty Cổ phần Regal Group',
        companyCode: 'REGAL',
        address: 'Đà Nẵng',
        email: 'hr@regalgroup.vn',
        phone: '0236.3777777'
      },
      {
        companyName: 'Công ty TNHH Tích hợp hệ thống NHT',
        companyCode: 'NHT',
        address: 'Đà Nẵng',
        email: 'hr@nht.com.vn',
        phone: '0236.3666666'
      },
      {
        companyName: 'CodeComplete Solutions',
        companyCode: 'CODECOMPLETE',
        address: 'Đà Nẵng',
        email: 'jobs@codecomplete.vn',
        phone: '0236.3555555'
      }
    ];

    // Insert companies and get IDs
    const companyIds = {};
    for (const company of companies) {
      const [existing] = await connection.query(
        'SELECT company_id FROM companies WHERE companyCode = ?',
        [company.companyCode]
      );

      if (existing.length > 0) {
        companyIds[company.companyCode] = existing[0].company_id;
        console.log(`✓ Công ty đã tồn tại: ${company.companyName}`);
      } else {
        const [result] = await connection.query(
          'INSERT INTO companies (companyName, companyCode, address, email, phone) VALUES (?, ?, ?, ?, ?)',
          [company.companyName, company.companyCode, company.address, company.email, company.phone]
        );
        companyIds[company.companyCode] = result.insertId;
        console.log(`✓ Đã thêm công ty: ${company.companyName}`);
      }
    }

    // Insert job positions
    const jobs = [
      {
        company: 'DTU_CNPM',
        title: 'Chuyên Viên Quản Lý Hạ Tầng CNTT (System Admin)',
        department: 'IT',
        description: `Quản lý và vận hành hệ thống máy chủ, mạng LAN/WAN. Cài đặt, cấu hình và bảo trì hệ thống Windows Server, Linux. Quản lý hệ thống VMware, backup/restore dữ liệu. Giám sát và xử lý sự cố hệ thống 24/7.`,
        requirements: `Yêu cầu: Tốt nghiệp Đại học CNTT, kinh nghiệm 2-3 năm System Admin. Thành thạo Windows Server, Linux. Có kinh nghiệm VMware, Active Directory. Lương: 12-18 triệu.`
      },
      {
        company: 'KIDO',
        title: 'Nhân viên Bán hàng Kênh GT (Dầu Tường An)',
        department: 'Sales',
        description: `Chăm sóc và phát triển hệ thống siêu thị, cửa hàng. Thực hiện kế hoạch bán hàng, đạt chỉ tiêu doanh số. Triển khai chương trình khuyến mãi tại điểm bán.`,
        requirements: `Yêu cầu: Cao đẳng trở lên, kinh nghiệm 1-2 năm bán hàng FMCG. Có xe máy. Năng động, chịu áp lực. Lương cơ bản + Thưởng doanh số.`
      },
      {
        company: 'SUPREMETECH',
        title: 'Trưởng Nhóm Kỹ Thuật - Technical Leader',
        department: 'Engineering',
        description: `Lead team 5-8 developers phát triển dự án web/mobile. Review code, thiết kế kiến trúc hệ thống. Tư vấn giải pháp kỹ thuật. Mentoring junior developers.`,
        requirements: `Yêu cầu: Kinh nghiệm 5+ năm lập trình, 2+ năm Lead. Thành thạo Node.js/Java. Hiểu Microservices, Cloud. Tiếng Anh tốt. Lương: 25-40 triệu.`
      },
      {
        company: 'REGAL',
        title: 'Trưởng Phòng Kinh Doanh',
        department: 'Business Development',
        description: `Xây dựng chiến lược kinh doanh. Quản lý đội sales 10-15 người. Thiết lập mối quan hệ khách hàng lớn. Đàm phán hợp đồng.`,
        requirements: `Yêu cầu: Kinh nghiệm 5+ năm, trong đó 2+ năm quản lý. Kỹ năng leadership, đàm phán xuất sắc. Lương: 20-35 triệu + thưởng.`
      },
      {
        company: 'NHT',
        title: 'Kỹ Sư Thiết Kế Điện - Điện Nhẹ',
        department: 'Engineering',
        description: `Thiết kế hệ thống điện nhẹ cho công trình. Thiết kế báo cháy, camera, kiểm soát ra vào. Lập dự toán, giám sát thi công.`,
        requirements: `Yêu cầu: Đại học Điện - Điện tử. Kinh nghiệm 2+ năm. Thành thạo AutoCAD, Revit MEP. Lương: 12-20 triệu.`
      },
      {
        company: 'CODECOMPLETE',
        title: 'Scrum Master',
        department: 'PMO',
        description: `Hướng dẫn team áp dụng Scrum framework. Tổ chức Scrum ceremonies. Loại bỏ blockers. Coaching team về Agile mindset.`,
        requirements: `Yêu cầu: Kinh nghiệm 2+ năm Scrum Master. Có chứng chỉ CSM/PSM. Kỹ năng facilitation tốt. Tiếng Anh tốt. Lương: 15-25 triệu.`
      },
      {
        company: 'NHT',
        title: 'Cán Bộ Hồ Sơ/ Thanh Quyết Toán Dự Án',
        department: 'Project Management',
        description: `Lập hồ sơ thanh toán, quyết toán dự án. Kiểm tra khối lượng thi công. Đối chiếu với thiết kế và hợp đồng. Làm việc với chủ đầu tư.`,
        requirements: `Yêu cầu: Đại học Xây dựng/Kinh tế. Kinh nghiệm 1-2 năm. Thành thạo Excel, phần mềm dự toán. Cẩn thận, tỉ mỉ. Lương: 10-15 triệu.`
      },
      {
        company: 'REGAL',
        title: 'Chuyên Viên Graphic Designer',
        department: 'Design',
        description: `Thiết kế ấn phẩm quảng cáo: poster, brochure, banner. Design content cho social media. Thiết kế bao bì sản phẩm. Chỉnh sửa hình ảnh, video.`,
        requirements: `Yêu cầu: Thiết kế Đồ họa. Kinh nghiệm 1-2 năm. Thành thạo Photoshop, Illustrator. Portfolio đẹp. Lương: 8-15 triệu.`
      },
      {
        company: 'SUPREMETECH',
        title: 'Quản Lý Dự Án - Project Manager',
        department: 'PMO',
        description: `Quản lý dự án phần mềm outsourcing. Lập kế hoạch, phân bổ nguồn lực. Theo dõi tiến độ, chất lượng. Giao tiếp với khách hàng nước ngoài.`,
        requirements: `Yêu cầu: Kinh nghiệm 3+ năm PM. Hiểu SDLC, Agile/Scrum. Tiếng Anh tốt (TOEIC 700+). Kỹ năng leadership xuất sắc. Lương: 20-35 triệu.`
      }
    ];

    // Insert jobs
    let successCount = 0;
    for (const job of jobs) {
      const companyId = companyIds[job.company];
      
      const [existing] = await connection.query(
        'SELECT position_id FROM job_positions WHERE title = ? AND company_id = ?',
        [job.title, companyId]
      );

      if (existing.length === 0) {
        await connection.query(
          'INSERT INTO job_positions (title, department, description, requirements, is_active, created_by, company_id) VALUES (?, ?, ?, ?, TRUE, 26, ?)',
          [job.title, job.department, job.description, job.requirements, companyId]
        );
        successCount++;
        console.log(`✓ Đã thêm: ${job.title}`);
      } else {
        console.log(`⚠ Đã tồn tại: ${job.title}`);
      }
    }

    console.log(`\n✅ Hoàn thành! Đã thêm ${successCount} việc làm mới.`);

  } catch (error) {
    console.error('❌ Lỗi:', error.message);
  } finally {
    await connection.end();
  }
}

seedRealJobs();
