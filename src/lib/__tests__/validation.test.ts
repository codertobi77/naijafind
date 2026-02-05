import { describe, it, expect } from 'vitest';
import { 
  contactFormSchema, 
  supplierContactSchema, 
  verificationDocumentSchema, 
  reviewSchema,
  validateForm 
} from '../validation';

describe('Validation Utilities', () => {
  describe('contactFormSchema', () => {
    it('should validate valid contact form data', () => {
      const validData = {
        name: 'John Doe',
        email: 'john@example.com',
        subject: 'Test Subject',
        message: 'This is a test message.',
        type: 'general' as const,
      };

      expect(() => contactFormSchema.parse(validData)).not.toThrow();
    });

    it('should reject invalid email', () => {
      const invalidData = {
        name: 'John Doe',
        email: 'invalid-email',
        subject: 'Test Subject',
        message: 'This is a test message.',
        type: 'general' as const,
      };

      expect(() => contactFormSchema.parse(invalidData)).toThrow();
    });

    it('should reject short name', () => {
      const invalidData = {
        name: 'A',
        email: 'john@example.com',
        subject: 'Test Subject',
        message: 'This is a test message.',
        type: 'general' as const,
      };

      expect(() => contactFormSchema.parse(invalidData)).toThrow();
    });

    it('should reject short message', () => {
      const invalidData = {
        name: 'John Doe',
        email: 'john@example.com',
        subject: 'Test Subject',
        message: 'Hi',
        type: 'general' as const,
      };

      expect(() => contactFormSchema.parse(invalidData)).toThrow();
    });

    it('should reject honeypot field if present', () => {
      const invalidData = {
        name: 'John Doe',
        email: 'john@example.com',
        subject: 'Test Subject',
        message: 'This is a test message.',
        type: 'general' as const,
        website: 'some-value', // Honeypot field should be empty
      };

      expect(() => contactFormSchema.parse(invalidData)).toThrow();
    });
  });

  describe('validateForm helper', () => {
    it('should return success for valid data', () => {
      const validData = {
        name: 'John Doe',
        email: 'john@example.com',
        subject: 'Test Subject',
        message: 'This is a test message.',
        type: 'general' as const,
      };

      const result = validateForm(contactFormSchema, validData);
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual(validData);
      expect(result.errors).toBeUndefined();
    });

    it('should return errors for invalid data', () => {
      const invalidData = {
        name: 'A', // Too short
        email: 'invalid-email',
        subject: 'Te', // Too short
        message: 'Hi', // Too short
        type: 'general' as const,
      };

      const result = validateForm(contactFormSchema, invalidData);
      
      expect(result.success).toBe(false);
      expect(result.data).toBeUndefined();
      expect(result.errors).toBeDefined();
      expect(result.errors).toHaveProperty('name');
      expect(result.errors).toHaveProperty('email');
      expect(result.errors).toHaveProperty('subject');
      expect(result.errors).toHaveProperty('message');
    });
  });

  describe('supplierContactSchema', () => {
    it('should validate valid supplier contact data', () => {
      const validData = {
        senderName: 'John Doe',
        senderEmail: 'john@example.com',
        senderPhone: '+2341234567890',
        subject: 'Test Subject',
        message: 'This is a test message for supplier.',
        supplierId: 'supplier123',
      };

      expect(() => supplierContactSchema.parse(validData)).not.toThrow();
    });

    it('should reject invalid phone format', () => {
      const invalidData = {
        senderName: 'John Doe',
        senderEmail: 'john@example.com',
        senderPhone: 'short', // Invalid phone
        subject: 'Test Subject',
        message: 'This is a test message for supplier.',
        supplierId: 'supplier123',
      };

      expect(() => supplierContactSchema.parse(invalidData)).toThrow();
    });
  });

  describe('verificationDocumentSchema', () => {
    it('should validate valid document data', () => {
      const validData = {
        documentType: 'business_registration',
        documentName: 'Registration Certificate.pdf',
        documentUrl: 'https://example.com/docs/cert.pdf',
      };

      expect(() => verificationDocumentSchema.parse(validData)).not.toThrow();
    });

    it('should reject invalid document type', () => {
      const invalidData = {
        documentType: 'invalid_type',
        documentName: 'Registration Certificate.pdf',
        documentUrl: 'https://example.com/docs/cert.pdf',
      };

      expect(() => verificationDocumentSchema.parse(invalidData)).toThrow();
    });
  });

  describe('reviewSchema', () => {
    it('should validate valid review data', () => {
      const validData = {
        rating: 4,
        comment: 'This is a great service!',
        supplierId: 'supplier123',
      };

      expect(() => reviewSchema.parse(validData)).not.toThrow();
    });

    it('should reject invalid rating', () => {
      const invalidData = {
        rating: 10, // Rating should be 1-5
        comment: 'This is a great service!',
        supplierId: 'supplier123',
      };

      expect(() => reviewSchema.parse(invalidData)).toThrow();
    });
  });
});