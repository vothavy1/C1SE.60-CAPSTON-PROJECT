const { 
  CandidateTest, 
  Test, 
  Candidate, 
  Company,
  CandidateTestResult,
  CandidateTestAnswer,
  Question,
  User,
  TestFraudLog,
  RecruitmentReport,
  Interview,
  InterviewFeedback,
  CandidateJobApplication
} = require('../models');
const logger = require('../utils/logger');
const { Op } = require('sequelize');
const sequelize = require('../config/database');
const fs = require('fs').promises;
const path = require('path');

// Directory for storing logs
const REPORTS_DIR = path.join(__dirname, '../../reports');

// Ensure reports directory exists
async function ensureReportsDir() {
  try {
    await fs.mkdir(REPORTS_DIR, { recursive: true });
  } catch (error) {
    console.error('Error creating reports directory:', error);
  }
}

// ===== 1. VIOLATION REPORTS =====
exports.reportViolation = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { candidate_test_id, violation_type, description, event_count } = req.body;
    const userId = req.user.userId || req.user.user_id;

    if (!candidate_test_id || !violation_type) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'candidate_test_id and violation_type are required'
      });
    }

    // Validate violation_type
    const validTypes = ['TAB_SWITCH', 'COPY_PASTE', 'MULTIPLE_WINDOWS', 'SCREENSHOT', 'OTHER'];
    if (!validTypes.includes(violation_type)) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: `Invalid violation_type. Must be one of: ${validTypes.join(', ')}`
      });
    }

    // Find candidate test
    const candidateTest = await CandidateTest.findByPk(candidate_test_id, {
      include: [
        { model: Test, attributes: ['test_id', 'test_name'] },
        { model: Candidate, attributes: ['candidate_id', 'first_name', 'last_name', 'email'] }
      ],
      transaction
    });

    if (!candidateTest) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Candidate test not found'
      });
    }

    // Save violation to test_fraud_logs table
    const fraudLog = await TestFraudLog.create({
      candidate_test_id,
      event_type: violation_type,
      event_count: event_count || 1,
      event_time: new Date(),
      details: description || ''
    }, { transaction });

    logger.info(`Violation reported for test ${candidate_test_id}: ${violation_type}`);

    // Also create a recruitment report entry for tracking
    await RecruitmentReport.create({
      report_name: `Violation - ${violation_type}`,
      report_type: 'VIOLATION',
      parameters: JSON.stringify({
        candidate_test_id,
        test_id: candidateTest.Test?.test_id,
        test_name: candidateTest.Test?.test_name,
        candidate_id: candidateTest.Candidate?.candidate_id,
        candidate_name: `${candidateTest.Candidate?.first_name} ${candidateTest.Candidate?.last_name}`,
        candidate_email: candidateTest.Candidate?.email,
        violation_type,
        description: description || '',
        event_count: event_count || 1
      }),
      created_by: userId
    }, { transaction });

    await transaction.commit();

    return res.status(200).json({
      success: true,
      message: 'Violation reported successfully',
      data: {
        log_id: fraudLog.log_id,
        candidate_test_id,
        test_name: candidateTest.Test?.test_name,
        candidate_name: `${candidateTest.Candidate?.first_name} ${candidateTest.Candidate?.last_name}`,
        candidate_email: candidateTest.Candidate?.email,
        violation_type,
        description: description || '',
        event_count: event_count || 1,
        reported_at: fraudLog.event_time
      }
    });

  } catch (error) {
    await transaction.rollback();
    logger.error(`Error reporting violation: ${error.message}`);
    console.error('Error reporting violation:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to report violation',
      error: error.message
    });
  }
};

// Get all violations (Admin only) - NOW SHOWS ALL TESTS
exports.getViolations = async (req, res) => {
  try {
    const { violationType, candidateTestId, startDate, endDate } = req.query;
    
    console.log('📊 Fetching ALL candidate tests with violations info...');
    console.log('🔍 Filters:', { violationType, candidateTestId, startDate, endDate });
    
    // 🔒 COMPANY FILTER - Recruiter chỉ xem báo cáo của công ty mình
    const userRole = req.user?.Role?.role_name?.toUpperCase() || req.user?.role?.toUpperCase();
    console.log(`👤 User: ${req.user?.username}, Role: ${userRole}, Company ID: ${req.user?.company_id}`);
    
    // Build where clause for candidates filtering by company
    const candidateWhereClause = {};
    if (userRole === 'RECRUITER') {
      if (req.user.company_id) {
        candidateWhereClause.company_id = req.user.company_id;
        console.log(`🔒 RECRUITER FILTER APPLIED: Only showing violations for company_id = ${req.user.company_id}`);
      } else {
        return res.status(403).json({
          success: false,
          message: 'Tài khoản recruiter chưa được gán vào công ty nào. Vui lòng liên hệ admin.'
        });
      }
    }
    
    // Build where clause for candidate_tests filtering
    const testWhereClause = {
      status: 'COMPLETED' // Only show completed tests
    };
    
    if (candidateTestId) {
      testWhereClause.candidate_test_id = candidateTestId;
    }
    
    // Add date range filter
    if (startDate || endDate) {
      testWhereClause.end_time = {};
      if (startDate) {
        testWhereClause.end_time[Op.gte] = new Date(startDate);
        console.log('📅 Start date filter:', startDate);
      }
      if (endDate) {
        const endDateTime = new Date(endDate);
        endDateTime.setHours(23, 59, 59, 999); // Include entire end date
        testWhereClause.end_time[Op.lte] = endDateTime;
        console.log('📅 End date filter:', endDate);
      }
    }
    
    // Fetch ALL completed candidate tests
    const candidateTests = await CandidateTest.findAll({
      where: testWhereClause,
      include: [
        {
          model: Test,
          attributes: ['test_id', 'test_name']
        },
        {
          model: Candidate,
          attributes: ['candidate_id', 'first_name', 'last_name', 'email', 'company_id'],
          where: candidateWhereClause,
          required: true, // INNER JOIN - only include tests with matching company
          include: [
            {
              model: Company,
              attributes: ['company_id', 'companyName'],
              required: false
            }
          ]
        },
        {
          model: CandidateTestResult,
          attributes: ['total_score', 'percentage', 'passed']
        },
        {
          model: TestFraudLog,
          attributes: ['log_id', 'event_type', 'event_count', 'event_time', 'details'],
          required: false // LEFT JOIN - include tests even without violations
        }
      ],
      order: [['end_time', 'DESC']],
      subQuery: false
    });

    console.log(`📋 Found ${candidateTests.length} completed tests`);

    // Transform to match frontend expectations
    let violations = candidateTests.map(ct => {
      const candidate = ct.Candidate;
      const test = ct.Test;
      const result = ct.CandidateTestResult;
      const fraudLogs = ct.TestFraudLogs || [];
      
      // Get primary violation (most recent or most severe)
      const primaryViolation = fraudLogs.length > 0 ? fraudLogs[0] : null;
      
      // Get company name - use companyName field from database
      const companyName = candidate?.Company?.companyName || 'N/A';
      
      return {
        id: primaryViolation?.log_id || ct.candidate_test_id, // Use candidate_test_id if no violation log
        log_id: primaryViolation?.log_id || ct.candidate_test_id,
        candidateId: candidate?.candidate_id || 'N/A',
        candidate_id: candidate?.candidate_id || 'N/A',
        candidate_name: candidate ? `${candidate.first_name} ${candidate.last_name}` : 'Unknown',
        candidate_email: candidate?.email || '',
        company_id: candidate?.company_id || null,
        company_name: companyName,
        candidate_test_id: ct.candidate_test_id,
        test_id: test?.test_id || 'N/A',
        test_name: test?.test_name || 'Unknown Test',
        violation_type: primaryViolation?.event_type || 'NONE',
        event_type: primaryViolation?.event_type || 'NONE',
        event_count: primaryViolation?.event_count || 0,
        description: primaryViolation?.details || 'No violations detected',
        details: primaryViolation?.details || 'No violations detected',
        score: result?.total_score || ct.score || 0,
        manual_score: ct.manual_score || null,
        percentage: result?.percentage || 0,
        result: result?.passed ? 'passed' : 'failed',
        status: result?.passed ? 'pass' : 'fail',
        passing_status: ct.passing_status || 'PENDING',
        reported_at: primaryViolation?.event_time || ct.end_time,
        event_time: primaryViolation?.event_time || ct.end_time,
        timestamp: primaryViolation?.event_time || ct.end_time,
        has_violations: fraudLogs.length > 0,
        violation_count: fraudLogs.length,
        violation_summary: fraudLogs.length > 0 
          ? `${fraudLogs.length} violation(s) detected`
          : '✓ Clean test - no violations'
      };
    });

    // For RECRUITER: Only show tests with ACTUAL violations (exclude NONE)
    if (userRole === 'RECRUITER') {
      violations = violations.filter(v => v.violation_type !== 'NONE' && v.has_violations);
      console.log(`🔒 RECRUITER FILTER: Only showing tests with actual violations: ${violations.length} results`);
    }

    // Apply violation type filter if specified
    if (violationType) {
      violations = violations.filter(v => v.violation_type === violationType);
      console.log(`🔍 Filtered by violation type '${violationType}': ${violations.length} results`);
    }

    console.log(`⚠️ Returning ${violations.length} enhanced violations`);

    return res.status(200).json({
      success: true,
      count: violations.length,
      data: violations
    });

  } catch (error) {
    console.error('❌ Error getting violations:', error);
    logger.error(`Error getting violations: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Failed to get violations',
      error: error.message
    });
  }
};

// Get violation details by ID
exports.getViolationById = async (req, res) => {
  try {
    const { logId } = req.params;

    const fraudLog = await TestFraudLog.findByPk(logId, {
      include: [
        {
          model: CandidateTest,
          include: [
            { model: Test, attributes: ['test_id', 'test_name', 'duration_minutes'] },
            { model: Candidate, attributes: ['candidate_id', 'first_name', 'last_name', 'email', 'company_id'] },
            { model: CandidateTestResult }
          ]
        }
      ]
    });

    if (!fraudLog) {
      return res.status(404).json({
        success: false,
        message: 'Violation not found'
      });
    }

    // 🔒 COMPANY CHECK - Recruiter chỉ xem được violation của công ty mình
    const userRole = req.user?.Role?.role_name?.toUpperCase() || req.user?.role?.toUpperCase();
    const candidateCompanyId = fraudLog.CandidateTest?.Candidate?.company_id;
    if (userRole === 'RECRUITER' && candidateCompanyId !== req.user.company_id) {
      console.log(`🚫 ACCESS DENIED: Recruiter company_id=${req.user.company_id} tried to access violation of candidate company_id=${candidateCompanyId}`);
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền xem báo cáo vi phạm này'
      });
    }

    const ct = fraudLog.CandidateTest;
    const violation = {
      log_id: fraudLog.log_id,
      candidate_test_id: fraudLog.candidate_test_id,
      event_type: fraudLog.event_type,
      event_count: fraudLog.event_count,
      event_time: fraudLog.event_time,
      details: fraudLog.details,
      test: ct?.Test,
      candidate: ct?.Candidate,
      test_result: ct?.CandidateTestResult
    };

    return res.status(200).json({
      success: true,
      data: violation
    });

  } catch (error) {
    logger.error(`Error getting violation: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Failed to get violation',
      error: error.message
    });
  }
};

// Get violations by candidate test
exports.getViolationsByTest = async (req, res) => {
  try {
    const { candidateTestId } = req.params;

    const violations = await TestFraudLog.findAll({
      where: { candidate_test_id: candidateTestId },
      order: [['event_time', 'ASC']]
    });

    return res.status(200).json({
      success: true,
      count: violations.length,
      data: violations
    });

  } catch (error) {
    logger.error(`Error getting test violations: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Failed to get test violations',
      error: error.message
    });
  }
};

// Get violation statistics
exports.getViolationStatistics = async (req, res) => {
  try {
    // Count violations by type
    const violationsByType = await TestFraudLog.findAll({
      attributes: [
        'event_type',
        [sequelize.fn('COUNT', sequelize.col('log_id')), 'count'],
        [sequelize.fn('SUM', sequelize.col('event_count')), 'total_events']
      ],
      group: ['event_type']
    });

    // Total violations
    const totalViolations = await TestFraudLog.count();

    // Tests with violations
    const testsWithViolations = await TestFraudLog.findAll({
      attributes: [
        'candidate_test_id',
        [sequelize.fn('COUNT', sequelize.col('log_id')), 'violation_count']
      ],
      group: ['candidate_test_id'],
      order: [[sequelize.literal('violation_count'), 'DESC']],
      limit: 10
    });

    // Recent violations
    const recentViolations = await TestFraudLog.findAll({
      include: [
        {
          model: CandidateTest,
          include: [
            { model: Test, attributes: ['test_name'] },
            { model: Candidate, attributes: ['first_name', 'last_name', 'email'] }
          ]
        }
      ],
      order: [['event_time', 'DESC']],
      limit: 10
    });

    return res.status(200).json({
      success: true,
      data: {
        total_violations: totalViolations,
        by_type: violationsByType,
        top_tests_with_violations: testsWithViolations,
        recent_violations: recentViolations
      }
    });

  } catch (error) {
    logger.error(`Error getting violation statistics: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Failed to get violation statistics',
      error: error.message
    });
  }
};

// ===== 2. STATISTICS REPORTS =====
exports.getStatistics = async (req, res) => {
  try {
    console.log('📊 Fetching statistics from database...');
    
    // 🔒 COMPANY FILTER - Recruiter chỉ xem thống kê của công ty mình
    const userRole = req.user?.Role?.role_name?.toUpperCase() || req.user?.role?.toUpperCase();
    console.log(`👤 User: ${req.user?.username}, Role: ${userRole}, Company ID: ${req.user?.company_id}`);
    
    // Build where clause for candidates filtering by company
    const candidateWhereClause = {};
    if (userRole === 'RECRUITER') {
      if (req.user.company_id) {
        candidateWhereClause.company_id = req.user.company_id;
        console.log(`🔒 RECRUITER FILTER APPLIED: Only showing statistics for company_id = ${req.user.company_id}`);
      } else {
        return res.status(403).json({
          success: false,
          message: 'Tài khoản recruiter chưa được gán vào công ty nào. Vui lòng liên hệ admin.'
        });
      }
    }
    
    // Get all completed candidate tests with results
    const completedTests = await CandidateTest.findAll({
      where: {
        status: 'COMPLETED'
      },
      include: [
        {
          model: Test,
          attributes: ['test_id', 'test_name']
        },
        {
          model: Candidate,
          attributes: ['candidate_id', 'first_name', 'last_name', 'email', 'company_id'],
          where: candidateWhereClause,
          required: true // INNER JOIN - only include tests with matching company
        },
        {
          model: CandidateTestResult,
          attributes: ['total_score', 'percentage', 'passed']
        }
      ]
    });

    console.log(`📊 Found ${completedTests.length} completed tests`);

    // Calculate aggregated statistics
    const totalTests = completedTests.length;
    const passedTests = completedTests.filter(t => t.CandidateTestResult?.passed === true).length;
    const failedTests = completedTests.filter(t => t.CandidateTestResult?.passed === false).length;
    const pendingTests = completedTests.filter(t => !t.CandidateTestResult).length;
    
    let averageScore = 0;
    const testsWithScores = completedTests.filter(t => t.CandidateTestResult?.total_score != null);
    if (testsWithScores.length > 0) {
      const totalScore = testsWithScores.reduce((sum, t) => sum + (t.CandidateTestResult.total_score || 0), 0);
      averageScore = (totalScore / testsWithScores.length).toFixed(2);
    }

    // Calculate score distribution
    let scoreDistribution = {
      '0-20': 0,
      '21-40': 0,
      '41-60': 0,
      '61-80': 0,
      '81-100': 0
    };

    testsWithScores.forEach(t => {
      const percentage = t.CandidateTestResult.percentage || 0;
      if (percentage >= 0 && percentage <= 20) scoreDistribution['0-20']++;
      else if (percentage >= 21 && percentage <= 40) scoreDistribution['21-40']++;
      else if (percentage >= 41 && percentage <= 60) scoreDistribution['41-60']++;
      else if (percentage >= 61 && percentage <= 80) scoreDistribution['61-80']++;
      else if (percentage >= 81 && percentage <= 100) scoreDistribution['81-100']++;
    });

    // Count violations from database
    const totalViolations = await TestFraudLog.count();

    // Get in-progress and assigned tests
    const inProgressTests = await CandidateTest.count({
      where: { status: 'IN_PROGRESS' }
    });
    
    const assignedTests = await CandidateTest.count({
      where: { status: 'ASSIGNED' }
    });

    // Transform tests list for frontend
    const testsList = completedTests.map(t => ({
      id: t.candidate_test_id,
      testId: t.test_id,
      candidateId: t.candidate_id,
      candidateName: t.Candidate ? `${t.Candidate.first_name} ${t.Candidate.last_name}` : 'Unknown',
      candidateEmail: t.Candidate?.email || '',
      testName: t.Test?.test_name || 'Unknown Test',
      score: t.CandidateTestResult?.total_score || 0,
      percentage: t.CandidateTestResult?.percentage || 0,
      status: t.CandidateTestResult?.passed ? 'pass' : (t.CandidateTestResult ? 'fail' : 'pending'),
      passed: t.CandidateTestResult?.passed || false,
      completedAt: t.end_time || t.updated_at
    }));

    // Prepare response with both aggregated stats and detailed list
    const response = {
      totalTests: totalTests + inProgressTests + assignedTests,
      completedTests: totalTests,
      passedTests,
      failedTests,
      pendingTests,
      averageScore: parseFloat(averageScore),
      totalViolations,
      statusDistribution: {
        completed: totalTests,
        in_progress: inProgressTests,
        assigned: assignedTests
      },
      scoreDistribution,
      testsList
    };

    console.log('📊 Statistics summary:', {
      total: response.totalTests,
      completed: response.completedTests,
      passed: passedTests,
      failed: failedTests
    });

    return res.status(200).json({
      success: true,
      data: response
    });

  } catch (error) {
    console.error('❌ Error getting statistics:', error);
    logger.error(`Error getting statistics: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Failed to get statistics',
      error: error.message
    });
  }
};

// ===== 3. ACTIVITY LOGS =====
exports.logActivity = async (req, res) => {
  try {
    const { candidate_test_id, event_type, event_time, event_data } = req.body;
    const userId = req.user.userId || req.user.user_id;

    if (!candidate_test_id || !event_type) {
      return res.status(400).json({
        success: false,
        message: 'candidate_test_id and event_type are required'
      });
    }

    // Verify candidate test exists
    const candidateTest = await CandidateTest.findByPk(candidate_test_id);
    if (!candidateTest) {
      return res.status(404).json({
        success: false,
        message: 'Candidate test not found'
      });
    }

    // Log to system_logs table (using RecruitmentReport for structured tracking)
    const activityLog = await RecruitmentReport.create({
      report_name: `Activity: ${event_type}`,
      report_type: 'ACTIVITY_LOG',
      parameters: JSON.stringify({
        candidate_test_id,
        event_type,
        event_time: event_time || new Date(),
        event_data: event_data || {},
        test_id: candidateTest.test_id,
        candidate_id: candidateTest.candidate_id
      }),
      created_by: userId
    });

    logger.info(`Activity logged for test ${candidate_test_id}: ${event_type}`);

    return res.status(200).json({
      success: true,
      message: 'Activity logged successfully',
      data: {
        report_id: activityLog.report_id,
        candidate_test_id,
        event_type,
        event_time: event_time || new Date(),
        event_data: event_data || {},
        logged_at: activityLog.created_at
      }
    });

  } catch (error) {
    logger.error(`Error logging activity: ${error.message}`);
    console.error('Error logging activity:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to log activity',
      error: error.message
    });
  }
};

// Get activity logs (Admin only)
exports.getActivityLogs = async (req, res) => {
  try {
    const { candidate_test_id, event_type, startDate, endDate } = req.query;

    console.log('📋 Fetching activity logs from database...');
    console.log('🔍 Filters:', { candidate_test_id, event_type, startDate, endDate });

    // Build where clause with date filter
    const whereClause = {
      report_type: 'ACTIVITY_LOG'
    };
    
    // Add date range filter for created_at
    if (startDate || endDate) {
      whereClause.created_at = {};
      if (startDate) {
        whereClause.created_at[Op.gte] = new Date(startDate);
        console.log('📅 Start date filter:', startDate);
      }
      if (endDate) {
        const endDateTime = new Date(endDate);
        endDateTime.setHours(23, 59, 59, 999);
        whereClause.created_at[Op.lte] = endDateTime;
        console.log('📅 End date filter:', endDate);
      }
    }

    // Fetch activity logs from recruitment_reports
    const activityReports = await RecruitmentReport.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'Creator',
          attributes: ['user_id', 'username', 'full_name']
        }
      ],
      order: [['created_at', 'DESC']]
    });

    // Parse and filter activities
    let activities = activityReports.map(report => {
      const params = report.parameters || {};
      return {
        report_id: report.report_id,
        candidate_test_id: params.candidate_test_id,
        test_id: params.test_id,
        candidate_id: params.candidate_id,
        event_type: params.event_type,
        event_time: params.event_time,
        event_data: params.event_data,
        created_by: report.created_by,
        creator: report.Creator,
        logged_at: report.created_at
      };
    });

    // Apply filters
    if (candidate_test_id) {
      activities = activities.filter(a => a.candidate_test_id == candidate_test_id);
    }
    if (event_type) {
      activities = activities.filter(a => a.event_type === event_type);
    }
    if (startDate) {
      activities = activities.filter(a => new Date(a.event_time) >= new Date(startDate));
    }
    if (endDate) {
      activities = activities.filter(a => new Date(a.event_time) <= new Date(endDate));
    }

    console.log(`📋 Found ${activities.length} activity logs`);

    return res.status(200).json({
      success: true,
      count: activities.length,
      data: activities
    });

  } catch (error) {
    logger.error(`Error getting activity logs: ${error.message}`);
    console.error('Error getting activity logs:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get activity logs',
      error: error.message
    });
  }
};

// ===== 4. NOTIFY CANDIDATE =====
exports.notifyCandidate = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { candidate_test_id } = req.body;
    const userId = req.user.userId || req.user.user_id;

    if (!candidate_test_id) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'candidate_test_id is required'
      });
    }

    // Get test result and details
    const candidateTest = await CandidateTest.findByPk(candidate_test_id, {
      include: [
        {
          model: Test,
          attributes: ['test_id', 'test_name', 'passing_score']
        },
        {
          model: Candidate,
          attributes: ['candidate_id', 'first_name', 'last_name', 'email'],
          include: [
            {
              model: User,
              attributes: ['email']
            }
          ]
        },
        {
          model: CandidateTestResult
        }
      ],
      transaction
    });

    if (!candidateTest) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Candidate test not found'
      });
    }

    if (!candidateTest.CandidateTestResult) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Test result not available yet'
      });
    }

    const testName = candidateTest.Test?.test_name;
    const score = candidateTest.CandidateTestResult.total_score;
    const percentage = candidateTest.CandidateTestResult.percentage;
    const passed = candidateTest.CandidateTestResult.passed;
    const candidateName = `${candidateTest.Candidate?.first_name} ${candidateTest.Candidate?.last_name}`;
    const candidateEmail = candidateTest.Candidate?.email || candidateTest.Candidate?.User?.email;

    // Create notification message
    let message;
    if (passed) {
      message = `Xin chúc mừng, bạn đã pass bài thi "${testName}" với điểm ${score} (${percentage}%).`;
    } else {
      message = `Rất tiếc, bạn chưa đạt yêu cầu ở bài thi "${testName}", điểm của bạn là ${score} (${percentage}%).`;
    }

    // Save notification to recruitment_reports
    const notification = await RecruitmentReport.create({
      report_name: `Notification: ${testName} - ${candidateName}`,
      report_type: 'NOTIFICATION',
      parameters: JSON.stringify({
        candidate_test_id,
        test_id: candidateTest.Test?.test_id,
        candidate_id: candidateTest.Candidate?.candidate_id,
        candidate_name: candidateName,
        candidate_email: candidateEmail,
        test_name: testName,
        score,
        percentage,
        passed,
        message,
        status: 'sent'
      }),
      created_by: userId
    }, { transaction });

    await transaction.commit();

    logger.info(`Notification sent to candidate for test ${candidate_test_id}`);

    // In a real application, you would send an actual email here
    // For now, we just log and save to database

    return res.status(200).json({
      success: true,
      message: 'Notification sent successfully',
      data: {
        report_id: notification.report_id,
        candidate_test_id,
        candidate_name: candidateName,
        candidate_email: candidateEmail,
        test_name: testName,
        score,
        percentage,
        passed,
        message,
        sent_at: notification.created_at,
        status: 'sent'
      }
    });

  } catch (error) {
    await transaction.rollback();
    logger.error(`Error notifying candidate: ${error.message}`);
    console.error('Error notifying candidate:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to send notification',
      error: error.message
    });
  }
};

// Get notifications (for candidate dashboard) - UPDATED to join with test_fraud_logs and interview_feedback
exports.getNotifications = async (req, res) => {
  try {
    const userId = req.user.userId || req.user.user_id;

    console.log('📧 Fetching notifications with test_fraud_logs and interview_feedback...');

    // 🔒 COMPANY FILTER - Recruiter chỉ xem thông báo của công ty mình
    const userRole = req.user?.Role?.role_name?.toUpperCase() || req.user?.role?.toUpperCase();
    console.log(`👤 User: ${req.user?.username}, Role: ${userRole}, Company ID: ${req.user?.company_id}`);
    
    const candidateWhereClause = {};
    if (userRole === 'RECRUITER') {
      if (req.user.company_id) {
        candidateWhereClause.company_id = req.user.company_id;
        console.log(`🔒 RECRUITER FILTER APPLIED: Only showing notifications for company_id = ${req.user.company_id}`);
      } else {
        return res.status(403).json({
          success: false,
          message: 'Tài khoản recruiter chưa được gán vào công ty nào. Vui lòng liên hệ admin.'
        });
      }
    }

    // Get all completed candidate tests with related data
    const candidateTests = await CandidateTest.findAll({
      where: {
        status: 'COMPLETED'
      },
      include: [
        {
          model: Test,
          attributes: ['test_id', 'test_name', 'description']
        },
        {
          model: Candidate,
          attributes: ['candidate_id', 'first_name', 'last_name', 'email', 'company_id'],
          where: candidateWhereClause,
          required: true // INNER JOIN - only include tests with matching company
        },
        {
          model: CandidateTestResult,
          attributes: ['total_score', 'percentage', 'passed']
        },
        {
          model: TestFraudLog,
          attributes: ['log_id', 'event_type', 'event_count', 'event_time', 'details'],
          required: false
        }
      ],
      order: [['end_time', 'DESC']]
    });

    // Get interview feedbacks to use as notification content
    const interviewFeedbacks = await InterviewFeedback.findAll({
      include: [
        {
          model: Interview,
          include: [
            {
              model: CandidateJobApplication,
              include: [
                {
                  model: Candidate,
                  attributes: ['candidate_id', 'first_name', 'last_name', 'email']
                }
              ]
            }
          ]
        }
      ]
    });

    // Transform to notifications
    const notifications = candidateTests.map(ct => {
      const candidate = ct.Candidate;
      const test = ct.Test;
      const result = ct.CandidateTestResult;
      const fraudLogs = ct.TestFraudLogs || [];
      
      // Find matching interview feedback for this candidate (if any)
      const matchingFeedback = interviewFeedbacks.find(feedback => 
        feedback.Interview?.CandidateJobApplication?.Candidate?.candidate_id === candidate?.candidate_id
      );
      
      // Get notification type from test_fraud_logs
      let notificationType = 'general';
      if (fraudLogs.length > 0) {
        notificationType = 'violation_warning';
      } else if (result?.passed) {
        notificationType = 'result_available';
      }
      
      // Get notification message from interview_feedback or generate default
      let message = '';
      if (matchingFeedback) {
        message = matchingFeedback.feedback_text || matchingFeedback.comments || '';
      } else if (result?.passed) {
        message = `Xin chúc mừng! Bạn đã pass bài thi "${test?.test_name}" với điểm ${result.total_score} (${result.percentage}%).`;
      } else {
        message = `Kết quả bài thi "${test?.test_name}": ${result?.total_score || 0} điểm (${result?.percentage || 0}%).`;
      }
      
      return {
        id: ct.candidate_test_id,
        candidate_test_id: ct.candidate_test_id,
        candidate_id: candidate?.candidate_id || 'N/A',
        candidate_name: candidate ? `${candidate.first_name} ${candidate.last_name}` : 'Unknown',
        candidate_email: candidate?.email || '',
        test_id: test?.test_id || 'N/A',
        test_name: test?.test_name || 'Unknown Test', // FROM tests table
        type: notificationType, // FROM test_fraud_logs (violation_warning if has violations)
        message: message, // FROM interview_feedback table
        score: result?.total_score || 0,
        percentage: result?.percentage || 0,
        passed: result?.passed || false,
        status: 'sent',
        violation_count: fraudLogs.length,
        has_violations: fraudLogs.length > 0,
        sent_at: ct.end_time || ct.updated_at,
        timestamp: ct.end_time || ct.updated_at
      };
    });

    console.log(`📧 Found ${notifications.length} notifications with enhanced data`);

    return res.status(200).json({
      success: true,
      count: notifications.length,
      data: notifications
    });

  } catch (error) {
    logger.error(`Error getting notifications: ${error.message}`);
    console.error('Error getting notifications:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get notifications',
      error: error.message
    });
  }
};

// ===== HELPER FUNCTION: AUTO-SAVE REPORT DATA ON TEST COMPLETION =====
exports.saveTestCompletionData = async (candidateTestData) => {
  const transaction = await sequelize.transaction();
  
  try {
    const {
      candidate_test_id,
      test_id,
      candidate_id,
      candidate_name,
      candidate_email,
      test_name,
      score,
      percentage,
      passed,
      status,
      start_time,
      end_time,
      violations = [],
      created_by = null
    } = candidateTestData;

    console.log(`📊 Auto-saving report data for test ${candidate_test_id}...`);

    // 1. Save violations to database if any
    if (violations && violations.length > 0) {
      for (const v of violations) {
        await TestFraudLog.create({
          candidate_test_id,
          event_type: v.type || v.violation_type || 'OTHER',
          event_count: v.count || 1,
          event_time: v.timestamp || new Date(),
          details: v.description || ''
        }, { transaction });
      }
      console.log(`⚠️ Saved ${violations.length} violations for test ${candidate_test_id}`);
    }

    // 2. Create activity log report
    await RecruitmentReport.create({
      report_name: `Test Completion: ${test_name}`,
      report_type: 'ACTIVITY_LOG',
      parameters: JSON.stringify({
        candidate_test_id,
        test_id,
        candidate_id,
        event_type: 'test_submit',
        description: `Test completed by ${candidate_name}`,
        event_time: end_time || new Date(),
        event_data: {
          score,
          percentage,
          passed,
          test_name,
          start_time,
          end_time
        }
      }),
      created_by
    }, { transaction });
    console.log(`📋 Saved activity log for test ${candidate_test_id}`);

    // 3. Create notification report
    const message = passed 
      ? `Xin chúc mừng, bạn đã pass bài thi "${test_name}" với điểm ${score} (${percentage}%).`
      : `Rất tiếc, bạn chưa đạt yêu cầu ở bài thi "${test_name}", điểm của bạn là ${score} (${percentage}%).`;

    await RecruitmentReport.create({
      report_name: `Auto-Notification: ${test_name} - ${candidate_name}`,
      report_type: 'NOTIFICATION',
      parameters: JSON.stringify({
        candidate_test_id,
        test_id,
        candidate_id,
        candidate_name,
        candidate_email,
        test_name,
        score,
        percentage,
        passed,
        message,
        status: 'auto-sent'
      }),
      created_by
    }, { transaction });
    console.log(`� Saved notification for test ${candidate_test_id}`);

    // 4. Create statistics report
    await RecruitmentReport.create({
      report_name: `Test Statistics: ${test_name}`,
      report_type: 'STATISTICS',
      parameters: JSON.stringify({
        candidate_test_id,
        test_id,
        candidate_id,
        candidate_name,
        test_name,
        score,
        percentage,
        status: passed ? 'pass' : 'fail',
        passed,
        completed_at: end_time || new Date(),
        duration: start_time && end_time ? 
          Math.floor((new Date(end_time) - new Date(start_time)) / 1000 / 60) : null
      }),
      created_by
    }, { transaction });
    console.log(`� Saved statistics report for test ${candidate_test_id}`);

    await transaction.commit();
    logger.info(`✅ Auto-saved all report data for test ${candidate_test_id} to database`);
    return true;

  } catch (error) {
    await transaction.rollback();
    console.error('❌ Error saving test completion data:', error);
    logger.error(`Error saving test completion data: ${error.message}`);
    return false;
  }
};

// ===== 5. RECRUITMENT REPORTS (ADMIN & RECRUITER) =====
// Get all reports from recruitment_reports table
exports.getAllReports = async (req, res) => {
  try {
    const { report_type, limit = 100, offset = 0, startDate, endDate } = req.query;

    console.log('📋 Fetching reports from recruitment_reports...');
    console.log('🔍 Filters:', { report_type, startDate, endDate, limit, offset });

    // 🔒 COMPANY FILTER - Recruiter chỉ xem báo cáo của công ty mình
    const userRole = req.user?.Role?.role_name?.toUpperCase() || req.user?.role?.toUpperCase();
    console.log(`👤 User: ${req.user?.username}, Role: ${userRole}, Company ID: ${req.user?.company_id}`);

    // Build where clause with date filter
    const whereClause = {};
    if (report_type) {
      whereClause.report_type = report_type;
    }
    
    // Add date range filter
    if (startDate || endDate) {
      whereClause.created_at = {};
      if (startDate) {
        whereClause.created_at[Op.gte] = new Date(startDate);
        console.log('📅 Start date filter:', startDate);
      }
      if (endDate) {
        const endDateTime = new Date(endDate);
        endDateTime.setHours(23, 59, 59, 999); // Include entire end date
        whereClause.created_at[Op.lte] = endDateTime;
        console.log('📅 End date filter:', endDate);
      }
    }

    // Fetch all reports with creator info
    const reports = await RecruitmentReport.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'Creator',
          attributes: ['user_id', 'username', 'full_name', 'company_id']
        }
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // Filter by company if recruiter
    let filteredReports = reports;
    if (userRole === 'RECRUITER' && req.user.company_id) {
      filteredReports = reports.filter(report => {
        // Check if creator belongs to same company
        if (report.Creator?.company_id === req.user.company_id) return true;
        
        // Check if report parameters contain company_id
        const params = report.parameters;
        if (params && params.company_id === req.user.company_id) return true;
        
        // Check if report is related to candidate from same company
        if (params && params.candidate_company_id === req.user.company_id) return true;
        
        return false;
      });
      console.log(`🔒 RECRUITER FILTER: ${reports.length} total, ${filteredReports.length} for company ${req.user.company_id}`);
    }

    // Format data for response
    const reportsData = filteredReports.map(report => ({
      report_id: report.report_id,
      report_name: report.report_name,
      report_type: report.report_type,
      parameters: report.parameters, // Already parsed by getter
      created_by: report.created_by,
      creator_name: report.Creator?.full_name || report.Creator?.username || 'System',
      created_at: report.created_at
    }));

    console.log(`✅ Found ${reportsData.length} reports`);

    return res.status(200).json({
      success: true,
      count: reportsData.length,
      data: reportsData
    });

  } catch (error) {
    console.error('❌ Error fetching all reports:', error);
    logger.error(`Error fetching all reports: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch reports',
      error: error.message
    });
  }
};

// ===== 5B. GET SINGLE REPORT BY ID (ADMIN ONLY) =====
exports.getReportById = async (req, res) => {
  try {
    const { reportId } = req.params;

    console.log(`📊 Fetching report #${reportId}...`);

    // Validate reportId
    if (!reportId || isNaN(reportId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid report ID'
      });
    }

    // Fetch report with creator info
    const report = await RecruitmentReport.findByPk(reportId, {
      include: [
        {
          model: User,
          as: 'Creator',
          attributes: ['user_id', 'username', 'full_name', 'company_id']
        }
      ]
    });

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    // Format response
    const reportData = {
      report_id: report.report_id,
      report_name: report.report_name,
      report_type: report.report_type,
      description: report.description || null,
      parameters: report.parameters, // Already parsed by getter
      severity: report.severity || 'INFO',
      status: report.status || 'COMPLETED',
      created_by: report.created_by,
      creator_name: report.Creator?.full_name || report.Creator?.username || 'System',
      created_at: report.created_at,
      updated_at: report.updated_at
    };

    console.log(`✅ Found report #${reportId}: ${report.report_name}`);

    return res.status(200).json({
      success: true,
      data: reportData
    });

  } catch (error) {
    console.error(`❌ Error fetching report #${req.params.reportId}:`, error);
    logger.error(`Error fetching report: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch report',
      error: error.message
    });
  }
};

// ===== 6. UPDATE REPORT (ADMIN ONLY) =====
exports.updateReport = async (req, res) => {
  try {
    const { reportId } = req.params;
    const { report_name } = req.body;
    const userId = req.user?.user_id || req.user?.userId;
    const username = req.user?.username || 'Unknown';

    console.log(`✏️ [ADMIN] User ${username} (ID: ${userId}) attempting to update report ${reportId}...`);
    console.log(`📝 New name: "${report_name}"`);

    // Validate reportId
    if (!reportId || isNaN(reportId)) {
      console.log(`❌ Invalid report ID: ${reportId}`);
      return res.status(400).json({
        success: false,
        message: 'Invalid report ID'
      });
    }

    // Validate report_name
    if (!report_name || report_name.trim() === '') {
      console.log(`❌ Report name is empty`);
      return res.status(400).json({
        success: false,
        message: 'Tên báo cáo không được để trống'
      });
    }

    // Find report
    const report = await RecruitmentReport.findByPk(reportId);
    if (!report) {
      console.log(`❌ Report ${reportId} not found in database`);
      return res.status(404).json({
        success: false,
        message: `Báo cáo #${reportId} không tồn tại`
      });
    }

    const oldName = report.report_name;
    console.log(`📄 Found report: "${oldName}" (Type: ${report.report_type})`);

    // Check if name actually changed
    if (oldName === report_name.trim()) {
      console.log(`⚠️ Report name unchanged`);
      return res.status(200).json({
        success: true,
        message: 'Tên báo cáo không thay đổi',
        data: {
          report_id: report.report_id,
          report_name: report.report_name,
          report_type: report.report_type
        }
      });
    }

    // Update report
    report.report_name = report_name.trim();
    await report.save();

    console.log(`✅ [ADMIN] Report ${reportId} updated: "${oldName}" → "${report.report_name}" by ${username}`);
    logger.info(`Report updated: ID=${reportId}, Old="${oldName}", New="${report.report_name}" by user ${username} (${userId})`);

    return res.status(200).json({
      success: true,
      message: 'Đã cập nhật báo cáo thành công',
      data: {
        report_id: report.report_id,
        report_name: report.report_name,
        report_type: report.report_type,
        updated_at: new Date(),
        updated_by: username
      }
    });

  } catch (error) {
    console.error('❌ Error updating report:', error);
    console.error('❌ Error stack:', error.stack);
    logger.error(`Error updating report: ${error.message}`, { stack: error.stack });
    return res.status(500).json({
      success: false,
      message: 'Lỗi server khi cập nhật báo cáo',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// ===== 7. DELETE REPORT (ADMIN ONLY) =====
exports.deleteReport = async (req, res) => {
  try {
    const { reportId } = req.params;
    const userId = req.user?.user_id || req.user?.userId;
    const username = req.user?.username || 'Unknown';

    console.log(`🗑️ [ADMIN] User ${username} (ID: ${userId}) attempting to delete report ${reportId}...`);

    // Validate reportId
    if (!reportId || isNaN(reportId)) {
      console.log(`❌ Invalid report ID: ${reportId}`);
      return res.status(400).json({
        success: false,
        message: 'Invalid report ID'
      });
    }

    // Find report
    const report = await RecruitmentReport.findByPk(reportId);
    if (!report) {
      console.log(`❌ Report ${reportId} not found in database`);
      return res.status(404).json({
        success: false,
        message: `Báo cáo #${reportId} không tồn tại`
      });
    }

    console.log(`📄 Found report: "${report.report_name}" (Type: ${report.report_type})`);

    // Store info for logging
    const reportInfo = {
      report_id: report.report_id,
      report_name: report.report_name,
      report_type: report.report_type,
      created_at: report.created_at
    };

    // Delete report
    await report.destroy();

    console.log(`✅ [ADMIN] Report ${reportId} deleted successfully by ${username}`);
    logger.info(`Report deleted: ${JSON.stringify(reportInfo)} by user ${username} (${userId})`);

    return res.status(200).json({
      success: true,
      message: 'Đã xóa báo cáo thành công',
      data: {
        report_id: parseInt(reportId),
        deleted_at: new Date(),
        deleted_by: username
      }
    });

  } catch (error) {
    console.error('❌ Error deleting report:', error);
    console.error('❌ Error stack:', error.stack);
    logger.error(`Error deleting report: ${error.message}`, { stack: error.stack });
    return res.status(500).json({
      success: false,
      message: 'Lỗi server khi xóa báo cáo',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

module.exports = exports;
