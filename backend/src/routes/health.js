/**
 * Health Check Routes
 *
 * Provides multiple health check endpoints for different use cases:
 * - Basic health check for simple load balancers
 * - Detailed health check for monitoring systems
 * - Kubernetes readiness and liveness probes
 * - Metrics endpoint for monitoring
 */

const express = require("express");
const { healthManager } = require("../utils/healthCheck");

const router = express.Router();

/**
 * Basic Health Check Endpoint
 * Simple endpoint for load balancers that need a quick health status
 * Returns: 200 (healthy) or 503 (unhealthy)
 */
router.get("/health", async (req, res) => {
  const startTime = Date.now();

  try {
    const health = await healthManager.getBasicHealth();
    const responseTime = Date.now() - startTime;

    // Record metrics
    healthManager.recordMetrics(responseTime, health.status !== "healthy");

    if (health.status === "healthy") {
      res.status(200).json(health);
    } else {
      res.status(503).json(health);
    }
  } catch (error) {
    const responseTime = Date.now() - startTime;
    healthManager.recordMetrics(responseTime, true, error.message);

    res.status(503).json({
      status: "unhealthy",
      error: "Health check failed",
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * Detailed Health Check Endpoint
 * Comprehensive health check with dependency status and system metrics
 * Used by monitoring systems for detailed health information
 */
router.get("/health/detailed", async (req, res) => {
  const startTime = Date.now();

  try {
    const health = await healthManager.getDetailedHealth();
    const responseTime = Date.now() - startTime;

    // Record metrics
    healthManager.recordMetrics(responseTime, health.status !== "healthy");

    if (health.status === "healthy") {
      res.status(200).json(health);
    } else {
      res.status(503).json(health);
    }
  } catch (error) {
    const responseTime = Date.now() - startTime;
    healthManager.recordMetrics(responseTime, true, error.message);

    res.status(503).json({
      status: "unhealthy",
      error: "Detailed health check failed",
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * Readiness Probe Endpoint
 * Kubernetes readiness probe - indicates if the service is ready to accept traffic
 * Returns: 200 (ready) or 503 (not ready)
 */
router.get("/health/ready", async (req, res) => {
  const startTime = Date.now();

  try {
    const readiness = await healthManager.getReadiness();
    const responseTime = Date.now() - startTime;

    // Record metrics
    healthManager.recordMetrics(responseTime, readiness.status !== "ready");

    if (readiness.status === "ready") {
      res.status(200).json(readiness);
    } else {
      res.status(503).json(readiness);
    }
  } catch (error) {
    const responseTime = Date.now() - startTime;
    healthManager.recordMetrics(responseTime, true, error.message);

    res.status(503).json({
      status: "not_ready",
      error: "Readiness check failed",
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * Liveness Probe Endpoint
 * Kubernetes liveness probe - indicates if the service is alive and should not be restarted
 * Returns: 200 (alive) or 503 (dead)
 */
router.get("/health/live", async (req, res) => {
  const startTime = Date.now();

  try {
    const liveness = healthManager.getLiveness();
    const responseTime = Date.now() - startTime;

    // Record metrics
    healthManager.recordMetrics(responseTime, liveness.status !== "alive");

    if (liveness.status === "alive") {
      res.status(200).json(liveness);
    } else {
      res.status(503).json(liveness);
    }
  } catch (error) {
    const responseTime = Date.now() - startTime;
    healthManager.recordMetrics(responseTime, true, error.message);

    res.status(503).json({
      status: "dead",
      error: "Liveness check failed",
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * Startup Probe Endpoint
 * Kubernetes startup probe - indicates if the application has started successfully
 * Returns: 200 (started) or 503 (starting)
 */
router.get("/health/startup", async (req, res) => {
  const startTime = Date.now();

  try {
    // Simple startup check - service is considered started if it's been running for more than 10 seconds
    const uptime = Date.now() - healthManager.startTime;
    const isStarted = uptime > 10000; // 10 seconds

    const responseTime = Date.now() - startTime;
    healthManager.recordMetrics(responseTime, !isStarted);

    const response = {
      status: isStarted ? "started" : "starting",
      uptime: Math.floor(uptime / 1000),
      timestamp: new Date().toISOString(),
    };

    if (isStarted) {
      res.status(200).json(response);
    } else {
      res.status(503).json(response);
    }
  } catch (error) {
    const responseTime = Date.now() - startTime;
    healthManager.recordMetrics(responseTime, true, error.message);

    res.status(503).json({
      status: "starting",
      error: "Startup check failed",
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * Metrics Endpoint
 * Provides application metrics for monitoring systems
 * Returns: 200 with metrics data
 */
router.get("/health/metrics", async (req, res) => {
  const startTime = Date.now();

  try {
    const systemMetrics = await healthManager.getSystemMetrics();
    const applicationMetrics = healthManager.getApplicationMetrics();

    const metrics = {
      timestamp: new Date().toISOString(),
      system: systemMetrics,
      application: applicationMetrics,
      dependencies: Object.fromEntries(
        Array.from(healthManager.dependencies.entries()).map(
          ([name, config]) => [
            name,
            {
              critical: config.critical,
              lastStatus: config.lastStatus,
              consecutiveFailures: config.consecutiveFailures,
              lastCheck: config.lastCheck?.toISOString() || null,
            },
          ]
        )
      ),
    };

    const responseTime = Date.now() - startTime;
    healthManager.recordMetrics(responseTime, false);

    res.status(200).json(metrics);
  } catch (error) {
    const responseTime = Date.now() - startTime;
    healthManager.recordMetrics(responseTime, true, error.message);

    res.status(500).json({
      error: "Failed to collect metrics",
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * Version Endpoint
 * Simple endpoint to get application version information
 * Returns: 200 with version data
 */
router.get("/health/version", (req, res) => {
  const startTime = Date.now();

  try {
    const version = {
      version: process.env.npm_package_version || "1.0.0",
      name: process.env.npm_package_name || "ondetem-backend",
      environment: process.env.NODE_ENV || "development",
      nodeVersion: process.version,
      uptime: Math.floor((Date.now() - healthManager.startTime) / 1000),
      timestamp: new Date().toISOString(),
    };

    const responseTime = Date.now() - startTime;
    healthManager.recordMetrics(responseTime, false);

    res.status(200).json(version);
  } catch (error) {
    const responseTime = Date.now() - startTime;
    healthManager.recordMetrics(responseTime, true, error.message);

    res.status(500).json({
      error: "Failed to get version information",
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * Graceful Shutdown Endpoint
 * Initiates graceful shutdown process
 * POST /health/shutdown
 */
router.post("/health/shutdown", async (req, res) => {
  // Only allow shutdown in development or if proper authorization is provided
  if (
    process.env.NODE_ENV === "production" &&
    !req.headers["x-shutdown-token"]
  ) {
    return res.status(403).json({
      error: "Shutdown not allowed in production without proper authorization",
      timestamp: new Date().toISOString(),
    });
  }

  try {
    // Start graceful shutdown preparation first
    await healthManager.prepareShutdown();

    // Only send success response if preparation succeeds
    res.status(200).json({
      message: "Graceful shutdown initiated",
      timestamp: new Date().toISOString(),
    });

    // Give time for the response to be sent
    setTimeout(() => {
      process.exit(0);
    }, 1000);
  } catch (error) {
    res.status(500).json({
      error: "Failed to initiate shutdown",
      timestamp: new Date().toISOString(),
    });
  }
});

module.exports = router;
