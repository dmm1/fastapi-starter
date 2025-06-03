# Fastapi-Starter Backend API - Authentication System

A secure FastAPI-based authentication system with JWT tokens, user management, and admin functionality. Built with modern FastAPI best practices using a modular architecture.

## Features

- ✅ **Secure Authentication**: JWT access and refresh tokens
- ✅ **User Registration & Login**: Email-based authentication  
- ✅ **Token Refresh**: Seamless token renewal
- ✅ **User Management**: Profile updates and admin controls
- ✅ **Admin Panel**: Admin-only endpoints for user management
- ✅ **OAuth2 Compatible**: Supports OAuth2 password flow
- ✅ **Password Hashing**: Secure bcrypt password hashing
- ✅ **CORS Support**: Cross-origin requests enabled
- ✅ **SQLite Database**: Persistent data storage with SQLAlchemy ORM
- ✅ **Modular Architecture**: Clean separation of concerns
- ✅ **API Versioning**: Versioned API endpoints under `/api/v1/`

## Quick Start

1. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

2. **Start the Server**:
   ```bash
   python run.py
   ```

3. **Access Documentation**: 
   - API Docs: http://127.0.0.1:8000/docs
   - OpenAPI Schema: http://127.0.0.1:8000/openapi.json
   - Health Check: http://127.0.0.1:8000/health

## Default Admin User

A default admin user is created automatically:
- **Email**: `admin@example.com`
- **Password**: `admin123`
- **Username**: `admin`

⚠️ **Important**: Change the admin password in production!

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
    "password": "securepassword123"
  }'
```
    "password": "securepassword123"
  }'
```

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
- **Password Hashing**: Bcrypt with salt
- **Token Expiration**: Access tokens expire in 30 minutes
- **Refresh Tokens**: Long-lived tokens for renewal (7 days)
- **Token Invalidation**: Logout invalidates refresh tokens
- **Admin Protection**: Admin-only endpoints require admin privileges

## Architecture & File Structure

This backend follows modern FastAPI best practices with a modular architecture:

```
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
4. **HTTPS**: Use HTTPS in production
5. **Rate Limiting**: Add rate limiting for login attempts
6. **Logging**: Add comprehensive logging
7. **Monitoring**: Set up health checks and monitoring
8. **Environment**: Use different configurations for dev/staging/production

## Environment Variables

Create a `.env` file in the backend directory:

```env
SECRET_KEY=your-super-secret-key-change-this-in-production-minimum-32-characters
DATABASE_URL=sqlite:///./data/auth.db
ADMIN_EMAIL=admin@example.com
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
```

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
