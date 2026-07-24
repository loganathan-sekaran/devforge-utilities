import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import RegexTool from '../RegexTool';

describe('RegexTool Component', () => {
  it('renders correctly and matches pattern on input test text', async () => {
    render(<RegexTool onSaveHistory={vi.fn()} history={[]} />);

    expect(screen.getByText('Regex Pattern Validator')).toBeInTheDocument();

    const patternInput = screen.getByPlaceholderText(/Type regex pattern/i);
    const testStringInput = screen.getByPlaceholderText(/Paste test paragraph/i);

    // Enter a simple email pattern
    fireEvent.change(patternInput, { target: { value: '[a-z]+@example\\.com' } });
    fireEvent.change(testStringInput, { target: { value: 'Send to info@example.com right now.' } });

    await waitFor(() => {
      // Should find a match and list it in details
      expect(screen.getAllByText(/info@example\.com/).length).toBeGreaterThan(0);
      expect(screen.getByText(/Matches \(1\)/i)).toBeInTheDocument();
    });
  });

  it('performs input validation and shows error message for malformed regex patterns', async () => {
    render(<RegexTool onSaveHistory={vi.fn()} history={[]} />);

    const patternInput = screen.getByPlaceholderText(/Type regex pattern/i);

    // Unclosed parenthesis (malformed regex)
    fireEvent.change(patternInput, { target: { value: '(\\w+' } });

    await waitFor(() => {
      // Validate that error state is caught and displayed
      expect(screen.getByText(/Invalid regular expression/i || /unterminated/i)).toBeInTheDocument();
    });
  });
});
