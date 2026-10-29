export type EventType =
  | 'task_start'
  | 'task_switch_away'
  | 'task_switch_back'
  | 'answer_submit'
  | 'retry'
  | 'idle_ping'
  | 'self_report'
  | 'task_complete'
  | 'task_abandon';

export interface TaskStartPayload {
  event_type: 'task_start';
}

export interface TaskSwitchAwayPayload {
  event_type: 'task_switch_away';
}

export interface TaskSwitchBackPayload {
  event_type: 'task_switch_back';
}

export interface AnswerSubmitPayload {
  event_type: 'answer_submit';
  correct: boolean;
  answer_given: string;
}

export interface RetryPayload {
  event_type: 'retry';
  attempt_number: number;
}

export interface IdlePingPayload {
  event_type: 'idle_ping';
  idle_seconds: number;
}

export interface SelfReportPayload {
  event_type: 'self_report';
  score: number;
}

export interface TaskCompletePayload {
  event_type: 'task_complete';
  correct: boolean;
  actual_duration_seconds: number;
}

export interface TaskAbandonPayload {
  event_type: 'task_abandon';
  reason?: string;
}

export type EventPayload =
  | TaskStartPayload
  | TaskSwitchAwayPayload
  | TaskSwitchBackPayload
  | AnswerSubmitPayload
  | RetryPayload
  | IdlePingPayload
  | SelfReportPayload
  | TaskCompletePayload
  | TaskAbandonPayload;

export interface EventCreate {
  session_id: string;
  task_id: string;
  payload: EventPayload;
  timestamp?: string;
}

export interface EventResponse {
  id: string;
  session_id: string;
  task_id: string;
  event_type: EventType;
  timestamp: string;
}
