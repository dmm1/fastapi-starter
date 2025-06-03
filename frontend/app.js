// Fastapi-Starter Backend API Test Frontend
// Configuration
const API_BASE_URL = 'http://127.0.0.1:8000';

// Global state
let currentTokens = {
    access_token: null,
    refresh_token: null
};

// Axios instance with default config
const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Add request interceptor to include auth token
api.interceptors.request.use(
    (config) => {
        if (currentTokens.access_token) {
            config.headers.Authorization = `Bearer ${currentTokens.access_token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add response interceptor to handle token refresh
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response?.status === 401 && currentTokens.refresh_token) {
            try {
                await refreshToken();
                // Retry the original request
                const originalRequest = error.config;
                originalRequest.headers.Authorization = `Bearer ${currentTokens.access_token}`;
                return api.request(originalRequest);
            } catch (refreshError) {
                // Refresh failed, logout user
                logout();
                return Promise.reject(refreshError);
            }
        }
        return Promise.reject(error);
    }
);

// Utility functions
function displayResponse(response, error = null) {
    const responseDisplay = document.getElementById('responseDisplay');

    if (error) {
        responseDisplay.innerHTML = `<span class="status-error">❌ Error:</span>\n${JSON.stringify(error.response?.data || error.message, null, 2)}`;
    } else {
        responseDisplay.innerHTML = `<span class="status-success">✅ Success:</span>\n${JSON.stringify(response.data, null, 2)}`;
    }
}

function updateTokenDisplay() {
    const tokenDisplay = document.getElementById('tokenDisplay');
    const accessTokenSpan = document.getElementById('accessToken');
    const refreshTokenSpan = document.getElementById('refreshTokenSpan');

    if (currentTokens.access_token) {
        tokenDisplay.classList.remove('hidden');
        accessTokenSpan.textContent = currentTokens.access_token.substring(0, 50) + '...';
        refreshTokenSpan.textContent = currentTokens.refresh_token.substring(0, 50) + '...';

        // Enable buttons that require authentication
        document.getElementById('refreshBtn').disabled = false;
        document.getElementById('testBtn').disabled = false;
        document.getElementById('logoutBtn').disabled = false;
    } else {
        tokenDisplay.classList.add('hidden');

        // Disable buttons that require authentication
        document.getElementById('refreshBtn').disabled = true;
        document.getElementById('testBtn').disabled = true;
        document.getElementById('logoutBtn').disabled = true;
    }
}

function showTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });

    // Remove active class from all nav tabs
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.classList.remove('active');
    });

    // Show selected tab
    document.getElementById(`${tabName}-tab`).classList.add('active');

    // Add active class to clicked nav tab
    event.target.classList.add('active');
}

// Authentication functions
async function login(email, password) {
    try {
        const response = await api.post('/api/v1/auth/login', {
            email: email,
            password: password
        });

        currentTokens = response.data;
        updateTokenDisplay();
        displayResponse(response);

        return response.data;
    } catch (error) {
        displayResponse(null, error);
        throw error;
    }
}

async function loginForm() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    try {
        const formData = new FormData();
        formData.append('username', email); // OAuth2 form uses 'username' field
        formData.append('password', password);

        const response = await axios.post(`${API_BASE_URL}/api/v1/auth/login-form`, formData, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        currentTokens = response.data;
        updateTokenDisplay();
        displayResponse(response);

        return response.data;
    } catch (error) {
        displayResponse(null, error);
        throw error;
    }
}

async function register(email, username, password, isAdmin = false) {
    try {
        const response = await api.post('/api/v1/auth/register', {
            email: email,
            username: username,
            password: password,
            is_active: true,
            is_admin: isAdmin
        });

        displayResponse(response);
        return response.data;
    } catch (error) {
        displayResponse(null, error);
        throw error;
    }
}

async function refreshToken() {
    if (!currentTokens.refresh_token) {
        displayResponse(null, { message: 'No refresh token available' });
        return;
    }

    try {
        const response = await api.post('/api/v1/auth/refresh', {
            refresh_token: currentTokens.refresh_token
        });

        currentTokens = response.data;
        updateTokenDisplay();
        displayResponse(response);

        return response.data;
    } catch (error) {
        displayResponse(null, error);
        currentTokens = { access_token: null, refresh_token: null };
        updateTokenDisplay();
        throw error;
    }
}

async function logout() {
    if (!currentTokens.refresh_token) {
        currentTokens = { access_token: null, refresh_token: null };
        updateTokenDisplay();
        return;
    }

    try {
        await api.post('/api/v1/auth/logout', {
            refresh_token: currentTokens.refresh_token
        });

        displayResponse({ data: { message: 'Logged out successfully' } });
    } catch (error) {
        displayResponse(null, error);
    } finally {
        currentTokens = { access_token: null, refresh_token: null };
        updateTokenDisplay();

        // Clear user info
        document.getElementById('userInfo').classList.add('hidden');
        document.getElementById('allUsers').classList.add('hidden');
    }
}

// User management functions
async function getUserInfo() {
    try {
        const response = await api.get('/api/v1/users/me');

        const userInfo = document.getElementById('userInfo');
        userInfo.innerHTML = `
            <h4>User Information</h4>
            <p><strong>ID:</strong> ${response.data.id}</p>
            <p><strong>Email:</strong> ${response.data.email}</p>
            <p><strong>Username:</strong> ${response.data.username}</p>
            <p><strong>Is Active:</strong> ${response.data.is_active ? '✅' : '❌'}</p>
            <p><strong>Is Admin:</strong> ${response.data.is_admin ? '👑' : '👤'}</p>
            <p><strong>Created:</strong> ${new Date(response.data.created_at).toLocaleString()}</p>
            <p><strong>Updated:</strong> ${new Date(response.data.updated_at).toLocaleString()}</p>
        `;
        userInfo.classList.remove('hidden');

        displayResponse(response);
        return response.data;
    } catch (error) {
        displayResponse(null, error);
        throw error;
    }
}

async function updateProfile(email, username, password) {
    try {
        const updateData = {};
        if (email) updateData.email = email;
        if (username) updateData.username = username;
        if (password) updateData.password = password;

        const response = await api.put('/api/v1/users/me', updateData);

        displayResponse(response);

        // Refresh user info
        await getUserInfo();

        return response.data;
    } catch (error) {
        displayResponse(null, error);
        throw error;
    }
}

// Admin functions
async function getAllUsers() {
    try {
        const response = await api.get('/api/v1/users/');

        const allUsers = document.getElementById('allUsers');
        allUsers.innerHTML = `
            <h4>All Users (${response.data.length})</h4>
            ${response.data.map(user => `
                <div style="border: 1px solid var(--pico-border-color); border-radius: var(--pico-border-radius); padding: 1rem; margin: 0.5rem 0;">
                    <p><strong>ID:</strong> ${user.id} | <strong>Email:</strong> ${user.email} | <strong>Username:</strong> ${user.username}</p>
                    <p><strong>Active:</strong> ${user.is_active ? '✅' : '❌'} | <strong>Admin:</strong> ${user.is_admin ? '👑' : '👤'}</p>
                    <p><strong>Created:</strong> ${new Date(user.created_at).toLocaleDateString()}</p>
                </div>
            `).join('')}
        `;
        allUsers.classList.remove('hidden');

        displayResponse(response);
        return response.data;
    } catch (error) {
        displayResponse(null, error);
        throw error;
    }
}

// Test functions
async function testProtectedEndpoint() {
    try {
        const response = await api.get('/api/v1/users/me');
        displayResponse(response);
        return response.data;
    } catch (error) {
        displayResponse(null, error);
        throw error;
    }
}

// Event listeners
document.addEventListener('DOMContentLoaded', function () {
    // Login form
    document.getElementById('loginForm').addEventListener('submit', async function (e) {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;

        try {
            await login(email, password);
        } catch (error) {
            console.error('Login failed:', error);
        }
    });

    // Register form
    document.getElementById('registerForm').addEventListener('submit', async function (e) {
        e.preventDefault();
        const email = document.getElementById('registerEmail').value;
        const username = document.getElementById('registerUsername').value;
        const password = document.getElementById('registerPassword').value;
        const isAdmin = document.getElementById('registerAdmin').checked;

        try {
            await register(email, username, password, isAdmin);
            // Clear form
            this.reset();
        } catch (error) {
            console.error('Registration failed:', error);
        }
    });

    // Update profile form
    document.getElementById('updateProfileForm').addEventListener('submit', async function (e) {
        e.preventDefault();
        const email = document.getElementById('updateEmail').value;
        const username = document.getElementById('updateUsername').value;
        const password = document.getElementById('updatePassword').value;

        try {
            await updateProfile(email, username, password);
            // Clear form
            this.reset();
        } catch (error) {
            console.error('Profile update failed:', error);
        }
    });

    // Theme toggle
    document.getElementById('themeToggle').addEventListener('click', function () {
        const html = document.documentElement;
        const currentTheme = html.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

        html.setAttribute('data-theme', newTheme);
        this.textContent = newTheme === 'dark' ? '☀️ Light' : '🌙 Dark';

        // Save theme preference
        localStorage.setItem('theme', newTheme);
    });

    // Load saved theme
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    const themeToggle = document.getElementById('themeToggle');
    themeToggle.textContent = savedTheme === 'dark' ? '☀️ Light' : '🌙 Dark';
});

// Initialize
updateTokenDisplay();
