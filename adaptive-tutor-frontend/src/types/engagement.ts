export type EngagementClassification = 'no_action' | 'flag_monitor' | 'trigger_intervention';

export interface EngagementScoreResponse {
  id: string;
  session_id: string;
  task_id: string;
  computed_score: number;
  computed_at: string;
  signals_snapshot: Record<string, any>;
  classification: EngagementClassification;
}
