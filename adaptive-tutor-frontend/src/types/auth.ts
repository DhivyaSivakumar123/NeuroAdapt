export type UserRole = 'student' | 'parent' | 'teacher';

export interface Profile {
  id: string;
  role: UserRole;
  display_name: string;
  created_at: string;
}

export interface ProfileCreate {
  id: string;
  role: UserRole;
  display_name: string;
}
