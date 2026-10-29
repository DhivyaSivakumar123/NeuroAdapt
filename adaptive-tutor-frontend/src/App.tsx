import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { useAuth } from './hooks/useAuth';
import { ProtectedLayout } from './components/layout/ProtectedLayout';
import { Login } from './routes/auth/Login';
import { Signup } from './routes/auth/Signup';
import { TaskView } from './routes/student/TaskView';
import { StudentDashboard } from './routes/dashboard/StudentDashboard';
import { TeacherDashboard } from './routes/dashboard/TeacherDashboard';
import { ParentDashboard } from './routes/dashboard/ParentDashboard';
import { StudentDetail } from './routes/dashboard/StudentDetail';
import { TeacherMeetings } from './routes/teacher/TeacherMeetings';
import { LearningCalendar } from './routes/student/LearningCalendar';
import { ChatbotView } from './routes/student/ChatbotView';
import { ProfilePage } from './routes/profile/ProfilePage';

const DashboardRouter: React.FC = () => {
  const { profile } = useAuth();
  if (profile?.role === 'teacher') {
    return <TeacherDashboard />;
  }
  if (profile?.role === 'parent') {
    return <ParentDashboard />;
  }
  return <StudentDashboard />;
};

const RootRedirect: React.FC = () => {
  const { session, loading } = useAuth();
  if (loading) return null;
  if (!session) return <Navigate to="/login" replace />;
  return <Navigate to="/dashboard" replace />;
};

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <Routes>
              {/* Public Auth Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />

              {/* Role-Adaptive Dashboard & Common Routes */}
              <Route element={<ProtectedLayout allowedRoles={['student', 'parent', 'teacher']} />}>
                <Route path="/dashboard" element={<DashboardRouter />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/calendar" element={<LearningCalendar />} />
              </Route>

              {/* Student Only Task & AI Tutor Chatbot Routes */}
              <Route element={<ProtectedLayout allowedRoles={['student']} />}>
                <Route path="/task" element={<TaskView />} />
                <Route path="/chatbot" element={<ChatbotView />} />
              </Route>

              {/* Teacher Only Live Meetings Management Route */}
              <Route element={<ProtectedLayout allowedRoles={['teacher']} />}>
                <Route path="/meetings" element={<TeacherMeetings />} />
              </Route>

              {/* Parent & Teacher Detailed Student Inspection */}
              <Route element={<ProtectedLayout allowedRoles={['parent', 'teacher']} />}>
                <Route path="/dashboard/student/:studentId" element={<StudentDetail />} />
              </Route>

              {/* Fallback Root Route */}
              <Route path="*" element={<RootRedirect />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
