import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi as vitest } from 'vitest';
import DocumentUpload from '../DocumentUpload';

// Mock the cloudinary functions
vi.mock('../../../lib/cloudinary', () => ({
  uploadDocumentToCloudinary: vitest.fn(),
  validateDocumentFile: vitest.fn(),
}));

import { uploadDocumentToCloudinary, validateDocumentFile } from '../../../lib/cloudinary';

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

    (uploadDocumentToCloudinary as ReturnType<typeof vitest.fn>).mockResolvedValue(mockResult);

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
      expect(uploadDocumentToCloudinary).toHaveBeenCalledWith(
        file,
        'Olufinja/verification/business_registration'
      );
      expect(mockOnChange).toHaveBeenCalledWith(mockResult.url, 'registration.pdf');
    });
  });

  it('shows error for files larger than 20MB', async () => {
    // Mock the validation to return an error for large files
    (validateDocumentFile as ReturnType<typeof vitest.fn>).mockReturnValue('Document size must be less than 20MB');
    
    const largeFile = new File([new ArrayBuffer(21 * 1024 * 1024)], 'large-file.pdf', { type: 'application/pdf' });

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

    expect(screen.getByText('Document size must be less than 20MB')).toBeInTheDocument();
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
    (uploadDocumentToCloudinary as ReturnType<typeof vitest.fn>).mockReturnValue(mockPromise as Promise<any>);

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