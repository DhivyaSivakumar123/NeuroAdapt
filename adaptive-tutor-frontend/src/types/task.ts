export type ContentType = 'text' | 'interactive' | 'visual';

export interface Task {
  id: string;
  subject: string;
  skill_tag: string;
  difficulty_level: number;
  content_type: ContentType;
  content_body?: Record<string, any>;
  content?: Record<string, any>;
  title?: string;
  expected_duration_seconds: number;
  prerequisite_task_ids: string[];
}

export interface AnswerSubmitRequest {
  session_id: string;
  answer: string | Record<string, any>;
  actual_duration_seconds: number;
}

export interface AnswerSubmitResponse {
  correct: boolean;
  feedback: string;
  task_id: string;
  session_id: string;
}

export interface TaskCatalogResponse {
  tasks: Task[];
  subjects: string[];
  skill_tags: string[];
  total: number;
}
