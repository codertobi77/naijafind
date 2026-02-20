import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useState } from 'react';
import DocumentUpload from './DocumentUpload';
import type { Id } from '../../../convex/_generated/dataModel';

interface VerificationStatusProps {
  supplierId: Id<'suppliers'>;
}

type DocumentType = 'business_registration' | 'tax_certificate' | 'id_card' | 'proof_of_address';

const DOCUMENT_TYPES: Array<{
  type: DocumentType;
  label: string;
  description: string;
  required: boolean;
}> = [
  {
    type: 'business_registration',
    label: 'Business Registration',
    description: 'Certificate of business registration or incorporation',
    required: true,
  },
  {
    type: 'tax_certificate',
    label: 'Tax Certificate',
    description: 'Valid tax identification number (TIN) certificate',
    required: true,
  },
  {
    type: 'id_card',
    label: 'Valid ID Card',
    description: "Owner's valid government-issued ID (Passport, National ID, or Driver's License)",
    required: true,
  },
  {
    type: 'proof_of_address',
    label: 'Proof of Address',
    description: 'Utility bill or bank statement (not older than 3 months)',
    required: false,
  },
];

export default function VerificationStatus({ supplierId }: VerificationStatusProps) {
  const verificationStatus = useQuery(api.verification.getVerificationStatus, { supplierId });
  const verificationDocuments = useQuery(api.verification.getVerificationDocuments, { supplierId });
  const uploadDocument = useMutation(api.verification.uploadVerificationDocument);
  
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);

  const handleDocumentUpload = async (documentType: DocumentType, url: string, fileName: string) => {
    setUploading(prev => ({ ...prev, [documentType]: true }));
    setError(null);
    
    try {
      await uploadDocument({
        supplierId,
        documentType,
        documentUrl: url,
        documentName: fileName,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload document');
    } finally {
      setUploading(prev => ({ ...prev, [documentType]: false }));
    }
  };

  if (!verificationStatus) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-1/3"></div>
        <div className="h-24 bg-gray-200 rounded"></div>
        <div className="h-24 bg-gray-200 rounded"></div>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <i className="ri-checkbox-circle-fill mr-1"></i>
            Approved
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <i className="ri-time-line mr-1"></i>
            Under Review
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <i className="ri-close-circle-fill mr-1"></i>
            Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            <i className="ri-upload-line mr-1"></i>
            Not Uploaded
          </span>
        );
    }
  };

  const overallProgress = verificationStatus.documents.filter(d => d.status === 'approved').length;
  const totalRequired = verificationStatus.documents.filter(d => d.type !== 'proof_of_address').length;
  const progressPercentage = (overallProgress / totalRequired) * 100;

  return (
    <div className="space-y-6">
      {/* Overall Status Banner */}
      <div className={`rounded-xl p-6 ${
        verificationStatus.allApproved 
          ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200' 
          : 'bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200'
      }`}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center mb-2">
              {verificationStatus.allApproved ? (
                <i className="ri-verified-badge-fill text-3xl text-green-600 mr-3"></i>
              ) : (
                <i className="ri-shield-check-line text-3xl text-blue-600 mr-3"></i>
              )}
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {verificationStatus.allApproved ? 'Verified Supplier' : 'Verification in Progress'}
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {verificationStatus.allApproved 
                    ? 'Your business has been verified by Olufinja' 
                    : 'Complete the verification process to gain customer trust'}
                </p>
              </div>
            </div>
            
            {!verificationStatus.allApproved && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">
                    Progress: {overallProgress} of {totalRequired} required documents approved
                  </span>
                  <span className="text-sm font-medium text-blue-600">
                    {Math.round(progressPercentage)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${progressPercentage}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>
        </div>

        {verificationStatus.allApproved && (
          <div className="mt-4 flex items-center text-sm text-green-700">
            <i className="ri-information-line mr-2"></i>
            <span>Verified suppliers get priority placement in search results and customer trust badges</span>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
          <i className="ri-error-warning-line text-red-500 text-xl mr-3 flex-shrink-0 mt-0.5"></i>
          <div>
            <p className="text-sm font-medium text-red-800">Upload Error</p>
            <p className="text-sm text-red-600 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Document Upload Cards */}
      <div className="grid gap-4">
        {DOCUMENT_TYPES.map((docType) => {
          const docStatus = verificationStatus.documents.find(d => d.type === docType.type);
          const existingDoc = verificationDocuments?.find(d => d.documentType === docType.type);
          
          return (
            <div 
              key={docType.type} 
              className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{docType.label}</h3>
                    {docType.required && (
                      <span className="ml-2 text-xs font-medium text-red-500">*Required</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">{docType.description}</p>
                </div>
                <div className="ml-4">
                  {getStatusBadge(docStatus?.status || 'not_uploaded')}
                </div>
              </div>

              {/* Rejection Reason */}
              {docStatus?.status === 'rejected' && docStatus.rejectionReason && (
                <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm font-medium text-red-800 mb-1">Rejection Reason:</p>
                  <p className="text-sm text-red-600">{docStatus.rejectionReason}</p>
                </div>
              )}

              {/* Document Upload */}
              {docStatus?.status !== 'approved' && (
                <div className="mt-4">
                  <DocumentUpload
                    label=""
                    documentType={docType.type}
                    value={existingDoc?.documentUrl || ''}
                    onChange={(url, fileName) => handleDocumentUpload(docType.type, url, fileName)}
                    accept="image/*,application/pdf,.doc,.docx"
                    description={existingDoc ? `Current: ${existingDoc.documentName}` : undefined}
                  />
                  {uploading[docType.type] && (
                    <div className="mt-2 flex items-center text-sm text-blue-600">
                      <i className="ri-loader-4-line animate-spin mr-2"></i>
                      Uploading...
                    </div>
                  )}
                </div>
              )}

              {/* Approved Document Info */}
              {docStatus?.status === 'approved' && existingDoc && (
                <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <i className="ri-file-text-line text-green-600 mr-2"></i>
                      <span className="text-sm text-green-800">{existingDoc.documentName}</span>
                    </div>
                    <a 
                      href={existingDoc.documentUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-green-600 hover:text-green-700 font-medium"
                    >
                      View
                    </a>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Information Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <div className="flex items-start">
          <i className="ri-information-line text-blue-600 text-2xl mr-3 flex-shrink-0"></i>
          <div>
            <h4 className="font-semibold text-blue-900 mb-2">Verification Process</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li className="flex items-start">
                <i className="ri-checkbox-circle-line mr-2 mt-0.5"></i>
                <span>Upload all required documents in PDF, JPG, or PNG format (max 10MB each)</span>
              </li>
              <li className="flex items-start">
                <i className="ri-checkbox-circle-line mr-2 mt-0.5"></i>
                <span>Documents will be reviewed by our team within 1-2 business days</span>
              </li>
              <li className="flex items-start">
                <i className="ri-checkbox-circle-line mr-2 mt-0.5"></i>
                <span>You'll receive an email notification once your verification is complete</span>
              </li>
              <li className="flex items-start">
                <i className="ri-checkbox-circle-line mr-2 mt-0.5"></i>
                <span>Verified suppliers receive a trust badge and priority placement</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
