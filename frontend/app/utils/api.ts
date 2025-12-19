// app/utils/api.ts
import { AuthService } from "./auth";
import type { ElectionFormData } from "../types/election";

const API_BASE_URL = "http://localhost:8080";

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterCredentials extends LoginCredentials {
  confirmPassword?: string;
}

export const ApiService = {
  // Register new user
  async register(credentials: RegisterCredentials) {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: credentials.username,
        password: credentials.password,
        role: "VOTER",
      }),
    });

    if (!response.ok) {
      throw new Error("Registration failed");
    }

    return response.json();
  },

  // Login user
  async login(credentials: LoginCredentials) {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      throw new Error("Login failed");
    }

    return response.json();
  },

  // Logout
  logout() {
    AuthService.clearTokens();
  },

  // Fetch with authentication
  async fetchWithAuth(endpoint: string, options: RequestInit = {}) {
    const token = AuthService.getAccessToken();

    const headers: Record<string, any> = {
      "Content-Type": "application/json",
      ...options.headers,
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      // Token expired, handle refresh or redirect to login
      AuthService.clearTokens();
      window.location.href = "/login";
    }

    return response;
  },
  async submitVerification(formData: FormData): Promise<any> {
    const token = AuthService.getAccessToken();
    if (!token) {
      throw new Error("Not authenticated");
    }

    const response = await fetch(`${API_BASE_URL}/voter/register`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        // Don't set Content-Type for FormData, let browser set it with boundary
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Verification submission failed");
    }

    return response.json();
  },

  // Check verification status
  async getVerificationStatus(): Promise<any> {
    const token = AuthService.getAccessToken();

    if (!token) {
      throw new Error("Not authenticated");
    }

    const response = await fetch(`${API_BASE_URL}/voter/status`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch verification status");
    }

    return response.json();
  },
  // Admin: Get all voters
  async getVoters(): Promise<any> {
    const response = await this.fetchWithAuth("/admin/voters");
    if (!response.ok) {
      throw new Error("Failed to fetch voters");
    }
    return response.json();
  },

  // Admin: Approve voter
  async approveVoter(voterId: number): Promise<any> {
    const response = await this.fetchWithAuth(
      `/admin/voters/${voterId}/approve`,
      {
        method: "PUT",
      }
    );

    if (!response.ok) {
      throw new Error("Failed to approve voter");
    }
    return response.json();
  },
  // Admin: Get all elections
  async getElections(): Promise<any> {
    const response = await this.fetchWithAuth("/admin/elections");
    if (!response.ok) {
      throw new Error("Failed to fetch elections");
    }
    return response.json();
  },

  // Admin: Get all candidates
  async getCandidates(): Promise<any> {
    const response = await this.fetchWithAuth("/admin/electors");
    if (!response.ok) {
      throw new Error("Failed to fetch candidates");
    }
    return response.json();
  },

  // Admin: Create election
  async createElection(data: ElectionFormData): Promise<any> {
    const response = await this.fetchWithAuth("/admin/elections", {
      method: "POST",
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error("Failed to create election");
    }
    return response.json();
  },

  // Admin: Add candidate to election
  async addCandidateToElection(
    electionId: number,
    candidateId: number
  ): Promise<any> {
    const response = await this.fetchWithAuth(
      `/admin/elections/${electionId}/candidates/${candidateId}`,
      {
        method: "POST",
      }
    );

    if (!response.ok) {
      throw new Error("Failed to add candidate");
    }
    return response.json();
  },

  // Admin: Open election
  async openElection(electionId: number): Promise<any> {
    const response = await this.fetchWithAuth(
      `/admin/elections/${electionId}/open`,
      {
        method: "PUT",
      }
    );

    if (!response.ok) {
      throw new Error("Failed to open election");
    }
    return response.json();
  },

  // Admin: Delete election
  async deleteElection(electionId: number): Promise<any> {
    const response = await this.fetchWithAuth(
      `/admin/elections/${electionId}`,
      {
        method: "DELETE",
      }
    );

    if (!response.ok) {
      throw new Error("Failed to delete election");
    }
    return response.json();
  },
};
