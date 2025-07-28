import { useEffect, useState, useCallback } from "react";
import { getSessions, deleteSession, deleteAllOtherSessions, tokenUtils } from "../lib/api-client";

interface Session {
  id: number;
  user_id: number;
  user_agent: string | null;
  ip_address: string | null;
  created_at: string;
  expires_at: string | null;
  is_active: boolean;
  is_current?: boolean;
}

export function useSessions() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const sessionData = await getSessions();
      setSessions(sessionData);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleDeleteSession = useCallback(async (id: number) => {
    setError("");
    try {
      const result = await deleteSession(id);
      
      // If current session was deleted, user needs to be logged out
      if (result.current_session_deleted) {
        // Clear tokens and redirect to login
        tokenUtils.clearTokens();
        window.location.href = "/login";
        return;
      }
      
      // Optimistically update UI for other sessions
      setSessions(prev => prev.filter(session => session.id !== id));
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : "Unknown error";
      setError(errorMessage);
      
      // If it's a current session error, show specific message
      if (errorMessage.includes("Cannot delete current session")) {
        setError("Cannot delete your current session. Please use the logout button instead.");
      }
      
      // Refetch on error to ensure consistency
      await fetchSessions();
    }
  }, [fetchSessions]);

  const handleDeleteAllOtherSessions = useCallback(async () => {
    setError("");
    try {
      const result = await deleteAllOtherSessions();
      // Remove all non-current sessions from state
      setSessions(prev => prev.filter(session => session.is_current));
      return result;
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : "Unknown error";
      setError(errorMessage);
      // Refetch on error to ensure consistency
      await fetchSessions();
      throw e;
    }
  }, [fetchSessions]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  return { 
    sessions, 
    loading, 
    error, 
    fetchSessions, 
    deleteSession: handleDeleteSession,
    deleteAllOtherSessions: handleDeleteAllOtherSessions
  };
}
