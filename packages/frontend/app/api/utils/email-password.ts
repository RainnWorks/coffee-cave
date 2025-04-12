import crypto from "crypto";

export const buildEmail = (username: string) => {
  return `${username}@${DMNO_CONFIG.EMAIL_DOMAIN}`;
};

/**
 * Creates a secure password by hashing the pin with the email address
 * @param pin The user's PIN code
 * @param email The user's email address
 * @returns A secure hash of the pin and email
 */
export const createSecurePassword = (pin: string, username: string): string => {
  // Create a SHA-256 hash of the pin and email
  return crypto
    .createHash("sha256")
    .update(`${pin}:${buildEmail(username)}`)
    .digest("hex");
};
