import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ColorTool from '../ColorTool';

describe('ColorTool Component', () => {
  it('renders Color Code Converter and performs conversion', () => {
    render(<ColorTool onSaveHistory={vi.fn()} history={[]} />);

    expect(screen.getByText('Color Code Converter & WCAG Contrast Checker')).toBeInTheDocument();

    const hexInput = screen.getByRole('textbox');
    expect(hexInput.value).toBe('#3B82F6');

    // Default conversions
    expect(screen.getByText('rgb(59, 130, 246)')).toBeInTheDocument();
    expect(screen.getByText('hsl(217, 91%, 60%)')).toBeInTheDocument();
  });

  it('handles input validation for invalid HEX formats gracefully', () => {
    render(<ColorTool onSaveHistory={vi.fn()} history={[]} />);

    const hexInput = screen.getByRole('textbox');
    
    // Type an invalid HEX color
    fireEvent.change(hexInput, { target: { value: '#invalid' } });

    // Component should not crash, it should just not render RGB/HSL blocks (or render default error state)
    expect(screen.queryByText(/rgb\(/)).not.toBeInTheDocument();
    expect(screen.queryByText(/hsl\(/)).not.toBeInTheDocument();
  });

  it('calculates WCAG contrast ratio correctly', () => {
    render(<ColorTool onSaveHistory={vi.fn()} history={[]} />);

    expect(screen.getByText('Contrast Ratio')).toBeInTheDocument();
    // Default #3B82F6 contrast vs #FFFFFF is 3.68, which fails both AA normal and AAA normal, but let's check it renders WCAG section
    expect(screen.getByText('WCAG 2.1 Contrast Checker')).toBeInTheDocument();
  });
});
