export type InterventionType = 're_chunk' | 'modality_switch' | 'break_task' | 'difficulty_step_down';

export type InterventionOutcome = 'completed' | 'abandoned_after' | 'improved_score';

export interface InterventionResponse {
  id: string;
  session_id: string;
  task_id: string;
  intervention_type: InterventionType;
  triggered_at: string;
  outcome: InterventionOutcome | null;
  generated_content_id: string | null;
  generation_source: 'llm' | 'stub';
}

export interface OutcomeUpdate {
  outcome: InterventionOutcome;
}

export interface SimulateInterventionRequest {
  session_id: string;
  task_id: string;
  signals: Record<string, any>;
  force_type?: InterventionType;
}
