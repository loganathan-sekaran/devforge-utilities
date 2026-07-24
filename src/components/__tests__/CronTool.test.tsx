import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import CronTool from '../CronTool';

describe('CronTool Component', () => {
  it('renders correctly and parses standard cron expressions', () => {
    render(<CronTool onSaveHistory={vi.fn()} history={[]} />);

    expect(screen.getByText('Cron Expression Parser & Explainer')).toBeInTheDocument();
    
    // Default initial expression: */15 * * * *
    expect(screen.getByText(/every 15 minutes/i)).toBeInTheDocument();
  });

  it('updates explanation when preset buttons are clicked', () => {
    render(<CronTool onSaveHistory={vi.fn()} history={[]} />);

    const presetBtn = screen.getByRole('button', { name: /Every Hour \(0 \* \* \* \*\)/i });
    fireEvent.click(presetBtn);

    expect(screen.getByText(/at minute 0/i)).toBeInTheDocument();
  });

  it('performs input validation and shows error for invalid expressions', () => {
    render(<CronTool onSaveHistory={vi.fn()} history={[]} />);

    const inputField = screen.getByPlaceholderText(/e.g. 0 9 \* \* 1-5/i);
    
    // Type an invalid cron (only 3 parts)
    fireEvent.change(inputField, { target: { value: '* * *' } });

    // Validate warning message is displayed
    expect(screen.getByText(/must have 5 or 6 fields/i)).toBeInTheDocument();
  });
});
