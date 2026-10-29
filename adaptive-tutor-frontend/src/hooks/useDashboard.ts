import { useState, useCallback } from 'react';
import { apiClient } from '../lib/apiClient';
import {
  StudentEngagementTrend,
  InterventionHistory,
  DashboardFlags,
  DashboardRoster,
  ClassAnalyticsResponse,
  ParentGuidanceResponse,
  AIStudentAnalysisResponse,
} from '../types/dashboard';
import { Student, StudentCreate, StudentUpdate } from '../types/student';

export function useDashboard() {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEngagementTrend = useCallback(async (studentId: string): Promise<StudentEngagementTrend | null> => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient<StudentEngagementTrend>(`/dashboard/students/${studentId}/engagement`);
      return data;
    } catch (err: any) {
      console.error('Failed to fetch engagement trend:', err);
      setError(err.message || 'Failed to load engagement trend');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchInterventionHistory = useCallback(async (studentId: string): Promise<InterventionHistory | null> => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient<InterventionHistory>(`/dashboard/students/${studentId}/interventions`);
      return data;
    } catch (err: any) {
      console.error('Failed to fetch intervention history:', err);
      setError(err.message || 'Failed to load intervention history');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchParentGuidance = useCallback(async (studentId: string): Promise<ParentGuidanceResponse | null> => {
    try {
      const data = await apiClient<ParentGuidanceResponse>(`/dashboard/students/${studentId}/guidance`);
      return data;
    } catch (err: any) {
      console.error('Failed to fetch parent guidance:', err);
      return null;
    }
  }, []);

  const fetchAIAnalysis = useCallback(async (studentId: string, forceRefresh = false): Promise<AIStudentAnalysisResponse | null> => {
    try {
      const url = forceRefresh
        ? `/dashboard/students/${studentId}/ai-analysis?force_refresh=true`
        : `/dashboard/students/${studentId}/ai-analysis`;
      const data = await apiClient<AIStudentAnalysisResponse>(url);
      return data;
    } catch (err: any) {
      console.error('Failed to fetch AI analysis:', err);
      return null;
    }
  }, []);

  const fetchFlaggedStudents = useCallback(async (): Promise<DashboardFlags | null> => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient<DashboardFlags>('/dashboard/flags');
      return data;
    } catch (err: any) {
      console.error('Failed to fetch flagged students:', err);
      setError(err.message || 'Failed to load flagged students');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchRoster = useCallback(async (): Promise<DashboardRoster | null> => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient<DashboardRoster>('/dashboard/roster');
      return data;
    } catch (err: any) {
      console.error('Failed to fetch dashboard roster:', err);
      setError(err.message || 'Failed to load roster');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchClassAnalytics = useCallback(async (): Promise<ClassAnalyticsResponse | null> => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient<ClassAnalyticsResponse>('/dashboard/analytics');
      return data;
    } catch (err: any) {
      console.error('Failed to fetch class analytics:', err);
      setError(err.message || 'Failed to load class analytics');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const createStudent = useCallback(async (studentData: StudentCreate): Promise<Student | null> => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient<Student>('/students', {
        method: 'POST',
        body: studentData,
      });
      return data;
    } catch (err: any) {
      console.error('Failed to create student:', err);
      setError(err.message || 'Failed to create student');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateStudent = useCallback(async (studentId: string, updates: StudentUpdate): Promise<Student | null> => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient<Student>(`/students/${studentId}`, {
        method: 'PATCH',
        body: updates,
      });
      return data;
    } catch (err: any) {
      console.error('Failed to update student:', err);
      setError(err.message || 'Failed to update student');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const searchStudents = useCallback(async (query: string): Promise<Student[]> => {
    try {
      const data = await apiClient<Student[]>(`/students/search?q=${encodeURIComponent(query)}`);
      return data || [];
    } catch (err: any) {
      console.error('Failed to search students:', err);
      return [];
    }
  }, []);

  const assignStudentToParent = useCallback(async (studentId: string): Promise<boolean> => {
    setLoading(true);
    try {
      await apiClient(`/students/${studentId}/assign-parent`, {
        method: 'POST',
      });
      return true;
    } catch (err: any) {
      console.error('Failed to link student to parent:', err);
      setError(err.message || 'Failed to link student');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const assignStudentToTeacher = useCallback(async (studentId: string): Promise<boolean> => {
    setLoading(true);
    try {
      await apiClient(`/students/${studentId}/assign-teacher`, {
        method: 'POST',
      });
      return true;
    } catch (err: any) {
      console.error('Failed to assign student to teacher:', err);
      setError(err.message || 'Failed to assign student');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const unassignStudentFromTeacher = useCallback(async (studentId: string): Promise<boolean> => {
    setLoading(true);
    try {
      await apiClient(`/students/${studentId}/unassign-teacher`, {
        method: 'DELETE',
      });
      return true;
    } catch (err: any) {
      console.error('Failed to unassign student:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    fetchEngagementTrend,
    fetchInterventionHistory,
    fetchParentGuidance,
    fetchAIAnalysis,
    fetchFlaggedStudents,
    fetchRoster,
    fetchClassAnalytics,
    createStudent,
    updateStudent,
    searchStudents,
    assignStudentToParent,
    assignStudentToTeacher,
    unassignStudentFromTeacher,
  };
}
