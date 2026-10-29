import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { InterventionOverlay } from '../../src/routes/student/InterventionOverlay';

describe('InterventionOverlay', () => {
  it('renders loading state when isLoading is true', () => {
    render(<InterventionOverlay type="re_chunk" isLoading={true} onDismiss={vi.fn()} />);
    expect(screen.getByText('Adapting your workspace...')).toBeInTheDocument();
  });

  it('renders re_chunk intervention type correctly', () => {
    render(<InterventionOverlay type="re_chunk" onDismiss={vi.fn()} />);
    expect(screen.getByText("Let's Break This Down into Small Steps")).toBeInTheDocument();
    expect(screen.getByText('Start Step 1')).toBeInTheDocument();
  });

  it('renders modality_switch intervention type correctly', () => {
    render(<InterventionOverlay type="modality_switch" onDismiss={vi.fn()} />);
    expect(screen.getByText("Let's Try a Visual Approach")).toBeInTheDocument();
  });

  it('renders fallback diagnostic indicator when isFallback is true', () => {
    render(<InterventionOverlay type="break_task" isFallback={true} onDismiss={vi.fn()} />);
    expect(screen.getByText('[Dev Diagnostic]: Generated using local fallback engine')).toBeInTheDocument();
  });

  it('calls onDismiss when action button is clicked', () => {
    const onDismiss = vi.fn();
    render(<InterventionOverlay type="difficulty_step_down" onDismiss={onDismiss} />);

    const actionButton = screen.getByText('Try Warm-up Task');
    fireEvent.click(actionButton);

    expect(onDismiss).toHaveBeenCalled();
  });
});
