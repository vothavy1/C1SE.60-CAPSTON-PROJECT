const bcrypt = require('bcryptjs');
const { User, Candidate } = require('../models');
const logger = require('../utils/logger');

/**
 * Generate random password
 * Format: Uppercase + lowercase + numbers + special chars
 */
const generateRandomPassword = () => {
  const upperChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowerChars = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const specialChars = '@#$%';
  
  // Ensure at least one of each type
  let password = '';
  password += upperChars[Math.floor(Math.random() * upperChars.length)];
  password += lowerChars[Math.floor(Math.random() * lowerChars.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += specialChars[Math.floor(Math.random() * specialChars.length)];
  
  // Fill the rest (total 10 characters)
  const allChars = upperChars + lowerChars + numbers + specialChars;
  for (let i = 4; i < 10; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
};

/**
 * Generate username from email
 * Username = email address
 * Example: vothavy@gmail.com -> vothavy@gmail.com
 */
const generateUsername = async (email) => {
  // Use email as username directly
  return email.toLowerCase();
};

/**
 * Auto-create account for approved candidate OR reset password if exists
 * Creates a CANDIDATE role user account or resets password
 */
const createCandidateAccount = async (candidate) => {
  try {
    const username = await generateUsername(candidate.email); // username = email
    const plainPassword = generateRandomPassword();
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    // Check if candidate already has a user account
    if (candidate.user_id) {
      const existingUser = await User.findByPk(candidate.user_id);
      
      if (existingUser) {
        // Reset password for existing account
        await existingUser.update({ 
          password_hash: hashedPassword,
          is_active: true 
        });
        
        logger.info(`🔄 Reset password for user ${existingUser.user_id} (${username})`);
        
        return {
          user_id: existingUser.user_id,
          username: username,
          password: plainPassword,
          email: candidate.email,
          isReset: true
        };
      }
    }

    // Check if user with this email already exists
    const existingUser = await User.findOne({ 
      where: { 
        email: candidate.email
      } 
    });
    
    if (existingUser) {
      // Reset password for existing user
      await existingUser.update({ 
        password_hash: hashedPassword,
        is_active: true 
      });
      
      // Link existing user to candidate
      await candidate.update({ user_id: existingUser.user_id });
      
      logger.info(`🔄 Reset password and linked user ${existingUser.user_id} to candidate ${candidate.candidate_id}`);
      
      return {
        user_id: existingUser.user_id,
        username: username,
        password: plainPassword,
        email: candidate.email,
        isReset: true
      };
    }

    // Create new user account
    const newUser = await User.create({
      username: username,
      email: candidate.email,
      password_hash: hashedPassword,
      full_name: `${candidate.first_name} ${candidate.last_name}`,
      role_id: 4, // Set role_id as CANDIDATE (4)
      is_active: true
    });

    // Update candidate with user_id
    await candidate.update({ user_id: newUser.user_id });

    logger.info(`✅ Created user account ${newUser.user_id} (${username}) for candidate ${candidate.candidate_id}`);

    return {
      user_id: newUser.user_id,
      username: username,
      password: plainPassword, // Return plain password to send via email
      email: candidate.email,
      isReset: false
    };

  } catch (error) {
    logger.error(`❌ Failed to create/reset account for candidate ${candidate.candidate_id}:`, error);
    throw error;
  }
};

/**
 * Check if candidate needs account creation
 */
const needsAccountCreation = (candidate) => {
  // Create account if candidate doesn't have user_id
  return !candidate.user_id;
};

module.exports = {
  generateRandomPassword,
  generateUsername,
  createCandidateAccount,
  needsAccountCreation
};
