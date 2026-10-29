export interface Student {
  id: string;
  profile_id?: string | null;
  name: string;
  age: number;
  grade_level: string;
  learner_profile_tags: string[];
  parent_id: string;
  created_at: string;
}

export interface StudentCreate {
  name: string;
  email: string;
  password: string;
  age: number;
  grade_level: string;
  learner_profile_tags: string[];
}

export interface StudentUpdate {
  name?: string;
  age?: number;
  grade_level?: string;
  learner_profile_tags?: string[];
}
