/**
 * Password Utilities
 * 
 * Password hashing and verification using bcryptjs.
 */

import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';

const SALT_ROUNDS = 12; // Higher for better security

/**
 * Hash a password using bcrypt
 */
export const hashPassword = async (password: string): Promise<string> => {
  try {
    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    const hashedPassword = await bcrypt.hash(password, salt);
    return hashedPassword;
  } catch (error) {
    throw new Error(`Failed to hash password: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Verify a password against its hash
 */
export const verifyPassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  try {
    return await bcrypt.compare(password, hashedPassword);
  } catch (error) {
    throw new Error(`Failed to verify password: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Generate a secure random password reset token
 */
export const generateResetToken = (): string => {
  return randomBytes(32).toString('hex');
};

/**
 * Generate a secure random email verification token
 */
export const generateVerificationToken = (): string => {
  return randomBytes(32).toString('hex');
};

/**
 * Check password strength (basic implementation)
 */
export const checkPasswordStrength = (password: string): {
  score: number; // 0-4
  feedback: string[];
} => {
  const feedback: string[] = [];
  let score = 0;

  if (password.length >= 8) {
    score++;
  } else {
    feedback.push('Password should be at least 8 characters long');
  }

  if (/[a-z]/.test(password)) {
    score++;
  } else {
    feedback.push('Password should contain lowercase letters');
  }

  if (/[A-Z]/.test(password)) {
    score++;
  } else {
    feedback.push('Password should contain uppercase letters');
  }

  if (/[0-9]/.test(password)) {
    score++;
  } else {
    feedback.push('Password should contain numbers');
  }

  if (/[^A-Za-z0-9]/.test(password)) {
    score++;
  } else {
    feedback.push('Password should contain special characters');
  }

  return { score, feedback };
};
