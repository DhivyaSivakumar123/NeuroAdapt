import { useCallback } from 'react';
import { apiClient } from '../lib/apiClient';
import { EventCreate, EventPayload, EventResponse } from '../types/event';

export function useEventLogger() {
  const logEvent = useCallback(
    async (sessionId: string, taskId: string, payload: EventPayload): Promise<EventResponse | null> => {
      try {
        const body: EventCreate = {
          session_id: sessionId,
          task_id: taskId,
          payload,
          timestamp: new Date().toISOString(),
        };
        const response = await apiClient<EventResponse>('/events', {
          method: 'POST',
          body,
        });
        return response;
      } catch (err: any) {
        console.error(`Failed to log event ${payload.event_type}:`, err);
        // Event logging failures should not crash the primary UI flow
        return null;
      }
    },
    []
  );

  const logTaskStart = useCallback(
    (sessionId: string, taskId: string) =>
      logEvent(sessionId, taskId, { event_type: 'task_start' }),
    [logEvent]
  );

  const logTaskSwitchAway = useCallback(
    (sessionId: string, taskId: string) =>
      logEvent(sessionId, taskId, { event_type: 'task_switch_away' }),
    [logEvent]
  );

  const logTaskSwitchBack = useCallback(
    (sessionId: string, taskId: string) =>
      logEvent(sessionId, taskId, { event_type: 'task_switch_back' }),
    [logEvent]
  );

  const logAnswerSubmit = useCallback(
    (sessionId: string, taskId: string, correct: boolean, answerGiven: string) =>
      logEvent(sessionId, taskId, { event_type: 'answer_submit', correct, answer_given: answerGiven }),
    [logEvent]
  );

  const logRetry = useCallback(
    (sessionId: string, taskId: string, attemptNumber: number) =>
      logEvent(sessionId, taskId, { event_type: 'retry', attempt_number: attemptNumber }),
    [logEvent]
  );

  const logIdlePing = useCallback(
    (sessionId: string, taskId: string, idleSeconds: number) =>
      logEvent(sessionId, taskId, { event_type: 'idle_ping', idle_seconds: idleSeconds }),
    [logEvent]
  );

  const logSelfReport = useCallback(
    (sessionId: string, taskId: string, score: number) =>
      logEvent(sessionId, taskId, { event_type: 'self_report', score }),
    [logEvent]
  );

  const logTaskComplete = useCallback(
    (sessionId: string, taskId: string, correct: boolean, actualDurationSeconds: number) =>
      logEvent(sessionId, taskId, {
        event_type: 'task_complete',
        correct,
        actual_duration_seconds: actualDurationSeconds,
      }),
    [logEvent]
  );

  const logTaskAbandon = useCallback(
    (sessionId: string, taskId: string, reason?: string) =>
      logEvent(sessionId, taskId, { event_type: 'task_abandon', reason }),
    [logEvent]
  );

  return {
    logEvent,
    logTaskStart,
    logTaskSwitchAway,
    logTaskSwitchBack,
    logAnswerSubmit,
    logRetry,
    logIdlePing,
    logSelfReport,
    logTaskComplete,
    logTaskAbandon,
  };
}
