import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PemTool from '../PemTool';

// Mock CryptoJS window.atob
if (typeof window !== 'undefined') {
  window.atob = vi.fn((str) => {
    return Buffer.from(str, 'base64').toString('latin1');
  });
}

describe('PemTool Component', () => {
  it('renders correctly and parses mock certificate block', async () => {
    render(<PemTool onSaveHistory={vi.fn()} history={[]} />);

    expect(screen.getByText('PEM Key & Certificate Decoder')).toBeInTheDocument();

    const inputArea = screen.getByPlaceholderText(/-----BEGIN CERTIFICATE-----/);

    // Enter a valid looking certificate structure
    const mockPem = `-----BEGIN CERTIFICATE-----\nMIIBqwIBAAKCAQEA0=\n-----END CERTIFICATE-----`;
    fireEvent.change(inputArea, { target: { value: mockPem } });

    await waitFor(() => {
      // Should detect type
      expect(screen.getByText('CERTIFICATE')).toBeInTheDocument();
    });
  });

  it('performs input validation and shows syntax error for invalid boundary PEM blocks', async () => {
    render(<PemTool onSaveHistory={vi.fn()} history={[]} />);

    const inputArea = screen.getByPlaceholderText(/-----BEGIN CERTIFICATE-----/);

    // Invalid format
    fireEvent.change(inputArea, { target: { value: 'some random non-pem key' } });

    await waitFor(() => {
      // Validate error
      expect(screen.getByText(/Invalid PEM format/i)).toBeInTheDocument();
    });
  });
});
