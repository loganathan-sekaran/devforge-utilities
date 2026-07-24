import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ChmodTool from '../ChmodTool';

describe('ChmodTool Component', () => {
  it('renders correctly and has default permissions configured', () => {
    render(<ChmodTool onSaveHistory={vi.fn()} history={[]} />);

    expect(screen.getByText('Chmod Linux Permission Calculator')).toBeInTheDocument();
    
    // Check initial state (owner: rwx -> 7, group: r-x -> 5, public: r-x -> 5 => 755)
    expect(screen.getByText('755')).toBeInTheDocument();
    expect(screen.getByText('rwxr-xr-x')).toBeInTheDocument();
  });

  it('updates permissions when checkboxes are clicked', () => {
    render(<ChmodTool onSaveHistory={vi.fn()} history={[]} />);

    // Toggle owner execute off (7 -> 6)
    // There are three 'execute' checkboxes: owner, group, public
    const executeCheckboxes = screen.getAllByRole('checkbox');
    // Index mapping from ChmodTool:
    // owner: read (0), write (1), execute (2)
    // group: read (3), write (4), execute (5)
    // public: read (6), write (7), execute (8)
    
    fireEvent.click(executeCheckboxes[2]); // owner execute toggled off
    expect(screen.getByText('655')).toBeInTheDocument();
    expect(screen.getByText('rw-r-xr-x')).toBeInTheDocument();

    // Toggle group write on (5 -> 7)
    fireEvent.click(executeCheckboxes[4]); // group write toggled on
    expect(screen.getByText('675')).toBeInTheDocument();
    expect(screen.getByText('rw-rwxr-x')).toBeInTheDocument();
  });
});
