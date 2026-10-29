export interface Session {
  id: string;
  student_id: string;
  subject?: string | null;
  started_at: string;
  ended_at: string | null;
}

export interface SessionCreate {
  student_id: string;
  subject?: string;
}
