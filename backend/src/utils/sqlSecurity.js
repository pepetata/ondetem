/**
 * SQL Injection Prevention Utilities
 *
 * This module provides utilities to prevent SQL injection attacks by:
 * 1. Enforcing parameterized queries
 * 2. Input validation and sanitization
 * 3. Query logging and monitoring
 * 4. Safe query building helpers
 */

const { Pool } = require("pg");
const winston = require("winston");

// Create logger for SQL operations (created as a function to support testing)
const createSqlLogger = () =>
  winston.createLogger({
    level: "info",
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    ),
    transports: [
      new winston.transports.File({ filename: "logs/sql-queries.log" }),
      ...(process.env.NODE_ENV !== "production"
        ? [new winston.transports.Console()]
        : []),
    ],
  });

let sqlLogger = createSqlLogger();

/**
 * Safe Database Pool with SQL Injection Protection
 */
class SafePool {
  constructor(connectionString, options = {}) {
    this.pool = new Pool({ connectionString });
    this.queryCount = 0;
    this.suspiciousQueries = [];
    this.slowQueryThreshold =
      options.slowQueryThreshold ||
      (process.env.NODE_ENV === "test" ? 50 : 1000);
    // Create logger to pick up any mocks
    this.logger = createSqlLogger();
  }

  /**
   * Execute a parameterized query safely
   * @param {string} text - SQL query with placeholders ($1, $2, etc.)
   * @param {Array} params - Parameters for the query
   * @param {string} operation - Description of the operation (for logging)
   * @returns {Promise} Query result
   */
  async safeQuery(text, params = [], operation = "unknown") {
    const startTime = Date.now();

    try {
      // Validate that query uses parameterized format
      this.validateQuery(text, params, operation);

      // Log query for monitoring
      this.logQuery(text, params, operation);

      const result = await this.pool.query(text, params);
      const duration = Date.now() - startTime;

      // Log successful query
      this.logger.info({
        operation,
        duration,
        rowCount: result.rowCount,
        queryId: ++this.queryCount,
      });

      // Check for slow queries (warn if > threshold)
      if (duration > this.slowQueryThreshold) {
        this.logger.warn({
          type: "SLOW_QUERY",
          operation,
          duration,
          query: this.sanitizeQueryForLog(text),
        });
      }

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      // Log failed query
      this.logger.error({
        operation,
        error: error.message,
        query: this.sanitizeQueryForLog(text),
        queryId: ++this.queryCount,
      });
      throw error;
    }
  }

  /**
   * Validate query to ensure it uses parameterized format
   * @param {string} text - SQL query
   * @param {Array} params - Parameters
   * @param {string} operation - Operation name for logging
   */
  validateQuery(text, params, operation = "unknown") {
    // Check for potential SQL injection patterns
    const dangerousPatterns = [
      /;\s*(DROP|DELETE|INSERT|UPDATE|CREATE|ALTER)\s/i,
      /UNION\s+SELECT/i,
      /'\s*OR\s*'1'\s*=\s*'1/i,
      /'\s*OR\s*1\s*=\s*1/i,
      /--.*$/m, // SQL comments (including end of line)
      /\/\*[\s\S]*?\*\//, // Block comments
      /\${.*}/, // Template literal injection
      /\+.*\+/, // String concatenation
    ];

    // Check for dangerous patterns
    for (const pattern of dangerousPatterns) {
      if (pattern.test(text)) {
        const suspiciousQuery = {
          query: this.sanitizeQueryForLog(text),
          pattern: pattern.toString(),
          timestamp: new Date(),
          params: params.length,
        };

        this.suspiciousQueries.push(suspiciousQuery);

        this.logger.error({
          type: "DANGEROUS_QUERY_BLOCKED",
          operation,
          ...suspiciousQuery,
        });

        throw new Error("Potentially dangerous query pattern detected");
      }
    }

    // Additional check: queries with string literals instead of parameters
    // This helps catch queries that were built with string concatenation
    if (
      params.length === 0 &&
      (/WHERE\s+\w+\s*=\s*'[^']*'/i.test(text) || // String literal in WHERE
        /WHERE\s+\w+\s*=\s*\d+/i.test(text)) // Number literal in WHERE
    ) {
      const suspiciousQuery = {
        query: this.sanitizeQueryForLog(text),
        pattern: "unparameterized_query",
        timestamp: new Date(),
        params: params.length,
      };

      this.suspiciousQueries.push(suspiciousQuery);

      this.logger.error({
        type: "DANGEROUS_QUERY_BLOCKED",
        operation,
        ...suspiciousQuery,
      });

      throw new Error("Potentially dangerous query pattern detected");
    }

    // Validate parameter placeholders are sequential starting from $1
    const placeholders = text.match(/\$\d+/g) || [];
    const uniquePlaceholders = [...new Set(placeholders)];

    if (uniquePlaceholders.length > 0) {
      const numbers = uniquePlaceholders
        .map((p) => parseInt(p.substring(1)))
        .sort((a, b) => a - b);

      // Check if placeholders start from 1 and are sequential
      for (let i = 0; i < numbers.length; i++) {
        if (numbers[i] !== i + 1) {
          this.logger.error({
            type: "INVALID_PARAMETER_SEQUENCE",
            query: this.sanitizeQueryForLog(text),
            expectedSequence: Array.from(
              { length: numbers.length },
              (_, i) => i + 1
            ),
            actualSequence: numbers,
          });
          throw new Error("Invalid parameter sequence");
        }
      }

      // Ensure parameter count matches
      if (numbers.length !== params.length) {
        this.logger.error({
          type: "PARAMETER_MISMATCH",
          query: this.sanitizeQueryForLog(text),
          expectedParams: numbers.length,
          actualParams: params.length,
        });
        throw new Error(
          `Parameter count mismatch: expected ${numbers.length}, got ${params.length}`
        );
      }
    }
  }

  /**
   * Log query execution for monitoring
   * @param {string} text - SQL query
   * @param {Array} params - Parameters
   * @param {string} operation - Operation description
   */
  logQuery(text, params, operation) {
    if (process.env.NODE_ENV === "development") {
      this.logger.debug({
        operation,
        query: this.sanitizeQueryForLog(text),
        paramCount: params.length,
        timestamp: new Date(),
      });
    }
  }

  /**
   * Sanitize query for safe logging (remove sensitive data)
   * @param {string} query - SQL query
   * @returns {string} Sanitized query
   */
  sanitizeQueryForLog(query) {
    return query.replace(/\$\d+/g, "?");
  }

  /**
   * Get suspicious query statistics
   * @returns {Object} Statistics about suspicious queries
   */
  getSuspiciousQueryStats() {
    return {
      count: this.suspiciousQueries.length,
      recent: this.suspiciousQueries.slice(-10),
      lastDetected:
        this.suspiciousQueries.length > 0
          ? this.suspiciousQueries[this.suspiciousQueries.length - 1].timestamp
          : null,
    };
  }

  /**
   * Close the pool connection
   */
  async close() {
    await this.pool.end();
  }
}

/**
 * Input Sanitization Utilities for SQL Safety
 * Note: Use XSSProtection from xssProtection.js for comprehensive XSS prevention
 */
class InputSanitizer {
  /**
   * Sanitize string input to prevent SQL injection (lighter approach)
   * @param {string} input - Input string
   * @returns {string} Sanitized string
   */
  static sanitizeString(input) {
    if (typeof input !== "string") return input;

    // Only remove SQL-specific dangerous patterns, preserve user content
    return input
      .replace(/;\s*(DROP|DELETE|INSERT|UPDATE|CREATE|ALTER)/gi, "") // Remove dangerous SQL commands
      .replace(/--\s*$/gm, "") // Remove end-of-line SQL comments
      .replace(/\/\*[\s\S]*?\*\//g, "") // Remove block comments
      .replace(/\bUNION\s+SELECT\b/gi, "") // Remove UNION SELECT
      .trim();
  }

  /**
   * Validate and sanitize UUID
   * @param {string} uuid - UUID string
   * @returns {string|null} Valid UUID or null
   */
  static sanitizeUUID(uuid) {
    if (typeof uuid !== "string") return null;

    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid) ? uuid : null;
  }

  /**
   * Validate and sanitize email
   * @param {string} email - Email string
   * @returns {string|null} Valid email or null
   */
  static sanitizeEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return null;

    return email.toLowerCase().trim();
  }

  /**
   * Sanitize search terms for LIKE queries
   * @param {string} searchTerm - Search term
   * @returns {string} Sanitized search term
   */
  static sanitizeSearchTerm(searchTerm) {
    if (typeof searchTerm !== "string") return "";

    return searchTerm
      .replace(/[%_]/g, "\\$&") // Escape LIKE wildcards
      .replace(/['"]/g, "") // Remove quotes
      .replace(/;/g, "") // Remove semicolons
      .trim()
      .substring(0, 100); // Limit length
  }
}

/**
 * Query Builder with SQL Injection Protection
 */
class SafeQueryBuilder {
  constructor() {
    this.query = "";
    this.params = [];
    this.paramIndex = 1;
  }

  /**
   * Add SELECT clause safely
   * @param {string[]} fields - Field names
   * @returns {SafeQueryBuilder} this
   */
  select(fields) {
    if (!Array.isArray(fields)) {
      throw new Error("Fields must be an array");
    }

    // Validate each field name
    for (const field of fields) {
      if (field !== "*" && !/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(field)) {
        throw new Error(`Invalid column name: ${field}`);
      }
    }

    this.query = `SELECT ${fields.join(", ")}`;
    return this;
  }

  /**
   * Add FROM clause safely
   * @param {string} table - Table name
   * @returns {SafeQueryBuilder} this
   */
  from(table) {
    // Validate table name (only allow alphanumeric and underscore)
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(table)) {
      throw new Error(`Invalid table name: ${table}`);
    }

    this.query += ` FROM ${table}`;
    return this;
  }

  /**
   * Add WHERE clause safely
   * @param {string} field - Field name
   * @param {string} operator - Operator (=, LIKE, etc.)
   * @param {any} value - Value to compare
   * @returns {SafeQueryBuilder} this
   */
  where(field, operator, value) {
    // Validate field name (only allow alphanumeric and underscore)
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(field)) {
      throw new Error(`Invalid column name: ${field}`);
    }

    // Validate operator
    const allowedOperators = [
      "=",
      "!=",
      "<",
      ">",
      "<=",
      ">=",
      "LIKE",
      "ILIKE",
      "IN",
    ];
    if (!allowedOperators.includes(operator.toUpperCase())) {
      throw new Error(`Invalid operator: ${operator}`);
    }

    this.query += this.query.includes("WHERE") ? " AND " : " WHERE ";

    // Handle special cases
    if (value === null) {
      this.query += `${field} IS NULL`;
    } else if (operator.toUpperCase() === "IN" && Array.isArray(value)) {
      const placeholders = value.map(() => `$${this.paramIndex++}`).join(", ");
      this.query += `${field} IN (${placeholders})`;
      this.params.push(...value);
    } else {
      this.query += `${field} ${operator} $${this.paramIndex++}`;
      this.params.push(value);
    }

    return this;
  }

  /**
   * Add ORDER BY clause safely
   * @param {string} field - Field name
   * @param {string} direction - ASC or DESC
   * @returns {SafeQueryBuilder} this
   */
  orderBy(field, direction = "ASC") {
    // Validate field name
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(field)) {
      throw new Error(`Invalid column name: ${field}`);
    }

    // Validate direction
    if (!["ASC", "DESC"].includes(direction.toUpperCase())) {
      throw new Error(`Invalid sort direction: ${direction}`);
    }

    this.query += ` ORDER BY ${field} ${direction.toUpperCase()}`;
    return this;
  }

  /**
   * Add LIMIT clause safely
   * @param {number} limit - Limit number
   * @returns {SafeQueryBuilder} this
   */
  limit(limit) {
    const numLimit = parseInt(limit);
    if (isNaN(numLimit) || numLimit < 0 || numLimit > 1000) {
      throw new Error(`Invalid limit: ${limit}`);
    }

    this.query += ` LIMIT $${this.paramIndex++}`;
    this.params.push(numLimit);
    return this;
  }

  /**
   * Add OFFSET clause safely
   * @param {number} offset - Offset number
   * @returns {SafeQueryBuilder} this
   */
  offset(offset) {
    const numOffset = parseInt(offset);
    if (isNaN(numOffset) || numOffset < 0) {
      throw new Error(`Invalid offset: ${offset}`);
    }

    this.query += ` OFFSET $${this.paramIndex++}`;
    this.params.push(numOffset);
    return this;
  }

  /**
   * Get the built query and parameters
   * @returns {Object} {text, values}
   */
  build() {
    return {
      text: this.query,
      values: this.params,
    };
  }
}

// Create singleton instance
const safePool = new SafePool(process.env.DATABASE_URL);

module.exports = {
  SafePool,
  InputSanitizer,
  SafeQueryBuilder,
  safePool,
};
