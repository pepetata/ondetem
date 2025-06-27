/**
 * SQL Security Unit Tests
 *
 * Tests the sqlSecurity.js SafePool class to ensure SQL injection prevention,
 * query validation, and logging functionality.
 */

const {
  SafePool,
  SafeQueryBuilder,
} = require("../../../src/utils/sqlSecurity");
const winston = require("winston");

// Mock winston logger
jest.mock("winston", () => ({
  createLogger: jest.fn(() => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  })),
  format: {
    combine: jest.fn(),
    timestamp: jest.fn(),
    json: jest.fn(),
  },
  transports: {
    File: jest.fn(),
    Console: jest.fn(),
  },
}));

// Mock the pg Pool
jest.mock("pg", () => {
  const mockPool = {
    query: jest.fn(),
    connect: jest.fn(),
    end: jest.fn(),
  };

  return {
    Pool: jest.fn(() => mockPool),
  };
});

describe("SafePool", () => {
  let safePool;
  let mockLogger;
  let mockPool;

  beforeEach(() => {
    jest.clearAllMocks();
    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    };

    // Get the mock pool instance
    const { Pool } = require("pg");
    mockPool = {
      query: jest.fn(),
      connect: jest.fn(),
      end: jest.fn(),
    };
    Pool.mockReturnValue(mockPool);
    winston.createLogger.mockReturnValue(mockLogger);

    safePool = new SafePool({
      connectionString: "postgresql://test:test@localhost:5432/test",
    });
  });

  describe("Query Validation", () => {
    it("should allow valid parameterized queries", async () => {
      const query = "SELECT * FROM users WHERE id = $1 AND email = $2";
      const params = ["user-123", "test@example.com"];

      mockPool.query.mockResolvedValue({ rows: [], rowCount: 0 });

      await safePool.safeQuery(query, params, "test_operation");

      expect(mockPool.query).toHaveBeenCalledWith(query, params);
      expect(mockLogger.info).toHaveBeenCalled();
    });

    it("should block queries with string concatenation patterns", async () => {
      const maliciousQuery =
        "SELECT * FROM users WHERE name = '" + "test" + "'";
      const params = [];

      await expect(
        safePool.safeQuery(maliciousQuery, params, "test_operation")
      ).rejects.toThrow("Potentially dangerous query pattern detected");

      expect(mockPool.query).not.toHaveBeenCalled();
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "DANGEROUS_QUERY_BLOCKED",
        })
      );
    });

    it("should block queries with template literal injection", async () => {
      const maliciousQuery = `SELECT * FROM users WHERE id = ${123}`;
      const params = [];

      await expect(
        safePool.safeQuery(maliciousQuery, params, "test_operation")
      ).rejects.toThrow("Potentially dangerous query pattern detected");

      expect(mockPool.query).not.toHaveBeenCalled();
    });

    it("should block queries with UNION attacks", async () => {
      const maliciousQuery =
        "SELECT id FROM users UNION SELECT password FROM admin_users";
      const params = [];

      await expect(
        safePool.safeQuery(maliciousQuery, params, "test_operation")
      ).rejects.toThrow("Potentially dangerous query pattern detected");

      expect(mockPool.query).not.toHaveBeenCalled();
    });

    it("should block queries with comment injection", async () => {
      const maliciousQuery =
        "SELECT * FROM users WHERE id = $1; -- DROP TABLE users";
      const params = ["user-123"];

      await expect(
        safePool.safeQuery(maliciousQuery, params, "test_operation")
      ).rejects.toThrow("Potentially dangerous query pattern detected");

      expect(mockPool.query).not.toHaveBeenCalled();
    });

    it("should validate parameter count matches placeholders", async () => {
      const query = "SELECT * FROM users WHERE id = $1 AND email = $2";
      const params = ["user-123"]; // Missing second parameter

      await expect(
        safePool.safeQuery(query, params, "test_operation")
      ).rejects.toThrow("Parameter count mismatch");

      expect(mockPool.query).not.toHaveBeenCalled();
    });

    it("should validate parameter placeholders are sequential", async () => {
      const query = "SELECT * FROM users WHERE id = $1 AND email = $3"; // Missing $2
      const params = ["user-123", "test@example.com"];

      await expect(
        safePool.safeQuery(query, params, "test_operation")
      ).rejects.toThrow("Invalid parameter sequence");

      expect(mockPool.query).not.toHaveBeenCalled();
    });
  });

  describe("Security Logging", () => {
    it("should log successful queries", async () => {
      const query = "SELECT * FROM users WHERE id = $1";
      const params = ["user-123"];

      mockPool.query.mockResolvedValue({
        rows: [{ id: "user-123" }],
        rowCount: 1,
      });

      await safePool.safeQuery(query, params, "test_operation");

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          operation: "test_operation",
          rowCount: 1,
          duration: expect.any(Number),
        })
      );
    });

    it("should log blocked malicious queries", async () => {
      const maliciousQuery = "SELECT * FROM users; DROP TABLE users; --";
      const params = [];

      await expect(
        safePool.safeQuery(maliciousQuery, params, "test_operation")
      ).rejects.toThrow();

      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "DANGEROUS_QUERY_BLOCKED",
          query: maliciousQuery,
          operation: "test_operation",
        })
      );
    });

    it("should log database errors", async () => {
      const query = "SELECT * FROM users WHERE id = $1";
      const params = ["user-123"];

      mockPool.query.mockRejectedValue(new Error("Connection timeout"));

      await expect(
        safePool.safeQuery(query, params, "test_operation")
      ).rejects.toThrow("Connection timeout");

      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          operation: "test_operation",
          error: "Connection timeout",
        })
      );
    });

    it("should log slow queries", async () => {
      const query = "SELECT * FROM users WHERE id = $1";
      const params = ["user-123"];

      // Mock a slow query
      mockPool.query.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve({ rows: [], rowCount: 0 }), 100)
          )
      );

      await safePool.safeQuery(query, params, "test_operation");

      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "SLOW_QUERY",
          operation: "test_operation",
          duration: expect.any(Number),
        })
      );
    });
  });

  describe("Performance Monitoring", () => {
    it("should track query execution time", async () => {
      const query = "SELECT * FROM users WHERE id = $1";
      const params = ["user-123"];

      mockPool.query.mockResolvedValue({ rows: [], rowCount: 0 });

      await safePool.safeQuery(query, params, "test_operation");

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          duration: expect.any(Number),
        })
      );
    });

    it("should track row count returned", async () => {
      const query = "SELECT * FROM users";
      const params = [];

      mockPool.query.mockResolvedValue({
        rows: [{ id: "1" }, { id: "2" }, { id: "3" }],
        rowCount: 3,
      });

      await safePool.safeQuery(query, params, "test_operation");

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          rowCount: 3,
        })
      );
    });
  });

  describe("Connection Management", () => {
    it("should handle connection pool properly", async () => {
      const query = "SELECT 1";
      const params = [];

      mockPool.query.mockResolvedValue({
        rows: [{ "?column?": 1 }],
        rowCount: 1,
      });

      await safePool.safeQuery(query, params, "health_check");

      expect(mockPool.query).toHaveBeenCalledWith(query, params);
    });

    it("should handle connection errors gracefully", async () => {
      const query = "SELECT * FROM users WHERE id = $1";
      const params = ["user-123"];

      mockPool.query.mockRejectedValue(new Error("ECONNREFUSED"));

      await expect(
        safePool.safeQuery(query, params, "test_operation")
      ).rejects.toThrow("ECONNREFUSED");

      expect(mockLogger.error).toHaveBeenCalled();
    });
  });
});

describe("SafeQueryBuilder", () => {
  let builder;

  beforeEach(() => {
    builder = new SafeQueryBuilder();
  });

  describe("Query Building", () => {
    it("should build basic SELECT query", () => {
      const query = builder
        .select(["id", "name", "email"])
        .from("users")
        .build();

      expect(query.text).toBe("SELECT id, name, email FROM users");
      expect(query.values).toEqual([]);
    });

    it("should build query with WHERE conditions", () => {
      const query = builder
        .select(["*"])
        .from("users")
        .where("id", "=", "user-123")
        .where("active", "=", true)
        .build();

      expect(query.text).toBe(
        "SELECT * FROM users WHERE id = $1 AND active = $2"
      );
      expect(query.values).toEqual(["user-123", true]);
    });

    it("should build query with ORDER BY", () => {
      const query = builder
        .select(["*"])
        .from("users")
        .orderBy("created_at", "DESC")
        .build();

      expect(query.text).toBe("SELECT * FROM users ORDER BY created_at DESC");
    });

    it("should build query with LIMIT and OFFSET", () => {
      const query = builder
        .select(["*"])
        .from("users")
        .limit(10)
        .offset(20)
        .build();

      expect(query.text).toBe("SELECT * FROM users LIMIT $1 OFFSET $2");
      expect(query.values).toEqual([10, 20]);
    });

    it("should build complex query with all clauses", () => {
      const query = builder
        .select(["id", "name", "email"])
        .from("users")
        .where("age", ">", 18)
        .where("city", "=", "São Paulo")
        .orderBy("name", "ASC")
        .limit(50)
        .offset(100)
        .build();

      expect(query.text).toBe(
        "SELECT id, name, email FROM users WHERE age > $1 AND city = $2 ORDER BY name ASC LIMIT $3 OFFSET $4"
      );
      expect(query.values).toEqual([18, "São Paulo", 50, 100]);
    });

    it("should handle LIKE operations for search", () => {
      const searchTerm = "john";
      const query = builder
        .select(["*"])
        .from("users")
        .where("name", "ILIKE", `%${searchTerm}%`)
        .build();

      expect(query.text).toBe("SELECT * FROM users WHERE name ILIKE $1");
      expect(query.values).toEqual([`%${searchTerm}%`]);
    });

    it("should handle IN operations", () => {
      const ids = ["id1", "id2", "id3"];
      const query = builder
        .select(["*"])
        .from("users")
        .where("id", "IN", ids)
        .build();

      expect(query.text).toBe("SELECT * FROM users WHERE id IN ($1, $2, $3)");
      expect(query.values).toEqual(ids);
    });
  });

  describe("Security Validation", () => {
    it("should prevent SQL injection in table names", () => {
      expect(() => {
        builder.from("users; DROP TABLE passwords; --");
      }).toThrow("Invalid table name");
    });

    it("should prevent SQL injection in column names", () => {
      expect(() => {
        builder.select(["id", "name; DROP TABLE users; --"]);
      }).toThrow("Invalid column name");
    });

    it("should prevent SQL injection in WHERE conditions", () => {
      expect(() => {
        builder.where("id; DROP TABLE users", "=", "value");
      }).toThrow("Invalid column name");
    });

    it("should validate operator whitelist", () => {
      expect(() => {
        builder.where("id", "CUSTOM_FUNCTION()", "value");
      }).toThrow("Invalid operator");
    });

    it("should sanitize ORDER BY columns", () => {
      expect(() => {
        builder.orderBy("name; DROP TABLE users", "ASC");
      }).toThrow("Invalid column name");
    });

    it("should validate ORDER BY direction", () => {
      expect(() => {
        builder.orderBy("name", "MALICIOUS");
      }).toThrow("Invalid sort direction");
    });
  });

  describe("Parameter Management", () => {
    it("should manage parameter placeholders correctly", () => {
      const query = builder
        .select(["*"])
        .from("users")
        .where("name", "=", "John")
        .where("age", ">", 25)
        .where("city", "=", "NYC")
        .build();

      expect(query.text).toBe(
        "SELECT * FROM users WHERE name = $1 AND age > $2 AND city = $3"
      );
      expect(query.values).toEqual(["John", 25, "NYC"]);
    });

    it("should handle null values properly", () => {
      const query = builder
        .select(["*"])
        .from("users")
        .where("deleted_at", "=", null)
        .build();

      expect(query.text).toBe("SELECT * FROM users WHERE deleted_at IS NULL");
      expect(query.values).toEqual([]);
    });

    it("should handle arrays in IN clauses", () => {
      const query = builder
        .select(["*"])
        .from("users")
        .where("role", "IN", ["admin", "moderator", "user"])
        .build();

      expect(query.text).toBe("SELECT * FROM users WHERE role IN ($1, $2, $3)");
      expect(query.values).toEqual(["admin", "moderator", "user"]);
    });
  });
});
