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
let refreshInterval = null;

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

// Utility Functions
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast bg-${type === 'error' ? 'red' : type === 'success' ? 'green' : 'blue'}-500 text-white px-6 py-3 rounded-lg shadow-lg mb-2`;
    toast.innerHTML = `
        <div class="flex items-center space-x-2">
            <i data-lucide="${type === 'error' ? 'alert-circle' : type === 'success' ? 'check-circle' : 'info'}" class="w-4 h-4"></i>
            <span>${message}</span>
        </div>
    `;

    document.getElementById('toastContainer').appendChild(toast);
    lucide.createIcons();

    setTimeout(() => {
        toast.remove();
    }, 3000);
}

function addEventLog(type, message, details = null) {
    const timestamp = new Date().toISOString();
    const logEntry = {
        id: Date.now(),
        timestamp,
        type,
        message,
        details
    };

    eventLogs.unshift(logEntry);
    if (eventLogs.length > 100) {
        eventLogs.pop();
    }

    updateEventLogs();
}

function updateEventLogs() {
    const container = document.getElementById('eventLogs');
    const filter = document.getElementById('logFilter').value;

    const filteredLogs = eventLogs.filter(log =>
        filter === 'all' || log.type === filter
    );

    if (filteredLogs.length === 0) {
        container.innerHTML = `
            <div class="text-center text-gray-500 py-8">
                <i data-lucide="file-text" class="w-12 h-12 mx-auto mb-3 text-gray-300"></i>
                <p>No events logged yet</p>
                <p class="text-sm">Events will appear here as they occur</p>
            </div>
        `;
    } else {
        container.innerHTML = filteredLogs.map(log => `
            <div class="log-entry p-3 bg-gray-50 rounded-lg border-l-4 border-${getLogTypeColor(log.type)}-500">
                <div class="flex justify-between items-start">
                    <div class="flex-1">
                        <p class="font-medium text-gray-900">${log.message}</p>
                        <p class="text-sm text-gray-500">${new Date(log.timestamp).toLocaleString()}</p>
                        ${log.details ? `<pre class="text-xs text-gray-600 mt-2 overflow-x-auto">${JSON.stringify(log.details, null, 2)}</pre>` : ''}
                    </div>
                    <span class="text-xs px-2 py-1 bg-${getLogTypeColor(log.type)}-100 text-${getLogTypeColor(log.type)}-800 rounded">${log.type}</span>
                </div>
            </div>
        `).join('');
    }

    lucide.createIcons();
}

function getLogTypeColor(type) {
    const colors = {
        login: 'blue',
        rate_limit: 'red',
        errors: 'red',
        success: 'green',
        info: 'blue'
    };
    return colors[type] || 'gray';
}

function showModal(title, content) {
    const modal = document.getElementById('responseModal');
    modal.querySelector('h3').textContent = title;
    modal.querySelector('#responseContent').textContent = JSON.stringify(content, null, 2);
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

function hideModal() {
    const modal = document.getElementById('responseModal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
}

// Tab Management
function showTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.add('hidden');
    });

    // Remove active styles from all nav tabs
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.classList.remove('border-blue-600', 'text-blue-600');
        tab.classList.add('border-transparent', 'text-gray-500');
    });

    // Show selected tab
    document.getElementById(`${tabName}-tab`).classList.remove('hidden');

    // Add active styles to clicked nav tab
    const activeTab = document.querySelector(`[data-tab="${tabName}"]`);
    activeTab.classList.add('border-blue-600', 'text-blue-600');
    activeTab.classList.remove('border-transparent', 'text-gray-500');

    // Load tab-specific data
    if (tabName === 'monitoring') {
        updateSystemMetrics();
    } else if (tabName === 'rate-limits') {
        updateRateLimitStatus();
    }
}

// Authentication Functions
async function login(email, password) {
    try {
        const response = await api.post('/api/v1/auth/login', {
            email: email,
            password: password
        });

        currentTokens = response.data;
        updateAuthUI();
        addEventLog('login', `User ${email} logged in successfully`);
        showToast('Login successful!', 'success');

        return response.data;
    } catch (error) {
        addEventLog('errors', 'Login failed', error.response?.data);
        showToast('Login failed: ' + (error.response?.data?.detail || error.message), 'error');
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

        addEventLog('success', `User ${email} registered successfully`);
        showToast('Registration successful!', 'success');
        return response.data;
    } catch (error) {
        addEventLog('errors', 'Registration failed', error.response?.data);
        showToast('Registration failed: ' + (error.response?.data?.detail || error.message), 'error');
        throw error;
    }
}

async function refreshToken() {
    if (!currentTokens.refresh_token) {
        showToast('No refresh token available', 'error');
        return;
    }

    try {
        const response = await api.post('/api/v1/auth/refresh', {
            refresh_token: currentTokens.refresh_token
        });

        currentTokens = response.data;
        updateAuthUI();
        addEventLog('success', 'Token refreshed successfully');
        showToast('Token refreshed!', 'success');

        return response.data;
    } catch (error) {
        addEventLog('errors', 'Token refresh failed', error.response?.data);
        showToast('Token refresh failed', 'error');
        currentTokens = { access_token: null, refresh_token: null };
        updateAuthUI();
        throw error;
    }
}

function logout() {
    currentTokens = { access_token: null, refresh_token: null };
    updateAuthUI();
    addEventLog('info', 'User logged out');
    showToast('Logged out successfully', 'info');
}

async function getUserInfo() {
    try {
        const response = await api.get('/api/v1/users/me');
        document.getElementById('userEmail').textContent = response.data.email;
        showToast('User info retrieved', 'success');
        return response.data;
    } catch (error) {
        showToast('Failed to get user info', 'error');
        throw error;
    }
}

function updateAuthUI() {
    const authStatus = document.getElementById('authStatus');
    const loginForm = document.getElementById('loginForm');
    const logoutBtn = document.getElementById('logoutBtn');
    const refreshTokenBtn = document.getElementById('refreshTokenBtn');
    const getUserInfoBtn = document.getElementById('getUserInfoBtn');
    const tokenDisplay = document.getElementById('tokenDisplay');
    const noTokenMessage = document.getElementById('noTokenMessage');

    if (currentTokens.access_token) {
        authStatus.classList.remove('hidden');
        logoutBtn.disabled = false;
        refreshTokenBtn.disabled = false;
        getUserInfoBtn.disabled = false;

        if (tokenDisplay && noTokenMessage) {
            tokenDisplay.classList.remove('hidden');
            noTokenMessage.classList.add('hidden');

            document.getElementById('accessTokenDisplay').textContent =
                currentTokens.access_token.substring(0, 50) + '...';
            document.getElementById('refreshTokenDisplay').textContent =
                currentTokens.refresh_token.substring(0, 50) + '...';
        }
    } else {
        authStatus.classList.add('hidden');
        logoutBtn.disabled = true;
        refreshTokenBtn.disabled = true;
        getUserInfoBtn.disabled = true;

        if (tokenDisplay && noTokenMessage) {
            tokenDisplay.classList.add('hidden');
            noTokenMessage.classList.remove('hidden');
        }
    }
}

// Monitoring Functions
async function getHealthCheck() {
    try {
        const response = await api.get('/health');
        updateConnectionStatus(true);
        updateOverviewMetrics(response.data);
        addEventLog('success', 'Health check completed');
        return response.data;
    } catch (error) {
        updateConnectionStatus(false);
        addEventLog('errors', 'Health check failed', error.response?.data);
        throw error;
    }
}

async function getMetrics() {
    try {
        const response = await api.get('/metrics');
        updateOverviewMetrics(response.data);
        return response.data;
    } catch (error) {
        addEventLog('errors', 'Failed to get metrics', error.response?.data);
        throw error;
    }
}

function updateConnectionStatus(connected) {
    const statusElement = document.getElementById('connectionStatus');
    const dot = statusElement.querySelector('.status-dot');
    const text = statusElement.querySelector('span');

    if (connected) {
        dot.className = 'status-dot w-3 h-3 bg-green-400 rounded-full';
        text.textContent = 'Connected';
    } else {
        dot.className = 'status-dot w-3 h-3 bg-red-400 rounded-full';
        text.textContent = 'Disconnected';
    }
}

function updateOverviewMetrics(data) {
    // Update status cards
    document.getElementById('apiStatus').textContent = data.status || 'Healthy';

    // Use real metrics from the backend
    document.getElementById('totalRequests').textContent = data.total_requests || '0';

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

    // Update charts
    updateRequestChart(data);
    updateResourceChart(data);
}

function updateSystemMetrics() {
    // Get real system metrics from the server
    getMetrics()
        .then(data => {
            if (data && data.system) {
                // Update CPU usage
                const cpuUsage = data.system.cpu_percent || 0;
                document.getElementById('cpuUsage').textContent = `${cpuUsage.toFixed(1)}%`;
                document.getElementById('cpuBar').style.width = `${cpuUsage}%`;

                // Update memory usage
                const memoryUsage = data.system.memory_percent || 0;
                document.getElementById('memoryUsage').textContent = `${memoryUsage.toFixed(1)}%`;
                document.getElementById('memoryBar').style.width = `${memoryUsage}%`;

                // Update active connections
                document.getElementById('activeConnections').textContent = data.active_connections || 0;
            }
            document.getElementById('lastHealthCheck').textContent = new Date().toLocaleString();
        })
        .catch(error => {
            console.error('Failed to get system metrics:', error);
        });
}

// Rate Limiting Functions
async function startRateLimitTest() {
    const endpoint = document.getElementById('endpointSelect').value;
    const requestCount = parseInt(document.getElementById('requestCount').value);
    const delay = parseInt(document.getElementById('requestDelay').value);

    if (rateLimitTestActive) return;

    rateLimitTestActive = true;
    document.getElementById('startRateLimitTest').disabled = true;
    document.getElementById('rateLimitProgress').classList.remove('hidden');
    document.getElementById('rateLimitResults').innerHTML = '';

    let successCount = 0;
    let rateLimitedCount = 0;
    let errorCount = 0;

    for (let i = 0; i < requestCount; i++) {
        try {
            const startTime = performance.now();
            let response;

            // Handle different endpoints with appropriate data
            if (endpoint.includes('/login')) {
                response = await api.post(endpoint, {
                    email: 'test@example.com',
                    password: 'testpassword'
                });
            } else if (endpoint.includes('/register')) {
                response = await api.post(endpoint, {
                    email: `test${i}@example.com`,
                    username: `testuser${i}`,
                    password: 'testpassword'
                });
            } else {
                response = await api.get(endpoint);
            }

            const endTime = performance.now();
            const responseTime = Math.round(endTime - startTime);

            successCount++;
            addRateLimitResult(i + 1, 'success', response.status, responseTime);

        } catch (error) {
            const responseTime = error.response ? Math.round(performance.now()) : 0;

            if (error.response?.status === 429) {
                rateLimitedCount++;
                addRateLimitResult(i + 1, 'rate-limited', 429, responseTime, 'Rate limit exceeded');
                addEventLog('rate_limit', `Rate limit hit on ${endpoint}`, error.response?.data);
            } else {
                errorCount++;
                addRateLimitResult(i + 1, 'error', error.response?.status || 0, responseTime, error.message);
            }
        }

        // Update progress
        const progress = ((i + 1) / requestCount) * 100;
        document.getElementById('progressBar').style.width = `${progress}%`;
        document.getElementById('progressText').textContent = `${i + 1}/${requestCount}`;

        // Wait before next request
        if (i < requestCount - 1) {
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }

    // Show summary
    addRateLimitSummary(successCount, rateLimitedCount, errorCount);

    rateLimitTestActive = false;
    document.getElementById('startRateLimitTest').disabled = false;
    document.getElementById('rateLimitProgress').classList.add('hidden');
}

function addRateLimitResult(requestNum, status, statusCode, responseTime, message = '') {
    const container = document.getElementById('rateLimitResults');
    const statusColors = {
        'success': 'text-green-600 bg-green-50',
        'rate-limited': 'text-red-600 bg-red-50',
        'error': 'text-orange-600 bg-orange-50'
    };

    const resultElement = document.createElement('div');
    resultElement.className = `p-3 rounded-lg border ${statusColors[status]} text-sm`;
    resultElement.innerHTML = `
        <div class="flex justify-between items-center">
            <span><strong>Request ${requestNum}:</strong> ${statusCode} (${responseTime}ms)</span>
            <span class="font-medium">${status.toUpperCase()}</span>
        </div>
        ${message ? `<p class="text-xs mt-1 opacity-75">${message}</p>` : ''}
    `;

    container.appendChild(resultElement);
    container.scrollTop = container.scrollHeight;
}

function addRateLimitSummary(success, rateLimited, errors) {
    const container = document.getElementById('rateLimitResults');
    const total = success + rateLimited + errors;

    const summaryElement = document.createElement('div');
    summaryElement.className = 'mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg';
    summaryElement.innerHTML = `
        <h4 class="font-semibold mb-2">Test Summary</h4>
        <div class="grid grid-cols-3 gap-4 text-sm">
            <div class="text-center">
                <div class="font-bold text-green-600">${success}</div>
                <div>Success</div>
            </div>
            <div class="text-center">
                <div class="font-bold text-red-600">${rateLimited}</div>
                <div>Rate Limited</div>
            </div>
            <div class="text-center">
                <div class="font-bold text-orange-600">${errors}</div>
                <div>Errors</div>
            </div>
        </div>
        <div class="mt-2 text-center text-xs text-gray-600">
            Total: ${total} requests | Success Rate: ${((success / total) * 100).toFixed(1)}%
        </div>
    `;

    container.appendChild(summaryElement);
}

function updateRateLimitStatus() {
    // Get real rate limit data from the backend
    getMetrics()
        .then(data => {
            const container = document.getElementById('rateLimitStatus');

            // If we have endpoint stats, use them to show rate limit usage
            if (data && data.endpoint_stats) {
                const rateLimits = [
                    { endpoint: '/api/v1/auth/login', limit: '5/min', current: data.endpoint_stats['POST /api/v1/auth/login']?.count || 0 },
                    { endpoint: '/api/v1/auth/register', limit: '3/min', current: data.endpoint_stats['POST /api/v1/auth/register']?.count || 0 },
                    { endpoint: '/api/v1/users/me', limit: '30/min', current: data.endpoint_stats['GET /api/v1/users/me']?.count || 0 },
                ];

                container.innerHTML = rateLimits.map(limit => `
                    <div class="bg-white p-4 rounded-lg border">
                        <h4 class="font-medium text-gray-900">${limit.endpoint}</h4>
                        <p class="text-sm text-gray-600 mb-2">Limit: ${limit.limit}</p>
                        <div class="flex justify-between text-sm mb-1">
                            <span>Current: ${limit.current}</span>
                            <span>${Math.min(Math.round((limit.current / parseInt(limit.limit)) * 100), 100)}%</span>
                        </div>
                        <div class="w-full bg-gray-200 rounded-full h-2">
                            <div class="bg-blue-600 h-2 rounded-full" style="width: ${Math.min((limit.current / parseInt(limit.limit)) * 100, 100)}%"></div>
                        </div>
                    </div>
                `).join('');
            } else {
                // Fallback to default display if no real data
                const rateLimits = [
                    { endpoint: '/api/v1/auth/login', limit: '5/min', current: 0 },
                    { endpoint: '/api/v1/auth/register', limit: '3/min', current: 0 },
                    { endpoint: '/api/v1/users/me', limit: '30/min', current: 0 },
                ];

                container.innerHTML = rateLimits.map(limit => `
                    <div class="bg-white p-4 rounded-lg border">
                        <h4 class="font-medium text-gray-900">${limit.endpoint}</h4>
                        <p class="text-sm text-gray-600 mb-2">Limit: ${limit.limit}</p>
                        <div class="flex justify-between text-sm mb-1">
                            <span>Current: ${limit.current}</span>
                            <span>0%</span>
                        </div>
                        <div class="w-full bg-gray-200 rounded-full h-2">
                            <div class="bg-blue-600 h-2 rounded-full" style="width: 0%"></div>
                        </div>
                    </div>
                `).join('');
            }
        })
        .catch(error => {
            console.error('Failed to get rate limit data:', error);
        });
}

// Chart Functions
function initializeCharts() {
    // Initialize tracking of total requests for delta calculation
    charts = {
        lastTotalRequests: 0
    };

    // Request Chart
    const requestCtx = document.getElementById('requestChart').getContext('2d');
    charts.requestChart = new Chart(requestCtx, {
        type: 'line',
        data: {
            labels: Array.from({ length: 10 }, (_, i) => {
                const d = new Date();
                d.setMinutes(d.getMinutes() - (10 - i));
                return `${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}`;
            }),
            datasets: [{
                label: 'Requests/min',
                data: Array.from({ length: 10 }, () => 0), // Start with zeros
                borderColor: 'rgb(59, 130, 246)',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });

    // Resource Chart
    const resourceCtx = document.getElementById('resourceChart').getContext('2d');
    charts.resourceChart = new Chart(resourceCtx, {
        type: 'doughnut',
        data: {
            labels: ['CPU', 'Memory', 'Available'],
            datasets: [{
                data: [0, 0, 100], // Start with zeros and 100% available
                backgroundColor: [
                    'rgba(239, 68, 68, 0.8)',
                    'rgba(34, 197, 94, 0.8)',
                    'rgba(156, 163, 175, 0.8)'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });

    // Performance Chart
    const performanceCtx = document.getElementById('performanceChart').getContext('2d');
    charts.performanceChart = new Chart(performanceCtx, {
        type: 'line',
        data: {
            labels: Array.from({ length: 20 }, (_, i) => `${i}:00`),
            datasets: [
                {
                    label: 'Response Time (ms)',
                    data: Array.from({ length: 20 }, () => Math.floor(Math.random() * 100 + 50)),
                    borderColor: 'rgb(168, 85, 247)',
                    backgroundColor: 'rgba(168, 85, 247, 0.1)',
                    yAxisID: 'y'
                },
                {
                    label: 'Requests/sec',
                    data: Array.from({ length: 20 }, () => Math.floor(Math.random() * 50)),
                    borderColor: 'rgb(34, 197, 94)',
                    backgroundColor: 'rgba(34, 197, 94, 0.1)',
                    yAxisID: 'y1'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            scales: {
                x: {
                    display: true,
                },
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    grid: {
                        drawOnChartArea: false,
                    },
                }
            }
        }
    });
}

function updateRequestChart(data) {
    if (charts.requestChart) {
        // Get the current timestamp
        const now = new Date();
        const timeLabel = `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;

        // Add new data point with actual request count if available
        const currentRequests = data.total_requests ?
            (charts.lastTotalRequests ? data.total_requests - charts.lastTotalRequests : 0) :
            Math.floor(Math.random() * 100);

        // Store the current total for the next update
        charts.lastTotalRequests = data.total_requests || 0;

        // Add the new data point and update label
        charts.requestChart.data.labels.push(timeLabel);
        charts.requestChart.data.labels.shift();
        charts.requestChart.data.datasets[0].data.push(currentRequests);
        charts.requestChart.data.datasets[0].data.shift();

        charts.requestChart.update('none');
    }
}

function updateResourceChart(data) {
    if (charts.resourceChart) {
        // Use real system metrics from the backend
        const cpu = data.system?.cpu_percent || 0;
        const memory = data.system?.memory_percent || 0;
        const available = 100 - cpu - memory;

        charts.resourceChart.data.datasets[0].data = [cpu, memory, available];
        charts.resourceChart.update('none');
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', function () {
    // Initialize charts
    initializeCharts();

    // Tab navigation
    document.querySelectorAll('.nav-tab').forEach(button => {
        button.addEventListener('click', function () {
            const tabName = this.dataset.tab;
            showTab(tabName);
        });
    });

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

    // Logout button
    document.getElementById('logoutBtn').addEventListener('click', logout);

    // Refresh token button
    document.getElementById('refreshTokenBtn').addEventListener('click', refreshToken);

    // Get user info button
    document.getElementById('getUserInfoBtn').addEventListener('click', getUserInfo);

    // Quick action buttons
    document.getElementById('healthCheckBtn').addEventListener('click', async function () {
        try {
            const health = await getHealthCheck();
            showModal('Health Check Results', health);
        } catch (error) {
            showToast('Health check failed', 'error');
        }
    });

    document.getElementById('refreshMetricsBtn').addEventListener('click', async function () {
        try {
            await getMetrics();
            showToast('Metrics refreshed', 'success');
        } catch (error) {
            showToast('Failed to refresh metrics', 'error');
        }
    });

    document.getElementById('clearLogsBtn').addEventListener('click', function () {
        eventLogs = [];
        updateEventLogs();
        showToast('Logs cleared', 'info');
    });

    document.getElementById('clearLogsBtn2').addEventListener('click', function () {
        eventLogs = [];
        updateEventLogs();
        showToast('Logs cleared', 'info');
    });

    // Rate limit test
    document.getElementById('startRateLimitTest').addEventListener('click', startRateLimitTest);

    // Log filter
    document.getElementById('logFilter').addEventListener('change', updateEventLogs);

    // Modal close
    document.getElementById('closeModal').addEventListener('click', hideModal);

    // Dark mode toggle
    document.getElementById('darkModeToggle').addEventListener('click', function () {
        document.documentElement.classList.toggle('dark');
        const icon = this.querySelector('i');
        if (document.documentElement.classList.contains('dark')) {
            icon.setAttribute('data-lucide', 'sun');
        } else {
            icon.setAttribute('data-lucide', 'moon');
        }
        lucide.createIcons();
    });

    // Initialize UI
    updateAuthUI();
    updateEventLogs();

    // Start periodic health checks
    refreshInterval = setInterval(async () => {
        try {
            await getHealthCheck();
        } catch (error) {
            // Silent fail for periodic checks
        }
    }, 30000); // Every 30 seconds

    // Initial health check
    getHealthCheck().catch(() => {
        // Silent fail for initial check
    });

    addEventLog('info', 'Dashboard initialized');
});

// Cleanup on page unload
window.addEventListener('beforeunload', function () {
    if (refreshInterval) {
        clearInterval(refreshInterval);
    }
});
