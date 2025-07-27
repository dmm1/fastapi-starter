import { useEffect, useRef } from "react";
import { useRouter } from "@tanstack/react-router";
import { useAuthStore } from "../stores/auth";
import { tokenUtils } from "../lib/api-client";

export function useAuthGuard(requiredRoles?: string[]) {
  const { user, tokens, isLoading, restoreFromStorage } = useAuthStore();
  const router = useRouter();
  const hasRestoredRef = useRef(false);

  useEffect(() => {
    // Only restore auth state once on first load
    if (!hasRestoredRef.current && !tokens && !user) {
      hasRestoredRef.current = true;
      restoreFromStorage();
    }
  }, []); // Empty dependency array - only run once

  useEffect(() => {
    // Skip if still loading
    if (isLoading) return;
    
    // If no tokens and not currently on login page, redirect to login
    if (!tokenUtils.isAuthenticated() && router.state.location.pathname !== "/login") {
      router.navigate({ to: "/login" });
      return;
    }

    // If user is authenticated but doesn't have required roles, redirect to unauthorized page
    if (user && requiredRoles && requiredRoles.length > 0) {
      const userRoles = user.roles.map(role => role.name);
      const hasRequiredRole = requiredRoles.some(role => userRoles.includes(role));
      
      if (!hasRequiredRole) {
        router.navigate({ to: "/not-found" }); // or create an unauthorized page
        return;
      }
    }
  }, [user, tokens, isLoading, router.state.location.pathname, requiredRoles]);

  return {
    isAuthenticated: tokenUtils.isAuthenticated(),
    user,
    isLoading: isLoading || (!user && tokenUtils.isAuthenticated()), // Loading if we have tokens but no user data yet
  };
}
