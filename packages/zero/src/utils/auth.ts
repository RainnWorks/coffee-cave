import * as argon2 from "argon2";
import crypto from "crypto";

/**
 * Authentication utilities for secure password and PIN handling
 *
 * This module uses a combination of salt (unique per user) and pepper (application-wide secret)
 * to enhance security beyond standard hashing.
 */

/**
 * Generates a random salt for password hashing
 * @returns A randomly generated salt as a base64 string
 */
export const generateSalt = (): string => {
  return crypto.randomBytes(16).toString("base64");
};

/**
 * Hash a password or PIN using Argon2id with provided salt and application pepper
 * @param value - The password or PIN to hash
 * @param salt - The salt to use for hashing (unique per user)
 * @returns The hashed password/PIN
 */
export const hashWithSalt = async (
  value: string,
  salt: string
): Promise<string> => {
  const pepper = DMNO_CONFIG.AUTH_PEPPER;

  // Combine the value with salt and pepper before hashing
  const valueWithSaltAndPepper = `${value}${salt}${pepper}`;

  // Using Argon2id which balances resistance against GPU and side-channel attacks
  const hash = await argon2.hash(valueWithSaltAndPepper, {
    type: argon2.argon2id,
    // Recommended parameters for security
    memoryCost: 65536, // 64 MB
    timeCost: 3, // 3 iterations
    parallelism: 4, // 4 parallel threads
  });

  return hash;
};

/**
 * Verify a password or PIN against a stored hash
 * @param value - The password or PIN to verify
 * @param salt - The salt used when hashing
 * @param storedHash - The stored hash to compare against
 * @returns True if the password/PIN is correct, false otherwise
 */
export const verifyWithSalt = async (
  value: string,
  salt: string,
  storedHash: string
): Promise<boolean> => {
  const pepper = DMNO_CONFIG.AUTH_PEPPER;

  // Combine the value with salt and pepper, same as during hashing
  const valueWithSaltAndPepper = `${value}${salt}${pepper}`;

  // Verify the value against the stored hash
  return await argon2.verify(storedHash, valueWithSaltAndPepper);
};

/**
 * Create hash and salt for a new password/PIN
 * @param value - The password or PIN to secure
 * @returns Object containing hash and salt
 */
export const createHashAndSalt = async (
  value: string
): Promise<{ hash: string; salt: string }> => {
  const salt = generateSalt();
  const hash = await hashWithSalt(value, salt);
  return { hash, salt };
};
