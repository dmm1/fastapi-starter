# Fastapi-Starter Backend API - Authentication System

A secure FastAPI-based authentication system with JWT tokens, user management, and admin functionality. Built with modern FastAPI best practices using a modular architecture.

## Features

- ✅ **Secure Authentication**: JWT access and refresh tokens
- ✅ **Session Management**: Redis-backed session tracking with device information
- ✅ **User Registration & Login**: Email-based authentication  
- ✅ **Token Refresh**: Seamless token renewal
- ✅ **User Management**: Profile updates and admin controls
- ✅ **Admin Panel**: Admin-only endpoints for user management
- ✅ **OAuth2 Compatible**: Supports OAuth2 password flow
- ✅ **Password Hashing**: Secure bcrypt password hashing
- ✅ **CORS Support**: Cross-origin requests enabled
- ✅ **SQLite Database**: Persistent data storage with SQLAlchemy ORM
- ✅ **Custom Rate Limiting**: High-performance configurable rate limiting
- ✅ **Security Middleware**: CSRF protection, security headers, session validation
- ✅ **Monitoring**: Comprehensive metrics and health checks
- ✅ **Modular Architecture**: Clean separation of concerns
- ✅ **API Versioning**: Versioned API endpoints under `/api/v1/`

## Quick Start

1. **Setup Environment**:

   ```bash
   cp .env.example .env
   # Generate a secure secret key (optional)
   python generate_secret_key.py
   # Edit .env with your configuration (especially admin credentials!)
   ```

2. **Install Dependencies**:

   ```bash
   pip install -r requirements.txt
   ```

3. **Start the Server**:

   ```bash
   python run.py
   ```

4. **Access Documentation**:
   - API Docs: <http://127.0.0.1:8000/docs>
   - OpenAPI Schema: <http://127.0.0.1:8000/openapi.json>
   - Health Check: <http://127.0.0.1:8000/health>

## Default Admin User

A default admin user is created automatically from your `.env` configuration:

- **Email**: Set via `ADMIN_EMAIL` in `.env`
- **Password**: Set via `ADMIN_PASSWORD` in `.env`
- **Username**: Set via `ADMIN_USERNAME` in `.env`

⚠️ **Important**: Always change the default credentials in your `.env` file!

## API Endpoints

### Authentication

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/v1/auth/register` | Register a new user | No |
| POST | `/api/v1/auth/login` | Login with email/password | No |
| POST | `/api/v1/auth/login-form` | OAuth2 compatible login | No |
| POST | `/api/v1/auth/refresh` | Refresh access token | No |
| POST | `/api/v1/auth/logout` | Logout and invalidate tokens | Yes |

### User Management

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/v1/users/me` | Get current user info | Yes |
| PUT | `/api/v1/users/me` | Update current user | Yes |
| GET | `/api/v1/sessions/` | Get user's active sessions | Yes |
| DELETE | `/api/v1/sessions/{session_id}` | Delete specific session | Yes |

### Admin Only

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/v1/users/` | Get all users | Admin |
| PUT | `/api/v1/users/{id}` | Update any user | Admin |

### General

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/` | API info | No |
| GET | `/health` | Health check | No |
| GET | `/metrics` | Application metrics | Admin |

## Authentication Flow

### 1. Register a New User

```bash
curl -X POST "http://127.0.0.1:8000/api/v1/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "username": "testuser",
    "password": "securepassword123",
    "is_active": true,
    "is_admin": false
  }'
```

### 2. Login and Get Tokens

```bash
curl -X POST "http://127.0.0.1:8000/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
  {
    "password": "securepassword123"
  }
```

```bash

Response:
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "token_type": "bearer"
}
```

### 3. Access Protected Endpoints

```bash
curl -X GET "http://127.0.0.1:8000/api/v1/users/me" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 4. Refresh Tokens

```bash
curl -X POST "http://127.0.0.1:8000/api/v1/auth/refresh" \
  -H "Content-Type: application/json" \
  -d '{
    "refresh_token": "YOUR_REFRESH_TOKEN"
  }'
```

### 5. Logout

```bash
curl -X POST "http://127.0.0.1:8000/api/v1/auth/logout" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "refresh_token": "YOUR_REFRESH_TOKEN"
  }'
```

## Data Models

### User Model

```json
{
  "id": 1,
  "email": "user@example.com",
  "username": "testuser",
  "is_active": true,
  "is_admin": false,
  "created_at": "2023-01-01T00:00:00",
  "updated_at": "2023-01-01T00:00:00"
}
```

### Token Model

```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "token_type": "bearer"
}
```

## Security Features

- **JWT Tokens**: Secure token-based authentication
- **Session Management**: Redis-backed session tracking with device information
- **Password Hashing**: Bcrypt with salt
- **Token Expiration**: Access tokens expire in 30 minutes
- **Refresh Tokens**: Long-lived tokens for renewal (7 days)
- **Session Cookies**: Secure, HttpOnly cookies for enhanced security
- **Token Invalidation**: Logout invalidates refresh tokens and sessions
- **Custom Rate Limiting**: Configurable rate limits for different endpoint types
- **Security Middleware**: CSRF protection, security headers, session validation
- **Admin Protection**: Admin-only endpoints require admin privileges
- **Session Tracking**: Track login devices, browsers, and IP addresses
- **Remote Logout**: Users can terminate sessions from other devices

## Architecture & File Structure

This backend follows modern FastAPI best practices with a modular architecture:

```bash
backend/
├── run.py                    # Server entry point
├── .env                      # Environment variables
├── requirements.txt          # Python dependencies
├── data/
│   └── auth.db              # SQLite database
└── app/                     # Main application package
    ├── __init__.py
    ├── main.py              # FastAPI app instance
    ├── core/                # Core functionality
    │   ├── __init__.py
    │   ├── config.py        # Configuration management
    │   └── security.py      # JWT & password utilities
    ├── db/                  # Database layer
    │   ├── __init__.py
    │   ├── base.py         # SQLAlchemy setup
    │   └── session.py      # Database sessions
    ├── models/              # SQLAlchemy models
    │   ├── __init__.py
    │   └── user.py         # User model
    ├── schemas/             # Pydantic schemas
    │   ├── __init__.py
    │   └── user.py         # User schemas
    ├── services/            # Business logic layer
    │   ├── __init__.py
    │   └── user_service.py # User service
    └── api/                 # API layer
        ├── __init__.py
        ├── deps.py          # Dependencies
        └── v1/              # API version 1
            ├── __init__.py
            ├── api.py       # Router setup
            └── endpoints/   # API endpoints
                ├── __init__.py
                ├── auth.py  # Authentication endpoints
                └── users.py # User endpoints
```

### Key Architecture Principles

- **Separation of Concerns**: Clear separation between models, schemas, services, and API layers
- **Dependency Injection**: FastAPI's dependency system for clean code
- **Service Layer**: Business logic separated from API endpoints
- **Configuration Management**: Environment-based configuration with pydantic-settings
- **Database Abstraction**: SQLAlchemy ORM with proper session management

## Production Considerations

1. **Secret Key**: Use a strong, randomly generated secret key (configure in `.env`)
2. **Database**: SQLite is used for development; consider PostgreSQL/MySQL for production
3. **CORS**: Configure CORS origins for your frontend domains
4. **HTTPS**: Use HTTPS in production and set `SECURE_COOKIES=true`
5. **Redis**: Use Redis for session storage and rate limiting in production
6. **Rate Limiting**: Configure appropriate rate limits via environment variables
7. **Monitoring**: Use `/metrics` endpoint for application monitoring
8. **Session Security**: Set `HTTPS_ONLY=true` in production environments
9. **Logging**: Comprehensive structured logging for security events
10. **Monitoring**: Set up health checks and monitoring
11. **Environment**: Use different configurations for dev/staging/production

## Environment Variables

Copy the example file and configure your environment:

```bash
cp .env.example .env
```

Edit the `.env` file with your configuration:

```env
# Security - Generate a strong secret key for production!
SECRET_KEY=your-super-secret-key-change-this-in-production-minimum-32-characters

# Database
DATABASE_URL=sqlite:///./data/auth.db

# Admin User Credentials - CHANGE THESE!
ADMIN_EMAIL=your-admin@example.com
ADMIN_USERNAME=youradmin  
ADMIN_PASSWORD=your-secure-password

# CORS Origins (JSON array format)
BACKEND_CORS_ORIGINS=["http://localhost:3000"]

# Token Configuration
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7
```

⚠️ **Security**: Never commit the `.env` file to version control!

## Dependencies

- **FastAPI**: Modern web framework
- **SQLAlchemy**: Database ORM
- **python-jose**: JWT token handling
- **passlib**: Password hashing
- **python-multipart**: Form data support
- **pydantic-settings**: Configuration management
- **uvicorn**: ASGI server

## OAuth2 Schema Compliance

The API follows OAuth2 password flow standards:

- Uses Bearer token authentication
- Provides both access and refresh tokens
- Compatible with OAuth2 clients
- Supports form-based login (`/api/v1/auth/login-form`)

This authentication system provides a solid foundation for your Fastapi-Starter application with modern FastAPI architecture and all the security features you need!
