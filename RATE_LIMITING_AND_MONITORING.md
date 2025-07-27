# Rate Limiting and Monitoring Implementation

This document describes the comprehensive rate limiting and monitoring features that have been added to the FastAPI starter project.

## Overview

The application now includes:

- **Rate Limiting**: Using SlowAPI for request rate limiting
- **Monitoring**: Comprehensive application metrics and health checks
- **Structured Logging**: JSON-formatted logging with structured events
- **Security Monitoring**: Authentication and security event tracking

## Features Implemented

### 1. Rate Limiting (`app/core/rate_limiting.py`)

#### Configuration

- **Redis Support**: Automatic fallback to in-memory storage if Redis is unavailable
- **Different Limits**: Separate rate limits for different endpoint types
- **User-based Limiting**: Rate limiting based on authenticated user ID or IP address

#### Rate Limit Rules

```python
# Authentication endpoints (more restrictive)
AUTH_LOGIN = "5 per minute"        # Max 5 login attempts per minute
AUTH_REGISTER = "3 per minute"     # Max 3 registrations per minute  
AUTH_REFRESH = "10 per minute"     # Max 10 token refreshes per minute

# General API endpoints
API_GENERAL = "100 per minute"     # General API calls
API_USER_PROFILE = "30 per minute" # User profile operations

# Admin endpoints
ADMIN_OPERATIONS = "50 per minute" # Admin operations

# Health and monitoring
HEALTH_CHECK = "60 per minute"     # Health checks
METRICS = "10 per minute"          # Metrics access (more limited)
```

#### Security Events

Rate limit violations are automatically logged as security events with:

- User ID (if authenticated)
- Client IP address
- Request path and method
- Rate limit details

### 2. Monitoring (`app/core/monitoring.py`)

#### Metrics Collection

The `MetricsCollector` class tracks:

- **Request Metrics**: Total requests, errors, response times
- **Endpoint Statistics**: Per-endpoint performance data
- **System Metrics**: CPU, memory, and disk usage
- **Active Connections**: Current connection count
- **Recent Requests**: Last 100 requests with details

#### Health Checks

Enhanced health endpoint (`/health`) provides:

- Overall application status (healthy/degraded/unhealthy)
- Database connectivity check
- System resource usage
- Request statistics and error rates
- Detailed issue reporting

#### Structured Logging

- **JSON Format**: All logs are in structured JSON format
- **Event Types**: Login attempts, security events, errors
- **Context**: User IDs, request details, system information

### 3. Enhanced Endpoints

#### New Monitoring Endpoints

- **`GET /health`**: Comprehensive health check with system metrics
- **`GET /metrics`**: Detailed application metrics for monitoring systems
- **`GET /status`**: Basic application status and uptime

#### Rate Limited Endpoints

All authentication and API endpoints now have appropriate rate limiting:

- Login/registration endpoints are heavily rate limited
- User profile endpoints have moderate limits
- Admin operations have specific limits
- Health checks allow frequent access

### 4. Security Enhancements

#### Authentication Monitoring

- Failed login attempts are logged with user email and IP
- Successful logins are tracked
- Rate limit violations trigger security alerts
- User registration attempts are monitored

#### Event Logging

Security events include:

- `rate_limit_exceeded`: When rate limits are hit
- `login_failed`: Failed authentication attempts
- `login_successful`: Successful logins
- `user_registered`: New user registrations

## Environment Configuration

### Environment Variables

```bash
# Optional: Redis URL for distributed rate limiting
REDIS_URL=redis://localhost:6379

# Existing environment variables for the application
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=admin123
SECRET_KEY=your-secret-key
```

### Dependencies

The following packages have been added:

```txt
slowapi      # Rate limiting
redis        # Redis client for distributed rate limiting
psutil       # System metrics
structlog    # Structured logging
```

## Usage Examples

### Testing Rate Limits

```bash
# Test general endpoint rate limits
for i in {1..10}; do 
  curl -w "Request $i: %{http_code}\n" http://localhost:8000/ -o /dev/null
done

# Test authentication rate limits
for i in {1..6}; do 
  curl -X POST http://localhost:8000/api/v1/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email": "test@example.com", "password": "wrong"}'
done
```

### Accessing Monitoring Data

```bash
# Get health status
curl http://localhost:8000/health | python -m json.tool

# Get detailed metrics
curl http://localhost:8000/metrics | python -m json.tool

# Get basic status
curl http://localhost:8000/status | python -m json.tool
```

### Log Analysis

Logs are in JSON format and can be easily parsed:

```bash
# Filter login attempts
grep "Login" app.log | jq .

# Filter rate limit violations
grep "rate_limit_exceeded" app.log | jq .

# Show all security events
grep "security_event" app.log | jq .
```

## Architecture

### Middleware Stack

1. **CORS Middleware**: Cross-origin request handling
2. **MonitoringMiddleware**: Request tracking and metrics collection
3. **Rate Limiting**: SlowAPI integration with custom handlers

### Error Handling

- Rate limit exceeded returns HTTP 429 with retry information
- Health checks return appropriate HTTP status codes
- All errors are logged with context

### Performance Impact

- **Minimal Overhead**: Monitoring adds ~1-2ms per request
- **Memory Efficient**: Uses rolling windows for metrics
- **Redis Optional**: Falls back to in-memory storage

## Production Considerations

### Scaling

- Use Redis for distributed rate limiting across multiple instances
- Monitor memory usage of metrics collection
- Implement log rotation for structured logs

### Alerting

- Set up alerts on health check failures
- Monitor rate limit violation trends
- Track error rate increases

### Security

- Regularly review security event logs
- Adjust rate limits based on usage patterns
- Monitor for suspicious authentication patterns

## Integration with Frontend

The frontend automatically works with the new rate-limited endpoints. The existing authentication flow now includes:

- Automatic rate limit handling
- Enhanced error reporting
- Improved security monitoring

## Future Enhancements

Potential improvements for production use:

- Prometheus metrics export
- Grafana dashboard integration
- Advanced alerting rules
- Rate limit bypass for trusted IPs
- Custom rate limiting strategies per user role
