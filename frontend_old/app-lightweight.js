// FastAPI Starter - Lightweight Monitoring

// Configuration
const API_BASE_URL = 'http://127.0.0.1:8000';

// Global state
let currentTokens = {
    access_token: null,
    refresh_token: null
};

let eventLogs = [];
let rateLimitTestActive = false;

// Utility Functions
function showToast(message, type = 'info') {
    alert(message); // Simple alert instead of fancy toast
}

function showError(error) {
    console.error('API Error:', error);
    const message = error.response?.data?.detail || error.message || 'An unknown error occurred';
    showToast(message, 'error');
}

// Authentication Functions
async function login(email, password) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password })
        });

        if (!response.ok) {
            throw new Error(`Login failed: ${response.statusText}`);
        }

        const data = await response.json();
        currentTokens = data;

        // Update UI
        document.getElementById('authStatus').style.display = 'block';
        document.getElementById('userEmail').textContent = email;
        document.getElementById('noTokenMessage').style.display = 'none';
        document.getElementById('tokenDisplay').style.display = 'block';
        document.getElementById('accessTokenDisplay').textContent = data.access_token;
        document.getElementById('refreshTokenDisplay').textContent = data.refresh_token;

        // Enable buttons
        document.getElementById('logoutBtn').disabled = false;
        document.getElementById('refreshTokenBtn').disabled = false;
        document.getElementById('getUserInfoBtn').disabled = false;

        showToast('Login successful', 'success');
        return data;
    } catch (error) {
        showError(error);
        throw error;
    }
}

async function logout() {
    try {
        if (!currentTokens.refresh_token) {
            throw new Error('No active session');
        }

        const response = await fetch(`${API_BASE_URL}/api/v1/auth/logout`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${currentTokens.access_token}`
            },
            body: JSON.stringify({ refresh_token: currentTokens.refresh_token })
        });

        if (!response.ok) {
            throw new Error(`Logout failed: ${response.statusText}`);
        }

        // Reset tokens and UI
        currentTokens = { access_token: null, refresh_token: null };
        document.getElementById('authStatus').style.display = 'none';
        document.getElementById('tokenDisplay').style.display = 'none';
        document.getElementById('noTokenMessage').style.display = 'block';

        // Disable buttons
        document.getElementById('logoutBtn').disabled = true;
        document.getElementById('refreshTokenBtn').disabled = true;
        document.getElementById('getUserInfoBtn').disabled = true;

        showToast('Logout successful', 'success');
    } catch (error) {
        showError(error);
    }
}

async function refreshToken() {
    try {
        if (!currentTokens.refresh_token) {
            throw new Error('No refresh token available');
        }

        const response = await fetch(`${API_BASE_URL}/api/v1/auth/refresh`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ refresh_token: currentTokens.refresh_token })
        });

        if (!response.ok) {
            throw new Error(`Token refresh failed: ${response.statusText}`);
        }

        const data = await response.json();
        currentTokens = data;

        // Update token display
        document.getElementById('accessTokenDisplay').textContent = data.access_token;
        document.getElementById('refreshTokenDisplay').textContent = data.refresh_token;

        showToast('Token refreshed successfully', 'success');
    } catch (error) {
        showError(error);
    }
}

async function getUserInfo() {
    try {
        if (!currentTokens.access_token) {
            throw new Error('Not authenticated');
        }

        const response = await fetch(`${API_BASE_URL}/api/v1/users/me`, {
            headers: {
                'Authorization': `Bearer ${currentTokens.access_token}`
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to get user info: ${response.statusText}`);
        }

        const data = await response.json();
        showModal(JSON.stringify(data, null, 2));
        return data;
    } catch (error) {
        showError(error);
    }
}

// Health & Monitoring Functions
async function fetchHealthCheck() {
    try {
        const response = await fetch(`${API_BASE_URL}/health`);
        if (!response.ok) {
            throw new Error(`Health check failed: ${response.statusText}`);
        }

        const data = await response.json();
        updateHealthStatus(data);
        document.getElementById('lastHealthCheck').textContent = new Date().toLocaleTimeString();

        // Show full response in modal
        showModal(JSON.stringify(data, null, 2));
        return data;
    } catch (error) {
        showError(error);
        updateHealthStatus({ status: 'unhealthy' });
    }
}

async function fetchMetrics() {
    try {
        const response = await fetch(`${API_BASE_URL}/metrics`);
        if (!response.ok) {
            throw new Error(`Failed to fetch metrics: ${response.statusText}`);
        }

        const data = await response.json();
        updateMetricsDisplay(data);
        return data;
    } catch (error) {
        showError(error);
    }
}

function updateHealthStatus(data) {
    const status = data.status || 'unknown';
    const apiStatus = document.getElementById('apiStatus');
    const apiStatusDot = document.getElementById('apiStatusDot');

    apiStatus.textContent = status.charAt(0).toUpperCase() + status.slice(1);

    if (status === 'healthy') {
        apiStatus.style.color = '#4caf50';
        apiStatusDot.className = 'status status-green';
    } else {
        apiStatus.style.color = '#f44336';
        apiStatusDot.className = 'status status-red';
    }
}

function updateMetricsDisplay(data) {
    // Update overview stats
    if (data) {
        document.getElementById('totalRequests').textContent = data.total_requests || 0;

        // Calculate error rate if available
        const errorRate = data.status_codes ?
            (Object.entries(data.status_codes)
                .filter(([code]) => parseInt(code) >= 400)
                .reduce((sum, [_, count]) => sum + count, 0) /
                Object.values(data.status_codes).reduce((sum, count) => sum + count, 1) * 100).toFixed(1) : 0;

        document.getElementById('errorRate').textContent = `${errorRate}%`;

        // Calculate average response time from all endpoints if available
        const avgResponseTime = data.average_response_times ?
            Object.values(data.average_response_times).reduce((sum, time) => sum + time, 0) /
            Math.max(Object.values(data.average_response_times).length, 1) : 0;

        document.getElementById('avgResponseTime').textContent = `${avgResponseTime.toFixed(2)}ms`;
    }

    // Update system metrics
    if (data && data.system) {
        const cpuUsage = data.system.cpu_percent || 0;
        const memoryUsage = data.system.memory_percent || 0;

        document.getElementById('cpuUsage').textContent = `${cpuUsage.toFixed(1)}%`;
        document.getElementById('cpuBar').value = cpuUsage;

        document.getElementById('memoryUsage').textContent = `${memoryUsage.toFixed(1)}%`;
        document.getElementById('memoryBar').value = memoryUsage;

        document.getElementById('activeConnections').textContent = data.active_connections || 0;
    }
}

// Rate Limiting Test Functions
async function startRateLimitTest() {
    if (rateLimitTestActive) return;

    const endpoint = document.getElementById('endpointSelect').value;
    const count = parseInt(document.getElementById('requestCount').value);
    const delay = parseInt(document.getElementById('requestDelay').value);

    if (count < 1 || count > 50) {
        showToast('Request count must be between 1 and 50', 'error');
        return;
    }

    rateLimitTestActive = true;
    document.getElementById('startRateLimitTest').disabled = true;
    document.getElementById('rateLimitProgress').style.display = 'block';
    document.getElementById('rateLimitResults').innerHTML = '';

    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');
    progressBar.value = 0;
    progressBar.max = count;
    progressText.textContent = `0/${count}`;

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < count; i++) {
        try {
            const startTime = performance.now();

            // Set proper HTTP method and body for each endpoint
            let method = 'GET';
            let headers = {};
            let body = null;

            // Configure request based on endpoint
            if (endpoint === '/api/v1/auth/login') {
                method = 'POST';
                headers = { 'Content-Type': 'application/json' };
                body = JSON.stringify({
                    email: document.getElementById('loginEmail').value || 'admin@example.com',
                    password: document.getElementById('loginPassword').value || 'admin123'
                });
            } else if (endpoint === '/api/v1/auth/register') {
                method = 'POST';
                headers = { 'Content-Type': 'application/json' };
                body = JSON.stringify({
                    email: `test${Date.now()}@example.com`,
                    password: 'password123',
                    first_name: 'Test',
                    last_name: 'User'
                });
            } else if (endpoint === '/api/v1/users/me') {
                method = 'GET';
                if (currentTokens.access_token) {
                    headers = { 'Authorization': `Bearer ${currentTokens.access_token}` };
                }
            } else {
                // Default GET endpoints: /health, /, etc.
                method = 'GET';
            }

            // Add auth header to all requests if token exists
            if (currentTokens.access_token && !headers['Authorization']) {
                headers['Authorization'] = `Bearer ${currentTokens.access_token}`;
            }

            // Make request with appropriate method, headers and body
            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                method: method,
                headers: headers,
                body: body
            });

            const endTime = performance.now();
            const duration = Math.round(endTime - startTime);

            // Create result element
            const result = document.createElement('div');

            if (response.ok) {
                successCount++;
                result.innerHTML = `
                    <p>Request ${i + 1}: <strong>Success</strong> (${response.status} ${response.statusText}) - ${duration}ms</p>
                `;
            } else {
                failCount++;
                const errorData = await response.text();
                result.innerHTML = `
                    <p>Request ${i + 1}: <strong style="color:red">Failed</strong> (${response.status} ${response.statusText}) - ${duration}ms</p>
                    <pre style="margin-top:5px; font-size:12px; background:#f5f5f5; padding:5px;">${errorData}</pre>
                `;
            }

            document.getElementById('rateLimitResults').appendChild(result);

            // Update progress
            progressBar.value = i + 1;
            progressText.textContent = `${i + 1}/${count}`;

            // Delay between requests (except for the last one)
            if (i < count - 1) {
                await new Promise(r => setTimeout(r, delay));
            }
        } catch (error) {
            failCount++;
            const result = document.createElement('div');
            result.innerHTML = `
                <p>Request ${i + 1}: <strong style="color:red">Error</strong> - ${error.message}</p>
            `;
            document.getElementById('rateLimitResults').appendChild(result);

            // Update progress
            progressBar.value = i + 1;
            progressText.textContent = `${i + 1}/${count}`;

            // Delay between requests (except for the last one)
            if (i < count - 1) {
                await new Promise(r => setTimeout(r, delay));
            }
        }
    }

    // Add summary
    const summary = document.createElement('div');
    summary.innerHTML = `
        <p style="margin-top:15px; font-weight:bold;">Test Complete: ${successCount} successful, ${failCount} failed</p>
    `;
    document.getElementById('rateLimitResults').appendChild(summary);

    rateLimitTestActive = false;
    document.getElementById('startRateLimitTest').disabled = false;
}

// UI Utilities
function showModal(content) {
    document.getElementById('responseContent').textContent = content;
    document.getElementById('responseModal').style.display = 'block';
}

function hideModal() {
    document.getElementById('responseModal').style.display = 'none';
}

function switchTab(tabId) {
    // Hide all tab content
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });

    // Remove active class from all tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    // Show selected tab content
    document.getElementById(`${tabId}-tab`).classList.add('active');

    // Add active class to clicked button
    document.querySelector(`.tab-btn[data-tab="${tabId}"]`).classList.add('active');
}

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    // Fetch initial health & metrics
    fetchHealthCheck();
    fetchMetrics();

    // Set up refresh interval (every 30 seconds instead of 5)
    setInterval(() => {
        fetchMetrics();
    }, 30000); // 30 second refresh

    // Tab navigation
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            switchTab(btn.dataset.tab);
        });
    });

    // Authentication handlers
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        await login(email, password);
    });

    document.getElementById('logoutBtn').addEventListener('click', logout);
    document.getElementById('refreshTokenBtn').addEventListener('click', refreshToken);
    document.getElementById('getUserInfoBtn').addEventListener('click', getUserInfo);

    // Quick action buttons
    document.getElementById('healthCheckBtn').addEventListener('click', fetchHealthCheck);
    document.getElementById('refreshMetricsBtn').addEventListener('click', fetchMetrics);
    document.getElementById('clearLogsBtn').addEventListener('click', () => {
        document.getElementById('eventLogs').innerHTML = '<p>Event log cleared</p>';
    });

    // Rate limit testing
    document.getElementById('startRateLimitTest').addEventListener('click', startRateLimitTest);

    // Modal close button
    document.getElementById('closeModal').addEventListener('click', hideModal);
});
