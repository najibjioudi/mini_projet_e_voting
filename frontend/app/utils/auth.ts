// app/utils/auth.ts
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface User {
  username: string;
  userId?: number;
  roles?: string[];
}

// Helper to check if we're on the client side
const isClient = typeof window !== "undefined";

export const AuthService = {
  // Get access token
  getAccessToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("accessToken");
  },

  getRefreshToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("refreshToken");
  },
  setTokens(tokens: AuthTokens): void {
    if (typeof window === "undefined") return;
    localStorage.setItem("accessToken", tokens.accessToken);
    localStorage.setItem("refreshToken", tokens.refreshToken);
  },

  // Clear tokens (logout)
  clearTokens(): void {
    if (!isClient) return;
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
  },

  // Check if user is authenticated
  isAuthenticated(): boolean {
    if (!isClient) return false;

    const token = this.getAccessToken();
    if (!token) return false;

    // Check if token is expired (basic check - you might want to decode JWT for proper check)
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload.exp * 1000 > Date.now();
    } catch {
      return false;
    }
  },

  // Decode user from token
  getUserFromToken(): User | null {
    if (!isClient) return null;

    const token = this.getAccessToken();
    if (!token) return null;

    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      return {
        username: payload.sub,
        userId: payload.userId,
        roles: payload.roles
          ? Array.isArray(payload.roles)
            ? payload.roles
            : [payload.roles]
          : [],
      };
    } catch {
      return null;
    }
  },

  // Save user info
  setUser(user: User): void {
    if (!isClient) return;
    localStorage.setItem("user", JSON.stringify(user));
  },

  // Get user info
  getUser(): User | null {
    if (!isClient) return null;

    const userStr = localStorage.getItem("user");
    return userStr ? JSON.parse(userStr) : null;
  },
};
