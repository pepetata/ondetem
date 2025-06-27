/**
 * Health Check Manager Unit Tests
 *
 * Tests the HealthCheckManager class functionality including dependency monitoring,
 * metrics collection, and health status determination.
 */

const { HealthCheckManager } = require("../../../src/utils/healthCheck");
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

// Mock fs promises
jest.mock("fs", () => ({
  promises: {
    writeFile: jest.fn(),
    unlink: jest.fn(),
    stat: jest.fn(),
  },
}));

// Mock os module
jest.mock("os", () => ({
  loadavg: jest.fn(() => [0.5, 0.3, 0.1]),
  hostname: jest.fn(() => "test-hostname"),
  platform: jest.fn(() => "linux"),
  arch: jest.fn(() => "x64"),
}));

describe("HealthCheckManager", () => {
  let healthManager;
  let mockLogger;

  beforeEach(() => {
    jest.clearAllMocks();
    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    };
    winston.createLogger.mockReturnValue(mockLogger);

    healthManager = new HealthCheckManager();

    // Mock process methods
    jest.spyOn(process, "memoryUsage").mockReturnValue({
      rss: 50000000,
      heapTotal: 30000000,
      heapUsed: 20000000,
      external: 5000000,
    });

    jest.spyOn(process, "cpuUsage").mockReturnValue({
      user: 1000000,
      system: 500000,
    });

    jest.spyOn(process, "uptime").mockReturnValue(3600);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("Basic Health Check", () => {
    it("should return healthy status for basic health check", async () => {
      const health = await healthManager.getBasicHealth();

      expect(health).toEqual({
        status: "healthy",
        uptime: expect.any(Number),
        timestamp: expect.any(String),
        version: expect.any(String),
      });
      expect(health.uptime).toBeGreaterThan(0);
    });

    it("should handle errors in basic health check", async () => {
      // Mock process.uptime to throw an error instead of Date.now
      const originalUptime = process.uptime;
      process.uptime = jest.fn(() => {
        throw new Error("Uptime error");
      });

      try {
        const health = await healthManager.getBasicHealth();
        expect(health).toEqual({
          status: "unhealthy",
          error: "Health check failed",
          timestamp: expect.any(String),
        });
        expect(mockLogger.error).toHaveBeenCalled();
      } finally {
        // Restore original function
        process.uptime = originalUptime;
      }
    });
  });

  describe("Dependency Registration and Monitoring", () => {
    beforeEach(() => {
      // Create a fresh healthManager for each test to avoid Date.now conflicts
      const mockLogger = {
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
      };
      winston.createLogger.mockReturnValue(mockLogger);
      healthManager = new HealthCheckManager();
    });

    it("should register dependencies correctly", () => {
      const checkFunction = jest.fn().mockResolvedValue(true);

      healthManager.registerDependency("test-service", checkFunction, {
        critical: true,
        timeout: 5000,
      });

      expect(healthManager.dependencies.has("test-service")).toBe(true);
      const dependency = healthManager.dependencies.get("test-service");
      expect(dependency.critical).toBe(true);
      expect(dependency.timeout).toBe(5000);
    });

    it("should check healthy dependencies", async () => {
      const checkFunction = jest.fn().mockResolvedValue(true);
      healthManager.registerDependency("healthy-service", checkFunction, {
        critical: true,
        timeout: 1000,
      });

      const health = await healthManager.getDetailedHealth();

      expect(health.status).toBe("healthy");
      expect(health.dependencies["healthy-service"]).toEqual({
        status: "healthy",
        critical: true,
        duration: expect.any(Number),
        consecutiveFailures: 0,
        lastCheck: expect.any(String),
      });
      expect(checkFunction).toHaveBeenCalled();
    });

    it("should handle unhealthy critical dependencies", async () => {
      const checkFunction = jest.fn().mockResolvedValue(false);
      healthManager.registerDependency("unhealthy-service", checkFunction, {
        critical: true,
        timeout: 1000,
      });

      const health = await healthManager.getDetailedHealth();

      expect(health.status).toBe("unhealthy");
      expect(health.dependencies["unhealthy-service"]).toEqual({
        status: "unhealthy",
        critical: true,
        duration: expect.any(Number),
        consecutiveFailures: 1,
        lastCheck: expect.any(String),
      });
    });

    it("should handle unhealthy non-critical dependencies", async () => {
      const checkFunction = jest.fn().mockResolvedValue(false);
      healthManager.registerDependency("non-critical-service", checkFunction, {
        critical: false,
        timeout: 1000,
      });

      const health = await healthManager.getDetailedHealth();

      expect(health.status).toBe("healthy"); // Should still be healthy
      expect(health.dependencies["non-critical-service"]).toEqual({
        status: "unhealthy",
        critical: false,
        duration: expect.any(Number),
        consecutiveFailures: 1,
        lastCheck: expect.any(String),
      });
    });

    it("should handle dependency check timeouts", async () => {
      const checkFunction = jest
        .fn()
        .mockImplementation(
          () => new Promise((resolve) => setTimeout(() => resolve(true), 2000))
        );

      healthManager.registerDependency("slow-service", checkFunction, {
        critical: true,
        timeout: 100, // Short timeout
      });

      const health = await healthManager.getDetailedHealth();

      expect(health.status).toBe("unhealthy");
      expect(health.dependencies["slow-service"]).toEqual({
        status: "unhealthy",
        critical: true,
        error: "Timeout",
        consecutiveFailures: 1,
        lastCheck: expect.any(String),
      });
    });

    it("should handle dependency check errors", async () => {
      const checkFunction = jest
        .fn()
        .mockRejectedValue(new Error("Connection failed"));
      healthManager.registerDependency("error-service", checkFunction, {
        critical: true,
        timeout: 1000,
      });

      const health = await healthManager.getDetailedHealth();

      expect(health.status).toBe("unhealthy");
      expect(health.dependencies["error-service"]).toEqual({
        status: "unhealthy",
        critical: true,
        error: "Connection failed",
        consecutiveFailures: 1,
        lastCheck: expect.any(String),
      });
    });
  });

  describe("System Metrics Collection", () => {
    it("should collect system metrics correctly", async () => {
      const fs = require("fs").promises;
      fs.stat.mockResolvedValue({});

      const metrics = await healthManager.getSystemMetrics();

      expect(metrics).toEqual({
        memory: {
          used: 20000000,
          total: 30000000,
          external: 5000000,
          rss: 50000000,
          usage: expect.any(Number),
        },
        cpu: {
          user: 1000000,
          system: 500000,
          loadAverage: [0.5, 0.3, 0.1],
        },
        disk: {
          available: true,
          path: expect.any(String),
        },
        network: {
          hostname: "test-hostname",
          platform: "linux",
          arch: "x64",
        },
        process: {
          pid: expect.any(Number),
          uptime: 3600,
          nodeVersion: expect.any(String),
        },
      });
    });

    it("should handle disk check errors", async () => {
      const fs = require("fs").promises;
      fs.stat.mockRejectedValue(new Error("Disk error"));

      const metrics = await healthManager.getSystemMetrics();

      expect(metrics.disk).toEqual({
        available: false,
        error: "Disk error",
      });
    });

    it("should handle system metrics errors", async () => {
      jest.spyOn(process, "memoryUsage").mockImplementation(() => {
        throw new Error("Memory error");
      });

      const metrics = await healthManager.getSystemMetrics();

      expect(metrics).toEqual({
        error: "Failed to collect system metrics",
        timestamp: expect.any(String),
      });
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe("Application Metrics", () => {
    it("should return default application metrics", () => {
      const metrics = healthManager.getApplicationMetrics();

      expect(metrics).toEqual({
        requests: {
          total: 0,
          errors: 0,
          errorRate: "0%",
          averageResponseTime: "0ms",
        },
        lastError: null,
        healthChecks: {
          total: 0,
          lastCheck: null,
          history: [],
        },
      });
    });

    it("should record and calculate metrics correctly", () => {
      healthManager.recordMetrics(100, false);
      healthManager.recordMetrics(200, false);
      healthManager.recordMetrics(150, true, "Test error");

      const metrics = healthManager.getApplicationMetrics();

      expect(metrics.requests.total).toBe(3);
      expect(metrics.requests.errors).toBe(1);
      expect(metrics.requests.errorRate).toBe("33.33%");
      expect(metrics.requests.averageResponseTime).toBe("150ms");
      expect(metrics.lastError).toEqual({
        message: "Test error",
        timestamp: expect.any(String),
      });
    });
  });

  describe("Readiness Probe", () => {
    it("should return ready when no critical dependencies", async () => {
      const readiness = await healthManager.getReadiness();

      expect(readiness).toEqual({
        status: "ready",
        timestamp: expect.any(String),
        message: "No critical dependencies configured",
      });
    });

    it("should return ready when all critical dependencies are healthy", async () => {
      const checkFunction = jest.fn().mockResolvedValue(true);
      healthManager.registerDependency("service1", checkFunction, {
        critical: true,
      });
      healthManager.registerDependency("service2", checkFunction, {
        critical: true,
      });

      const readiness = await healthManager.getReadiness();

      expect(readiness).toEqual({
        status: "ready",
        timestamp: expect.any(String),
        dependencies: 2,
      });
    });

    it("should return not ready when critical dependencies fail", async () => {
      const healthyCheck = jest.fn().mockResolvedValue(true);
      const unhealthyCheck = jest.fn().mockResolvedValue(false);

      healthManager.registerDependency("healthy-service", healthyCheck, {
        critical: true,
      });
      healthManager.registerDependency("unhealthy-service", unhealthyCheck, {
        critical: true,
      });

      const readiness = await healthManager.getReadiness();

      expect(readiness.status).toBe("not_ready");
      expect(readiness.message).toBe("Critical dependencies are unhealthy");
      expect(readiness.failedDependencies).toHaveLength(1);
      expect(readiness.failedDependencies[0].name).toBe("unhealthy-service");
    });

    it("should handle readiness check errors", async () => {
      const errorCheck = jest
        .fn()
        .mockRejectedValue(new Error("Connection error"));
      healthManager.registerDependency("error-service", errorCheck, {
        critical: true,
      });

      const readiness = await healthManager.getReadiness();

      expect(readiness.status).toBe("not_ready");
      expect(readiness.failedDependencies[0]).toEqual({
        name: "error-service",
        healthy: false,
        error: "Connection error",
      });
    });

    it("should handle unexpected readiness errors", async () => {
      // Mock the dependencies Map to throw an error
      healthManager.dependencies = {
        entries: jest.fn().mockImplementation(() => {
          throw new Error("Map error");
        }),
      };

      const readiness = await healthManager.getReadiness();

      expect(readiness).toEqual({
        status: "not_ready",
        timestamp: expect.any(String),
        error: "Readiness check failed",
      });
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe("Liveness Probe", () => {
    it("should return alive status", () => {
      const liveness = healthManager.getLiveness();

      expect(liveness).toEqual({
        status: "alive",
        timestamp: expect.any(String),
        uptime: expect.any(Number),
        memory: {
          usage: expect.any(Number),
          threshold: 95,
        },
      });
      expect(liveness.uptime).toBeGreaterThan(0);
      expect(liveness.memory.usage).toBeLessThan(95);
    });

    it("should return dead status for high memory usage", () => {
      jest.spyOn(process, "memoryUsage").mockReturnValue({
        heapUsed: 95000000,
        heapTotal: 100000000,
        rss: 50000000,
        external: 5000000,
      });

      const liveness = healthManager.getLiveness();

      expect(liveness.status).toBe("dead");
      expect(liveness.memory.usage).toBe(95);
    });

    it("should handle liveness check errors", () => {
      jest.spyOn(process, "memoryUsage").mockImplementation(() => {
        throw new Error("Memory check error");
      });

      const liveness = healthManager.getLiveness();

      expect(liveness).toEqual({
        status: "dead",
        timestamp: expect.any(String),
        error: "Liveness check failed",
      });
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe("Graceful Shutdown", () => {
    it("should prepare for shutdown", async () => {
      jest.useFakeTimers();

      const shutdownPromise = healthManager.prepareShutdown();

      expect(healthManager.startTime).toBe(0);
      expect(mockLogger.info).toHaveBeenCalledWith({
        type: "SHUTDOWN_INITIATED",
        timestamp: expect.any(Date),
      });

      // Fast-forward time
      jest.advanceTimersByTime(5000);

      await shutdownPromise;

      expect(mockLogger.info).toHaveBeenCalledWith({
        type: "SHUTDOWN_READY",
        timestamp: expect.any(Date),
      });

      jest.useRealTimers();
    });
  });

  describe("Health History Tracking", () => {
    it("should maintain health check history", async () => {
      const checkFunction = jest.fn().mockResolvedValue(true);
      healthManager.registerDependency("test-service", checkFunction);

      await healthManager.getDetailedHealth();
      await healthManager.getDetailedHealth();

      expect(healthManager.healthHistory).toHaveLength(2);
      expect(healthManager.healthHistory[0]).toEqual({
        timestamp: expect.any(String),
        status: "healthy",
        checkDuration: expect.any(Number),
      });
    });

    it("should limit history size", async () => {
      const checkFunction = jest.fn().mockResolvedValue(true);
      healthManager.registerDependency("test-service", checkFunction);

      // Set small history size for testing
      healthManager.maxHistorySize = 3;

      // Perform more health checks than max size
      await healthManager.getDetailedHealth();
      await healthManager.getDetailedHealth();
      await healthManager.getDetailedHealth();
      await healthManager.getDetailedHealth();
      await healthManager.getDetailedHealth();

      expect(healthManager.healthHistory).toHaveLength(3);
    });
  });

  describe("Logging Integration", () => {
    it("should log health check completion", async () => {
      const checkFunction = jest.fn().mockResolvedValue(true);
      healthManager.registerDependency("test-service", checkFunction);

      await healthManager.getDetailedHealth();

      expect(mockLogger.info).toHaveBeenCalledWith({
        type: "HEALTH_CHECK_COMPLETED",
        status: "healthy",
        duration: expect.any(Number),
        dependencies: 1,
        timestamp: expect.any(String),
      });
    });
  });
});
