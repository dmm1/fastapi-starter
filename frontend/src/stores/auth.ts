import { Store } from "@tanstack/store";
import { useStore } from "@tanstack/react-store";
import { useCallback } from "react";
import { authApi, usersApi, tokenUtils, type User, type Token } from "../lib/api-client";

export type AuthState = {
  user: User | null;
  tokens: Token | null;
  isLoading: boolean;
  error: string | null;
};

const initialState: AuthState = {
  user: null,
  tokens: null,
  isLoading: false,
  error: null,
};

export const authStore = new Store<AuthState>(initialState);

export function useAuthStore() {
  const state = useStore(authStore);
  
  const restoreFromStorage = useCallback(() => {
    const tokens = tokenUtils.getTokens();
    const currentState = authStore.state;
    
    // Only restore if we don't already have tokens or user data
    if (tokens && !currentState.tokens && !currentState.user) {
      authStore.setState(prev => ({ ...prev, tokens, isLoading: true }));
      
      // Fetch user data in background
      authApi.getCurrentUser()
        .then(user => {
          authStore.setState(prev => ({ ...prev, user, isLoading: false }));
        })
        .catch(() => {
          // If fetching user fails, clear tokens
          tokenUtils.clearTokens();
          authStore.setState(() => initialState);
        });
    }
  }, []);
  
  return {
    ...state,
    
    login: async (email: string, password: string) => {
      authStore.setState(prev => ({ ...prev, isLoading: true, error: null }));
      try {
        const tokens = await authApi.login({ email, password });
        tokenUtils.saveTokens(tokens);
        
        // Get user info after successful login
        const user = await authApi.getCurrentUser();
        
        authStore.setState(prev => ({
          ...prev,
          user,
          tokens,
          isLoading: false,
          error: null,
        }));
        
        return { success: true };
      } catch (error) {
        authStore.setState(prev => ({
          ...prev,
          isLoading: false,
          error: error instanceof Error ? error.message : "Login failed",
        }));
        return { success: false, error: error instanceof Error ? error.message : "Login failed" };
      }
    },

    register: async (userData: {
      email: string;
      username: string;
      password: string;
      firstname?: string;
      lastname?: string;
      is_admin?: boolean;
    }) => {
      authStore.setState(prev => ({ ...prev, isLoading: true, error: null }));
      try {
        const user = await authApi.register(userData);
        authStore.setState(prev => ({
          ...prev,
          isLoading: false,
          error: null,
        }));
        return { success: true, user };
      } catch (error) {
        authStore.setState(prev => ({
          ...prev,
          isLoading: false,
          error: error instanceof Error ? error.message : "Registration failed",
        }));
        return { success: false, error: error instanceof Error ? error.message : "Registration failed" };
      }
    },

    logout: async () => {
      const tokens = tokenUtils.getTokens();
      if (tokens) {
        try {
          await authApi.logout({ refresh_token: tokens.refresh_token });
        } catch (error) {
          console.warn("Logout API call failed:", error);
        }
      }
      
      tokenUtils.clearTokens();
      authStore.setState(() => initialState);
    },

    refreshUser: async () => {
      if (!tokenUtils.isAuthenticated()) return;
      
      try {
        const user = await authApi.getCurrentUser();
        authStore.setState(prev => ({ ...prev, user }));
      } catch (error) {
        console.error("Failed to refresh user:", error);
        // If refresh fails, logout user
        tokenUtils.clearTokens();
        authStore.setState(() => initialState);
      }
    },

    updateProfile: async (userData: {
      email?: string;
      username?: string;
      firstname?: string;
      lastname?: string;
      avatar?: string;
    }) => {
      authStore.setState(prev => ({ ...prev, isLoading: true, error: null }));
      try {
        const updatedUser = await usersApi.updateCurrentUserProfile(userData);
        authStore.setState(prev => ({
          ...prev,
          user: updatedUser,
          isLoading: false,
          error: null,
        }));
        return { success: true, user: updatedUser };
      } catch (error) {
        authStore.setState(prev => ({
          ...prev,
          isLoading: false,
          error: error instanceof Error ? error.message : "Profile update failed",
        }));
        return { success: false, error: error instanceof Error ? error.message : "Profile update failed" };
      }
    },

    changePassword: async (currentPassword: string, newPassword: string) => {
      authStore.setState(prev => ({ ...prev, isLoading: true, error: null }));
      try {
        await usersApi.changePassword({
          current_password: currentPassword,
          new_password: newPassword,
        });
        authStore.setState(prev => ({
          ...prev,
          isLoading: false,
          error: null,
        }));
        return { success: true };
      } catch (error) {
        authStore.setState(prev => ({
          ...prev,
          isLoading: false,
          error: error instanceof Error ? error.message : "Password change failed",
        }));
        return { success: false, error: error instanceof Error ? error.message : "Password change failed" };
      }
    },

    restoreFromStorage,

    clearError: () => {
      authStore.setState(prev => ({ ...prev, error: null }));
    },
  };
}
