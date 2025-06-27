# Health Check Endpoints Implementation

## Overview

This implementation provides comprehensive health check endpoints for monitoring, load balancing, and orchestration systems like Kubernetes. The health check system includes multiple endpoints for different use cases and monitoring requirements.

## Architecture

### Components

1. **HealthManager Class** (`src/utils/healthCheck.js`)

   - Core health checking logic
   - Dependency monitoring
   - System metrics collection
   - Request/error tracking

2. **Health Routes** (`src/routes/health.js`)

   - Multiple specialized endpoints
   - Kubernetes-compatible probes
   - Metrics and monitoring endpoints

3. **Integration** (`src/app.js`)
   - Health routes mounted at `/api`
   - Available alongside other API endpoints

## Endpoints

### Basic Health Check

- **Endpoint**: `GET /api/health`
- **Purpose**: Simple health status for load balancers
- **Response**: Basic status, uptime, and timestamp
- **Status Codes**:
  - `200`: Service is healthy
  - `503`: Service is unhealthy

### Detailed Health Check

- **Endpoint**: `GET /api/health/detailed`
- **Purpose**: Comprehensive health information for monitoring systems
- **Response**: Complete health status including:
  - Dependency health checks (database, filesystem)
  - System metrics (memory, CPU, disk, network)
  - Application metrics (requests, errors, response times)
  - Check duration and metadata
- **Status Codes**:
  - `200`: All critical dependencies are healthy
  - `503`: One or more critical dependencies are unhealthy

### Readiness Probe

- **Endpoint**: `GET /api/health/ready`
- **Purpose**: Kubernetes readiness probe
- **Response**: Service readiness for receiving traffic
- **Logic**: Checks all critical dependencies
- **Status Codes**:
  - `200`: Service is ready to receive traffic
  - `503`: Service is not ready (lists failed dependencies)

### Liveness Probe

- **Endpoint**: `GET /api/health/live`
- **Purpose**: Kubernetes liveness probe
- **Response**: Basic liveness status with uptime and memory
- **Logic**: Always returns healthy unless the process is completely frozen
- **Status Codes**: `200`: Service is alive

### Startup Probe

- **Endpoint**: `GET /api/health/startup`
- **Purpose**: Kubernetes startup probe
- **Response**: Service startup status
- **Logic**: Checks if startup phase is complete
- **Status Codes**:
  - `200`: Service has started successfully
  - `503`: Service is still starting up

### Metrics

- **Endpoint**: `GET /api/health/metrics`
- **Purpose**: System and application metrics for monitoring
- **Response**: Detailed metrics including:
  - System resources (memory, CPU, disk)
  - Application statistics (requests, errors)
  - Process information

### Version Information

- **Endpoint**: `GET /api/health/version`
- **Purpose**: Service version and environment information
- **Response**: Version, Node.js version, environment, uptime

### Graceful Shutdown

- **Endpoint**: `POST /api/health/shutdown`
- **Purpose**: Initiate graceful shutdown
- **Security**: Only available in non-production environments
- **Response**: Shutdown confirmation

## Dependency Monitoring

### Database Health Check

- **Test**: `SELECT 1` query execution
- **Timeout**: 30 seconds
- **Critical**: Yes (affects readiness)
- **Failure Handling**: Retries with exponential backoff

### Filesystem Health Check

- **Test**: Write/read/delete test file
- **Timeout**: 5 seconds
- **Critical**: Yes (affects readiness)
- **Path**: Application root directory

## System Metrics

### Memory Metrics

- Used memory
- Total memory
- External memory
- RSS (Resident Set Size)
- Memory usage percentage

### CPU Metrics

- User CPU time
- System CPU time
- Load average (Unix/Linux only)

### Disk Metrics

- Disk availability
- Path information

### Network Metrics

- Hostname
- Platform
- Architecture

### Process Metrics

- Process ID
- Process uptime
- Node.js version

## Application Metrics

### Request Tracking

- Total requests
- Error count
- Error rate percentage
- Average response time

### Health Check Statistics

- Total health checks performed
- Last check timestamp
- Check history

## Security Features

### Rate Limiting

- Health endpoints are rate-limited to prevent abuse
- Different limits for different endpoint types

### Error Handling

- Comprehensive error handling for all health checks
- Graceful degradation when dependencies fail
- Detailed error logging

### Shutdown Protection

- Graceful shutdown endpoint only available in development/test
- Protection against accidental production shutdowns

## Kubernetes Integration

### Deployment Configuration Example

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ondetem-backend
spec:
  template:
    spec:
      containers:
        - name: backend
          image: ondetem-backend:latest
          ports:
            - containerPort: 3000
          livenessProbe:
            httpGet:
              path: /api/health/live
              port: 3000
            initialDelaySeconds: 30
            periodSeconds: 10
            timeoutSeconds: 5
            failureThreshold: 3
          readinessProbe:
            httpGet:
              path: /api/health/ready
              port: 3000
            initialDelaySeconds: 10
            periodSeconds: 5
            timeoutSeconds: 3
            failureThreshold: 2
          startupProbe:
            httpGet:
              path: /api/health/startup
              port: 3000
            initialDelaySeconds: 10
            periodSeconds: 10
            timeoutSeconds: 5
            failureThreshold: 30
```

## Load Balancer Integration

### HAProxy Configuration Example

```
backend backend_servers
    balance roundrobin
    option httpchk GET /api/health
    http-check expect status 200
    server backend1 10.0.1.10:3000 check inter 5000ms
    server backend2 10.0.1.11:3000 check inter 5000ms
```

### NGINX Configuration Example

```nginx
upstream backend {
    server 10.0.1.10:3000;
    server 10.0.1.11:3000;
}

server {
    location /health {
        access_log off;
        proxy_pass http://backend/api/health;
        proxy_set_header Host $host;
    }
}
```

## Monitoring Integration

### Prometheus Metrics

The `/api/health/metrics` endpoint provides data that can be scraped by Prometheus:

```yaml
# prometheus.yml
scrape_configs:
  - job_name: "ondetem-backend"
    static_configs:
      - targets: ["localhost:3000"]
    metrics_path: "/api/health/metrics"
    scrape_interval: 30s
```

### Alerting Rules

Example Prometheus alerting rules:

```yaml
groups:
  - name: ondetem-backend
    rules:
      - alert: ServiceDown
        expr: up{job="ondetem-backend"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Backend service is down"

      - alert: DatabaseUnhealthy
        expr: health_dependency_status{dependency="database"} == 0
        for: 30s
        labels:
          severity: critical
        annotations:
          summary: "Database dependency is unhealthy"
```

## Testing

### Integration Tests

Comprehensive test suite (`tests/integration/healthEndpoints.test.js`) covering:

- All endpoint functionality
- Status code verification
- Response structure validation
- Dependency health checking
- System metrics collection

### Test Results

- ✅ 11 tests passing
- ✅ All endpoints responding correctly
- ✅ Proper status codes returned
- ✅ Complete response structures

### Running Tests

```bash
npm test -- tests/integration/healthEndpoints.test.js
```

## Logging

All health check activities are logged with structured JSON format:

```json
{
  "level": "info",
  "message": {
    "type": "HEALTH_CHECK_COMPLETED",
    "status": "healthy",
    "dependencies": 2,
    "duration": 62,
    "timestamp": "2025-06-27T14:03:20.453Z"
  },
  "timestamp": "2025-06-27T14:03:20.515Z"
}
```

## Performance Considerations

### Caching

- Health check results are cached briefly to avoid excessive computation
- Dependency checks include timeout protection
- System metrics are collected efficiently

### Resource Usage

- Minimal CPU overhead for health checks
- Memory usage tracked and reported
- Non-blocking health check execution

## Best Practices

1. **Use appropriate endpoints for different purposes**:

   - `/health` for simple load balancer checks
   - `/health/ready` for Kubernetes readiness probes
   - `/health/live` for Kubernetes liveness probes
   - `/health/detailed` for monitoring systems

2. **Configure appropriate timeouts**:

   - Liveness probe: Higher timeout, fewer retries
   - Readiness probe: Lower timeout, more frequent checks
   - Startup probe: Longer timeout for initial startup

3. **Monitor dependency health**:

   - Database connectivity
   - External service availability
   - File system accessibility

4. **Set up proper alerting**:
   - Service availability alerts
   - Dependency health alerts
   - Performance degradation alerts

## Troubleshooting

### Common Issues

1. **Database Health Check Failing**:

   - Check database connectivity
   - Verify connection string
   - Check database server status

2. **Readiness Probe Failing**:

   - Review failed dependencies in response
   - Check dependency configuration
   - Verify timeout settings

3. **High Response Times**:
   - Monitor system resources
   - Check dependency performance
   - Review health check frequency

### Debug Information

Use the detailed health endpoint to get comprehensive debug information:

```bash
curl http://localhost:3000/api/health/detailed
```

This provides complete information about all dependencies, system state, and performance metrics.
