# Fastapi-Starter Backend Frontend - Authentication Test Interface

A simple, lightweight frontend to test the Fastapi-Starter Backend authentication system.

## Features

- ✅ **Modern UI**: Built with Pico CSS (minimal, semantic framework)
- ✅ **Complete Auth Testing**: Login, register, logout, token refresh
- ✅ **User Management**: View and update user profiles
- ✅ **Admin Panel**: Admin-only user management
- ✅ **Token Management**: Visual token display and automatic refresh
- ✅ **Dark/Light Theme**: Toggle between themes
- ✅ **Real-time API Testing**: See all API responses in real-time
- ✅ **Mobile Responsive**: Works on all device sizes

## Quick Start

1. **Make sure the backend is running**:
   ```bash
   cd ../backend
   python run.py
   ```

2. **Start the frontend server**:
   ```bash
   python server.py
   ```

3. **Open your browser**: http://localhost:3000

## Default Test Credentials

The frontend comes pre-filled with the default admin credentials:
- **Email**: `admin@example.com`
- **Password**: `admin123`

## UI Overview

### 🔐 Authentication Tab
- **Login Forms**: Test both JSON and OAuth2 form-based login
- **User Registration**: Create new users with admin toggle
- **Token Display**: View current access and refresh tokens
- **Token Management**: Manual token refresh and protected endpoint testing

### 👤 User Profile Tab
- **User Info**: Display current user information
- **Profile Updates**: Update email, username, and password
- **Real-time Updates**: See changes immediately

### 👑 Admin Panel Tab
- **User List**: View all registered users (admin only)
- **User Management**: Future admin user management features

### 📊 API Response Panel
- **Real-time Responses**: See all API calls and responses
- **Error Handling**: Clear error messages and status codes
- **JSON Formatting**: Pretty-printed JSON responses

## Features in Detail

### Automatic Token Management
- **Auto-refresh**: Tokens are automatically refreshed when they expire
- **Interceptors**: Axios interceptors handle token attachment and refresh
- **Session Management**: Logout clears all tokens and UI state

### Theme Support
- **Light/Dark Modes**: Toggle between light and dark themes
- **Persistent Settings**: Theme preference saved in localStorage
- **System Integration**: Respects system dark mode preference

### Responsive Design
- **Mobile-first**: Works perfectly on mobile devices
- **Grid Layouts**: Responsive grid system for forms
- **Touch-friendly**: Large buttons and touch targets

## File Structure

```
frontend/
├── index.html          # Main HTML file with UI structure
├── app.js             # JavaScript application logic
├── server.py          # Simple Python HTTP server
└── README.md          # This file
```

## Technologies Used

- **[Pico CSS](https://picocss.com/)**: Minimal CSS framework (47KB)
- **[Axios](https://axios-http.com/)**: HTTP client with interceptors
- **Vanilla JavaScript**: No heavy frameworks, just clean JS
- **Python HTTP Server**: Simple development server

## API Testing Workflow

1. **Start with Authentication**:
   - Click "Login (JSON)" to test the primary login endpoint
   - Or try "Login (Form)" to test OAuth2 form-based login
   - Watch tokens appear in the token display

2. **Test User Management**:
   - Go to "User Profile" tab
   - Click "Get User Info" to see current user data
   - Try updating your profile information

3. **Admin Features** (if logged in as admin):
   - Go to "Admin Panel" tab
   - Click "Get All Users" to see all registered users

4. **Register New Users**:
   - Back to "Authentication" tab
   - Fill out the registration form
   - Toggle "Make Admin" to create admin users

5. **Test Token Management**:
   - Click "Refresh Token" to manually refresh tokens
   - Click "Test Protected Endpoint" to test authentication
   - Watch the API responses in the bottom panel

## Development Tips

### Testing Different Scenarios

1. **Invalid Credentials**: Try wrong email/password
2. **Expired Tokens**: Wait for tokens to expire and test auto-refresh
3. **Admin vs Regular User**: Test with different user types
4. **Network Errors**: Stop the backend and test error handling

### Customization

- **Colors**: Modify CSS variables in `index.html`
- **API URL**: Change `API_BASE_URL` in `app.js`
- **Server Port**: Use `python server.py 8080` for different port

## Browser Compatibility

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

## Production Notes

This frontend is designed for **development and testing only**. For production:

1. Use a proper build system (Vite, Webpack, etc.)
2. Implement proper error boundaries
3. Add input validation and sanitization
4. Use environment variables for API URLs
5. Implement proper logging and monitoring

## Troubleshooting

### Backend Not Available
If you see CORS errors or connection refused:
1. Make sure the backend is running on http://127.0.0.1:8000
2. Check that CORS is properly configured in the backend

### Port Already in Use
If port 3000 is busy:
```bash
python server.py 3001
```

### Tokens Not Working
1. Check the API response panel for error details
2. Try logging out and logging back in
3. Verify the backend secret key matches

Enjoy testing your authentication system! 🚀
