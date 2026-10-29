import { EngagementScoreResponse } from './engagement';
import { InterventionResponse } from './intervention';

export interface SubjectProgressDetail {
  subject: string;
  completed: number;
  total: number;
  mastery_percentage: number;
  status: string;
  color: string;
}

export interface StudentEngagementTrend {
  student_id: string;
  student_name: string;
  grade_level?: string | null;
  learner_profile_tags?: string[];
  scores: EngagementScoreResponse[];
  latest_classification: string | null;
  subject_progress?: SubjectProgressDetail[];
}

export interface InterventionHistory {
  student_id: string;
  student_name: string;
  interventions: InterventionResponse[];
}

export interface FlaggedStudent {
  student_id: string;
  student_name: string;
  latest_score: number;
  classification: 'flag_monitor' | 'trigger_intervention';
  latest_computed_at: string;
}

export interface DashboardFlags {
  flagged: FlaggedStudent[];
}

export interface RosterStudent {
  student_id: string;
  student_name: string;
  grade_level: string;
  learner_profile_tags?: string[];
  latest_score: number | null;
  classification: 'no_action' | 'flag_monitor' | 'trigger_intervention' | null;
  latest_computed_at: string | null;
}

export interface DashboardRoster {
  students: RosterStudent[];
}

export interface SkillFrictionMetric {
  skill_tag: string;
  subject: string;
  total_attempts: number;
  retry_count: number;
  avg_score: number;
  interventions_count: number;
}

export interface ClassAnalyticsResponse {
  total_students: number;
  optimal_count: number;
  monitoring_count: number;
  intervention_count: number;
  avg_engagement_score: number;
  recent_interventions_count: number;
  skill_friction: SkillFrictionMetric[];
}

export interface ParentGuidanceTip {
  title: string;
  strategy: string;
  category: string;
  recommended_action: string;
}

export interface ParentGuidanceResponse {
  student_id: string;
  student_name: string;
  current_status: string;
  tips: ParentGuidanceTip[];
}

export interface AIStudentAnalysisDetails {
  superpowers_and_strengths: string;
  cognitive_bottlenecks: string;
  teacher_action_plan: string[];
  parent_support_cue: string;
  recommended_next_module: string;
}

export interface AIStudentAnalysisResponse {
  student_id: string;
  student_name: string;
  analysis: AIStudentAnalysisDetails;
  source: string;
}
