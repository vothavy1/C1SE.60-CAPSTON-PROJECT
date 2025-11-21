const { 
  CandidateTest, 
  Test, 
  Candidate, 
  CandidateJobApplication, 
  CandidateTestAnswer, 
  Question, 
  QuestionOption,
  CandidateTestResult,
  TestFraudLog
} = require('../models');
const logger = require('../utils/logger');
const { Op } = require('sequelize');
const sequelize = require('../config/database');
const jwt = require('jsonwebtoken');
// const config = require('../config/config'); // Removed - not needed

// Assign test to candidate
exports.assignTest = async (req, res) => {
  const t = await sequelize.transaction();
  
  try {
    const { 
      candidate_id, 
      test_id, 
      application_id 
    } = req.body;
    
    // Check if candidate exists
    const candidate = await Candidate.findByPk(candidate_id, { transaction: t });
    if (!candidate) {
      await t.rollback();
      return res.status(404).json({
        success: false,
        message: 'Candidate not found'
      });
    }
    
    // Check if test exists
    const test = await Test.findByPk(test_id, { transaction: t });
    if (!test) {
      await t.rollback();
      return res.status(404).json({
        success: false,
        message: 'Test not found'
      });
    }
    
    // Check if application exists if provided
    if (application_id) {
      const application = await CandidateJobApplication.findOne({
        where: {
          application_id,
          candidate_id
        },
        transaction: t
      });
      
      if (!application) {
        await t.rollback();
        return res.status(404).json({
          success: false,
          message: 'Job application not found or does not belong to this candidate'
        });
      }
      
      // Update application status if not already in testing
      if (application.status !== 'TESTING') {
        await application.update({ status: 'TESTING' }, { transaction: t });
      }
    }
    
    // Check if candidate already has this test assigned and not completed/expired
    const existingTest = await CandidateTest.findOne({
      where: {
        candidate_id,
        test_id,
        status: {
          [Op.in]: ['PENDING', 'IN_PROGRESS']
        }
      },
      transaction: t
    });
    
    if (existingTest) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: 'This test is already assigned to the candidate and not yet completed'
      });
    }
    
    // Generate access token
    const accessToken = jwt.sign(
      { candidate_id, test_id },
      process.env.JWT_TEST_ACCESS_SECRET || 'test-access-secret-key',
      { expiresIn: '7d' }
    );
    
    // Calculate token expiry
    const tokenExpiry = new Date();
    tokenExpiry.setDate(tokenExpiry.getDate() + 7);
    
    // Create candidate test
    const candidateTest = await CandidateTest.create({
      candidate_id,
      test_id,
      application_id,
      status: 'PENDING',
      access_token: accessToken,
      access_token_expiry: tokenExpiry
    }, { transaction: t });
    
    // Update candidate status if needed
    if (candidate.status !== 'TESTING') {
      await candidate.update({ status: 'TESTING' }, { transaction: t });
    }
    
    await t.commit();
    
    logger.info(`Test ID ${test_id} assigned to Candidate ID ${candidate_id}`);
    
    return res.status(201).json({
      success: true,
      message: 'Test assigned successfully',
      data: {
        candidate_test_id: candidateTest.candidate_test_id,
        test_name: test.test_name,
        candidate_name: `${candidate.first_name} ${candidate.last_name}`,
        access_token: accessToken,
        access_token_expiry: tokenExpiry
      }
    });
    
  } catch (error) {
    await t.rollback();
    logger.error(`Error assigning test: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Failed to assign test',
      error: error.message
    });
  }
};

// Self-assign test for candidates (without permission check)
exports.selfAssignTest = async (req, res) => {
  const t = await sequelize.transaction();
  
  try {
    const { 
      candidate_id, 
      test_id
    } = req.body;
    
    // Verify the user owns this candidate profile
    const candidate = await Candidate.findByPk(candidate_id, { transaction: t });
    if (!candidate) {
      await t.rollback();
      return res.status(404).json({
        success: false,
        message: 'Candidate not found'
      });
    }
    
    // Check if the authenticated user is the owner of this candidate profile
    const requestUserId = req.user.userId || req.user.user_id;
    logger.info(`🔐 Verifying ownership - Candidate.user_id: ${candidate.user_id}, Request.userId: ${requestUserId}`);
    
    if (candidate.user_id && candidate.user_id !== requestUserId) {
      await t.rollback();
      logger.warn(`❌ Access denied - User ${requestUserId} tried to access candidate ${candidate_id} owned by ${candidate.user_id}`);
      return res.status(403).json({
        success: false,
        message: 'You can only assign tests to your own profile'
      });
    }
    
    // Check if test exists and is active
    const test = await Test.findByPk(test_id, { transaction: t });
    if (!test) {
      await t.rollback();
      return res.status(404).json({
        success: false,
        message: 'Test not found'
      });
    }
    
    if (test.status !== 'ACTIVE') {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: 'This test is not available'
      });
    }
    
    // Check if candidate already has this test assigned and not completed/expired
    const existingTest = await CandidateTest.findOne({
      where: {
        candidate_id,
        test_id,
        status: {
          [Op.in]: ['ASSIGNED', 'IN_PROGRESS']
        }
      },
      transaction: t
    });
    
    if (existingTest) {
      await t.commit();
      return res.status(200).json({
        success: true,
        message: 'Test already assigned',
        data: {
          candidate_test_id: existingTest.candidate_test_id,
          status: existingTest.status
        }
      });
    }
    
    // Create candidate test (no access_token needed for authenticated self-assign)
    const candidateTest = await CandidateTest.create({
      candidate_id,
      test_id,
      status: 'ASSIGNED'
    }, { transaction: t });
    
    await t.commit();
    
    logger.info(`✅ Candidate ${candidate_id} self-assigned test ${test_id}`);
    
    return res.status(201).json({
      success: true,
      message: 'Test assigned successfully',
      data: {
        candidate_test_id: candidateTest.candidate_test_id,
        test_id: test_id,
        status: 'PENDING'
      }
    });
    
  } catch (error) {
    await t.rollback();
    logger.error(`Error in self-assign test: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Failed to assign test',
      error: error.message
    });
  }
};

// Get candidate test by access token
exports.getTestByToken = async (req, res) => {
  try {
    const { token } = req.params;
    
    // Find the candidate test
    const candidateTest = await CandidateTest.findOne({
      where: {
        access_token: token,
        status: {
          [Op.in]: ['PENDING', 'IN_PROGRESS']
        },
        access_token_expiry: {
          [Op.gt]: new Date()
        }
      },
      include: [
        {
          model: Candidate,
          attributes: ['candidate_id', 'first_name', 'last_name', 'email']
        },
        {
          model: Test,
          attributes: [
            'test_id', 
            'test_name', 
            'description', 
            'duration_minutes',
            'passing_score'
          ]
        }
      ]
    });
    
    if (!candidateTest) {
      return res.status(404).json({
        success: false,
        message: 'Test not found or has expired'
      });
    }
    
    return res.status(200).json({
      success: true,
      message: 'Test found',
      data: {
        candidate_test_id: candidateTest.candidate_test_id,
        candidate: candidateTest.Candidate,
        test: candidateTest.Test,
        start_time: candidateTest.start_time,
        end_time: candidateTest.end_time,
        status: candidateTest.status
      }
    });
    
  } catch (error) {
    logger.error(`Error retrieving test by token: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve test',
      error: error.message
    });
  }
};

// Start candidate test
exports.startTest = async (req, res) => {
  const t = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    const userId = req.user.userId || req.user.user_id;
    
    // Find candidate by user_id
    const candidate = await Candidate.findOne({
      where: { user_id: userId },
      transaction: t
    });
    
    if (!candidate) {
      await t.rollback();
      return res.status(404).json({
        success: false,
        message: 'Candidate profile not found'
      });
    }
    
    // Find the candidate test
    const candidateTest = await CandidateTest.findOne({
      where: {
        candidate_test_id: id,
        candidate_id: candidate.candidate_id,
        status: {
          [Op.in]: ['ASSIGNED', 'IN_PROGRESS']
        }
      },
      include: [
        {
          model: Test,
          include: [
            {
              model: Question,
              through: {
                attributes: ['question_order', 'score_weight']
              },
              include: [
                {
                  model: QuestionOption,
                  as: 'QuestionOptions',
                  attributes: ['option_id', 'option_text']
                }
              ]
            }
          ]
        }
      ],
      transaction: t
    });
    
    if (!candidateTest) {
      await t.rollback();
      return res.status(404).json({
        success: false,
        message: 'Test not found or already completed'
      });
    }
    
    // If already in progress, return current state
    if (candidateTest.status === 'IN_PROGRESS' && candidateTest.start_time) {
      await t.commit();
      
      const questions = candidateTest.Test.Questions.map(q => ({
        question_id: q.question_id,
        question_text: q.question_text,
        question_type: q.question_type,
        order: q.TestQuestion.question_order,
        options: q.question_type !== 'TEXT' && q.question_type !== 'ESSAY' ? q.QuestionOptions.map(o => ({
          option_id: o.option_id,
          option_text: o.option_text
        })) : []
      }));
      
      return res.status(200).json({
        success: true,
        message: 'Test already started',
        data: {
          candidate_test_id: candidateTest.candidate_test_id,
          test_name: candidateTest.Test.test_name,
          start_time: candidateTest.start_time,
          end_time: candidateTest.end_time,
          duration_minutes: candidateTest.Test.duration_minutes,
          questions
        }
      });
    }
    
    // Calculate end time based on test duration
    const startTime = new Date();
    const endTime = new Date(startTime);
    endTime.setMinutes(endTime.getMinutes() + candidateTest.Test.duration_minutes);
    
    // Update candidate test - only update status and timestamps
    await candidateTest.update({
      status: 'IN_PROGRESS',
      start_time: startTime,
      end_time: endTime
    }, { transaction: t });
    
    await t.commit();
    
    logger.info(`✅ Candidate Test ID ${id} started by candidate ${candidate.candidate_id}`);
    
    // Prepare questions to return
    const questions = candidateTest.Test.Questions.map(q => ({
      question_id: q.question_id,
      question_text: q.question_text,
      question_type: q.question_type,
      order: q.TestQuestion.question_order,
      options: q.question_type !== 'TEXT' && q.question_type !== 'ESSAY' ? q.QuestionOptions.map(o => ({
        option_id: o.option_id,
        option_text: o.option_text
      })) : []
    }));
    
    return res.status(200).json({
      success: true,
      message: 'Test started successfully',
      data: {
        candidate_test_id: candidateTest.candidate_test_id,
        test_name: candidateTest.Test.test_name,
        start_time: startTime,
        end_time: endTime,
        duration_minutes: candidateTest.Test.duration_minutes,
        questions
      }
    });
    
  } catch (error) {
    await t.rollback();
    console.error('❌ Error starting test:', error.message);
    console.error(error.stack);
    logger.error(`Error starting test: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Failed to start test',
      error: error.message
    });
  }
};

// Submit answer for a question
exports.submitAnswer = async (req, res) => {
  const t = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    const { 
      question_id, 
      selected_option_id,
      text_answer,
      code_answer
    } = req.body;
    
    const userId = req.user.userId || req.user.user_id;
    
    // Find candidate by user_id
    const candidate = await Candidate.findOne({
      where: { user_id: userId },
      transaction: t
    });
    
    if (!candidate) {
      await t.rollback();
      return res.status(404).json({
        success: false,
        message: 'Candidate profile not found'
      });
    }
    
    // Find the candidate test
    const candidateTest = await CandidateTest.findOne({
      where: {
        candidate_test_id: id,
        candidate_id: candidate.candidate_id,
        status: 'IN_PROGRESS'
      },
      transaction: t
    });
    
    if (!candidateTest) {
      await t.rollback();
      return res.status(404).json({
        success: false,
        message: 'Test not found or not in progress'
      });
    }
    
    // Check if test has expired
    if (candidateTest.end_time && new Date() > candidateTest.end_time) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: 'Test has expired'
      });
    }
    
    // Find the question
    const question = await Question.findByPk(question_id, {
      include: [
        {
          model: QuestionOption,
          as: 'QuestionOptions',
          attributes: ['option_id', 'is_correct']
        }
      ],
      transaction: t
    });
    
    if (!question) {
      await t.rollback();
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }
    
    // Check if answer already exists
    const existingAnswer = await CandidateTestAnswer.findOne({
      where: {
        candidate_test_id: id,
        question_id
      },
      transaction: t
    });
    
    // Determine if answer is correct for auto-graded questions
    let isCorrect = null;
    let selectedOptions = null;
    
    if (question.question_type === 'MULTIPLE_CHOICE' || question.question_type === 'SINGLE_CHOICE') {
      if (selected_option_id) {
        selectedOptions = String(selected_option_id);
        const selectedOption = question.QuestionOptions.find(o => o.option_id === selected_option_id);
        if (selectedOption) {
          isCorrect = selectedOption.is_correct ? 1 : 0;
        } else {
          isCorrect = 0;
        }
      } else {
        isCorrect = 0;
      }
    }
    
    if (existingAnswer) {
      // Update existing answer
      const updateData = {
        is_correct: isCorrect !== null ? isCorrect : existingAnswer.is_correct,
        submitted_at: new Date()
      };
      
      if (selectedOptions !== null) {
        updateData.selected_options = selectedOptions;
      }
      if (text_answer !== undefined && text_answer !== null) {
        updateData.text_answer = text_answer;
      }
      if (code_answer !== undefined && code_answer !== null) {
        updateData.code_answer = code_answer;
      }
      
      await existingAnswer.update(updateData, { transaction: t });
      
      await t.commit();
      
      logger.info(`✅ Answer updated for question ${question_id} in test ${id}`);
      
      return res.status(200).json({
        success: true,
        message: 'Answer updated successfully',
        data: {
          answer_id: existingAnswer.answer_id,
          is_correct: isCorrect
        }
      });
      
    } else {
      // Create new answer
      const answer = await CandidateTestAnswer.create({
        candidate_test_id: id,
        question_id,
        selected_options: selectedOptions,
        text_answer: text_answer || null,
        code_answer: code_answer || null,
        is_correct: isCorrect !== null ? isCorrect : 0,
        submitted_at: new Date()
      }, { transaction: t });
      
      await t.commit();
      
      logger.info(`✅ Answer submitted for question ${question_id} in test ${id}`);
      
      return res.status(201).json({
        success: true,
        message: 'Answer submitted successfully',
        data: {
          answer_id: answer.answer_id,
          is_correct: isCorrect
        }
      });
    }
    
  } catch (error) {
    await t.rollback();
    console.error('❌ Error submitting answer:', error.message);
    console.error(error.stack);
    logger.error(`❌ Error submitting answer: ${error.message}`);
    logger.error(error.stack);
    return res.status(500).json({
      success: false,
      message: 'Failed to submit answer',
      error: error.message
    });
  }
};

// Complete candidate test
exports.completeTest = async (req, res) => {
  const t = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    const userId = req.user.userId || req.user.user_id;
    
    // Find candidate by user_id
    const candidate = await Candidate.findOne({
      where: { user_id: userId },
      transaction: t
    });
    
    if (!candidate) {
      await t.rollback();
      return res.status(404).json({
        success: false,
        message: 'Candidate profile not found'
      });
    }
    
    // Find the candidate test
    const candidateTest = await CandidateTest.findOne({
      where: {
        candidate_test_id: id,
        candidate_id: candidate.candidate_id,
        status: 'IN_PROGRESS'
      },
      include: [
        {
          model: Test,
          include: [
            {
              model: Question,
              through: {
                attributes: ['question_order', 'score_weight']
              }
            }
          ]
        },
        {
          model: CandidateTestAnswer,
          include: [
            {
              model: Question,
              attributes: ['question_id', 'question_type']
            }
          ]
        }
      ],
      transaction: t
    });
    
    if (!candidateTest) {
      await t.rollback();
      return res.status(404).json({
        success: false,
        message: 'Test not found or not in progress'
      });
    }
    
    // Calculate score for auto-gradable questions (multiple choice / single choice)
    let totalScore = 0;
    let totalWeight = 0;
    let pendingManualReview = false;
    
    // Process each question in the test
    for (const testQuestion of candidateTest.Test.Questions) {
      const weight = testQuestion.TestQuestion.score_weight || 1;
      totalWeight += weight;
      
      // Find answer for this question
      const answer = candidateTest.CandidateTestAnswers.find(a => 
        a.question_id === testQuestion.question_id
      );
      
      if (answer && answer.is_correct !== null && answer.is_correct !== 0) {
        // Auto-graded question that is correct
        if (answer.is_correct === 1 || answer.is_correct === true) {
          totalScore += weight;
        }
      } else if (testQuestion.question_type === 'TEXT' || testQuestion.question_type === 'ESSAY' || testQuestion.question_type === 'CODING') {
        // Text, essay or coding questions need manual review
        pendingManualReview = true;
      }
    }
    
    // Calculate percentage score
    const percentageScore = totalWeight > 0 ? (totalScore / totalWeight) * 100 : 0;
    
    // Determine if passing score is achieved
    const passingScore = candidateTest.Test.passing_score || 60;
    const isPassing = percentageScore >= passingScore && !pendingManualReview;
    
    // Update candidate test - only update fields that exist
    // Note: is_result_visible remains FALSE by default - recruiter must manually enable it
    const now = new Date();
    await candidateTest.update({
      status: 'COMPLETED',
      end_time: now,
      score: Math.round(percentageScore),
      passing_status: isPassing ? 'PASSED' : (pendingManualReview ? 'PENDING' : 'FAILED')
    }, { transaction: t });
    
    // Check if test result already exists
    let testResult = await CandidateTestResult.findOne({
      where: { candidate_test_id: id },
      transaction: t
    });
    
    if (testResult) {
      // Update existing result
      await testResult.update({
        total_score: Math.round(percentageScore),
        max_possible_score: 100,
        percentage: percentageScore.toFixed(2),
        passed: isPassing ? 1 : 0
      }, { transaction: t });
    } else {
      // Create new test result
      testResult = await CandidateTestResult.create({
        candidate_test_id: id,
        total_score: Math.round(percentageScore),
        max_possible_score: 100,
        percentage: percentageScore.toFixed(2),
        passed: isPassing ? 1 : 0
      }, { transaction: t });
    }
    
    // Commit transaction FIRST
    await t.commit();
    
    console.log('✅ Transaction committed successfully for test:', id);
    logger.info(`✅ Candidate Test ID ${id} completed with score ${percentageScore.toFixed(2)}% by candidate ${candidate.candidate_id}`);
    
    // Auto-save report data to /reports directory (ASYNC - don't block response)
    const reportController = require('./report.controller');
    const candidateName = `${candidate.first_name || ''} ${candidate.last_name || ''}`.trim() || 'Unknown';
    const candidateEmail = candidate.email || 'unknown@email.com';
    const testName = candidateTest.Test?.test_name || 'Unknown Test';
    
    reportController.saveTestCompletionData({
      candidate_test_id: id,
      test_id: candidateTest.test_id,
      candidate_id: candidate.candidate_id,
      candidate_name: candidateName,
      candidate_email: candidateEmail,
      test_name: testName,
      score: Math.round(percentageScore),
      percentage: percentageScore.toFixed(2),
      passed: isPassing,
      status: candidateTest.status,
      start_time: candidateTest.start_time,
      end_time: now,
      violations: [] // Can be populated if violations are tracked
    }).catch(err => {
      console.error('❌ Error saving report data:', err);
      // Don't fail the test completion if report saving fails
    });
    
    // Build response data (NO reload needed - we have the data already)
    const responseData = {
      candidate_test_id: id,
      status: 'COMPLETED',
      test_completed: true,
      is_result_visible: candidateTest.is_result_visible || false
    };
    
    // Only include score if result is visible
    if (candidateTest.is_result_visible) {
      responseData.score = Math.round(percentageScore);
      responseData.percentage = percentageScore.toFixed(2);
      responseData.passing_score = passingScore;
      responseData.passed = isPassing;
      responseData.passing_status = isPassing ? 'PASSED' : (pendingManualReview ? 'PENDING' : 'FAILED');
      responseData.pending_review = pendingManualReview;
    }
    
    console.log('📤 Sending completion response:', responseData);
    
    return res.status(200).json({
      success: true,
      message: 'Test completed successfully',
      data: responseData
    });
    
  } catch (error) {
    await t.rollback();
    console.error('❌ Error completing test:', error.message);
    console.error(error.stack);
    logger.error(`Error completing test: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Failed to complete test',
      error: error.message
    });
  }
};

// Log candidate test fraud event
exports.logFraudEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const { event_type, details } = req.body;
    
    // Find the candidate test
    const candidateTest = await CandidateTest.findOne({
      where: {
        candidate_test_id: id,
        status: 'IN_PROGRESS'
      }
    });
    
    if (!candidateTest) {
      return res.status(404).json({
        success: false,
        message: 'Test not found or not in progress'
      });
    }
    
    // Check if similar event was logged in the last 10 seconds
    const recentLog = await TestFraudLog.findOne({
      where: {
        candidate_test_id: id,
        event_type,
        event_time: {
          [Op.gt]: new Date(new Date() - 10 * 1000) // Last 10 seconds
        }
      }
    });
    
    if (recentLog) {
      // Update event count
      await recentLog.update({
        event_count: recentLog.event_count + 1
      });
      
      return res.status(200).json({
        success: true,
        message: 'Fraud event count updated',
        data: recentLog
      });
    }
    
    // Create new log
    const fraudLog = await TestFraudLog.create({
      candidate_test_id: id,
      event_type,
      details,
      event_time: new Date(),
      event_count: 1
    });
    
    logger.info(`Fraud event logged for Candidate Test ID ${id}: ${event_type}`);
    
    return res.status(201).json({
      success: true,
      message: 'Fraud event logged successfully',
      data: fraudLog
    });
    
  } catch (error) {
    logger.error(`Error logging fraud event: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Failed to log fraud event',
      error: error.message
    });
  }
};

// Get all candidate tests (for admin/recruiter)
exports.getAllCandidateTests = async (req, res) => {
  try {
    const { 
      candidate_id, 
      test_id, 
      status, 
      page = 1, 
      limit = 10 
    } = req.query;
    
    const offset = (page - 1) * limit;
    const whereClause = {};
    
    // Filter by candidate if provided
    if (candidate_id) {
      whereClause.candidate_id = candidate_id;
    }
    
    // Filter by test if provided
    if (test_id) {
      whereClause.test_id = test_id;
    }
    
    // Filter by status if provided
    if (status) {
      whereClause.status = status;
    }
    
    // Get candidate tests with pagination
    const { count, rows: candidateTests } = await CandidateTest.findAndCountAll({
      where: whereClause,
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: offset,
      include: [
        {
          model: Candidate,
          attributes: ['candidate_id', 'first_name', 'last_name', 'email']
        },
        {
          model: Test,
          attributes: ['test_id', 'test_name', 'passing_score']
        },
        {
          model: CandidateTestResult,
          attributes: ['result_id', 'total_score', 'percentage', 'passed']
        }
      ]
    });
    
    return res.status(200).json({
      success: true,
      message: 'Candidate tests retrieved successfully',
      data: {
        candidateTests,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / limit)
        }
      }
    });
    
  } catch (error) {
    logger.error(`Error retrieving candidate tests: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve candidate tests',
      error: error.message
    });
  }
};

// Get candidate test details by ID
exports.getCandidateTestById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const candidateTest = await CandidateTest.findByPk(id, {
      include: [
        {
          model: Candidate,
          attributes: ['candidate_id', 'first_name', 'last_name', 'email']
        },
        {
          model: Test,
          include: [
            {
              model: Question,
              through: {
                attributes: ['question_order', 'score_weight']
              }
            }
          ]
        },
        {
          model: CandidateTestAnswer,
          include: [
            {
              model: Question,
              attributes: ['question_id', 'question_text', 'question_type'],
              include: [
                {
                  model: QuestionOption,
                  as: 'QuestionOptions',
                  attributes: ['option_id', 'option_text', 'is_correct']
                }
              ]
            }
          ]
        },
        {
          model: CandidateTestResult
        },
        {
          model: TestFraudLog
        }
      ]
    });
    
    if (!candidateTest) {
      return res.status(404).json({
        success: false,
        message: 'Candidate test not found'
      });
    }
    
    // Prepare response data with score info from result table
    const responseData = {
      candidate_test_id: candidateTest.candidate_test_id,
      test_id: candidateTest.test_id,
      candidate_id: candidateTest.candidate_id,
      status: candidateTest.status,
      start_time: candidateTest.start_time,
      end_time: candidateTest.end_time,
      is_result_visible: candidateTest.is_result_visible,
      Test: candidateTest.Test,
      Candidate: candidateTest.Candidate,
      CandidateTestAnswers: candidateTest.CandidateTestAnswers,
      TestFraudLogs: candidateTest.TestFraudLogs
    };
    
    // Add score information if result is visible and test is completed
    if (candidateTest.is_result_visible && candidateTest.status === 'COMPLETED' && candidateTest.CandidateTestResult) {
      responseData.score = candidateTest.CandidateTestResult.total_score || 0;
      responseData.percentage = parseFloat(candidateTest.CandidateTestResult.percentage || 0);
      responseData.passed = candidateTest.CandidateTestResult.passed || false;
      responseData.CandidateTestResult = candidateTest.CandidateTestResult;
    }
    
    return res.status(200).json({
      success: true,
      message: 'Candidate test retrieved successfully',
      data: responseData
    });
    
  } catch (error) {
    logger.error(`Error retrieving candidate test: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve candidate test',
      error: error.message
    });
  }
};

// Review and update candidate test results
exports.reviewCandidateTest = async (req, res) => {
  const t = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    const { 
      answers,
      strength_areas, 
      improvement_areas, 
      feedback 
    } = req.body;
    
    // Find candidate test
    const candidateTest = await CandidateTest.findByPk(id, {
      include: [
        {
          model: Test
        },
        {
          model: CandidateTestResult
        }
      ],
      transaction: t
    });
    
    if (!candidateTest) {
      await t.rollback();
      return res.status(404).json({
        success: false,
        message: 'Candidate test not found'
      });
    }
    
    if (candidateTest.status !== 'COMPLETED') {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: 'Cannot review a test that is not completed'
      });
    }
    
    // Update manually graded answers
    if (answers && answers.length > 0) {
      for (const answerData of answers) {
        const answer = await CandidateTestAnswer.findOne({
          where: {
            answer_id: answerData.answer_id,
            candidate_test_id: id
          },
          transaction: t
        });
        
        if (answer) {
          await answer.update({
            is_correct: answerData.is_correct,
            score: answerData.score,
            reviewed_at: new Date(),
            reviewer_id: req.userId
          }, { transaction: t });
        }
      }
    }
    
    // Recalculate test score
    const updatedAnswers = await CandidateTestAnswer.findAll({
      where: {
        candidate_test_id: id
      },
      include: [
        {
          model: Question,
          attributes: ['question_id'],
          include: [
            {
              model: Test,
              where: { test_id: candidateTest.test_id },
              through: {
                attributes: ['score_weight']
              },
              required: false
            }
          ]
        }
      ],
      transaction: t
    });
    
    let totalScore = 0;
    let totalWeight = 0;
    
    for (const answer of updatedAnswers) {
      if (answer.Question && answer.Question.Tests && answer.Question.Tests[0]) {
        const weight = answer.Question.Tests[0].TestQuestion.score_weight || 1;
        totalWeight += weight;
        
        if (answer.is_correct || (answer.score && answer.score > 0)) {
          if (answer.score) {
            totalScore += (answer.score / 100) * weight;
          } else {
            totalScore += weight;
          }
        }
      }
    }
    
    // Calculate percentage score
    const percentageScore = totalWeight > 0 ? (totalScore / totalWeight) * 100 : 0;
    
    // Determine if passing score is achieved
    const passingScore = candidateTest.Test.passing_score || 60;
    const isPassing = percentageScore >= passingScore;
    
    // Update candidate test score
    await candidateTest.update({
      score: Math.round(percentageScore)
    }, { transaction: t });
    
    // Update or create test result
    if (candidateTest.CandidateTestResult) {
      await candidateTest.CandidateTestResult.update({
        total_score: Math.round(percentageScore),
        percentage: percentageScore.toFixed(2),
        passed: isPassing,
        strength_areas,
        improvement_areas,
        feedback,
        reviewed_by: req.userId,
        reviewed_at: new Date()
      }, { transaction: t });
    } else {
      await CandidateTestResult.create({
        candidate_test_id: id,
        total_score: Math.round(percentageScore),
        max_possible_score: 100,
        percentage: percentageScore.toFixed(2),
        passed: isPassing,
        strength_areas,
        improvement_areas,
        feedback,
        reviewed_by: req.userId,
        reviewed_at: new Date()
      }, { transaction: t });
    }
    
    await t.commit();
    
    logger.info(`Candidate Test ID ${id} reviewed by User ID ${req.userId}`);
    
    return res.status(200).json({
      success: true,
      message: 'Test review saved successfully',
      data: {
        score: Math.round(percentageScore),
        percentage: percentageScore.toFixed(2),
        passing_score: passingScore,
        passed: isPassing
      }
    });
    
  } catch (error) {
    await t.rollback();
    logger.error(`Error reviewing candidate test: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Failed to review test',
      error: error.message
    });
  }
};

// Get my candidate tests (for authenticated candidates)
exports.getMyCandidateTests = async (req, res) => {
  try {
    const userId = req.user.userId || req.user.user_id;
    
    // Find candidate by user_id
    const candidate = await Candidate.findOne({
      where: { user_id: userId }
    });
    
    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: 'Candidate profile not found'
      });
    }
    
    // Get all tests for this candidate
    const candidateTests = await CandidateTest.findAll({
      where: { candidate_id: candidate.candidate_id },
      include: [
        {
          model: Test,
          attributes: ['test_id', 'test_name', 'description', 'duration_minutes', 'passing_score']
        },
        {
          model: CandidateTestResult,
          attributes: ['total_score', 'percentage', 'passed', 'reviewed_at']
        }
      ],
      order: [['created_at', 'DESC']]
    });
    
    // Map and hide scores if not visible
    const formattedTests = candidateTests.map(test => {
      const testData = test.toJSON();
      
      // Only show score/result if is_result_visible is true
      if (!testData.is_result_visible) {
        delete testData.score;
        delete testData.passing_status;
        testData.CandidateTestResult = null;
      }
      
      return testData;
    });
    
    return res.status(200).json({
      success: true,
      data: formattedTests
    });
    
  } catch (error) {
    logger.error(`Error getting my candidate tests: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Failed to get candidate tests',
      error: error.message
    });
  }
};

// Get candidate test details with answers
exports.getCandidateTestDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId || req.user.user_id;
    
    // Find candidate by user_id
    const candidate = await Candidate.findOne({
      where: { user_id: userId }
    });
    
    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: 'Candidate profile not found'
      });
    }
    
    // Get candidate test with full details
    const candidateTest = await CandidateTest.findOne({
      where: {
        candidate_test_id: id,
        candidate_id: candidate.candidate_id
      },
      include: [
        {
          model: Test,
          attributes: ['test_id', 'test_name', 'description', 'duration_minutes', 'passing_score'],
          include: [
            {
              model: Question,
              through: {
                attributes: ['question_order', 'score_weight']
              },
              include: [
                {
                  model: QuestionOption,
                  as: 'QuestionOptions',
                  attributes: ['option_id', 'option_text', 'is_correct']
                }
              ]
            }
          ]
        },
        {
          model: CandidateTestAnswer,
          include: [
            {
              model: Question,
              attributes: ['question_id', 'question_text', 'question_type'],
              include: [
                {
                  model: QuestionOption,
                  as: 'QuestionOptions',
                  attributes: ['option_id', 'option_text', 'is_correct']
                }
              ]
            }
          ]
        },
        {
          model: CandidateTestResult,
          attributes: ['total_score', 'percentage', 'passed', 'strength_areas', 'improvement_areas', 'feedback', 'reviewed_at']
        }
      ]
    });
    
    if (!candidateTest) {
      return res.status(404).json({
        success: false,
        message: 'Test not found or does not belong to you'
      });
    }
    
    // Format response - hide scores if not visible to candidate
    const formattedTest = {
      candidate_test_id: candidateTest.candidate_test_id,
      test: candidateTest.Test,
      status: candidateTest.status,
      start_time: candidateTest.start_time,
      end_time: candidateTest.end_time,
      is_result_visible: candidateTest.is_result_visible,
      created_at: candidateTest.created_at,
      answers: candidateTest.CandidateTestAnswers.map(answer => ({
        answer_id: answer.answer_id,
        question: answer.Question,
        selected_options: answer.selected_options,
        text_answer: answer.text_answer,
        code_answer: answer.code_answer,
        // Only show correctness if results are visible
        is_correct: candidateTest.is_result_visible ? answer.is_correct : null,
        submitted_at: answer.submitted_at
      }))
    };
    
    // Only include score and result if visible
    if (candidateTest.is_result_visible) {
      formattedTest.score = candidateTest.score;
      formattedTest.passing_status = candidateTest.passing_status;
      formattedTest.result = candidateTest.CandidateTestResult;
    }
    
    return res.status(200).json({
      success: true,
      data: formattedTest
    });
    
  } catch (error) {
    logger.error(`Error getting candidate test details: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Failed to get test details',
      error: error.message
    });
  }
};
