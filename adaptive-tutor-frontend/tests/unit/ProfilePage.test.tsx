import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProfilePage } from '../../src/routes/profile/ProfilePage';

vi.mock('../../src/hooks/useAuth', () => ({
  useAuth: () => ({
    profile: {
      id: 'user-123',
      display_name: 'Alex Student',
      role: 'student',
    },
    session: {
      user: {
        email: 'student@clarity.edu',
      },
    },
    updateProfile: vi.fn(),
    logout: vi.fn(),
  }),
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
  Link: ({ children, to, ...props }: any) => <a href={to} {...props}>{children}</a>,
}));

vi.mock('../../src/lib/apiClient', () => ({
  apiClient: vi.fn().mockResolvedValue({
    id: 'user-123',
    name: 'Alex Student',
    age: 11,
    grade_level: 'Grade 6',
    learner_profile_tags: ['adhd', 'dyslexia'],
  }),
}));

describe('ProfilePage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders user details, email, and sensory preferences correctly', () => {
    render(<ProfilePage />);

    expect(screen.getByText('Alex Student')).toBeInTheDocument();
    expect(screen.getByText('student@clarity.edu')).toBeInTheDocument();
    expect(screen.getByText(/Student Academic Overview/i)).toBeInTheDocument();
    expect(screen.getByText('Sensory & Accessibility Preferences')).toBeInTheDocument();
    expect(screen.getByText('Dyslexia-Friendly Font')).toBeInTheDocument();
    expect(screen.getByText('Notification Preferences')).toBeInTheDocument();
  });

  it('allows switching to edit mode for display name', () => {
    render(<ProfilePage />);

    const editButton = screen.getByText('Edit Name');
    fireEvent.click(editButton);

    const input = screen.getByLabelText('Display Name');
    expect(input).toBeInTheDocument();
    expect(input).toHaveValue('Alex Student');
  });

  it('renders backward navigation button to return to previous page', () => {
    render(<ProfilePage />);

    expect(screen.getByText('Back to Learning Session')).toBeInTheDocument();
  });
});
