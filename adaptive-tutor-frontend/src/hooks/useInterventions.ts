import { useState, useCallback } from 'react';
import { apiClient } from '../lib/apiClient';
import {
  InterventionResponse,
  InterventionType,
  InterventionOutcome,
  OutcomeUpdate,
  SimulateInterventionRequest,
} from '../types/intervention';

export function useInterventions() {
  const [interventions, setInterventions] = useState<InterventionResponse[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInterventions = useCallback(async (sessionId: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient<InterventionResponse[]>(`/interventions/${sessionId}`);
      setInterventions(data);
      return data;
    } catch (err: any) {
      console.error('Failed to fetch interventions:', err);
      setError(err.message || 'Failed to retrieve interventions');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const updateOutcome = useCallback(async (interventionId: string, outcome: InterventionOutcome) => {
    try {
      const body: OutcomeUpdate = { outcome };
      const updated = await apiClient<InterventionResponse>(`/interventions/${interventionId}/outcome`, {
        method: 'PATCH',
        body,
      });
      setInterventions((prev) =>
        prev.map((item) => (item.id === interventionId ? updated : item))
      );
      return updated;
    } catch (err: any) {
      console.error('Failed to update intervention outcome:', err);
      throw err;
    }
  }, []);

  const simulateIntervention = useCallback(
    async (sessionId: string, taskId: string, forceType?: InterventionType) => {
      setLoading(true);
      setError(null);
      try {
        const body: SimulateInterventionRequest = {
          session_id: sessionId,
          task_id: taskId,
          signals: {
            latency_ratio: 2.2,
            switch_rate: 4,
            retry_count: 3,
            self_report_score: 2,
          },
          force_type: forceType,
        };
        const result = await apiClient<InterventionResponse>('/interventions/simulate', {
          method: 'POST',
          body,
        });
        setInterventions((prev) => [...prev, result]);
        return result;
      } catch (err: any) {
        console.error('Failed to simulate intervention:', err);
        setError(err.message || 'Failed to simulate intervention');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    interventions,
    loading,
    error,
    fetchInterventions,
    updateOutcome,
    simulateIntervention,
  };
}
