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

  it('converts UTC to selected timezone (IST) correctly', async () => {
    render(<TimestampTool onSaveHistory={vi.fn()} history={[]} />);

    expect(screen.getByText('UTC ⇄ Timezone Converter (To & Fro)')).toBeInTheDocument();

    const datetimeInput = screen.getByPlaceholderText('YYYY-MM-DDTHH:mm:ss');
    // Set 10:00:00 UTC
    fireEvent.change(datetimeInput, { target: { value: '2026-09-18T10:00:00' } });

    // With IST (+05:30), 10:00:00 UTC should be 15:30:00 IST
    await waitFor(() => {
      expect(screen.getByText('2026-09-18 15:30:00')).toBeInTheDocument();
      expect(screen.getAllByText('+05:30').length).toBeGreaterThan(0);
    });
  });

  it('swaps conversion direction from IST to UTC and back to and fro', async () => {
    const onSaveHistory = vi.fn();
    render(<TimestampTool onSaveHistory={onSaveHistory} history={[]} />);

    const datetimeInput = screen.getByPlaceholderText('YYYY-MM-DDTHH:mm:ss');
    // Enter 10:00 UTC -> 15:30 IST
    fireEvent.change(datetimeInput, { target: { value: '2026-09-18T10:00:00' } });

    await waitFor(() => {
      expect(screen.getByText('2026-09-18 15:30:00')).toBeInTheDocument();
    });

    // Click "Swap Direction" to convert from IST to UTC
    const swapButton = screen.getByTitle('Swap Direction (To and Fro)');
    fireEvent.click(swapButton);

    // The input should now reflect 15:30, and the converted result should be 10:00:00 UTC
    await waitFor(() => {
      expect(screen.getByText('2026-09-18 10:00:00')).toBeInTheDocument();
    });

    // Save to history
    const saveButton = screen.getByRole('button', { name: /Save Conversion to History/i });
    fireEvent.click(saveButton);
    expect(onSaveHistory).toHaveBeenCalledWith(
      expect.stringContaining('Asia/Kolkata ➔ UTC'),
      '2026-09-18 10:00:00',
      expect.objectContaining({ direction: 'tz_to_utc', timezone: 'Asia/Kolkata' })
    );

    // Swap back (to and fro)
    fireEvent.click(swapButton);
    await waitFor(() => {
      expect(screen.getByText('2026-09-18 15:30:00')).toBeInTheDocument();
    });
  });

  it('allows converting to other selected timezones like Tokyo (JST)', async () => {
    render(<TimestampTool onSaveHistory={vi.fn()} history={[]} />);

    const datetimeInput = screen.getByPlaceholderText('YYYY-MM-DDTHH:mm:ss');
    fireEvent.change(datetimeInput, { target: { value: '2026-09-18T10:00:00' } });

    // Click JST preset button
    const jstButton = screen.getByRole('button', { name: /JST/i });
    fireEvent.click(jstButton);

    // JST is UTC+9, so 10:00 UTC is 19:00 JST
    await waitFor(() => {
      expect(screen.getByText('2026-09-18 19:00:00')).toBeInTheDocument();
      expect(screen.getAllByText('+09:00').length).toBeGreaterThan(0);
    });
  });
});
