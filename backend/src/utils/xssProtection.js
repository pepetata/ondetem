/**
 * Comprehensive XSS Prevention Utilities
 *
 * This module provides utilities to prevent XSS attacks by:
 * 1. HTML encoding and sanitization
 * 2. Script tag removal
 * 3. Attribute sanitization
 * 4. URL validation
 * 5. File upload security
 */

const DOMPurify = require("isomorphic-dompurify");
const validator = require("validator");
const winston = require("winston");

// Create logger for XSS protection
const xssLogger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: "logs/xss-protection.log" }),
    ...(process.env.NODE_ENV !== "production"
      ? [new winston.transports.Console()]
      : []),
  ],
});

/**
 * XSS Protection Class
 */
class XSSProtection {
  /**
   * Sanitize HTML content to prevent XSS
   * @param {string} input - HTML content
   * @param {Object} options - Sanitization options
   * @returns {string} Sanitized HTML
   */
  static sanitizeHTML(input, options = {}) {
    if (typeof input !== "string") return input;

    const defaultOptions = {
      ALLOWED_TAGS: ["p", "br", "strong", "em", "u", "ul", "ol", "li", "a"],
      ALLOWED_ATTR: ["href", "target"],
      FORBID_SCRIPTS: true,
      FORBID_TAGS: ["script", "object", "embed", "form", "input", "iframe"],
      FORBID_ATTR: [
        "onerror",
        "onload",
        "onclick",
        "onmouseover",
        "onfocus",
        "onblur",
        "style",
      ],
      ALLOW_DATA_ATTR: false,
      ...options,
    };

    try {
      const sanitized = DOMPurify.sanitize(input, defaultOptions);

      if (sanitized !== input) {
        xssLogger.warn({
          type: "HTML_SANITIZED",
          original: input.substring(0, 100),
          sanitized: sanitized.substring(0, 100),
          timestamp: new Date(),
        });
      }

      return sanitized;
    } catch (error) {
      xssLogger.error({
        type: "HTML_SANITIZATION_ERROR",
        error: error.message,
        input: input.substring(0, 100),
      });
      return this.htmlEncode(input);
    }
  }

  /**
   * Encode HTML entities to prevent XSS
   * @param {string} input - Input string
   * @returns {string} HTML encoded string
   */
  static htmlEncode(input) {
    if (typeof input !== "string") return input;

    return input
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#x27;")
      .replace(/\//g, "&#x2F;");
  }

  /**
   * Remove all script tags and javascript: URLs
   * @param {string} input - Input string
   * @returns {string} Cleaned string
   */
  static removeScripts(input) {
    if (typeof input !== "string") return input;

    const original = input;
    let cleaned = input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
      .replace(/javascript:/gi, "removed:")
      .replace(/on\w+\s*=/gi, "data-removed=")
      .replace(/expression\s*\(/gi, "removed(")
      .replace(/vbscript:/gi, "removed:")
      .replace(/data:text\/html/gi, "data:text/plain");

    if (cleaned !== original) {
      xssLogger.warn({
        type: "SCRIPT_REMOVED",
        original: original.substring(0, 100),
        cleaned: cleaned.substring(0, 100),
        timestamp: new Date(),
      });
    }

    return cleaned;
  }

  /**
   * Sanitize user input for display
   * @param {string} input - User input
   * @param {Object} options - Sanitization options
   * @returns {string} Sanitized input
   */
  static sanitizeUserInput(input, options = {}) {
    if (typeof input !== "string") return input;

    const {
      allowHTML = false,
      maxLength = 1000,
      stripTags = true,
      normalizeWhitespace = true,
      preserveLineBreaks = false,
      allowEmptyString = true,
    } = options;

    let sanitized = input;

    // Check for common XSS patterns
    this.detectXSSAttempts(sanitized);

    // Remove or encode HTML based on allowHTML setting
    if (allowHTML) {
      sanitized = this.sanitizeHTML(sanitized);
    } else if (stripTags) {
      sanitized = this.htmlEncode(sanitized);
    }

    // Remove scripts regardless of allowHTML setting
    sanitized = this.removeScripts(sanitized);

    // Normalize whitespace
    if (normalizeWhitespace) {
      if (preserveLineBreaks) {
        sanitized = sanitized.replace(/[ \t]+/g, " ");
      } else {
        sanitized = sanitized.replace(/\s+/g, " ");
      }
      sanitized = sanitized.trim();
    }

    // Handle empty strings
    if (!allowEmptyString && !sanitized.trim()) {
      return null;
    }

    // Limit length
    if (maxLength > 0) {
      sanitized = sanitized.substring(0, maxLength);
    }

    return sanitized;
  }

  /**
   * Detect XSS attempts and log them
   * @param {string} input - Input to check
   */
  static detectXSSAttempts(input) {
    const xssPatterns = [
      /<script/i,
      /javascript:/i,
      /on\w+\s*=/i,
      /<iframe/i,
      /document\.cookie/i,
      /document\.write/i,
      /eval\s*\(/i,
      /alert\s*\(/i,
      /prompt\s*\(/i,
      /confirm\s*\(/i,
      /<object/i,
      /<embed/i,
      /expression\s*\(/i,
      /vbscript:/i,
      /data:text\/html/i,
    ];

    for (const pattern of xssPatterns) {
      if (pattern.test(input)) {
        xssLogger.error({
          type: "XSS_ATTEMPT_DETECTED",
          pattern: pattern.toString(),
          input: input.substring(0, 200),
          timestamp: new Date(),
          severity: "HIGH",
        });
        break;
      }
    }
  }

  /**
   * Sanitize URL to prevent javascript: and data: schemes
   * @param {string} url - URL to sanitize
   * @returns {string|null} Safe URL or null
   */
  static sanitizeURL(url) {
    if (typeof url !== "string") return null;

    // Remove dangerous protocols
    const dangerousProtocols = [
      "javascript:",
      "data:text/html",
      "vbscript:",
      "file:",
      "ftp:",
    ];

    const lowerUrl = url.toLowerCase();
    for (const protocol of dangerousProtocols) {
      if (lowerUrl.startsWith(protocol)) {
        xssLogger.warn({
          type: "DANGEROUS_URL_BLOCKED",
          url: url.substring(0, 100),
          protocol,
          timestamp: new Date(),
        });
        return null;
      }
    }

    // Validate URL format
    try {
      if (
        !validator.isURL(url, {
          protocols: ["http", "https"],
          require_protocol: false,
          allow_underscores: true,
          allow_trailing_dot: false,
        })
      ) {
        return null;
      }
    } catch (error) {
      return null;
    }

    return url;
  }

  /**
   * Sanitize filename for upload
   * @param {string} filename - Original filename
   * @returns {string} Safe filename
   */
  static sanitizeFilename(filename) {
    if (typeof filename !== "string") return "file";

    const sanitized = filename
      .replace(/[^a-zA-Z0-9.-]/g, "_") // Replace special chars with underscore
      .replace(/\.+/g, ".") // Multiple dots to single dot
      .replace(/^\.+|\.+$/g, "") // Remove leading/trailing dots
      .substring(0, 100); // Limit length

    return sanitized || "file"; // Fallback name
  }

  /**
   * Validate and sanitize JSON input
   * @param {string} jsonString - JSON string
   * @returns {Object|null} Parsed and sanitized object or null
   */
  static sanitizeJSON(jsonString) {
    try {
      const parsed = JSON.parse(jsonString);
      return this.sanitizeObject(parsed);
    } catch (error) {
      xssLogger.warn({
        type: "INVALID_JSON",
        input: jsonString.substring(0, 100),
        error: error.message,
      });
      return null;
    }
  }

  /**
   * Recursively sanitize object properties
   * @param {Object} obj - Object to sanitize
   * @param {number} depth - Current recursion depth
   * @returns {Object} Sanitized object
   */
  static sanitizeObject(obj, depth = 0) {
    // Prevent deep recursion
    if (depth > 10) {
      xssLogger.warn({
        type: "DEEP_RECURSION_BLOCKED",
        depth,
        timestamp: new Date(),
      });
      return {};
    }

    if (typeof obj !== "object" || obj === null) {
      return this.sanitizeUserInput(String(obj));
    }

    if (Array.isArray(obj)) {
      return obj
        .slice(0, 100)
        .map((item) => this.sanitizeObject(item, depth + 1));
    }

    const sanitized = {};
    let propertyCount = 0;

    for (const [key, value] of Object.entries(obj)) {
      // Limit number of properties
      if (propertyCount >= 50) {
        xssLogger.warn({
          type: "TOO_MANY_PROPERTIES",
          count: Object.keys(obj).length,
          timestamp: new Date(),
        });
        break;
      }

      const cleanKey = this.sanitizeUserInput(key, {
        maxLength: 50,
        allowEmptyString: false,
      });
      if (cleanKey) {
        sanitized[cleanKey] = this.sanitizeObject(value, depth + 1);
        propertyCount++;
      }
    }

    return sanitized;
  }

  /**
   * Generate Content Security Policy
   * @param {Object} options - CSP options
   * @returns {string} CSP header value
   */
  static generateCSP(options = {}) {
    const {
      allowInlineStyles = false,
      allowInlineScripts = false,
      allowEval = false,
      additionalSources = {},
    } = options;

    const csp = {
      "default-src": ["'self'"],
      "script-src": ["'self'"],
      "style-src": ["'self'", "https://fonts.googleapis.com"],
      "font-src": ["'self'", "https://fonts.gstatic.com"],
      "img-src": ["'self'", "data:", "https:"],
      "connect-src": ["'self'", "https://api.themoviedb.org"],
      "frame-ancestors": ["'none'"],
      "base-uri": ["'self'"],
      "form-action": ["'self'"],
      "object-src": ["'none'"],
      "media-src": ["'self'"],
    };

    if (allowInlineStyles) {
      csp["style-src"].push("'unsafe-inline'");
    }

    if (allowInlineScripts) {
      csp["script-src"].push("'unsafe-inline'");
    }

    if (allowEval) {
      csp["script-src"].push("'unsafe-eval'");
    }

    // Add additional sources
    Object.entries(additionalSources).forEach(([directive, sources]) => {
      if (csp[directive]) {
        csp[directive] = csp[directive].concat(sources);
      }
    });

    return Object.entries(csp)
      .map(([directive, sources]) => `${directive} ${sources.join(" ")}`)
      .join("; ");
  }

  /**
   * Get XSS protection statistics
   * @returns {Object} Statistics
   */
  static getProtectionStats() {
    // This would typically read from logs or a database
    // For now, return a simple structure
    return {
      totalAttempts: 0,
      blockedToday: 0,
      commonPatterns: [],
      lastAttempt: null,
    };
  }
}

module.exports = {
  XSSProtection,
  xssLogger,
};
