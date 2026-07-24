import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import JSONTool from '../JSONTool';

describe('JSONTool Component', () => {
  it('renders JSON Formatter and handles valid JSON formatting', async () => {
    const onSaveHistoryMock = vi.fn();
    render(<JSONTool onSaveHistory={onSaveHistoryMock} history={[]} />);

    expect(screen.getByText('JSON Formatter & Minifier')).toBeInTheDocument();

    const inputArea = screen.getByPlaceholderText(/Paste your raw JSON string/i);
    
    // Input valid JSON
    fireEvent.change(inputArea, { target: { value: '{"name":"devforge","active":true}' } });

    const formatButton = screen.getByRole('button', { name: /Format/i });
    fireEvent.click(formatButton);

    // Assert formatted output
    await waitFor(() => {
      expect(screen.getByText(/"name": "devforge"/i)).toBeInTheDocument();
    });

    expect(onSaveHistoryMock).toHaveBeenCalledWith(
      '{"name":"devforge","active":true}',
      expect.stringContaining('"name": "devforge"'),
      expect.objectContaining({ action: 'format' })
    );
  });

  it('handles JSON minification correctly', async () => {
    render(<JSONTool onSaveHistory={vi.fn()} history={[]} />);
    
    const inputArea = screen.getByPlaceholderText(/Paste your raw JSON string/i);
    fireEvent.change(inputArea, { target: { value: '{\n  "name": "devforge",\n  "active": true\n}' } });

    const minifyButton = screen.getByRole('button', { name: /Minify/i });
    fireEvent.click(minifyButton);

    await waitFor(() => {
      expect(screen.getByText('{"name":"devforge","active":true}')).toBeInTheDocument();
    });
  });

  it('performs input validation and displays syntax error for invalid JSON', async () => {
    render(<JSONTool onSaveHistory={vi.fn()} history={[]} />);
    
    const inputArea = screen.getByPlaceholderText(/Paste your raw JSON string/i);
    
    // Malformed JSON (missing closing quote)
    fireEvent.change(inputArea, { target: { value: '{"name: "devforge"}' } });

    const formatButton = screen.getByRole('button', { name: /Format/i });
    fireEvent.click(formatButton);

    // Validate that syntax error is caught and displayed
    await waitFor(() => {
      expect(screen.getByText(/invalid|position|expected/i)).toBeInTheDocument();
    });
  });
});
