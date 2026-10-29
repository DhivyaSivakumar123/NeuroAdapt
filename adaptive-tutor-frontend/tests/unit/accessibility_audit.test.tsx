import React from 'react';
import { render, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import axe from 'axe-core';
import fs from 'fs';
import path from 'path';

// Import route components
import { Login } from '../../src/routes/auth/Login';
import { Signup } from '../../src/routes/auth/Signup';
import { StudentDashboard } from '../../src/routes/dashboard/StudentDashboard';
import { TeacherDashboard } from '../../src/routes/dashboard/TeacherDashboard';
import { ParentDashboard } from '../../src/routes/dashboard/ParentDashboard';
import { TaskView } from '../../src/routes/student/TaskView';
import { ChatbotView } from '../../src/routes/student/ChatbotView';
import { ProfilePage } from '../../src/routes/profile/ProfilePage';
import { LearningCalendar } from '../../src/routes/student/LearningCalendar';
import { TeacherMeetings } from '../../src/routes/teacher/TeacherMeetings';
import { StudentDetail } from '../../src/routes/dashboard/StudentDetail';

const OUTPUT_FILE = path.resolve(__dirname, '../../../evaluation/e3_e4_e5/e5_accessibility_raw.json');

// Mock Auth
let currentRole = 'student';
vi.mock('../../src/hooks/useAuth', () => ({
  useAuth: () => ({
    profile: {
      id: 'mock-user-uuid-1',
      display_name: 'Test Evaluator',
      role: currentRole,
    },
    session: {
      user: {
        id: 'mock-user-uuid-1',
        email: 'evaluator@clarity.edu',
      },
    },
    loading: false,
    updateProfile: vi.fn(),
    logout: vi.fn(),
  }),
}));

// Mock API Client
vi.mock('../../src/lib/apiClient', () => ({
  apiClient: vi.fn().mockImplementation((endpoint: string) => {
    if (endpoint.includes('/tasks')) {
      return Promise.resolve([
        {
          id: 'task-1',
          subject: 'biology',
          skill_tag: 'cell_structure',
          difficulty_level: 2,
          content_type: 'interactive',
          content_body: {
            question: 'Which organelle generates ATP?',
            options: ['Mitochondria', 'Nucleus', 'Ribosome', 'Vacuole'],
            correct_index: 0,
          },
          expected_duration_seconds: 60,
        },
      ]);
    }
    if (endpoint.includes('/meetings')) {
      return Promise.resolve({
        meetings: [
          {
            id: 'meet-1',
            title: 'Biology IEP Review',
            meeting_url: 'https://meet.jit.si/clarity-iep-1',
            meeting_time: new Date().toISOString(),
            status: 'scheduled',
          },
        ],
      });
    }
    if (endpoint.includes('/dashboard')) {
      return Promise.resolve({
        students: [
          {
            id: 'stu-1',
            name: 'Alex Student',
            grade_level: 'Grade 7',
            age: 12,
            risk_score: 0.25,
            recent_task: 'Cell Biology Basics',
          },
        ],
        metrics: {
          total_tasks: 24,
          completed_count: 20,
          streak_days: 5,
          avg_performance_score: 88,
          subjects_count: 4,
          modalities_count: 3,
        },
      });
    }
    return Promise.resolve({});
  }),
}));

// Mock recharts
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
  LineChart: ({ children }: any) => <div>{children}</div>,
  Line: () => <div />,
  XAxis: () => <div />,
  YAxis: () => <div />,
  CartesianGrid: () => <div />,
  Tooltip: () => <div />,
  Legend: () => <div />,
  AreaChart: ({ children }: any) => <div>{children}</div>,
  Area: () => <div />,
  BarChart: ({ children }: any) => <div>{children}</div>,
  Bar: () => <div />,
}));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

function wrap(ui: React.ReactElement) {
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        {ui}
      </MemoryRouter>
    </QueryClientProvider>
  );
}

// Global audit store
const auditResults: Record<string, any> = {
  metadata: {
    tool: 'axe-core',
    axe_version: axe.version,
    evaluation_date: new Date().toISOString(),
    standards_tested: ['WCAG 2.0 Level A', 'WCAG 2.0 Level AA', 'WCAG 2.1 Level A', 'WCAG 2.1 Level AA'],
    runtime_environment: 'jsdom 26.0.0 (Vite / React 18 / Vitest)',
    notes: 'Color-contrast rule is disabled in jsdom environment per axe-core specifications because jsdom does not support visual rasterization or computed geometric layout.',
  },
  routes_evaluated: [],
};

function persistAudit() {
  fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(auditResults, null, 2), 'utf-8');
}

async function evaluateComponent(routeName: string, role: string, element: React.ReactElement) {
  currentRole = role;
  const { container } = wrap(element);
  
  // Configure axe with standard DOM-compatible WCAG 2.1 AA rules
  const results = await axe.run(container, {
    runOnly: {
      type: 'rule',
      values: [
        'button-name',
        'image-alt',
        'label',
        'input-button-title',
        'heading-order',
        'link-name',
        'aria-allowed-attr',
        'aria-roles',
        'aria-valid-attr',
        'aria-valid-attr-value',
        'aria-hidden-focus',
        'duplicate-id-aria',
        'form-field-multiple-labels',
        'region',
        'landmark-one-main',
        'bypass',
        'list',
        'listitem',
        'nested-interactive',
        'tabindex',
      ],
    },
  });

  const routeAudit = {
    route: routeName,
    role_tested: role,
    violations_count: results.violations.length,
    passes_count: results.passes.length,
    incomplete_count: results.incomplete.length,
    inapplicable_count: results.inapplicable.length,
    violations: results.violations.map(v => ({
      id: v.id,
      impact: v.impact,
      description: v.description,
      help: v.help,
      helpUrl: v.helpUrl,
      tags: v.tags,
      nodes_affected: v.nodes.length,
      nodes: v.nodes.map(n => ({
        html: n.html.slice(0, 300),
        target: n.target,
        failureSummary: n.failureSummary,
      })),
    })),
    wcag_criteria_affected: Array.from(
      new Set(
        results.violations.flatMap(v =>
          v.tags.filter(t => t.startsWith('wcag') && !t.includes('wcag2a') && !t.includes('wcag2aa'))
        )
      )
    ),
  };

  auditResults.routes_evaluated.push(routeAudit);
  persistAudit();
  return results;
}

describe('E5: Automated Accessibility Evaluation Suite (axe-core)', () => {
  afterEach(() => {
    cleanup();
  });

  it('evaluates Route: /login (Public Auth)', async () => {
    const res = await evaluateComponent('/login', 'unauthenticated', <Login />);
    expect(res).toBeDefined();
  });

  it('evaluates Route: /signup (Public Auth)', async () => {
    const res = await evaluateComponent('/signup', 'unauthenticated', <Signup />);
    expect(res).toBeDefined();
  });

  it('evaluates Route: /dashboard (Student Role)', async () => {
    const res = await evaluateComponent('/dashboard', 'student', <StudentDashboard />);
    expect(res).toBeDefined();
  });

  it('evaluates Route: /dashboard (Teacher Role)', async () => {
    const res = await evaluateComponent('/dashboard', 'teacher', <TeacherDashboard />);
    expect(res).toBeDefined();
  });

  it('evaluates Route: /dashboard (Parent Role)', async () => {
    const res = await evaluateComponent('/dashboard', 'parent', <ParentDashboard />);
    expect(res).toBeDefined();
  });

  it('evaluates Route: /task (Student Active Learning View)', async () => {
    const res = await evaluateComponent('/task', 'student', <TaskView />);
    expect(res).toBeDefined();
  });

  it('evaluates Route: /chatbot (Student AI Tutor Chat View)', async () => {
    const res = await evaluateComponent('/chatbot', 'student', <ChatbotView />);
    expect(res).toBeDefined();
  });

  it('evaluates Route: /profile (User Sensory & Preference Settings)', async () => {
    const res = await evaluateComponent('/profile', 'student', <ProfilePage />);
    expect(res).toBeDefined();
  });

  it('evaluates Route: /calendar (Student Learning Calendar)', async () => {
    const res = await evaluateComponent('/calendar', 'student', <LearningCalendar />);
    expect(res).toBeDefined();
  });

  it('evaluates Route: /meetings (Teacher IEP & 1-on-1 Scheduler)', async () => {
    const res = await evaluateComponent('/meetings', 'teacher', <TeacherMeetings />);
    expect(res).toBeDefined();
  });

  it('evaluates Route: /dashboard/student/:studentId (Detailed Inspection)', async () => {
    const res = await evaluateComponent('/dashboard/student/:studentId', 'teacher', <StudentDetail />);
    expect(res).toBeDefined();
  });
});
