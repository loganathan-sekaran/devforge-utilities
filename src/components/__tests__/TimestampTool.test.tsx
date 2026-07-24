import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import TimestampTool from '../TimestampTool';

describe('TimestampTool Component', () => {
  it('renders correctly and performs epoch-to-date conversion', async () => {
    render(<TimestampTool onSaveHistory={vi.fn()} history={[]} />);

    expect(screen.getByText('Unix Timestamp & Epoch Converter')).toBeInTheDocument();

    const epochInput = screen.getByPlaceholderText('e.g. 1774175339');
    // Standard timestamp: 1774889287 (representing a date in 2026)
    fireEvent.change(epochInput, { target: { value: '1774889287' } });

    await waitFor(() => {
      expect(screen.getAllByText(/2026/).length).toBeGreaterThan(0);
    });
  });

  it('performs input validation for malformed timestamps', async () => {
    render(<TimestampTool onSaveHistory={vi.fn()} history={[]} />);

    const epochInput = screen.getByPlaceholderText('e.g. 1774175339');
    
    // Type an invalid numeric string
    fireEvent.change(epochInput, { target: { value: 'not-a-timestamp' } });

    await waitFor(() => {
      // Validate that it handles invalid values gracefully by showing error
      expect(screen.getByText('Please enter a valid numeric Unix timestamp.')).toBeInTheDocument();
    });
  });
});
