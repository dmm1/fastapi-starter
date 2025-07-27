# Fastapi-Starter Project - Authentication System Starter

A modern authentication system starter built with **FastAPI** backend and a **test frontend interface**. This project provides a solid foundation that can be extended with modern frontend frameworks like **React**, **Vue**, **Angular**, or any other frontend technology.

> 🎯 **Purpose**: The included HTML/JavaScript frontend is designed for **API testing and development**. Replace it with your preferred modern frontend framework for production use.

## 🚀 Quick Start (Both Servers)

The easiest way to run both backend and frontend simultaneously:

```bash
python run.py
```

This will start:
- **Backend API** on http://localhost:8000
- **Frontend UI** on http://localhost:3000

Press `Ctrl+C` to stop both servers.

## 📁 Project Structure

```
Fastapi-Starter/
├── run.py                    # 🎯 Start both servers
├── backend/                  # 🔧 FastAPI Backend
│   ├── run.py               # Backend server entry point
│   ├── app/                 # Modular FastAPI application
│   ├── data/                # SQLite database
│   └── requirements.txt     # Python dependencies
└── frontend/                # 🧪 Test Frontend Interface
    ├── index.html           # API testing interface
    ├── app.js              # Testing application logic
    ├── server.py           # Development server
    └── README.md           # Frontend testing guide
```

## 🌟 Features

### Backend (FastAPI)
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

### Frontend (Test Interface)
- ✅ **API Testing UI**: Comprehensive interface to test all backend endpoints
- ✅ **Modern UI**: Built with Pico CSS framework for clean testing
- ✅ **Complete Testing**: All authentication and user management flows
- ✅ **Real-time API**: Live API response viewer for debugging
- ✅ **Mobile Responsive**: Test on any device
- ✅ **Admin Interface**: Test admin-only functionality

> 💡 **Note**: This frontend is for **development and testing only**. Replace with React, Vue, Angular, or your preferred modern framework for production.

## 🔧 Individual Server Commands

### Backend Only
```bash
cd backend
python run.py
```
Access at: http://localhost:8000

### Frontend Only
```bash
cd frontend
python server.py
```
Access at: http://localhost:3000

## 📚 API Documentation

With the backend running, access:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **OpenAPI Schema**: http://localhost:8000/openapi.json

## 🔐 Default Credentials

The system creates a default admin user from your `.env` configuration:
- **Email**: Set via `ADMIN_EMAIL` in `.env` 
- **Password**: Set via `ADMIN_PASSWORD` in `.env`
- **Username**: Set via `ADMIN_USERNAME` in `.env`

⚠️ **Important**: Always change the default credentials in your `.env` file before production!

## 📊 Key Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/register` | Register new user (with password validation) |
| POST | `/api/v1/auth/login` | Login with credentials (returns roles in token) |
| POST | `/api/v1/auth/refresh` | Refresh access token |
| GET | `/api/v1/users/me` | Get current user info |
| GET | `/api/v1/users/` | Get all users (admin) |
| GET | `/api/v1/roles/` | Get all available roles |
| POST | `/api/v1/roles/assign` | Assign roles to user (admin) |
| GET | `/health` | Health check with system metrics |
| GET | `/metrics` | Application metrics (monitoring) |
| GET | `/status` | Basic application status |

## 🛠️ Development Setup

1. **Clone & Navigate**:
   ```bash
   git clone <your-repo>
   cd Fastapi-Starter
   ```

2. **Setup Environment**:
   ```bash
   cd backend
   cp .env.example .env
   # Generate a secure secret key (optional)
   python generate_secret_key.py
   # Edit .env file with your settings (especially admin credentials!)
   ```

3. **Install Backend Dependencies**:
   ```bash
   pip install -r requirements.txt
   cd ..
   ```

4. **Start Both Servers**:
   ```bash
   python run.py
   ```

5. **Open Browser**: http://localhost:3000

## 🏗️ Architecture

### Backend Architecture
- **Modular Design**: Separate layers for API, services, models, and database
- **FastAPI Best Practices**: Dependency injection, automatic validation
- **SQLAlchemy ORM**: Modern database handling with SQLite
- **JWT Security**: Secure token-based authentication
- **Pydantic Schemas**: Type-safe data validation

### Frontend Architecture
- **Test Interface**: Vanilla JavaScript for API testing and development
- **Axios HTTP Client**: With automatic token management examples
- **Pico CSS**: Minimal framework for clean testing interface
- **Responsive Design**: Test on mobile and desktop

> 🚀 **Ready for Modern Frameworks**: The backend API is framework-agnostic and works seamlessly with:
> - **React** (with hooks, context, or Redux)
> - **Vue.js** (with Composition API or Options API)  
> - **Angular** (with services and guards)
> - **Svelte** (with stores)
> - **Next.js** (with API routes)
> - **Nuxt.js** (with middleware)
> - Any other modern frontend framework or vanilla JavaScript

## 🔒 Security Features

- **Password Hashing**: Bcrypt with salt
- **JWT Tokens**: HS256 algorithm with expiration and role information
- **Token Refresh**: Automatic token renewal
- **CORS Protection**: Configurable origins
- **Role-Based Access Control**: Flexible multi-role system
- **Password Policy**: Strong password requirements
- **Security Headers**: Comprehensive security headers on all responses
- **Token Versioning**: Support for future token invalidation

## 📝 Environment Configuration

Copy the example environment file and configure your settings:

```bash
cd backend
cp .env.example .env
```

Then edit `backend/.env` with your configuration:
```env
# Security - Generate a strong secret key for production
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

⚠️ **Security Note**: Never commit the `.env` file to version control. It contains sensitive information!

## 🚀 Production Deployment

### Backend
- Use PostgreSQL/MySQL instead of SQLite
- Set strong SECRET_KEY
- Configure CORS for your domain
- Use HTTPS
- Add rate limiting
- Set up monitoring

### Frontend
> **Replace the test frontend with a production-ready solution:**

**React Example:**
```bash
npx create-react-app my-Fastapi-Starter-frontend
cd my-Fastapi-Starter-frontend
npm install axios
# Configure API_BASE_URL to point to your backend
```

**Vue Example:**
```bash
npm create vue@latest my-Fastapi-Starter-frontend
cd my-Fastapi-Starter-frontend
npm install axios
# Configure API baseURL in your HTTP client
```

**Next.js Example:**
```bash
npx create-next-app@latest my-Fastapi-Starter-frontend
cd my-Fastapi-Starter-frontend
npm install axios
# Set up environment variables for API URLs
```

### Frontend Migration Tips
1. **API Client**: Copy the authentication logic from `frontend/app.js`
2. **Token Management**: Implement automatic token refresh using interceptors
3. **Route Protection**: Add authentication guards for protected routes
4. **State Management**: Use Context/Redux/Vuex for user state
5. **Environment Variables**: Configure API URLs for different environments

## 🧪 Testing

1. **Start the system**: `python run.py`
2. **Open test interface**: http://localhost:3000
3. **Login with admin credentials**
4. **Test all API endpoints** through the UI
5. **Check API docs**: http://localhost:8000/docs
6. **Use the test interface to understand the API flow** before implementing your production frontend

## 🎯 Next Steps for Production

1. **Keep the Backend**: The FastAPI backend is production-ready
2. **Replace the Frontend**: Choose your preferred modern framework:
   - **React**: For component-based UI with hooks
   - **Vue.js**: For progressive, approachable development  
   - **Angular**: For enterprise-scale applications
   - **Svelte**: For compiled, efficient applications
   - **Next.js/Nuxt.js**: For server-side rendering
3. **Copy Authentication Logic**: Use the patterns from `frontend/app.js`
4. **Implement Modern Features**: Add routing, state management, and UI libraries
5. **Deploy**: Use Vercel, Netlify, or your preferred hosting for the frontend

## 📖 Documentation

- **Backend README**: `backend/README.md` - Detailed API documentation
- **Frontend README**: `frontend/README.md` - Test interface guide
- **RBAC Documentation**: `RBAC_DOCUMENTATION.md` - Role-based access control guide
- **Rate Limiting & Monitoring**: `RATE_LIMITING_AND_MONITORING.md` - Production features guide
- **API Docs**: Available at `/docs` when backend is running

> 📚 **For Frontend Developers**: Study the test interface code in `frontend/app.js` to understand the authentication flow, then implement it in your preferred modern framework.

## 🔒 Production Features

This starter now includes production-ready features:

- **Rate Limiting**: Automatic protection against abuse with configurable limits
- **Monitoring**: Health checks, metrics, and system monitoring
- **Structured Logging**: JSON-formatted logs for security events
- **Security Events**: Automatic tracking of authentication attempts and rate limit violations

See `RATE_LIMITING_AND_MONITORING.md` for detailed configuration and usage.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

**Happy Coding!** 🎉

Built with ❤️ using FastAPI, SQLAlchemy, and modern web technologies.

> 🚀 **Ready for your favorite frontend framework!** This authentication system provides a solid foundation that works seamlessly with React, Vue, Angular, Svelte, or any modern frontend technology.
