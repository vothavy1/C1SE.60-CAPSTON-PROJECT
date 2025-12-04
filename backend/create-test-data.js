const mysql = require('mysql2/promise');

async function createTestData() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'capstone_project'
    });
    
    // Insert test recruiters for December 2025
    const today = new Date();
    const currentDay = today.getDate();
    
    console.log('Creating test data for December 2025...');
    
    // Add some test recruiters for recent days
    for (let i = 1; i <= Math.min(currentDay, 10); i++) {
      const testDate = new Date(2025, 11, i); // December 2025
      const count = Math.floor(Math.random() * 3) + 1; // 1-3 recruiters per day
      
      for (let j = 0; j < count; j++) {
        await connection.execute(
          'INSERT INTO users (username, email, password, role, created_at) VALUES (?, ?, ?, ?, ?)',
          [
            `test_recruiter_${i}_${j}`,
            `recruiter${i}${j}@test.com`,
            'hashed_password',
            'recruiter',
            testDate
          ]
        );
      }
      console.log(`Added ${count} recruiters for day ${i}`);
    }
    
    // Add some test candidates
    for (let i = 1; i <= Math.min(currentDay, 8); i++) {
      const testDate = new Date(2025, 11, i); // December 2025
      const count = Math.floor(Math.random() * 5) + 2; // 2-6 candidates per day
      
      for (let j = 0; j < count; j++) {
        await connection.execute(
          'INSERT INTO candidates (name, email, phone, created_at) VALUES (?, ?, ?, ?)',
          [
            `Test Candidate ${i}_${j}`,
            `candidate${i}${j}@test.com`,
            `0909${i}${j}${i}${j}${i}${j}`,
            testDate
          ]
        );
      }
      console.log(`Added ${count} candidates for day ${i}`);
    }
    
    console.log('Test data created successfully!');
    await connection.end();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

createTestData();