export interface Meeting {
  id: string;
  title: string;
  subject: string;
  teacher_id?: string | null;
  student_id?: string | null;
  meeting_link: string;
  meeting_date: string; // YYYY-MM-DD
  start_time: string;   // e.g. "01:00 PM"
  end_time: string;     // e.g. "02:00 PM"
  status: 'upcoming' | 'live' | 'completed' | 'cancelled';
  description?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface MeetingListResponse {
  meetings: Meeting[];
  total: number;
}

export interface CreateMeetingPayload {
  title: string;
  subject: string;
  meeting_link: string;
  meeting_date: string;
  start_time: string;
  end_time: string;
  status?: string;
  student_id?: string | null;
  description?: string;
}
