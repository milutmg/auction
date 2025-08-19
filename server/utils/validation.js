const validator = require('validator');

/**
 * Validate email format
 */
const isValidEmail = (email) => {
  if (!email || typeof email !== 'string') {
    return { isValid: false, message: 'Email is required' };
  }
  
  const trimmedEmail = email.trim().toLowerCase();
  
  if (!validator.isEmail(trimmedEmail)) {
    return { isValid: false, message: 'Please enter a valid email address' };
  }
  
  if (trimmedEmail.length > 255) {
    return { isValid: false, message: 'Email address is too long' };
  }
  
  return { isValid: true, sanitized: trimmedEmail };
};

/**
 * Validate full name
 */
const isValidFullName = (fullName) => {
  if (!fullName || typeof fullName !== 'string') {
    return { isValid: false, message: 'Full name is required' };
  }
  
  const trimmedName = fullName.trim();
  
  if (trimmedName.length < 2) {
    return { isValid: false, message: 'Name must be at least 2 characters long' };
  }
  
  if (trimmedName.length > 100) {
    return { isValid: false, message: 'Name must be less than 100 characters' };
  }
  
  // Allow letters, spaces, hyphens, apostrophes, and periods
  const nameRegex = /^[a-zA-Z\s\-'.]+$/;
  if (!nameRegex.test(trimmedName)) {
    return { isValid: false, message: 'Name can only contain letters, spaces, hyphens, apostrophes, and periods' };
  }
  
  // Prevent names with only spaces or special characters
  if (!/[a-zA-Z]/.test(trimmedName)) {
    return { isValid: false, message: 'Name must contain at least one letter' };
  }
  
  return { isValid: true, sanitized: trimmedName };
};

/**
 * Validate password strength
 */
const isValidPassword = (password) => {
  if (!password || typeof password !== 'string') {
    return { isValid: false, message: 'Password is required' };
  }
  
  if (password.length < 8) {
    return { isValid: false, message: 'Password must be at least 8 characters long' };
  }
  
  if (password.length > 128) {
    return { isValid: false, message: 'Password is too long (max 128 characters)' };
  }
  
  const hasLowercase = /[a-z]/.test(password);
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?\":{}|<>]/.test(password);
  
  if (!hasLowercase) {
    return { isValid: false, message: 'Password must contain at least one lowercase letter' };
  }
  
  if (!hasUppercase) {
    return { isValid: false, message: 'Password must contain at least one uppercase letter' };
  }
  
  if (!hasNumber) {
    return { isValid: false, message: 'Password must contain at least one number' };
  }
  
  // Check for common weak passwords
  const commonWeakPasswords = [
    'password', 'Password123', '12345678', 'qwerty123', 'Qwerty123',
    'admin123', 'welcome123', 'changeme', 'letmein', 'password1'
  ];
  
  if (commonWeakPasswords.includes(password)) {
    return { isValid: false, message: 'Password is too common. Please choose a stronger password' };
  }
  
  return { isValid: true };
};

/**
 * Calculate password strength score (0-5)
 */
const getPasswordStrength = (password) => {
  if (!password) return 0;
  
  let score = 0;
  const checks = {
    length: password.length >= 8,
    lowercase: /[a-z]/.test(password),
    uppercase: /[A-Z]/.test(password),
    number: /\d/.test(password),
    special: /[!@#$%^&*(),.?\":{}|<>]/.test(password)
  };
  
  score = Object.values(checks).filter(Boolean).length;
  
  // Bonus points for length
  if (password.length >= 12) score += 0.5;
  if (password.length >= 16) score += 0.5;
  
  return Math.min(Math.floor(score), 5);
};

/**
 * Sanitize string input
 */
const sanitizeString = (input, maxLength = 1000) => {
  if (!input || typeof input !== 'string') {
    return '';
  }
  
  return input.trim().slice(0, maxLength);
};

/**
 * Validate signup data
 */
const validateSignupData = (data) => {
  const errors = [];
  const sanitized = {};
  
  // Validate email
  const emailValidation = isValidEmail(data.email);
  if (!emailValidation.isValid) {
    errors.push({ field: 'email', message: emailValidation.message });
  } else {
    sanitized.email = emailValidation.sanitized;
  }
  
  // Validate full name
  const nameValidation = isValidFullName(data.fullName);
  if (!nameValidation.isValid) {
    errors.push({ field: 'fullName', message: nameValidation.message });
  } else {
    sanitized.fullName = nameValidation.sanitized;
  }
  
  // Validate password
  const passwordValidation = isValidPassword(data.password);
  if (!passwordValidation.isValid) {
    errors.push({ field: 'password', message: passwordValidation.message });
  } else {
    sanitized.password = data.password; // Don't modify the actual password
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    sanitized
  };
};

/**
 * Validate login data
 */
const validateLoginData = (data) => {
  const errors = [];
  const sanitized = {};
  
  // Validate email
  const emailValidation = isValidEmail(data.email);
  if (!emailValidation.isValid) {
    errors.push({ field: 'email', message: emailValidation.message });
  } else {
    sanitized.email = emailValidation.sanitized;
  }
  
  // Validate password presence (don't validate strength for login)
  if (!data.password || typeof data.password !== 'string') {
    errors.push({ field: 'password', message: 'Password is required' });
  } else if (data.password.length === 0) {
    errors.push({ field: 'password', message: 'Password cannot be empty' });
  } else {
    sanitized.password = data.password;
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    sanitized
  };
};

/**
 * Rate limiting helper
 */
const createRateLimiter = (windowMs = 15 * 60 * 1000, max = 5) => {
  const attempts = new Map();
  
  return (identifier) => {
    const now = Date.now();
    const key = identifier;
    
    if (!attempts.has(key)) {
      attempts.set(key, { count: 1, resetTime: now + windowMs });
      return { allowed: true, remaining: max - 1 };
    }
    
    const record = attempts.get(key);
    
    if (now > record.resetTime) {
      // Reset the window
      attempts.set(key, { count: 1, resetTime: now + windowMs });
      return { allowed: true, remaining: max - 1 };
    }
    
    if (record.count >= max) {
      return { 
        allowed: false, 
        remaining: 0, 
        resetTime: record.resetTime 
      };
    }
    
    record.count++;
    return { 
      allowed: true, 
      remaining: max - record.count 
    };
  };
};

/**
 * Validate user agent to detect suspicious activity
 */
const isValidUserAgent = (userAgent) => {
  if (!userAgent || typeof userAgent !== 'string') {
    return false;
  }
  
  // Basic checks for common bot patterns
  const botPatterns = [
    /bot/i, /crawler/i, /spider/i, /scraper/i,
    /wget/i, /curl/i, /python/i, /java/i
  ];
  
  return !botPatterns.some(pattern => pattern.test(userAgent));
};

module.exports = {
  isValidEmail,
  isValidFullName,
  isValidPassword,
  getPasswordStrength,
  sanitizeString,
  validateSignupData,
  validateLoginData,
  createRateLimiter,
  isValidUserAgent
};
