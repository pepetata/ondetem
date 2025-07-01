const request = require("supertest");
const express = require("express");

// Mock the health manager before importing the router
const mockHealthManager = {
  getBasicHealth: jest.fn(),
  getDetailedHealth: jest.fn(),
  getReadiness: jest.fn(),
  getLiveness: jest.fn(),
  getSystemMetrics: jest.fn(),
  getApplicationMetrics: jest.fn(),
  recordMetrics: jest.fn(),
  prepareShutdown: jest.fn(),
  startTime: Date.now() - 20000, // Started 20 seconds ago
  dependencies: new Map([
    [
      "database",
      {
        critical: true,
        lastStatus: "healthy",
        consecutiveFailures: 0,
        lastCheck: new Date(),
      },
    ],
    [
      "cache",
      {
        critical: false,
        lastStatus: "healthy",
        consecutiveFailures: 0,
        lastCheck: new Date(),
      },
    ],
  ]),
};

jest.mock("../../../src/utils/healthCheck", () => ({
  healthManager: mockHealthManager,
}));

describe("Health Routes", () => {
  let app;

  beforeAll(() => {
    // Create Express app and import routes after mocks are set up
    app = express();
    app.use(express.json());

    // Import the health router after the mock is in place
    const healthRouter = require("../../../src/routes/health");
    app.use("/", healthRouter);
  });

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Setup default mock implementations
    mockHealthManager.getBasicHealth.mockResolvedValue({
      status: "healthy",
      timestamp: new Date().toISOString(),
    });

    mockHealthManager.getDetailedHealth.mockResolvedValue({
      status: "healthy",
      timestamp: new Date().toISOString(),
      dependencies: [],
    });

    mockHealthManager.getReadiness.mockResolvedValue({
      status: "ready",
      timestamp: new Date().toISOString(),
    });

    mockHealthManager.getLiveness.mockReturnValue({
      status: "alive",
      timestamp: new Date().toISOString(),
    });

    mockHealthManager.getSystemMetrics.mockResolvedValue({
      memory: { used: 100, total: 1000 },
      cpu: { usage: 50 },
    });

    mockHealthManager.getApplicationMetrics.mockReturnValue({
      requests: { total: 100, errors: 5 },
      uptime: 3600,
    });

    mockHealthManager.prepareShutdown.mockResolvedValue();
  });

  describe("GET /health", () => {
    it("should return healthy status when health check passes", async () => {
      const response = await request(app).get("/health").expect(200);

      expect(response.body.status).toBe("healthy");
      expect(response.body).toHaveProperty("timestamp");
      expect(mockHealthManager.getBasicHealth).toHaveBeenCalled();
      expect(mockHealthManager.recordMetrics).toHaveBeenCalled();
    });

    it("should return unhealthy status when health check fails", async () => {
      mockHealthManager.getBasicHealth.mockResolvedValue({
        status: "unhealthy",
        timestamp: new Date().toISOString(),
      });

      const response = await request(app).get("/health").expect(503);

      expect(response.body.status).toBe("unhealthy");
    });

    it("should handle health check errors", async () => {
      mockHealthManager.getBasicHealth.mockRejectedValue(
        new Error("Health check failed")
      );

      const response = await request(app).get("/health").expect(503);

      expect(response.body.status).toBe("unhealthy");
      expect(response.body.error).toBe("Health check failed");
      expect(response.body).toHaveProperty("timestamp");
    });
  });

  describe("GET /health/detailed", () => {
    it("should return detailed health status", async () => {
      const detailedHealth = {
        status: "healthy",
        timestamp: new Date().toISOString(),
        dependencies: [{ name: "database", status: "healthy" }],
      };

      mockHealthManager.getDetailedHealth.mockResolvedValue(detailedHealth);

      const response = await request(app).get("/health/detailed").expect(200);

      expect(response.body).toEqual(detailedHealth);
      expect(mockHealthManager.getDetailedHealth).toHaveBeenCalled();
    });

    it("should return 503 for unhealthy detailed status", async () => {
      mockHealthManager.getDetailedHealth.mockResolvedValue({
        status: "unhealthy",
        timestamp: new Date().toISOString(),
      });

      await request(app).get("/health/detailed").expect(503);
    });

    it("should handle detailed health check errors", async () => {
      mockHealthManager.getDetailedHealth.mockRejectedValue(
        new Error("Detailed check failed")
      );

      const response = await request(app).get("/health/detailed").expect(503);

      expect(response.body.error).toBe("Detailed health check failed");
    });
  });

  describe("GET /health/ready", () => {
    it("should return ready status when service is ready", async () => {
      const response = await request(app).get("/health/ready").expect(200);

      expect(response.body.status).toBe("ready");
      expect(mockHealthManager.getReadiness).toHaveBeenCalled();
    });

    it("should return 503 when service is not ready", async () => {
      mockHealthManager.getReadiness.mockResolvedValue({
        status: "not_ready",
        timestamp: new Date().toISOString(),
      });

      await request(app).get("/health/ready").expect(503);
    });

    it("should handle readiness check errors", async () => {
      mockHealthManager.getReadiness.mockRejectedValue(
        new Error("Readiness failed")
      );

      const response = await request(app).get("/health/ready").expect(503);

      expect(response.body.status).toBe("not_ready");
      expect(response.body.error).toBe("Readiness check failed");
    });
  });

  describe("GET /health/live", () => {
    it("should return alive status", async () => {
      const response = await request(app).get("/health/live").expect(200);

      expect(response.body.status).toBe("alive");
      expect(mockHealthManager.getLiveness).toHaveBeenCalled();
    });

    it("should return 503 when service is dead", async () => {
      mockHealthManager.getLiveness.mockReturnValue({
        status: "dead",
        timestamp: new Date().toISOString(),
      });

      await request(app).get("/health/live").expect(503);
    });

    it("should handle liveness check errors", async () => {
      mockHealthManager.getLiveness.mockImplementation(() => {
        throw new Error("Liveness failed");
      });

      const response = await request(app).get("/health/live").expect(503);

      expect(response.body.status).toBe("dead");
      expect(response.body.error).toBe("Liveness check failed");
    });
  });

  describe("GET /health/startup", () => {
    it("should return started status when uptime > 10 seconds", async () => {
      // Mock start time to 20 seconds ago (already set in beforeEach)
      const response = await request(app).get("/health/startup").expect(200);

      expect(response.body.status).toBe("started");
      expect(response.body.uptime).toBeGreaterThan(10);
    });

    it("should return starting status when uptime < 10 seconds", async () => {
      // Mock recent start time
      mockHealthManager.startTime = Date.now() - 5000; // 5 seconds ago

      const response = await request(app).get("/health/startup").expect(503);

      expect(response.body.status).toBe("starting");
      expect(response.body.uptime).toBeLessThan(10);
    });
  });

  describe("GET /health/metrics", () => {
    it("should return application and system metrics", async () => {
      const response = await request(app).get("/health/metrics").expect(200);

      expect(response.body).toHaveProperty("timestamp");
      expect(response.body).toHaveProperty("system");
      expect(response.body).toHaveProperty("application");
      expect(response.body).toHaveProperty("dependencies");
      expect(mockHealthManager.getSystemMetrics).toHaveBeenCalled();
      expect(mockHealthManager.getApplicationMetrics).toHaveBeenCalled();
    });

    it("should include dependencies information", async () => {
      const response = await request(app).get("/health/metrics").expect(200);

      expect(response.body.dependencies).toHaveProperty("database");
      expect(response.body.dependencies).toHaveProperty("cache");
      expect(response.body.dependencies.database).toHaveProperty(
        "critical",
        true
      );
      expect(response.body.dependencies.database).toHaveProperty(
        "lastStatus",
        "healthy"
      );
    });

    it("should handle metrics collection errors", async () => {
      mockHealthManager.getSystemMetrics.mockRejectedValue(
        new Error("Metrics failed")
      );

      const response = await request(app).get("/health/metrics").expect(500);

      expect(response.body.error).toBe("Failed to collect metrics");
    });
  });

  describe("GET /health/version", () => {
    it("should return version information", async () => {
      const response = await request(app).get("/health/version").expect(200);

      expect(response.body).toHaveProperty("version");
      expect(response.body).toHaveProperty("name");
      expect(response.body).toHaveProperty("environment");
      expect(response.body).toHaveProperty("nodeVersion");
      expect(response.body).toHaveProperty("uptime");
      expect(response.body).toHaveProperty("timestamp");
    });

    it("should include Node.js version", async () => {
      const response = await request(app).get("/health/version").expect(200);

      expect(response.body.nodeVersion).toBe(process.version);
    });
  });

  describe("POST /health/shutdown", () => {
    beforeEach(() => {
      // Mock process.exit to prevent actual exit during tests
      jest.spyOn(process, "exit").mockImplementation(() => {});
    });

    afterEach(() => {
      process.exit.mockRestore();
    });

    it("should allow shutdown in non-production environment", async () => {
      process.env.NODE_ENV = "development";

      const response = await request(app).post("/health/shutdown").expect(200);

      expect(response.body.message).toBe("Graceful shutdown initiated");
      expect(mockHealthManager.prepareShutdown).toHaveBeenCalled();
    });

    it("should require authorization token in production", async () => {
      process.env.NODE_ENV = "production";

      const response = await request(app).post("/health/shutdown").expect(403);

      expect(response.body.error).toContain(
        "Shutdown not allowed in production"
      );
      expect(mockHealthManager.prepareShutdown).not.toHaveBeenCalled();
    });

    it("should allow shutdown in production with proper token", async () => {
      process.env.NODE_ENV = "production";

      const response = await request(app)
        .post("/health/shutdown")
        .set("x-shutdown-token", "valid-token")
        .expect(200);

      expect(response.body.message).toBe("Graceful shutdown initiated");
      expect(mockHealthManager.prepareShutdown).toHaveBeenCalled();
    });

    it("should handle shutdown preparation errors", async () => {
      process.env.NODE_ENV = "development";
      mockHealthManager.prepareShutdown.mockRejectedValue(
        new Error("Shutdown failed")
      );

      const response = await request(app).post("/health/shutdown").expect(500);

      expect(response.body.error).toBe("Failed to initiate shutdown");
    });
  });

  describe("Metrics recording", () => {
    it("should record metrics for each endpoint call", async () => {
      await request(app).get("/health");
      await request(app).get("/health/detailed");
      await request(app).get("/health/ready");

      // Should be called at least 3 times (once for each request)
      expect(mockHealthManager.recordMetrics).toHaveBeenCalledTimes(3);
    });

    it("should record error metrics on failures", async () => {
      mockHealthManager.getBasicHealth.mockRejectedValue(
        new Error("Test error")
      );

      await request(app).get("/health").expect(503);

      // Check that error metrics were recorded
      const recordMetricsCall = mockHealthManager.recordMetrics.mock.calls.find(
        (call) => call[1] === true // error flag
      );
      expect(recordMetricsCall).toBeDefined();
      expect(recordMetricsCall[2]).toBe("Test error"); // error message
    });
  });
});
