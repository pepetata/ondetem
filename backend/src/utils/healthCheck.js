/**
 * Health Check Utilities
 *
 * This module provides comprehensive health check functionality for:
 * 1. Load balancer health checks
 * 2. Service dependency monitoring
 * 3. Performance metrics collection
 * 4. System resource monitoring
 */

const { safePool } = require("./sqlSecurity");
const winston = require("winston");
const os = require("os");
const fs = require("fs").promises;
const path = require("path");

// Create logger for health checks
const healthLogger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: "logs/health-check.log" }),
    ...(process.env.NODE_ENV !== "production"
      ? [new winston.transports.Console()]
      : []),
  ],
});

/**
 * Health Check Manager
 */
class HealthCheckManager {
  constructor() {
    this.startTime = Date.now();
    this.lastHealthCheck = null;
    this.healthHistory = [];
    this.maxHistorySize = 100;
    this.dependencies = new Map();
    this.metrics = {
      totalRequests: 0,
      errorCount: 0,
      lastError: null,
      responseTimeSum: 0,
      requestCount: 0,
    };
  }

  /**
   * Register a dependency for health monitoring
   * @param {string} name - Dependency name
   * @param {Function} checkFunction - Function that returns Promise<boolean>
   * @param {Object} options - Configuration options
   */
  registerDependency(name, checkFunction, options = {}) {
    this.dependencies.set(name, {
      check: checkFunction,
      critical: options.critical || false,
      timeout: options.timeout || 5000,
      lastCheck: null,
      lastStatus: null,
      consecutiveFailures: 0,
    });
  }

  /**
   * Perform basic health check (for simple load balancer probes)
   * @returns {Object} Basic health status
   */
  async getBasicHealth() {
    try {
      const uptime = Date.now() - this.startTime;
      const status = uptime > 0 ? "healthy" : "unhealthy";

      return {
        status,
        uptime: Math.floor(uptime / 1000), // seconds
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || "1.0.0",
      };
    } catch (error) {
      healthLogger.error({
        type: "BASIC_HEALTH_CHECK_ERROR",
        error: error.message,
        timestamp: new Date(),
      });

      return {
        status: "unhealthy",
        error: "Health check failed",
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Perform detailed health check with dependencies
   * @returns {Object} Detailed health status
   */
  async getDetailedHealth() {
    const startTime = Date.now();
    const health = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      version: process.env.npm_package_version || "1.0.0",
      environment: process.env.NODE_ENV || "development",
      dependencies: {},
      system: await this.getSystemMetrics(),
      application: this.getApplicationMetrics(),
      checkDuration: 0,
    };

    // Check all registered dependencies
    const dependencyChecks = Array.from(this.dependencies.entries()).map(
      async ([name, config]) => {
        try {
          const checkStart = Date.now();
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Timeout")), config.timeout)
          );

          const isHealthy = await Promise.race([
            config.check(),
            timeoutPromise,
          ]);

          const duration = Date.now() - checkStart;

          config.lastCheck = new Date();
          config.lastStatus = isHealthy;

          if (isHealthy) {
            config.consecutiveFailures = 0;
          } else {
            config.consecutiveFailures++;
            if (config.critical) {
              health.status = "unhealthy";
            }
          }

          health.dependencies[name] = {
            status: isHealthy ? "healthy" : "unhealthy",
            critical: config.critical,
            duration,
            consecutiveFailures: config.consecutiveFailures,
            lastCheck: config.lastCheck.toISOString(),
          };
        } catch (error) {
          config.consecutiveFailures++;
          if (config.critical) {
            health.status = "unhealthy";
          }

          health.dependencies[name] = {
            status: "unhealthy",
            critical: config.critical,
            error: error.message,
            consecutiveFailures: config.consecutiveFailures,
            lastCheck: new Date().toISOString(),
          };
        }
      }
    );

    await Promise.all(dependencyChecks);

    health.checkDuration = Date.now() - startTime;
    this.lastHealthCheck = health;

    // Store in history
    this.healthHistory.push({
      timestamp: health.timestamp,
      status: health.status,
      checkDuration: health.checkDuration,
    });

    // Trim history
    if (this.healthHistory.length > this.maxHistorySize) {
      this.healthHistory = this.healthHistory.slice(-this.maxHistorySize);
    }

    // Log health check
    healthLogger.info({
      type: "HEALTH_CHECK_COMPLETED",
      status: health.status,
      duration: health.checkDuration,
      dependencies: Object.keys(health.dependencies).length,
      timestamp: health.timestamp,
    });

    return health;
  }

  /**
   * Get system metrics
   * @returns {Object} System resource information
   */
  async getSystemMetrics() {
    try {
      const memoryUsage = process.memoryUsage();
      const cpuUsage = process.cpuUsage();
      const loadAvg = os.loadavg();

      // Disk space check
      let diskSpace = null;
      try {
        const stats = await fs.stat(process.cwd());
        diskSpace = {
          available: true,
          path: process.cwd(),
        };
      } catch (error) {
        diskSpace = {
          available: false,
          error: error.message,
        };
      }

      return {
        memory: {
          used: memoryUsage.heapUsed,
          total: memoryUsage.heapTotal,
          external: memoryUsage.external,
          rss: memoryUsage.rss,
          usage: Math.round(
            (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100
          ),
        },
        cpu: {
          user: cpuUsage.user,
          system: cpuUsage.system,
          loadAverage: loadAvg,
        },
        disk: diskSpace,
        network: {
          hostname: os.hostname(),
          platform: os.platform(),
          arch: os.arch(),
        },
        process: {
          pid: process.pid,
          uptime: process.uptime(),
          nodeVersion: process.version,
        },
      };
    } catch (error) {
      healthLogger.error({
        type: "SYSTEM_METRICS_ERROR",
        error: error.message,
        timestamp: new Date(),
      });

      return {
        error: "Failed to collect system metrics",
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Get application-specific metrics
   * @returns {Object} Application performance metrics
   */
  getApplicationMetrics() {
    const avgResponseTime =
      this.metrics.requestCount > 0
        ? Math.round(this.metrics.responseTimeSum / this.metrics.requestCount)
        : 0;

    const errorRate =
      this.metrics.totalRequests > 0
        ? Math.round(
            (this.metrics.errorCount / this.metrics.totalRequests) * 100 * 100
          ) / 100
        : 0;

    return {
      requests: {
        total: this.metrics.totalRequests,
        errors: this.metrics.errorCount,
        errorRate: `${errorRate}%`,
        averageResponseTime: `${avgResponseTime}ms`,
      },
      lastError: this.metrics.lastError,
      healthChecks: {
        total: this.healthHistory.length,
        lastCheck: this.lastHealthCheck?.timestamp || null,
        history: this.healthHistory.slice(-10), // Last 10 checks
      },
    };
  }

  /**
   * Record request metrics
   * @param {number} responseTime - Response time in milliseconds
   * @param {boolean} isError - Whether the request resulted in an error
   * @param {string} errorMessage - Error message if applicable
   */
  recordMetrics(responseTime, isError = false, errorMessage = null) {
    this.metrics.totalRequests++;
    this.metrics.responseTimeSum += responseTime;
    this.metrics.requestCount++;

    if (isError) {
      this.metrics.errorCount++;
      this.metrics.lastError = {
        message: errorMessage,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Get readiness status (for Kubernetes readiness probes)
   * @returns {Object} Readiness status
   */
  async getReadiness() {
    try {
      // Check critical dependencies only
      const criticalDeps = Array.from(this.dependencies.entries()).filter(
        ([, config]) => config.critical
      );

      if (criticalDeps.length === 0) {
        return {
          status: "ready",
          timestamp: new Date().toISOString(),
          message: "No critical dependencies configured",
        };
      }

      const checks = criticalDeps.map(async ([name, config]) => {
        try {
          const isHealthy = await Promise.race([
            config.check(),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error("Timeout")), config.timeout)
            ),
          ]);
          return { name, healthy: isHealthy };
        } catch (error) {
          return { name, healthy: false, error: error.message };
        }
      });

      const results = await Promise.all(checks);
      const failedDeps = results.filter((result) => !result.healthy);

      if (failedDeps.length > 0) {
        return {
          status: "not_ready",
          timestamp: new Date().toISOString(),
          message: "Critical dependencies are unhealthy",
          failedDependencies: failedDeps,
        };
      }

      return {
        status: "ready",
        timestamp: new Date().toISOString(),
        dependencies: results.length,
      };
    } catch (error) {
      healthLogger.error({
        type: "READINESS_CHECK_ERROR",
        error: error.message,
        timestamp: new Date(),
      });

      return {
        status: "not_ready",
        timestamp: new Date().toISOString(),
        error: "Readiness check failed",
      };
    }
  }

  /**
   * Get liveness status (for Kubernetes liveness probes)
   * @returns {Object} Liveness status
   */
  getLiveness() {
    try {
      const uptime = Date.now() - this.startTime;
      const memoryUsage = process.memoryUsage();
      const memoryUsagePercent =
        (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;

      // Basic liveness checks
      const isAlive = uptime > 0 && memoryUsagePercent < 95; // Under 95% memory usage

      return {
        status: isAlive ? "alive" : "dead",
        timestamp: new Date().toISOString(),
        uptime: Math.floor(uptime / 1000),
        memory: {
          usage: Math.round(memoryUsagePercent),
          threshold: 95,
        },
      };
    } catch (error) {
      healthLogger.error({
        type: "LIVENESS_CHECK_ERROR",
        error: error.message,
        timestamp: new Date(),
      });

      return {
        status: "dead",
        timestamp: new Date().toISOString(),
        error: "Liveness check failed",
      };
    }
  }

  /**
   * Graceful shutdown preparation
   * @returns {Promise<void>}
   */
  async prepareShutdown() {
    healthLogger.info({
      type: "SHUTDOWN_INITIATED",
      timestamp: new Date(),
    });

    // Mark as unhealthy to remove from load balancer
    this.startTime = 0;

    // Wait for existing requests to complete (grace period)
    await new Promise((resolve) => setTimeout(resolve, 5000));

    healthLogger.info({
      type: "SHUTDOWN_READY",
      timestamp: new Date(),
    });
  }
}

// Create singleton instance
const healthManager = new HealthCheckManager();

// Register default dependencies
healthManager.registerDependency(
  "database",
  async () => {
    try {
      const result = await safePool.safeQuery(
        "SELECT 1 as health_check",
        [],
        "health_check_database"
      );
      return result.rowCount === 1;
    } catch (error) {
      return false;
    }
  },
  { critical: true, timeout: 3000 }
);

healthManager.registerDependency(
  "filesystem",
  async () => {
    try {
      const testFile = path.join(process.cwd(), "logs", ".health-check");
      await fs.writeFile(testFile, "health-check");
      await fs.unlink(testFile);
      return true;
    } catch (error) {
      return false;
    }
  },
  { critical: true, timeout: 2000 }
);

module.exports = {
  HealthCheckManager,
  healthManager,
  healthLogger,
};
