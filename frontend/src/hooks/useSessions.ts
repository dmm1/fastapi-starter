import { useEffect, useState, useCallback } from "react";
import { getSessions, deleteSession } from "../lib/api-client";

interface Session {
  id: number;
  user_id: number;
  user_agent: string | null;
  ip_address: string | null;
  created_at: string;
  expires_at: string | null;
  is_active: boolean;
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
      await deleteSession(id);
      // Optimistically update UI instead of refetching all sessions
      setSessions(prev => prev.filter(session => session.id !== id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
      // Refetch on error to ensure consistency
      await fetchSessions();
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
    deleteSession: handleDeleteSession 
  };
}
