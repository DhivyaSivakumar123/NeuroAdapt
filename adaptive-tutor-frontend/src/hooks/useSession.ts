import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../lib/apiClient';
import { Session, SessionCreate } from '../types/session';

const ACTIVE_SESSION_KEY = 'adaptive_tutor_active_session';

export function useSession(studentId?: string) {
  const [activeSession, setActiveSession] = useState<Session | null>(() => {
    const saved = localStorage.getItem(ACTIVE_SESSION_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return null;
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (activeSession) {
      localStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify(activeSession));
    } else {
      localStorage.removeItem(ACTIVE_SESSION_KEY);
    }
  }, [activeSession]);

  const startSession = useCallback(
    async (targetStudentId: string, subject?: string) => {
      setLoading(true);
      setError(null);
      try {
        const body: SessionCreate = {
          student_id: targetStudentId,
          subject: subject || 'biology',
        };
        const sessionData = await apiClient<Session>('/sessions', {
          method: 'POST',
          body,
        });
        setActiveSession(sessionData);
        return sessionData;
      } catch (err: any) {
        console.error('Failed to start session:', err);
        setError(err.message || 'Failed to start learning session');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const endSession = useCallback(async () => {
    if (!activeSession) return;
    setLoading(true);
    setError(null);
    try {
      const ended = await apiClient<Session>(`/sessions/${activeSession.id}/end`, {
        method: 'PATCH',
      });
      setActiveSession(null);
      return ended;
    } catch (err: any) {
      console.error('Failed to end session:', err);
      setError(err.message || 'Failed to end learning session');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [activeSession]);

  return {
    activeSession,
    loading,
    error,
    startSession,
    endSession,
    setActiveSession,
  };
}
