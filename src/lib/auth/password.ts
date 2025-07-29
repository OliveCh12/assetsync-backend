/**
 * Password Hashing Utilities
 * 
 * Secure password hashing and verification using bcryptjs.
 */

import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 12; // High security rounds

/**
 * Hash a plain text password
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
 * Generate a secure random token for password resets, email verification, etc.
 */
export const generateSecureToken = (): string => {
  const crypto = require('crypto');
  return crypto.randomBytes(32).toString('hex');
};
