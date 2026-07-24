import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import UUIDTool from '../UUIDTool';

describe('UUIDTool Component', () => {
  it('generates standard UUIDs successfully', async () => {
    const onSaveHistoryMock = vi.fn();
    const { container } = render(
      <UUIDTool
        onSaveHistory={onSaveHistoryMock}
        history={[]}
        onAddJob={vi.fn()}
        onUpdateJobProgress={vi.fn()}
      />
    );

    const countInput = container.querySelector('#uuid-count-input')!;
    fireEvent.change(countInput, { target: { value: '5' } });

    const generateButton = screen.getByRole('button', { name: /Generate/i });
    fireEvent.click(generateButton);

    await waitFor(() => {
      // UUID version 4 format: 8-4-4-4-12 hex chars inside output textarea
      const textarea = screen.getByPlaceholderText(/Your generated UUID list/i) as HTMLTextAreaElement;
      expect(textarea.value).toMatch(/[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i);
    });

    expect(onSaveHistoryMock).toHaveBeenCalledWith(
      expect.stringContaining('Generate 5 UUIDs'),
      expect.any(String),
      expect.objectContaining({ count: 5 })
    );
  });

  it('performs formatting changes for uppercase and no-hyphens', async () => {
    render(
      <UUIDTool
        onSaveHistory={vi.fn()}
        history={[]}
        onAddJob={vi.fn()}
        onUpdateJobProgress={vi.fn()}
      />
    );

    // Turn off hyphens and turn on uppercase
    const hyphenCheckbox = screen.getByLabelText(/Include Hyphens/i);
    const uppercaseCheckbox = screen.getByLabelText(/Uppercase/i);

    fireEvent.click(hyphenCheckbox); // Toggle off
    fireEvent.click(uppercaseCheckbox); // Toggle on

    const generateButton = screen.getByRole('button', { name: /Generate/i });
    fireEvent.click(generateButton);

    await waitFor(() => {
      // 32 uppercase characters without hyphens
      const textarea = screen.getByPlaceholderText(/Your generated UUID list/i) as HTMLTextAreaElement;
      const lines = textarea.value.trim().split('\n');
      expect(lines[0]).toMatch(/^[0-9A-F]{32}$/);
    });
  });

  it('performs input validation for counts and handles bulk generation jobs', async () => {
    const onAddJobMock = vi.fn();
    const { container } = render(
      <UUIDTool
        onSaveHistory={vi.fn()}
        history={[]}
        onAddJob={onAddJobMock}
        onUpdateJobProgress={vi.fn()}
      />
    );

    const countInput = container.querySelector('#uuid-count-input')!;
    
    // Set to bulk count (> 5000) to trigger background job
    fireEvent.change(countInput, { target: { value: '10000' } });

    const generateButton = screen.getByRole('button', { name: /Generate/i });
    fireEvent.click(generateButton);

    await waitFor(() => {
      expect(onAddJobMock).toHaveBeenCalledWith(
        expect.objectContaining({
          name: expect.stringContaining('10,000'),
          tool: 'uuid',
          status: 'running',
        })
      );
    });
  });
});
