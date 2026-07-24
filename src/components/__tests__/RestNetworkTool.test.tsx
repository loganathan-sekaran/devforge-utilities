import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import RestNetworkTool from '../RestNetworkTool';

describe('RestNetworkTool Component', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockImplementation(() =>
      Promise.resolve({
        status: 200,
        statusText: 'OK',
        headers: new Headers({ 'Content-Type': 'application/json' }),
        text: () => Promise.resolve('{"success": true}'),
      })
    ));
  });

  it('renders and executes standard GET requests successfully', async () => {
    render(<RestNetworkTool onSaveHistory={vi.fn()} history={[]} />);

    expect(screen.getByText('Network & REST API Tool')).toBeInTheDocument();

    const urlInput = screen.getByPlaceholderText('https://api.example.com/endpoint');
    fireEvent.change(urlInput, { target: { value: 'https://jsonplaceholder.typicode.com/posts/2' } });

    const sendBtn = screen.getByRole('button', { name: /Send/i });
    fireEvent.click(sendBtn);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        'https://jsonplaceholder.typicode.com/posts/2',
        expect.objectContaining({ method: 'GET' })
      );
    });
  });

  it('allows custom HTTP method entry and sends it in the request options', async () => {
    render(<RestNetworkTool onSaveHistory={vi.fn()} history={[]} />);

    // Select CUSTOM method option
    const methodSelect = screen.getByRole('combobox');
    fireEvent.change(methodSelect, { target: { value: 'CUSTOM' } });

    // Custom method input text box should be displayed
    const methodInput = screen.getByPlaceholderText('METHOD');
    fireEvent.change(methodInput, { target: { value: 'purge' } }); // lowercase should become uppercase

    const urlInput = screen.getByPlaceholderText('https://api.example.com/endpoint');
    fireEvent.change(urlInput, { target: { value: 'https://example.com/purge-cache' } });

    const sendBtn = screen.getByRole('button', { name: /Send/i });
    fireEvent.click(sendBtn);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        'https://example.com/purge-cache',
        expect.objectContaining({ method: 'PURGE' })
      );
    });
  });
});
