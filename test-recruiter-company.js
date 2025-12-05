// Test recruiter company filtering
const mysql = require('mysql2/promise');

async function testRecruiterCompany() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: 'rootpassword',
    database: 'cs60_recruitment'
  });

  console.log('🔍 Testing Recruiter Company Filtering\n');

  // Get all recruiters
  const [recruiters] = await connection.execute(`
    SELECT u.user_id, u.username, u.email, u.company_id, c.companyName
    FROM users u
    JOIN roles r ON u.role_id = r.role_id
    LEFT JOIN companies c ON u.company_id = c.company_id
    WHERE r.role_name = 'RECRUITER'
    ORDER BY u.company_id, u.user_id
  `);

  console.log('📋 All Recruiters:');
  console.log('==================');
  recruiters.forEach(r => {
    console.log(`ID: ${r.user_id} | ${r.username} | Company: ${r.companyName} (ID: ${r.company_id})`);
  });

  console.log('\n📊 Candidates by Company:');
  console.log('=========================');
  
  // Get candidates grouped by company
  const [companies] = await connection.execute(`
    SELECT company_id, companyName FROM companies ORDER BY company_id
  `);

  for (const company of companies) {
    const [candidates] = await connection.execute(`
      SELECT c.candidate_id, c.first_name, c.last_name, c.email, c.company_id
      FROM candidates c
      WHERE c.company_id = ?
      ORDER BY c.candidate_id
    `, [company.company_id]);

    console.log(`\n🏢 ${company.companyName} (ID: ${company.company_id})`);
    console.log(`   Candidates: ${candidates.length}`);
    if (candidates.length > 0) {
      candidates.forEach(c => {
        console.log(`   - ID: ${c.candidate_id} | ${c.first_name} ${c.last_name} | ${c.email}`);
      });
    }
  }

  await connection.end();
}

testRecruiterCompany().catch(console.error);
