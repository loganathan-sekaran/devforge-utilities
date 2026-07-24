import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Base64UrlTool from '../Base64UrlTool';

describe('Base64UrlTool Component', () => {
  it('renders correctly and has plaintext and base64 text areas', () => {
    render(<Base64UrlTool onSaveHistory={vi.fn()} history={[]} />);
    
    // Header check
    expect(screen.getByText(/Base64 Encoder \/ Decoder/i)).toBeInTheDocument();
    
    // Inputs check
    expect(screen.getByPlaceholderText(/Type or paste plaintext here.../i)).toBeInTheDocument();
  });

  it('performs basic Base64 encoding automatically when text is input', async () => {
    render(<Base64UrlTool onSaveHistory={vi.fn()} history={[]} />);
    
    const textInput = screen.getByPlaceholderText(/Type or paste plaintext here.../i);
    
    fireEvent.change(textInput, { target: { value: 'hello' } });
    
    // Wait for auto-processing and assert output 'aGVsbG8=' is rendered
    await waitFor(() => {
      expect(screen.getByText('aGVsbG8=')).toBeInTheDocument();
    });
  });

  it('performs URL-safe encoding when toggle is checked', async () => {
    render(<Base64UrlTool onSaveHistory={vi.fn()} history={[]} />);
    
    const textInput = screen.getByPlaceholderText(/Type or paste plaintext here.../i);
    
    // "hello?" standard base64 is "aGVsbG8/==" but URL-safe is "aGVsbG8_" or "aGVsbG8_==" depending on padding stripping
    fireEvent.change(textInput, { target: { value: 'hello?' } });
    
    await waitFor(() => {
      expect(screen.getByText(/aGVsbG8/)).toBeInTheDocument();
    });

    const urlSafeCheckbox = screen.getByLabelText(/URL-Safe/i);
    fireEvent.click(urlSafeCheckbox);

    // URL-safe version of "hello?" contains "_" instead of "/"
    await waitFor(() => {
      expect(screen.getByText('aGVsbG8_')).toBeInTheDocument();
    });
  });

  it('handles drag and drop file uploads and auto-encodes them', async () => {
    const onSaveHistoryMock = vi.fn();
    render(<Base64UrlTool onSaveHistory={onSaveHistoryMock} history={[]} />);

    const dropZone = screen.getByText(/or drag file here/i);
    
    // Mock File and DataTransfer
    const file = new File(['file contents'], 'test.txt', { type: 'text/plain' });
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

    fireEvent.drop(dropZone, {
      dataTransfer,
    });

    // Check that File Name is displayed
    expect(screen.getByText('test.txt')).toBeInTheDocument();

    // Verify file content is processed (Base64 of 'file contents' is 'ZmlsZSBjb250ZW50cw==')
    await waitFor(() => {
      expect(screen.getByText('ZmlsZSBjb250ZW50cw==')).toBeInTheDocument();
    });

    expect(onSaveHistoryMock).toHaveBeenCalledWith(
      '[File: test.txt]',
      'ZmlsZSBjb250ZW50cw==',
      expect.objectContaining({ tool: 'base64_file', direction: 'encode' })
    );
  });
});
