// Test script to verify recruitment_reports table and API
const sequelize = require('./src/config/database');
const { RecruitmentReport, User } = require('./src/models');

async function testReportSystem() {
  try {
    console.log('\n=== TESTING REPORT SYSTEM ===\n');

    // 1. Test database connection
    console.log('1️⃣ Testing database connection...');
    await sequelize.authenticate();
    console.log('✅ Database connected successfully\n');

    // 2. Check recruitment_reports table structure
    console.log('2️⃣ Checking recruitment_reports table...');
    const [results] = await sequelize.query('DESCRIBE recruitment_reports');
    console.log('✅ Table structure:');
    console.table(results);

    // 3. Count total reports
    console.log('\n3️⃣ Counting reports in database...');
    const totalCount = await RecruitmentReport.count();
    console.log(`✅ Total reports: ${totalCount}\n`);

    // 4. Get sample reports
    console.log('4️⃣ Fetching sample reports (limit 5)...');
    const sampleReports = await RecruitmentReport.findAll({
      limit: 5,
      include: [
        {
          model: User,
          as: 'Creator',
          attributes: ['user_id', 'username', 'full_name']
        }
      ],
      order: [['created_at', 'DESC']]
    });

    console.log(`✅ Found ${sampleReports.length} reports:`);
    sampleReports.forEach(report => {
      console.log(`   - ID: ${report.report_id}, Type: ${report.report_type}, Name: ${report.report_name}`);
      console.log(`     Creator: ${report.Creator?.full_name || 'System'}, Created: ${report.created_at}`);
    });

    // 5. Count by report type
    console.log('\n5️⃣ Reports by type:');
    const [typeResults] = await sequelize.query(`
      SELECT report_type, COUNT(*) as count 
      FROM recruitment_reports 
      GROUP BY report_type
      ORDER BY count DESC
    `);
    console.table(typeResults);

    console.log('\n✅ ALL TESTS PASSED!\n');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error(error);
    process.exit(1);
  }
}

testReportSystem();
