import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import MarkdownTool from '../MarkdownTool';

describe('MarkdownTool Component', () => {
  it('renders correctly and performs live markdown formatting', async () => {
    render(<MarkdownTool onSaveHistory={vi.fn()} history={[]} />);

    expect(screen.getByText('Markdown (MD) File Previewer')).toBeInTheDocument();

    const textEditor = screen.getByPlaceholderText(/Start typing your markdown here/i);
    
    // Type new markdown
    fireEvent.change(textEditor, { target: { value: '# Custom Title\n\nThis is custom text.' } });

    await waitFor(() => {
      // Test rendering the markdown HTML
      expect(screen.getByRole('heading', { level: 1, name: 'Custom Title' })).toBeInTheDocument();
      expect(screen.getByText('This is custom text.')).toBeInTheDocument();
    });
  });

  it('handles markdown file drop and loads content', async () => {
    const onSaveHistoryMock = vi.fn();
    render(<MarkdownTool onSaveHistory={onSaveHistoryMock} history={[]} />);

    const editorTextarea = screen.getByPlaceholderText(/Start typing your markdown here/i);

    // Mock drop file
    const file = new File(['# Dropped Doc\nSome text.'], 'dropped.md', { type: 'text/markdown' });
    const dataTransfer = {
      files: [file],
      types: ['Files'],
      items: [
        {
          kind: 'file',
          type: file.type,
          getAsFile: () => file,
        },
      ],
    };

    fireEvent.drop(editorTextarea, {
      dataTransfer,
    });

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: 'Dropped Doc' })).toBeInTheDocument();
    });

    expect(onSaveHistoryMock).toHaveBeenCalledWith(
      expect.stringContaining('dropped.md'),
      expect.stringContaining('chars'),
      expect.objectContaining({ tool: 'markdown_preview', fileName: 'dropped.md' })
    );
  });
});
