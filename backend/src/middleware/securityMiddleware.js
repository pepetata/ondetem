/**
 * Comprehensive Security Middleware
 *
 * This module provides middleware for:
 * 1. XSS Protection
 * 2. Input Sanitization
 * 3. Security Headers
 * 4. Rate Limiting
 * 5. File Upload Protection
 */

const helmet = require("helmet");
const { XSSProtection } = require("../utils/xssProtection");
const winston = require("winston");

// Create logger for security events
const securityLogger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: "logs/security.log" }),
    ...(process.env.NODE_ENV !== "production"
      ? [new winston.transports.Console()]
      : []),
  ],
});

/**
 * Security Middleware Class
 */
class SecurityMiddleware {
  /**
   * Apply all security middlewares to Express app
   * @param {Object} app - Express app instance
   */
  static applyAll(app) {
    // Basic security headers with helmet
    app.use(
      helmet({
        contentSecurityPolicy: false, // We'll set custom CSP
        crossOriginEmbedderPolicy: false, // Allow external resources
        hsts: {
          maxAge: 31536000,
          includeSubDomains: true,
          preload: true,
        },
      })
    );

    // Custom security headers
    app.use(this.securityHeaders());

    // Content Security Policy
    app.use(this.contentSecurityPolicy());

    // Request logging
    app.use(this.requestLogger());

    // Input sanitization for API routes
    app.use("/api", this.sanitizeQuery());
    app.use("/api", this.sanitizeParams());
    app.use("/api", this.sanitizeBody());

    // Rate limiting for sensitive endpoints
    // Be more lenient in test environment
    const isTestEnv =
      process.env.NODE_ENV === "test" || process.env.E2E === "true";

    app.use(
      "/api/auth",
      this.rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        maxRequests: isTestEnv ? 1000 : 5, // Allow many more requests in test
        message: "Muitas tentativas de login. Tente novamente em 15 minutos.",
      })
    );

    app.use(
      "/api/users",
      this.rateLimit({
        windowMs: 10 * 60 * 1000, // 10 minutes
        maxRequests: isTestEnv ? 1000 : 20, // Allow many more requests in test
        message: "Muitas operações de usuário. Tente novamente em 10 minutos.",
      })
    );

    // File upload protection for specific routes
    app.use("/api/users/upload", this.fileUploadProtection());
    app.use("/api/ads/upload", this.fileUploadProtection());
    app.use("/api/users/images", this.fileUploadProtection());
    app.use("/api/ads/images", this.fileUploadProtection());
  }

  /**
   * Security headers middleware
   * @returns {Function} Express middleware
   */
  static securityHeaders() {
    return (req, res, next) => {
      // Content Security Policy
      const isDevelopment = process.env.NODE_ENV === "development";
      const csp = XSSProtection.generateCSP({
        allowInlineStyles: isDevelopment,
        allowInlineScripts: false,
        allowEval: false,
        additionalSources: {
          "script-src": isDevelopment ? ["'unsafe-inline'"] : [],
          "connect-src": ["ws:", "wss:"], // For development hot reload
        },
      });
      res.setHeader("Content-Security-Policy", csp);

      // HSTS header for HTTPS
      if (req.secure || req.headers["x-forwarded-proto"] === "https") {
        res.setHeader(
          "Strict-Transport-Security",
          "max-age=31536000; includeSubDomains"
        );
      }

      // XSS Protection
      res.setHeader("X-XSS-Protection", "1; mode=block");

      // Content Type Options
      res.setHeader("X-Content-Type-Options", "nosniff");

      // Frame Options
      res.setHeader("X-Frame-Options", "DENY");

      // Referrer Policy
      res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");

      // Permissions Policy
      res.setHeader(
        "Permissions-Policy",
        "camera=(), microphone=(), geolocation=(), payment=()"
      );

      // Remove server information
      res.removeHeader("X-Powered-By");

      next();
    };
  }

  /**
   * Content Security Policy middleware
   * @returns {Function} Express middleware
   */
  static contentSecurityPolicy() {
    return (req, res, next) => {
      const isDevelopment = process.env.NODE_ENV === "development";

      const csp = XSSProtection.generateCSP({
        allowInlineStyles: isDevelopment,
        allowInlineScripts: false,
        allowEval: false,
        additionalSources: {
          "script-src": isDevelopment ? ["'unsafe-inline'"] : [],
          "connect-src": ["ws:", "wss:"], // For development hot reload
        },
      });

      res.setHeader("Content-Security-Policy", csp);

      // Report-only mode for development
      if (isDevelopment) {
        res.setHeader("Content-Security-Policy-Report-Only", csp);
      }

      next();
    };
  }

  /**
   * Request logging middleware
   * @returns {Function} Express middleware
   */
  static requestLogger() {
    return (req, res, next) => {
      const startTime = Date.now();

      // Log suspicious requests
      const suspiciousPatterns = [
        /\.\.\//, // Path traversal
        /<script/i, // Script injection in URL
        /javascript:/i, // JavaScript protocol
        /on\w+=/i, // Event handlers
        /eval\(/i, // Eval function
        /union\s+select/i, // SQL injection
      ];

      const fullUrl = req.originalUrl || req.url;
      const userAgent = req.get("User-Agent") || "";

      for (const pattern of suspiciousPatterns) {
        if (pattern.test(fullUrl) || pattern.test(userAgent)) {
          securityLogger.warn({
            type: "SUSPICIOUS_REQUEST",
            method: req.method,
            url: fullUrl,
            userAgent,
            ip: req.ip || req.connection.remoteAddress,
            pattern: pattern.toString(),
            timestamp: new Date(),
          });
          break;
        }
      }

      // Log response time on finish
      res.on("finish", () => {
        const duration = Date.now() - startTime;

        if (duration > 5000) {
          // Log slow requests
          securityLogger.info({
            type: "SLOW_REQUEST",
            method: req.method,
            url: fullUrl,
            duration,
            statusCode: res.statusCode,
            timestamp: new Date(),
          });
        }
      });

      next();
    };
  }

  /**
   * Query parameter sanitization middleware
   * @returns {Function} Express middleware
   */
  static sanitizeQuery() {
    return (req, res, next) => {
      if (req.query && typeof req.query === "object") {
        try {
          const sanitized = {};

          for (const [key, value] of Object.entries(req.query)) {
            const cleanKey = XSSProtection.sanitizeUserInput(key, {
              maxLength: 50,
              allowHTML: false,
              stripTags: true,
            });

            if (cleanKey) {
              if (Array.isArray(value)) {
                sanitized[cleanKey] = value
                  .map((v) =>
                    XSSProtection.sanitizeUserInput(String(v), {
                      maxLength: 500,
                      allowHTML: false,
                      stripTags: true,
                    })
                  )
                  .filter(Boolean);
              } else {
                const cleanValue = XSSProtection.sanitizeUserInput(
                  String(value),
                  {
                    maxLength: 500,
                    allowHTML: false,
                    stripTags: true,
                  }
                );
                if (cleanValue !== null) {
                  sanitized[cleanKey] = cleanValue;
                }
              }
            }
          }

          // Store sanitized query in a new property to avoid overwriting readonly property
          req.sanitizedQuery = sanitized;
          req.originalQuery = req.query; // Keep reference to original
        } catch (error) {
          // If sanitization fails, continue with original query but log the error
          securityLogger.error({
            type: "QUERY_SANITIZATION_ERROR",
            error: error.message,
            method: req.method,
            url: req.originalUrl,
            timestamp: new Date(),
          });
        }
      }

      next();
    };
  }

  /**
   * URL parameter sanitization middleware
   * @returns {Function} Express middleware
   */
  static sanitizeParams() {
    return (req, res, next) => {
      if (req.params && typeof req.params === "object") {
        const sanitized = {};

        for (const [key, value] of Object.entries(req.params)) {
          const cleanValue = XSSProtection.sanitizeUserInput(String(value), {
            maxLength: 100,
            allowHTML: false,
            stripTags: true,
            allowEmptyString: false,
          });

          if (cleanValue !== null) {
            sanitized[key] = cleanValue;
          }
        }

        req.params = sanitized;
      }

      next();
    };
  }

  /**
   * Input sanitization middleware (combined)
   * @returns {Function} Express middleware
   */
  static inputSanitization() {
    return (req, res, next) => {
      try {
        // Sanitize body
        if (req.body && typeof req.body === "object") {
          req.body = XSSProtection.sanitizeObject(req.body);
        }

        // Sanitize query
        if (req.query && typeof req.query === "object") {
          req.query = XSSProtection.sanitizeObject(req.query);
        }

        // Sanitize params
        if (req.params && typeof req.params === "object") {
          req.params = XSSProtection.sanitizeObject(req.params);
        }

        next();
      } catch (error) {
        securityLogger.error({
          type: "INPUT_SANITIZATION_ERROR",
          error: error.message,
          method: req.method,
          url: req.originalUrl,
          timestamp: new Date(),
        });

        return res.status(400).json({
          error: "Invalid input data",
          message: "Input validation failed",
        });
      }
    };
  }

  /**
   * Request body sanitization middleware
   * @returns {Function} Express middleware
   */
  static sanitizeBody() {
    return (req, res, next) => {
      if (req.body && typeof req.body === "object") {
        try {
          req.body = XSSProtection.sanitizeObject(req.body);
          req.sanitizedBody = true; // Flag to indicate sanitization
        } catch (error) {
          securityLogger.error({
            type: "BODY_SANITIZATION_ERROR",
            error: error.message,
            method: req.method,
            url: req.originalUrl,
            timestamp: new Date(),
          });

          return res.status(400).json({
            error: "Invalid request data",
          });
        }
      }

      next();
    };
  }

  /**
   * File upload protection middleware
   * @returns {Function} Express middleware
   */
  static fileUploadProtection() {
    return (req, res, next) => {
      if (req.files || req.file) {
        const files = req.files ? Object.values(req.files).flat() : [req.file];

        for (const file of files) {
          if (!file) continue;

          // Sanitize filename
          if (file.originalname) {
            file.originalname = XSSProtection.sanitizeFilename(
              file.originalname
            );
          }

          if (file.filename) {
            file.filename = XSSProtection.sanitizeFilename(file.filename);
          }

          // Validate file type
          const allowedMimeTypes = [
            "image/jpeg",
            "image/jpg",
            "image/png",
            "image/gif",
            "image/webp",
            "image/svg+xml",
          ];

          const allowedExtensions = [
            ".jpg",
            ".jpeg",
            ".png",
            ".gif",
            ".webp",
            ".svg",
          ];

          // Check MIME type first for clearly dangerous files
          if (!allowedMimeTypes.includes(file.mimetype)) {
            // If it's a clearly dangerous extension, use extension error
            const fileExtension = file.originalname
              ? file.originalname
                  .substring(file.originalname.lastIndexOf("."))
                  .toLowerCase()
              : "";

            const dangerousExtensions = [".php", ".js", ".html", ".htm"];

            if (fileExtension && dangerousExtensions.includes(fileExtension)) {
              return res.status(400).json({
                error: "File extension not allowed",
                allowedExtensions: allowedExtensions,
              });
            }

            securityLogger.warn({
              type: "INVALID_FILE_TYPE",
              mimetype: file.mimetype,
              originalname: file.originalname,
              size: file.size,
              timestamp: new Date(),
            });

            return res.status(400).json({
              error: "File type not allowed",
              allowedTypes: allowedMimeTypes,
            });
          }

          // Check file size (10MB max)
          if (file.size > 10 * 1024 * 1024) {
            return res.status(400).json({
              error: "File too large",
              maxSize: "10.00 MB",
            });
          }

          // Check for malicious content in SVG files
          if (file.mimetype === "image/svg+xml" && file.buffer) {
            const svgContent = file.buffer.toString("utf8");
            const dangerousPatterns = [
              /<script/i,
              /javascript:/i,
              /on\w+=/i,
              /<iframe/i,
              /<object/i,
              /<embed/i,
            ];

            for (const pattern of dangerousPatterns) {
              if (pattern.test(svgContent)) {
                securityLogger.warn({
                  type: "MALICIOUS_SVG_BLOCKED",
                  filename: file.originalname,
                  pattern: pattern.toString(),
                  timestamp: new Date(),
                });

                return res.status(400).json({
                  error: "Arquivo SVG contém conteúdo perigoso.",
                });
              }
            }
          }
        }
      }

      next();
    };
  }

  /**
   * Rate limiting middleware
   * @param {Object} options - Rate limiting options
   * @returns {Function} Express middleware
   */
  static rateLimit(options = {}) {
    const {
      windowMs = 15 * 60 * 1000, // 15 minutes
      maxRequests = 100,
      message = "Muitas tentativas. Tente novamente mais tarde.",
      skipSuccessfulRequests = false,
    } = options;

    const requestCounts = new Map();

    return (req, res, next) => {
      const clientIP = req.ip || req.connection.remoteAddress;
      const now = Date.now();
      const windowStart = now - windowMs;

      // Clean old entries
      for (const [ip, requests] of requestCounts.entries()) {
        const filtered = requests.filter((time) => time > windowStart);
        if (filtered.length === 0) {
          requestCounts.delete(ip);
        } else {
          requestCounts.set(ip, filtered);
        }
      }

      // Check current client
      const clientRequests = requestCounts.get(clientIP) || [];

      if (clientRequests.length >= maxRequests) {
        securityLogger.warn({
          type: "RATE_LIMIT_EXCEEDED",
          ip: clientIP,
          requests: clientRequests.length,
          limit: maxRequests,
          windowMs,
          timestamp: new Date(),
        });

        res.setHeader("Retry-After", Math.ceil(windowMs / 1000));
        return res.status(429).json({
          error: message,
          retryAfter: Math.ceil(windowMs / 1000),
        });
      }

      // Add current request
      if (!skipSuccessfulRequests || res.statusCode >= 400) {
        clientRequests.push(now);
        requestCounts.set(clientIP, clientRequests);
      }

      // Set rate limit headers
      res.setHeader("X-RateLimit-Limit", maxRequests);
      res.setHeader(
        "X-RateLimit-Remaining",
        Math.max(0, maxRequests - clientRequests.length)
      );
      res.setHeader(
        "X-RateLimit-Reset",
        Math.ceil((windowStart + windowMs) / 1000)
      );

      next();
    };
  }

  /**
   * Rate limiter alias for consistency with tests
   * @param {Object} options - Rate limiting options
   * @returns {Function} Express middleware
   */
  static rateLimiter(options = {}) {
    return this.rateLimit(options);
  }

  /**
   * Error handling middleware for security errors
   * @returns {Function} Express error middleware
   */
  static errorHandler() {
    return (err, req, res, next) => {
      const timestamp = new Date().toISOString();
      const requestId = req.id || Math.random().toString(36).substr(2, 9);

      // Handle security errors
      if (err.type === "SECURITY_ERROR") {
        securityLogger.error({
          type: "SECURITY_ERROR",
          error: err.message,
          stack: err.stack,
          method: req.method,
          url: req.originalUrl,
          ip: req.ip,
          timestamp: new Date(),
        });

        return res.status(403).json({
          error: "Security violation detected",
          timestamp,
          requestId,
          ...(process.env.NODE_ENV === "development" && {
            debug: {
              message: err.message,
              stack: err.stack,
            },
          }),
        });
      }

      // Handle validation errors
      if (err.type === "VALIDATION_ERROR" || err.name === "ValidationError") {
        return res.status(400).json({
          error: "Input validation failed",
          details: err.message,
          timestamp,
          requestId,
        });
      }

      // Handle rate limit errors
      if (err.type === "RATE_LIMIT_ERROR") {
        return res.status(429).json({
          error: "Too many requests",
          retryAfter: 60,
          timestamp,
          requestId,
        });
      }

      // Log other security-related errors
      if (
        err.message.includes("XSS") ||
        err.message.includes("injection") ||
        err.message.includes("security")
      ) {
        securityLogger.error({
          type: "SECURITY_ERROR",
          error: err.message,
          stack: err.stack,
          method: req.method,
          url: req.originalUrl,
          ip: req.ip,
          timestamp: new Date(),
        });

        return res.status(400).json({
          error: "Invalid request data",
          timestamp,
          requestId,
        });
      }

      next(err);
    };
  }
}

module.exports = SecurityMiddleware;
