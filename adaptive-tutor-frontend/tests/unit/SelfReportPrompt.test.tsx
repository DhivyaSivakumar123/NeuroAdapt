import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SelfReportPrompt } from '../../src/routes/student/SelfReportPrompt';

describe('SelfReportPrompt', () => {
  it('renders all 5 self report options correctly', () => {
    const onSelect = vi.fn();
    render(<SelfReportPrompt onSelectScore={onSelect} />);

    expect(screen.getByText('Quick Check-in!')).toBeInTheDocument();
    expect(screen.getByText('Super Hard')).toBeInTheDocument();
    expect(screen.getByText('Super Easy')).toBeInTheDocument();
  });

  it('triggers onSelectScore callback with correct score when tapped', () => {
    const onSelect = vi.fn();
    render(<SelfReportPrompt onSelectScore={onSelect} />);

    const easyButton = screen.getByText('Super Easy');
    fireEvent.click(easyButton);

    expect(onSelect).toHaveBeenCalledWith(5);
  });
});
