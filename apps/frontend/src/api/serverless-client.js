/**
 * Serverless API client for SeedPlanner
 */

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://your-api-gateway-url.amazonaws.com/dev';

class ServerlessApiClient {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    };

    // Add auth token if available
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Auth methods
  async login(email, password) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
  }

  async register(userData) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  }

  async refreshToken() {
    return this.request('/auth/refresh', {
      method: 'POST'
    });
  }

  // User methods
  async getUsers(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/users${queryString ? `?${queryString}` : ''}`);
  }

  async getUser(userId) {
    return this.request(`/users/${userId}`);
  }

  async updateUser(userId, data) {
    return this.request(`/users/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  }

  // Project methods
  async getProjects(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/projects${queryString ? `?${queryString}` : ''}`);
  }

  async getProject(projectId) {
    return this.request(`/projects/${projectId}`);
  }

  async createProject(data) {
    return this.request('/projects', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async updateProject(projectId, data) {
    return this.request(`/projects/${projectId}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  }

  async deleteProject(projectId) {
    return this.request(`/projects/${projectId}`, {
      method: 'DELETE'
    });
  }

  // Issue methods
  async getIssues(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/issues${queryString ? `?${queryString}` : ''}`);
  }

  async getIssue(issueId) {
    return this.request(`/issues/${issueId}`);
  }

  async createIssue(data) {
    return this.request('/issues', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async updateIssue(issueId, data) {
    return this.request(`/issues/${issueId}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  }

  async deleteIssue(issueId) {
    return this.request(`/issues/${issueId}`, {
      method: 'DELETE'
    });
  }

  // Sprint methods
  async getSprints(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/sprints${queryString ? `?${queryString}` : ''}`);
  }

  async getSprint(sprintId) {
    return this.request(`/sprints/${sprintId}`);
  }

  async createSprint(data) {
    return this.request('/sprints', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async updateSprint(sprintId, data) {
    return this.request(`/sprints/${sprintId}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  }

  async deleteSprint(sprintId) {
    return this.request(`/sprints/${sprintId}`, {
      method: 'DELETE'
    });
  }

  // Board methods
  async getBoard(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/boards${queryString ? `?${queryString}` : ''}`);
  }

  // Cost methods
  async getCosts(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/costs${queryString ? `?${queryString}` : ''}`);
  }

  async createCost(data) {
    return this.request('/costs', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  // System config methods
  async getSystemConfig() {
    return this.request('/system-config');
  }

  async updateSystemConfig(data) {
    return this.request('/system-config', {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  }

  // Project config methods
  async getProjectConfig(projectId) {
    return this.request(`/project-config/${projectId}`);
  }

  async updateProjectConfig(projectId, data) {
    return this.request(`/project-config/${projectId}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  }

  // GitHub integration methods
  async githubWebhook(data) {
    return this.request('/github/webhook', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  // Utility methods
  setAuthToken(token) {
    localStorage.setItem('token', token);
  }

  removeAuthToken() {
    localStorage.removeItem('token');
  }

  getAuthToken() {
    return localStorage.getItem('token');
  }

  isAuthenticated() {
    return !!this.getAuthToken();
  }
}

// Create singleton instance
const serverlessApiClient = new ServerlessApiClient();

export default serverlessApiClient;
