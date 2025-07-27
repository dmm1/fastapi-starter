# Fastapi-Starter Project - Modern Authentication System

A modern authentication system starter built with **FastAPI** backend and a **React frontend** using shadcn/ui, dark mode, avatar management, and a modern admin dashboard. This project provides a solid foundation for production-ready apps with role-based access control, user management, and beautiful UI/UX.

> 🎯 **Purpose**: The included React frontend is designed for **real-world authentication and admin flows**. Easily extend with more features or integrate with your own backend.

## 🚀 Quick Start (Both Servers)

The easiest way to run both backend and frontend simultaneously:

```bash
python run.py
```

This will start:

- **Backend API** on <http://localhost:8000>
- **Frontend UI** on <http://localhost:3000> (React + shadcn)

Press `Ctrl+C` to stop both servers.

## 🌟 Features

### Frontend (React + shadcn/ui)

- ✅ **Modern UI/UX**: Built with shadcn/ui, dark mode, and beautiful design
- ✅ **Avatar Management**: Upload, preview, and delete profile avatars
- ✅ **Admin Dashboard**: Stats, user management, and role badges
- ✅ **Role-Based Navigation**: Dynamic UI based on user roles
- ✅ **Theme Toggle**: Built-in dark mode support
- ✅ **Profile Page**: Edit profile, change password, manage avatar
- ✅ **Login/Register**: Modern forms with validation and error handling
- ✅ **Responsive Design**: Works on mobile and desktop
- ✅ **TanStack Router**: Modern routing and navigation
- ✅ **API Client**: Automatic token refresh and error handling

### Backend (FastAPI)

- ✅ **Avatar Upload/Delete**: Endpoints for uploading and deleting user avatars
- ✅ **Static File Serving**: Avatars served via `/static/avatars/`
- ✅ **Modern Architecture**: Modular FastAPI with separation of concerns
- ✅ **JWT Authentication**: Access and refresh tokens with role information
- ✅ **Secure Session Management**: Redis-backed session tracking with device information
- ✅ **Role-Based Access Control (RBAC)**: Flexible role management system
- ✅ **SQLite Database**: Persistent storage with SQLAlchemy ORM
- ✅ **User Management**: Registration, login, profile updates
- ✅ **Admin Panel**: Admin-only user management endpoints
- ✅ **API Versioning**: Clean `/api/v1/` endpoints
- ✅ **OAuth2 Compatible**: Standard OAuth2 password flow
- ✅ **Auto Documentation**: Swagger UI at `/docs`
- ✅ **Enhanced Security**: Password policies and security headers
- 🆕 **Custom Rate Limiting**: High-performance rate limiting with configurable limits
- 🆕 **Session Tracking**: Track active sessions with device info and IP addresses
- 🆕 **Monitoring**: Comprehensive metrics and health checks
- 🆕 **Structured Logging**: JSON-formatted security event logging
- 🆕 **Production Ready**: Enhanced security and observability

## 📁 Project Structure

```bash
Fastapi-Starter/
├── run.py                    # 🎯 Start both servers
├── backend/                  # 🔧 FastAPI Backend
│   ├── run.py               # Backend server entry point
│   ├── app/                 # Modular FastAPI application
│   ├── data/                # SQLite database & avatar uploads
│   └── requirements.txt     # Python dependencies
└── frontend/                # 🧑‍💻 React Frontend (shadcn/ui)
    ├── src/                 # React source code
    ├── public/              # Static assets
    ├── package.json         # Frontend dependencies
    └── README.md            # Frontend guide
```

## 🖼️ Avatar Management

- **Upload Avatar**: Go to Profile, click avatar, upload image (PNG/JPG/GIF up to 5MB)
- **Delete Avatar**: Click 'Delete Current' in avatar dialog
- **Avatar Storage**: Avatars are stored in `backend/data/uploads/avatars/` and served at `/static/avatars/`
- **Fallback**: If no avatar, Dicebear initials are shown

## 🛡️ Admin Dashboard

- **Stats Cards**: Total users, admins, active/inactive users
- **User Table**: Avatar, status, roles, actions (edit/delete)
- **Role Badges**: Visual role indicators
- **Search**: Filter users by name/email

## 🔐 Session Management

- **Secure Sessions**: Redis-backed session storage with database fallback
- **Device Tracking**: Track login device, browser, and IP address information
- **Session List**: View all active sessions in user profile
- **Remote Logout**: Delete sessions from other devices
- **Automatic Cleanup**: Expired sessions are automatically removed
- **Session Cookies**: Secure, HttpOnly cookies for enhanced security

## ⚡ Rate Limiting & Security

- **Custom Rate Limiting**: High-performance in-memory rate limiting
- **Configurable Limits**: Environment-based rate limit configuration
- **Endpoint-Specific**: Different limits for auth, API, and admin endpoints
- **Security Headers**: CSRF protection, HSTS, and content security policies
- **Monitoring**: Real-time metrics and health checks
- **Admin Protection**: Special rate limits for admin operations

## 📝 API Endpoints (Key additions)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST   | `/api/v1/users/me/avatar` | Upload user avatar |
| DELETE | `/api/v1/users/me/avatar` | Delete user avatar |
| GET    | `/static/avatars/{filename}` | Serve avatar image |
| GET    | `/api/v1/sessions/` | Get user's active sessions |
| DELETE | `/api/v1/sessions/{session_id}` | Delete specific session |
| GET    | `/metrics` | Application metrics (admin only) |

## 🧑‍💻 Frontend Usage

- **Login/Register**: Modern forms, error handling, dark mode
- **Profile**: Edit info, change password, manage avatar, view active sessions
- **Session Management**: View and delete active sessions from other devices
- **Admin**: Manage users, roles, avatars
- **Theme Toggle**: Top right in header

## ⚙️ Configuration

The application supports extensive configuration via environment variables:

### Security & Authentication

```bash
SECRET_KEY=your-secret-key
SECURE_COOKIES=false  # Set to true in production
HTTPS_ONLY=false      # Set to true in production
```

### Rate Limiting

```bash
DEFAULT_RATE_LIMIT=1000 per hour
AUTH_LOGIN_RATE_LIMIT=5 per minute
AUTH_REGISTER_RATE_LIMIT=3 per minute
API_GENERAL_RATE_LIMIT=100 per minute
ADMIN_OPERATIONS_RATE_LIMIT=50 per minute
```

### Session & Redis

```bash
REDIS_URL=redis://localhost:6379
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7
```

See `backend/.env.example` for all available configuration options.

## 🏁 Next Steps

- Extend with more shadcn/ui components
- Add more admin features
- Integrate with your own backend or deploy as-is

---

**Happy Coding!** 🎉

Built with ❤️ using FastAPI, React, shadcn/ui, and modern web technologies.

> 🚀 **Ready for your favorite frontend framework!** This authentication system provides a solid foundation that works seamlessly with React, Vue, Angular, Svelte, or any modern frontend technology.
