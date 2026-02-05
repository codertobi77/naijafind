import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi as vitest } from 'vitest';
import DocumentUpload from '../DocumentUpload';

// Mock the uploadImageToCloudinary function
vi.mock('../../../lib/cloudinary', () => ({
  uploadImageToCloudinary: vitest.fn(),
  validateImageFile: vitest.fn(),
}));

import { uploadImageToCloudinary, validateImageFile } from '../../../lib/cloudinary';

describe('DocumentUpload Component', () => {
  const mockOnChange = vitest.fn();

  beforeEach(() => {
    vitest.clearAllMocks();
  });

  it('renders correctly with label and description', () => {
    render(
      <DocumentUpload
        label="Business Registration"
        documentType="business_registration"
        value=""
        onChange={mockOnChange}
        description="Upload your business registration document"
      />
    );

    expect(screen.getByText('Business Registration')).toBeInTheDocument();
    expect(screen.getByText('Upload your business registration document')).toBeInTheDocument();
  });

  it('handles file selection and upload', async () => {
    const mockResult = {
      success: true,
      url: 'https://example.com/uploaded-doc.pdf',
    };

    (uploadImageToCloudinary as ReturnType<typeof vitest.fn>).mockResolvedValue(mockResult);

    render(
      <DocumentUpload
        label="Business Registration"
        documentType="business_registration"
        value=""
        onChange={mockOnChange}
      />
    );

    const fileInput = screen.getByLabelText('Business Registration');
    const file = new File(['dummy content'], 'registration.pdf', { type: 'application/pdf' });

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(uploadImageToCloudinary).toHaveBeenCalledWith(
        file,
        'naijafind/verification/business_registration'
      );
      expect(mockOnChange).toHaveBeenCalledWith(mockResult.url, 'registration.pdf');
    });
  });

  it('shows error for files larger than 10MB', async () => {
    const largeFile = new File([new ArrayBuffer(11 * 1024 * 1024)], 'large-file.pdf', { type: 'application/pdf' });

    render(
      <DocumentUpload
        label="Business Registration"
        documentType="business_registration"
        value=""
        onChange={mockOnChange}
      />
    );

    const fileInput = screen.getByLabelText('Business Registration');
    fireEvent.change(fileInput, { target: { files: [largeFile] } });

    expect(screen.getByText('Le fichier est trop volumineux (max 10MB)')).toBeInTheDocument();
    expect(mockOnChange).not.toHaveBeenCalled();
  });

  it('displays current file when value is provided', () => {
    render(
      <DocumentUpload
        label="Business Registration"
        documentType="business_registration"
        value="https://example.com/existing-doc.pdf"
        onChange={mockOnChange}
        description="Current: existing-document.pdf"
      />
    );

    expect(screen.getByText('Current: existing-document.pdf')).toBeInTheDocument();
  });

  it('shows loading state during upload', async () => {
    const mockPromise = new Promise(() => {}); // Never resolves to keep loading state
    (uploadImageToCloudinary as ReturnType<typeof vitest.fn>).mockReturnValue(mockPromise as Promise<any>);

    render(
      <DocumentUpload
        label="Business Registration"
        documentType="business_registration"
        value=""
        onChange={mockOnChange}
      />
    );

    const fileInput = screen.getByLabelText('Business Registration');
    const file = new File(['dummy content'], 'registration.pdf', { type: 'application/pdf' });

    fireEvent.change(fileInput, { target: { files: [file] } });

    expect(screen.getByText(/Téléchargement.../i)).toBeInTheDocument();
  });
});