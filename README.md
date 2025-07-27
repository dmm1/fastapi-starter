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
- ✅ **Role-Based Access Control (RBAC)**: Flexible role management system
- ✅ **SQLite Database**: Persistent storage with SQLAlchemy ORM
- ✅ **User Management**: Registration, login, profile updates
- ✅ **Admin Panel**: Admin-only user management endpoints
- ✅ **API Versioning**: Clean `/api/v1/` endpoints
- ✅ **OAuth2 Compatible**: Standard OAuth2 password flow
- ✅ **Auto Documentation**: Swagger UI at `/docs`
- ✅ **Enhanced Security**: Password policies and security headers
- 🆕 **Rate Limiting**: SlowAPI integration with Redis support
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

## 📝 API Endpoints (Key additions)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST   | `/api/v1/users/me/avatar` | Upload user avatar |
| DELETE | `/api/v1/users/me/avatar` | Delete user avatar |
| GET    | `/static/avatars/{filename}` | Serve avatar image |

## 🧑‍💻 Frontend Usage

- **Login/Register**: Modern forms, error handling, dark mode
- **Profile**: Edit info, change password, manage avatar
- **Admin**: Manage users, roles, avatars
- **Theme Toggle**: Top right in header

## 🏁 Next Steps

- Extend with more shadcn/ui components
- Add more admin features
- Integrate with your own backend or deploy as-is

---

**Happy Coding!** 🎉

Built with ❤️ using FastAPI, React, shadcn/ui, and modern web technologies.

> 🚀 **Ready for your favorite frontend framework!** This authentication system provides a solid foundation that works seamlessly with React, Vue, Angular, Svelte, or any modern frontend technology.
