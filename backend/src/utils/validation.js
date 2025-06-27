/**
 * Validation utilities for input data
 */

/**
 * Check if a string is a valid UUID v4
 * @param {string} uuid - The string to validate
 * @returns {boolean} - True if valid UUID, false otherwise
 */
const isValidUUID = (uuid) => {
  if (!uuid || typeof uuid !== "string") {
    return false;
  }

  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[4][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

/**
 * Check if a string is a valid email format
 * @param {string} email - The email to validate
 * @returns {boolean} - True if valid email format, false otherwise
 */
const isValidEmail = (email) => {
  if (!email || typeof email !== "string") {
    return false;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Check if a string is a valid integer
 * @param {string} str - The string to validate
 * @returns {boolean} - True if valid integer, false otherwise
 */
const isValidInteger = (str) => {
  if (!str || typeof str !== "string") {
    return false;
  }

  const num = parseInt(str, 10);
  return !isNaN(num) && num.toString() === str;
};

/**
 * Sanitize a string by removing potentially harmful characters
 * @param {string} str - The string to sanitize
 * @returns {string} - The sanitized string
 */
const sanitizeString = (str) => {
  if (!str || typeof str !== "string") {
    return "";
  }

  // Remove any script tags, null bytes, etc.
  return str
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/[\x00-\x1F\x7F]/g, "") // Remove control characters
    .trim();
};

module.exports = {
  isValidUUID,
  isValidEmail,
  isValidInteger,
  sanitizeString,
};
