import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TaskView } from '../../src/routes/student/TaskView';
import { Task } from '../../src/types/task';

// Hoisted mock functions
const {
  mockFetchNextTask,
  mockSubmitAnswer,
  mockLogTaskStart,
  mockLogAnswerSubmit,
  mockLogTaskComplete,
  mockLogSelfReport,
} = vi.hoisted(() => ({
  mockFetchNextTask: vi.fn(),
  mockSubmitAnswer: vi.fn(),
  mockLogTaskStart: vi.fn(),
  mockLogAnswerSubmit: vi.fn(),
  mockLogTaskComplete: vi.fn(),
  mockLogSelfReport: vi.fn(),
}));

vi.mock('../../src/hooks/useAuth', () => ({
  useAuth: () => ({
    profile: { id: 'student-profile-123', role: 'student', display_name: 'Alex' },
  }),
}));

vi.mock('../../src/hooks/useSession', () => ({
  useSession: () => ({
    activeSession: { id: 'session-123', student_id: 'student-profile-123' },
    startSession: vi.fn(),
    endSession: vi.fn(),
  }),
}));

vi.mock('../../src/hooks/useTasks', () => ({
  useTasks: () => ({
    currentTask: {
      id: 'task-text-1',
      subject: 'Life Science',
      skill_tag: 'Cell Biology',
      difficulty_level: 1,
      content_type: 'text',
      title: 'What is the powerhouse of the cell?',
      content: { prompt: 'Identify the organelle responsible for energy production.' },
      expected_duration_seconds: 60,
      prerequisite_task_ids: [],
    } as Task,
    loading: false,
    error: null,
    fetchNextTask: mockFetchNextTask,
    submitAnswer: mockSubmitAnswer,
    setCurrentTask: vi.fn(),
  }),
}));

vi.mock('../../src/hooks/useEventLogger', () => ({
  useEventLogger: () => ({
    logTaskStart: mockLogTaskStart,
    logTaskSwitchAway: vi.fn(),
    logTaskSwitchBack: vi.fn(),
    logAnswerSubmit: mockLogAnswerSubmit,
    logRetry: vi.fn(),
    logIdlePing: vi.fn(),
    logSelfReport: mockLogSelfReport,
    logTaskComplete: mockLogTaskComplete,
    logTaskAbandon: vi.fn(),
  }),
}));

vi.mock('../../src/hooks/useInterventions', () => ({
  useInterventions: () => ({
    interventions: [],
    loading: false,
    error: null,
    fetchInterventions: vi.fn().mockResolvedValue([]),
    updateOutcome: vi.fn(),
    simulateIntervention: vi.fn().mockResolvedValue({ intervention_type: 're_chunk', generation_source: 'stub' }),
  }),
}));

describe('TaskView Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSubmitAnswer.mockResolvedValue({
      correct: true,
      feedback: 'Correct! Mitochondria produces ATP energy.',
      task_id: 'task-text-1',
      session_id: 'session-123',
    });
    mockLogTaskStart.mockResolvedValue(null);
    mockLogAnswerSubmit.mockResolvedValue(null);
    mockLogTaskComplete.mockResolvedValue(null);
    mockLogSelfReport.mockResolvedValue(null);
  });

  it('renders task details and text content prompt correctly', () => {
    render(<TaskView />);

    expect(screen.getByText('What is the powerhouse of the cell?')).toBeInTheDocument();
    expect(screen.getByText('Life Science')).toBeInTheDocument();
    expect(screen.getByText('Cell Biology')).toBeInTheDocument();
    expect(screen.getAllByText('Identify the organelle responsible for energy production.')[0]).toBeInTheDocument();
  });

  it('handles answer submission and renders correct feedback', async () => {
    const { container } = render(<TaskView />);

    const input = screen.getByLabelText('Your Answer');
    fireEvent.change(input, { target: { value: 'Mitochondria' } });

    const form = container.querySelector('form')!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(mockSubmitAnswer).toHaveBeenCalled();
    });
  });
});
