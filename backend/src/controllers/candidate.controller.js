const { Candidate, User, CandidateResume, JobPosition, CandidateJobApplication } = require('../models');
const logger = require('../utils/logger');
const { Op } = require('sequelize');
const sequelize = require('../config/database');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Create a new candidate
exports.createCandidate = async (req, res) => {
  const t = await sequelize.transaction();
  
  try {
    const { 
      user_id,
      first_name, 
      last_name, 
      email, 
      phone,
      current_position,
      years_of_experience,
      education,
      skills,
      source,
      notes,
      status
    } = req.body;

    // Validate required fields
    if (!first_name || !last_name || !email || !source) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: first_name, last_name, email, source'
      });
    }

    // Check if user_id is provided and already has a candidate profile
    if (user_id) {
      const existingByUser = await Candidate.findOne({ 
        where: { user_id },
        transaction: t
      });

      if (existingByUser) {
        await t.rollback();
        return res.status(400).json({ 
          success: false, 
          message: 'User already has a candidate profile',
          data: existingByUser
        });
      }
    }

    // Check if candidate with the same email already exists
    if (email) {
      const existingCandidate = await Candidate.findOne({ 
        where: { email },
        transaction: t
      });

      if (existingCandidate) {
        await t.rollback();
        return res.status(400).json({ 
          success: false, 
          message: 'Candidate with this email already exists' 
        });
      }
    }

    // Create candidate - Always set status to NEW for new candidates
    const candidate = await Candidate.create({
      user_id: user_id || null,
      first_name,
      last_name,
      email,
      phone,
      current_position,
      years_of_experience: years_of_experience ? parseInt(years_of_experience) : null,
      education,
      skills,
      source,
      notes,
      status: 'NEW' // Always NEW for new candidates from recruiter
    }, { transaction: t });

    // Handle resume upload if file is present
    let resumeData = null;
    if (req.file) {
      try {
        // Save resume file info to database
        const resumeFileName = req.file.filename;
        const resumeFilePath = `/uploads/cv/${resumeFileName}`;
        
        resumeData = await CandidateResume.create({
          candidate_id: candidate.candidate_id,
          file_name: req.file.originalname,
          file_path: resumeFilePath,
          file_size: req.file.size,
          file_type: req.file.mimetype,
          is_primary: true
        }, { transaction: t });

        logger.info(`✅ Resume uploaded for candidate ${candidate.candidate_id}: ${resumeFileName}`);
      } catch (resumeError) {
        logger.error(`Error saving resume: ${resumeError.message}`);
        // Continue even if resume save fails
      }
    }

    await t.commit();
    
    // Logging chi tiết
    if (user_id) {
      logger.info(`✅ Created candidate profile for user_id: ${user_id}, candidate_id: ${candidate.candidate_id}`);
    } else {
      logger.info(`✅ New candidate created: ${candidate.first_name} ${candidate.last_name} (ID: ${candidate.candidate_id})`);
    }
    
    return res.status(201).json({
      success: true,
      message: 'Candidate created successfully',
      data: {
        ...candidate.toJSON(),
        resume: resumeData ? {
          file_name: resumeData.file_name,
          file_path: resumeData.file_path
        } : null
      }
    });
    
  } catch (error) {
    await t.rollback();
    
    // Clean up uploaded file if exists
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
        logger.info(`Cleaned up uploaded file: ${req.file.filename}`);
      } catch (cleanupError) {
        logger.error(`Failed to cleanup file: ${cleanupError.message}`);
      }
    }
    
    logger.error(`Error creating candidate: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Failed to create candidate',
      error: error.message
    });
  }
};

// Get all candidates with filtering options
exports.getAllCandidates = async (req, res) => {
  try {
    const { 
      status, 
      search, 
      sort = 'created_at',
      order = 'DESC',
      page = 1,
      limit = 10
    } = req.query;
    
    const offset = (page - 1) * limit;
    const whereClause = {};
    
    // Add filter by status if provided
    if (status) {
      whereClause.status = status;
    }
    
    // Add search filter if provided
    if (search) {
      whereClause[Op.or] = [
        { first_name: { [Op.like]: `%${search}%` } },
        { last_name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { current_position: { [Op.like]: `%${search}%` } },
        { skills: { [Op.like]: `%${search}%` } }
      ];
    }
    
    // Get candidates with pagination
    const { count, rows: candidates } = await Candidate.findAndCountAll({
      where: whereClause,
      order: [[sort, order]],
      limit: parseInt(limit),
      offset: offset,
      include: [
        {
          model: CandidateResume,
          attributes: ['resume_id', 'file_name', 'is_primary'],
          where: { is_primary: true },
          required: false
        }
      ]
    });
    
    return res.status(200).json({
      success: true,
      message: 'Candidates retrieved successfully',
      data: candidates,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    });
    
  } catch (error) {
    logger.error(`Error retrieving candidates: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve candidates',
      error: error.message
    });
  }
};

// Get candidate by ID
exports.getCandidateById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const candidate = await Candidate.findByPk(id, {
      include: [
        {
          model: CandidateResume,
          attributes: ['resume_id', 'file_name', 'file_path', 'file_type', 'uploaded_at', 'is_primary']
        },
        {
          model: User,
          attributes: ['user_id', 'username', 'email']
        },
        {
          model: CandidateJobApplication,
          include: [
            {
              model: JobPosition,
              attributes: ['position_id', 'title', 'department']
            }
          ]
        }
      ]
    });
    
    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: 'Candidate not found'
      });
    }
    
    return res.status(200).json({
      success: true,
      message: 'Candidate retrieved successfully',
      data: candidate
    });
    
  } catch (error) {
    logger.error(`Error retrieving candidate: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve candidate',
      error: error.message
    });
  }
};

// Get candidate by user_id
exports.getCandidateByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const candidate = await Candidate.findOne({
      where: { user_id: userId },
      include: [
        {
          model: User,
          attributes: ['user_id', 'username', 'email', 'full_name']
        }
      ]
    });
    
    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: 'Candidate profile not found for this user'
      });
    }
    
    return res.status(200).json({
      success: true,
      message: 'Candidate retrieved successfully',
      data: candidate
    });
    
  } catch (error) {
    logger.error(`Error retrieving candidate by user ID: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve candidate',
      error: error.message
    });
  }
};

// Update candidate
exports.updateCandidate = async (req, res) => {
  const t = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    const { 
      first_name, 
      last_name, 
      email, 
      phone,
      current_position,
      years_of_experience,
      education,
      skills,
      source,
      status,
      notes
    } = req.body;
    
    const candidate = await Candidate.findByPk(id, { transaction: t });
    
    if (!candidate) {
      await t.rollback();
      return res.status(404).json({
        success: false,
        message: 'Candidate not found'
      });
    }
    
    // Check if email is being changed and if it's already in use
    if (email && email !== candidate.email) {
      const existingCandidate = await Candidate.findOne({
        where: { email, candidate_id: { [Op.not]: id } },
        transaction: t
      });
      
      if (existingCandidate) {
        await t.rollback();
        return res.status(400).json({
          success: false,
          message: 'Email already in use by another candidate'
        });
      }
    }
    
    // Update candidate
    await candidate.update({
      first_name: first_name || candidate.first_name,
      last_name: last_name || candidate.last_name,
      email: email || candidate.email,
      phone: phone || candidate.phone,
      current_position: current_position || candidate.current_position,
      years_of_experience: years_of_experience || candidate.years_of_experience,
      education: education || candidate.education,
      skills: skills || candidate.skills,
      source: source || candidate.source,
      status: status || candidate.status,
      notes: notes || candidate.notes
    }, { transaction: t });
    
    await t.commit();
    
    logger.info(`Candidate updated: ${candidate.first_name} ${candidate.last_name}`);
    
    return res.status(200).json({
      success: true,
      message: 'Candidate updated successfully',
      data: candidate
    });
    
  } catch (error) {
    await t.rollback();
    logger.error(`Error updating candidate: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Failed to update candidate',
      error: error.message
    });
  }
};

// Upload candidate resume
exports.uploadResume = async (req, res) => {
  const t = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    
    if (!req.file) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }
    
    const candidate = await Candidate.findByPk(id, { transaction: t });
    
    if (!candidate) {
      await t.rollback();
      return res.status(404).json({
        success: false,
        message: 'Candidate not found'
      });
    }
    
    // Define upload directory
    const uploadDir = path.join(__dirname, '../../uploads/resumes');
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    const file = req.file;
    const fileExt = path.extname(file.originalname);
    const fileName = `${uuidv4()}${fileExt}`;
    const filePath = path.join(uploadDir, fileName);
    
    // Save file to disk
    fs.writeFileSync(filePath, file.buffer);
    
    // If this is the first resume, make it primary
    let isPrimary = true;
    const existingResumes = await CandidateResume.count({ 
      where: { candidate_id: id },
      transaction: t
    });
    
    if (existingResumes > 0) {
      isPrimary = false;
    }
    
    // Create resume record
    const resume = await CandidateResume.create({
      candidate_id: id,
      file_name: file.originalname,
      file_path: `/uploads/resumes/${fileName}`,
      file_type: file.mimetype,
      file_size: file.size,
      is_primary: isPrimary
    }, { transaction: t });
    
    await t.commit();
    
    logger.info(`Resume uploaded for candidate ID ${id}: ${file.originalname}`);
    
    return res.status(201).json({
      success: true,
      message: 'Resume uploaded successfully',
      data: resume
    });
    
  } catch (error) {
    await t.rollback();
    logger.error(`Error uploading resume: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Failed to upload resume',
      error: error.message
    });
  }
};

// Set primary resume
exports.setPrimaryResume = async (req, res) => {
  const t = await sequelize.transaction();
  
  try {
    const { candidateId, resumeId } = req.params;
    
    // Check if candidate exists
    const candidate = await Candidate.findByPk(candidateId, { transaction: t });
    
    if (!candidate) {
      await t.rollback();
      return res.status(404).json({
        success: false,
        message: 'Candidate not found'
      });
    }
    
    // Check if resume exists and belongs to the candidate
    const resume = await CandidateResume.findOne({
      where: {
        resume_id: resumeId,
        candidate_id: candidateId
      },
      transaction: t
    });
    
    if (!resume) {
      await t.rollback();
      return res.status(404).json({
        success: false,
        message: 'Resume not found or does not belong to this candidate'
      });
    }
    
    // Reset all resumes to non-primary
    await CandidateResume.update(
      { is_primary: false },
      { 
        where: { candidate_id: candidateId },
        transaction: t
      }
    );
    
    // Set selected resume as primary
    await resume.update({ is_primary: true }, { transaction: t });
    
    await t.commit();
    
    logger.info(`Set primary resume ${resumeId} for candidate ${candidateId}`);
    
    return res.status(200).json({
      success: true,
      message: 'Primary resume set successfully',
      data: resume
    });
    
  } catch (error) {
    await t.rollback();
    logger.error(`Error setting primary resume: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Failed to set primary resume',
      error: error.message
    });
  }
};

// Delete candidate
exports.deleteCandidate = async (req, res) => {
  const t = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    
    const candidate = await Candidate.findByPk(id, { transaction: t });
    
    if (!candidate) {
      await t.rollback();
      return res.status(404).json({
        success: false,
        message: 'Candidate not found'
      });
    }
    
    // Delete candidate
    await candidate.destroy({ transaction: t });
    
    await t.commit();
    
    logger.info(`Candidate deleted: ID ${id}`);
    
    return res.status(200).json({
      success: true,
      message: 'Candidate deleted successfully'
    });
    
  } catch (error) {
    await t.rollback();
    logger.error(`Error deleting candidate: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete candidate',
      error: error.message
    });
  }
};
