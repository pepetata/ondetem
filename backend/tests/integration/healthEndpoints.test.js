/**
 * Health Endpoints Integration Tests
 *
 * Tests all health check endpoints to ensure they respond correctly
 * and provide appropriate status codes and data structures.
 */

const request = require("supertest");
const app = require("../../src/app");

describe("Health Check Endpoints", () => {
  describe("GET /api/health", () => {
    it("should return basic health status", async () => {
      const response = await request(app).get("/api/health").expect(200);

      expect(response.body).toHaveProperty("status");
      expect(response.body).toHaveProperty("uptime");
      expect(response.body).toHaveProperty("timestamp");
      expect(typeof response.body.uptime).toBe("number");
      expect(typeof response.body.timestamp).toBe("string");
    });
  });

  describe("GET /api/health/detailed", () => {
    it("should return detailed health information", async () => {
      const response = await request(app).get("/api/health/detailed");

      // May return 200 (healthy) or 503 (unhealthy) depending on dependencies
      expect([200, 503]).toContain(response.status);

      expect(response.body).toHaveProperty("status");
      expect(response.body).toHaveProperty("timestamp");
      expect(response.body).toHaveProperty("uptime");
      expect(response.body).toHaveProperty("version");
      expect(response.body).toHaveProperty("environment");
      expect(response.body).toHaveProperty("dependencies");
      expect(response.body).toHaveProperty("system");
      expect(response.body).toHaveProperty("application");
      expect(response.body).toHaveProperty("checkDuration");
    });

    it("should include dependency health checks", async () => {
      const response = await request(app).get("/api/health/detailed");

      expect(response.body.dependencies).toHaveProperty("filesystem");
      expect(response.body.dependencies).toHaveProperty("database");

      // Each dependency should have status and check details
      Object.values(response.body.dependencies).forEach((dep) => {
        expect(dep).toHaveProperty("status");
        expect(dep).toHaveProperty("critical");
        expect(dep).toHaveProperty("duration");
        expect(dep).toHaveProperty("consecutiveFailures");
        expect(dep).toHaveProperty("lastCheck");
      });
    });

    it("should include system metrics", async () => {
      const response = await request(app).get("/api/health/detailed");

      expect(response.body.system).toHaveProperty("memory");
      expect(response.body.system).toHaveProperty("cpu");
      expect(response.body.system).toHaveProperty("disk");
      expect(response.body.system).toHaveProperty("network");
      expect(response.body.system).toHaveProperty("process");
    });
  });

  describe("GET /api/health/ready", () => {
    it("should return readiness status", async () => {
      const response = await request(app).get("/api/health/ready");

      // May return 200 (ready) or 503 (not ready) depending on critical dependencies
      expect([200, 503]).toContain(response.status);

      expect(response.body).toHaveProperty("status");
      expect(response.body).toHaveProperty("timestamp");
      expect(["ready", "not_ready"]).toContain(response.body.status);
    });

    it("should list failed dependencies when not ready", async () => {
      const response = await request(app).get("/api/health/ready");

      if (response.status === 503) {
        expect(response.body).toHaveProperty("message");
        expect(response.body).toHaveProperty("failedDependencies");
        expect(Array.isArray(response.body.failedDependencies)).toBe(true);
      }
    });
  });

  describe("GET /api/health/live", () => {
    it("should return liveness status", async () => {
      const response = await request(app).get("/api/health/live").expect(200);

      expect(response.body).toHaveProperty("status", "alive");
      expect(response.body).toHaveProperty("timestamp");
      expect(response.body).toHaveProperty("uptime");
      expect(response.body).toHaveProperty("memory");
    });
  });

  describe("GET /api/health/startup", () => {
    it("should return startup status", async () => {
      const response = await request(app).get("/api/health/startup");

      // May return 200 (started) or 503 (starting) depending on startup state
      expect([200, 503]).toContain(response.status);

      expect(response.body).toHaveProperty("status");
      expect(response.body).toHaveProperty("timestamp");
      expect(["started", "starting"]).toContain(response.body.status);
    });
  });

  describe("GET /api/health/metrics", () => {
    it("should return system metrics", async () => {
      const response = await request(app)
        .get("/api/health/metrics")
        .expect(200);

      expect(response.body).toHaveProperty("timestamp");
      expect(response.body).toHaveProperty("system");
      expect(response.body).toHaveProperty("application");

      // System metrics
      expect(response.body.system).toHaveProperty("memory");
      expect(response.body.system).toHaveProperty("cpu");
      expect(response.body.system).toHaveProperty("disk");
      expect(response.body.system).toHaveProperty("network");
      expect(response.body.system).toHaveProperty("process");

      // Application metrics
      expect(response.body.application).toHaveProperty("requests");
      expect(response.body.application).toHaveProperty("healthChecks");
    });
  });

  describe("GET /api/health/version", () => {
    it("should return version information", async () => {
      const response = await request(app)
        .get("/api/health/version")
        .expect(200);

      expect(response.body).toHaveProperty("version");
      expect(response.body).toHaveProperty("nodeVersion");
      expect(response.body).toHaveProperty("environment");
      expect(response.body).toHaveProperty("uptime");
      expect(response.body).toHaveProperty("timestamp");
    });
  });

  describe("POST /api/health/shutdown", () => {
    it("should initiate graceful shutdown (in test mode)", async () => {
      const response = await request(app)
        .post("/api/health/shutdown")
        .expect(200);

      expect(response.body).toHaveProperty("message");
      expect(response.body).toHaveProperty("timestamp");
      expect(response.body.message).toContain("shutdown");
    }, 10000); // Increase timeout to 10 seconds to allow for 5s grace period + response time
  });
});
