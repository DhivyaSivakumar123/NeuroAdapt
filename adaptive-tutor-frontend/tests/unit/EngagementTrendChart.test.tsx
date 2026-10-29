import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { EngagementTrendChart } from '../../src/routes/dashboard/EngagementTrendChart';
import { EngagementScoreResponse } from '../../src/types/engagement';

// Mock Recharts ResponsiveContainer to render children in test environment
vi.mock('recharts', async () => {
  const original = await vi.importActual<any>('recharts');
  return {
    ...original,
    ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
  };
});

describe('EngagementTrendChart', () => {
  it('renders empty state when scores list is empty', () => {
    render(<EngagementTrendChart scores={[]} studentName="Alex" />);
    expect(screen.getByText('No Learning Sessions Recorded Yet')).toBeInTheDocument();
  });

  it('renders engagement score trend chart with valid scores', () => {
    const mockScores: EngagementScoreResponse[] = [
      {
        id: '1',
        session_id: 's1',
        task_id: 't1',
        computed_score: 0.85,
        computed_at: '2026-08-29T10:00:00Z',
        signals_snapshot: {},
        classification: 'no_action',
      },
      {
        id: '2',
        session_id: 's1',
        task_id: 't2',
        computed_score: 0.55,
        computed_at: '2026-08-29T10:05:00Z',
        signals_snapshot: {},
        classification: 'flag_monitor',
      },
    ];

    render(<EngagementTrendChart scores={mockScores} studentName="Alex" />);
    expect(screen.getByText('Focus & Engagement Over Time')).toBeInTheDocument();
    expect(screen.getByText('55%')).toBeInTheDocument();
    expect(screen.getByText('Mild Distraction / Pause (40% - 70%)')).toBeInTheDocument();
  });
});
