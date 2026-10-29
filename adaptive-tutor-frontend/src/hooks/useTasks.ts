import { useState, useCallback } from 'react';
import { apiClient } from '../lib/apiClient';
import { Task, TaskCatalogResponse, AnswerSubmitRequest, AnswerSubmitResponse } from '../types/task';

export function useTasks() {
  const [currentTask, setCurrentTask] = useState<Task | null>(null);
  // `loading` is only used for fetchNextTask (task transition skeleton).
  // submitAnswer intentionally does NOT set loading — it has its own
  // local submitting state in the component to avoid full-page skeleton flash.
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNextTask = useCallback(
    async (studentId: string, sessionId: string, subject?: string, skillTag?: string) => {
      setLoading(true);
      setError(null);
      try {
        const task = await apiClient<Task | null>(`/students/${studentId}/next-task`, {
          params: { session_id: sessionId, subject, skill_tag: skillTag },
        });
        setCurrentTask(task);
        return task;
      } catch (err: any) {
        console.error('Failed to fetch next task:', err);
        setError(err.message || 'Failed to retrieve next task');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const fetchTaskCatalog = useCallback(
    async (subject?: string, skillTag?: string, difficulty?: number) => {
      setLoading(true);
      setError(null);
      try {
        const params: Record<string, any> = {};
        if (subject) params.subject = subject;
        if (skillTag) params.skill_tag = skillTag;
        if (difficulty) params.difficulty_level = difficulty;

        const data = await apiClient<TaskCatalogResponse>('/tasks/catalog', { params });
        return data;
      } catch (err: any) {
        console.error('Failed to fetch task catalog:', err);
        setError(err.message || 'Failed to load task catalog');
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /**
   * Submit an answer.
   * Intentionally does NOT set the shared `loading` flag so that the
   * full-page task skeleton never flashes while grading is in flight.
   * The caller (TaskView) manages its own `submitting` boolean for the
   * button disabled state.
   */
  const submitAnswer = useCallback(
    async (
      taskId: string,
      sessionId: string,
      answer: string | Record<string, any>,
      actualDurationSeconds: number = 0
    ) => {
      // No setLoading here — deliberate.
      setError(null);
      try {
        const body: AnswerSubmitRequest = {
          session_id: sessionId,
          answer: typeof answer === 'string' ? answer : JSON.stringify(answer),
          actual_duration_seconds: Math.max(0, Math.floor(actualDurationSeconds)),
        };
        const response = await apiClient<AnswerSubmitResponse>(`/tasks/${taskId}/submit`, {
          method: 'POST',
          body,
        });
        return response;
      } catch (err: any) {
        console.error('Failed to submit answer:', err);
        setError(err.message || 'Failed to submit answer');
        throw err;
      }
    },
    []
  );

  return {
    currentTask,
    loading,
    error,
    fetchNextTask,
    fetchTaskCatalog,
    submitAnswer,
    setCurrentTask,
  };
}
