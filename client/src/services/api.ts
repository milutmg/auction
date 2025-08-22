const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002/api';

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second
const REQUEST_TIMEOUT = 10000; // 10 seconds

class ApiService {
  private baseURL: string;

  constructor() {
    this.baseURL = API_BASE_URL;
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async fetchWithRetry(url: string, options: RequestInit, retries = MAX_RETRIES): Promise<Response> {
    // Add timeout to fetch
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
    
    const fetchOptions = {
      ...options,
      signal: controller.signal
    };

    try {
      const response = await fetch(url, fetchOptions);
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (retries > 0 && (error instanceof TypeError || error.name === 'AbortError')) {
        console.warn(`Request failed, retrying... (${MAX_RETRIES - retries + 1}/${MAX_RETRIES})`);
        await this.delay(RETRY_DELAY);
        return this.fetchWithRetry(url, options, retries - 1);
      }
      
      throw error;
    }
  }

  private getHeaders(includeAuth = true): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (includeAuth) {
      const token = localStorage.getItem('token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    return headers;
  }

  private async handleResponse(response: Response) {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error occurred' }));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // Auth endpoints
  async signup(data: { email: string; password: string; fullName: string }) {
    const response = await this.fetchWithRetry(`${this.baseURL}/auth/signup`, {
      method: 'POST',
      headers: this.getHeaders(false),
      body: JSON.stringify(data),
    });

    return this.handleResponse(response);
  }

  async signin(data: { email: string; password: string }) {
    const response = await this.fetchWithRetry(`${this.baseURL}/auth/signin`, {
      method: 'POST',
      headers: this.getHeaders(false),
      body: JSON.stringify(data),
    });

    return this.handleResponse(response);
  }

  async getProfile() {
    const response = await fetch(`${this.baseURL}/auth/profile`, {
      headers: this.getHeaders(),
    });

    return this.handleResponse(response);
  }

  async updateProfile(data: any) {
    const response = await fetch(`${this.baseURL}/auth/profile`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });

    return this.handleResponse(response);
  }

  async changePassword(data: { currentPassword: string; newPassword: string }) {
    const response = await fetch(`${this.baseURL}/auth/change-password`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });

    return this.handleResponse(response);
  }

  async getMyAuctions(status?: string) {
    const url = new URL(`${this.baseURL}/auth/my-auctions`);
    if (status) {
      url.searchParams.append('status', status);
    }

    const response = await fetch(url.toString(), {
      headers: this.getHeaders(),
    });

    return this.handleResponse(response);
  }

  async getMyBids() {
    const response = await fetch(`${this.baseURL}/auth/my-bids`, {
      headers: this.getHeaders(),
    });

    return this.handleResponse(response);
  }

  // Auction endpoints
  async getAuctions(params?: { 
    category?: string; 
    status?: string; 
    page?: number; 
    limit?: number;
    search?: string;
  }) {
    const url = new URL(`${this.baseURL}/auctions`);
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          url.searchParams.append(key, value.toString());
        }
      });
    }

    // If a token exists, include it so authenticated users (including admin) get correct visibility
    const hasToken = !!localStorage.getItem('token');
    const response = await fetch(url.toString(), {
      headers: this.getHeaders(hasToken),
    });

    return this.handleResponse(response);
  }

  async getAuction(id: string) {
    const response = await fetch(`${this.baseURL}/auctions/${id}`, {
      headers: this.getHeaders(false), // Auction details can be viewed without auth
    });

    return this.handleResponse(response);
  }

  async createAuction(data: any) {
    const response = await fetch(`${this.baseURL}/auctions`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });

    return this.handleResponse(response);
  }

  async updateAuction(id: string, data: any) {
    const response = await fetch(`${this.baseURL}/auctions/${id}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });

    return this.handleResponse(response);
  }

  async deleteAuction(id: string) {
    const response = await fetch(`${this.baseURL}/auctions/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });

    return this.handleResponse(response);
  }

  // Bid endpoints
  async placeBid(auctionId: string, amount: number) {
    const response = await fetch(`${this.baseURL}/bids`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ auctionId, amount }),
    });

    return this.handleResponse(response);
  }

  async getBids(auctionId: string) {
    const response = await fetch(`${this.baseURL}/bids/${auctionId}`, {
      headers: this.getHeaders(false), // Bids can be viewed without auth
    });

    return this.handleResponse(response);
  }

  // Category endpoints
  async getCategories() {
    const response = await fetch(`${this.baseURL}/categories`, {
      headers: this.getHeaders(false),
    });

    return this.handleResponse(response);
  }

  // File upload helper
  async uploadFile(file: File, endpoint: string) {
    const formData = new FormData();
    formData.append('file', file);

    const token = localStorage.getItem('token');
    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'POST',
      headers,
      body: formData,
    });

    return this.handleResponse(response);
  }

  // Payment endpoints for eSewa integration
  async initiateEsewaPayment(orderId: string) {
    const response = await fetch(`${this.baseURL}/auctions/order/${orderId}/payment/esewa/initiate`, {
      method: 'POST',
      headers: this.getHeaders(),
    });

    return this.handleResponse(response);
  }

  async getOrderDetails(orderId: string) {
    const response = await fetch(`${this.baseURL}/auctions/order/${orderId}`, {
      headers: this.getHeaders(),
    });

    return this.handleResponse(response);
  }

  async createOrder(auctionId: string) {
    const response = await fetch(`${this.baseURL}/auctions/${auctionId}/order`, {
      method: 'POST',
      headers: this.getHeaders(),
    });

    return this.handleResponse(response);
  }

  // Admin endpoints
  async getAdminStats() {
    const response = await this.fetchWithRetry(`${this.baseURL}/admin/stats`, {
      headers: this.getHeaders(),
    });

    return this.handleResponse(response);
  }

  async getAdminUsers(page = 1, limit = 10) {
    const response = await this.fetchWithRetry(`${this.baseURL}/admin/users?page=${page}&limit=${limit}`, {
      headers: this.getHeaders(),
    });

    return this.handleResponse(response);
  }

  async getAdminAuctions(status?: string, page = 1, limit = 10) {
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(status && { status })
    });

    const response = await this.fetchWithRetry(`${this.baseURL}/admin/auctions?${queryParams}`, {
      headers: this.getHeaders(),
    });

    return this.handleResponse(response);
  }

  async getAdminAllAuctions() {
    const response = await this.fetchWithRetry(`${this.baseURL}/admin/auctions/all`, {
      headers: this.getHeaders(),
    });
    return this.handleResponse(response);
  }

  async getAdminActivity(page = 1, limit = 20) {
    const response = await this.fetchWithRetry(`${this.baseURL}/admin/activity?page=${page}&limit=${limit}`, {
      headers: this.getHeaders(),
    });

    return this.handleResponse(response);
  }

  async getTopPerformers() {
    const response = await this.fetchWithRetry(`${this.baseURL}/admin/top-performers`, {
      headers: this.getHeaders(),
    });

    return this.handleResponse(response);
  }

  async approveAuction(auctionId: string) {
    const response = await this.fetchWithRetry(`${this.baseURL}/admin/auctions/${auctionId}/approve`, {
      method: 'POST',
      headers: this.getHeaders(),
    });

    return this.handleResponse(response);
  }

  async rejectAuction(auctionId: string, reason?: string) {
    const response = await this.fetchWithRetry(`${this.baseURL}/admin/auctions/${auctionId}/reject`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ reason }),
    });

    return this.handleResponse(response);
  }

  async updateUserStatus(userId: string, status: 'active' | 'suspended' | 'banned') {
    const response = await this.fetchWithRetry(`${this.baseURL}/admin/users/${userId}/status`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify({ status }),
    });

    return this.handleResponse(response);
  }

  async deleteUser(userId: string) {
    const response = await this.fetchWithRetry(`${this.baseURL}/admin/users/${userId}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });

    return this.handleResponse(response);
  }

  async getAdminReports(type: string, startDate?: string, endDate?: string) {
    const queryParams = new URLSearchParams({
      type,
      ...(startDate && { startDate }),
      ...(endDate && { endDate })
    });

    const response = await this.fetchWithRetry(`${this.baseURL}/admin/reports?${queryParams}`, {
      headers: this.getHeaders(),
    });

    return this.handleResponse(response);
  }

  async getPublicStats() {
    const response = await this.fetchWithRetry(`${this.baseURL}/auth/public-stats`, {
      headers: this.getHeaders(false),
    });
    return this.handleResponse(response);
  }

  // Generic helpers (added)
  async get(path: string, includeAuth = true) {
    const url = path.startsWith('http') ? path : `${this.baseURL}${path.startsWith('/') ? path : '/' + path}`;
    const response = await this.fetchWithRetry(url, { headers: this.getHeaders(includeAuth) });
    return this.handleResponse(response);
  }
  async post(path: string, body: any = {}, includeAuth = true) {
    const url = path.startsWith('http') ? path : `${this.baseURL}${path.startsWith('/') ? path : '/' + path}`;
    const response = await this.fetchWithRetry(url, { method: 'POST', headers: this.getHeaders(includeAuth), body: JSON.stringify(body) });
    return this.handleResponse(response);
  }
}

export const apiService = new ApiService();
export default apiService;
