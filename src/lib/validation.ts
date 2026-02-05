import { z } from 'zod';

// Contact form validation schema
export const contactFormSchema = z.object({
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters'),
  email: z.string()
    .email('Invalid email address'),
  subject: z.string()
    .min(5, 'Subject must be at least 5 characters')
    .max(200, 'Subject must be less than 200 characters'),
  message: z.string()
    .min(20, 'Message must be at least 20 characters')
    .max(500, 'Message must be less than 500 characters'),
  type: z.enum(['general', 'supplier', 'technical', 'partnership', 'feedback']),
  // Honeypot field for spam protection
  website: z.string().optional(),
});

export type ContactFormData = z.infer<typeof contactFormSchema>;

// Supplier contact form validation
export const supplierContactSchema = z.object({
  senderName: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters'),
  senderEmail: z.string()
    .email('Invalid email address'),
  senderPhone: z.string()
    .optional()
    .refine(
      (val) => !val || /^[\d\s\-\+\(\)]+$/.test(val),
      'Invalid phone number format'
    ),
  subject: z.string()
    .min(5, 'Subject must be at least 5 characters')
    .max(200, 'Subject must be less than 200 characters'),
  message: z.string()
    .min(20, 'Message must be at least 20 characters')
    .max(500, 'Message must be less than 500 characters'),
  // Honeypot field
  website: z.string().optional(),
});

export type SupplierContactFormData = z.infer<typeof supplierContactSchema>;

// Verification document validation
export const verificationDocumentSchema = z.object({
  documentType: z.enum(['business_registration', 'tax_certificate', 'id_card', 'proof_of_address']),
  documentUrl: z.string().url('Invalid document URL'),
  documentName: z.string().min(1, 'Document name is required'),
});

export type VerificationDocumentData = z.infer<typeof verificationDocumentSchema>;

// Review validation
export const reviewSchema = z.object({
  rating: z.number()
    .min(1, 'Rating must be at least 1')
    .max(5, 'Rating must be at most 5'),
  comment: z.string()
    .min(10, 'Comment must be at least 10 characters')
    .max(500, 'Comment must be less than 500 characters')
    .optional(),
});

export type ReviewData = z.infer<typeof reviewSchema>;

// Helper function to validate and get errors
export function validateForm<T>(schema: z.ZodSchema<T>, data: unknown): {
  success: boolean;
  data?: T;
  errors?: Record<string, string>;
} {
  try {
    const validated = schema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string> = {};
      error.issues.forEach((err: z.ZodIssue) => {
        if (err.path.length > 0) {
          errors[err.path[0].toString()] = err.message;
        }
      });
      return { success: false, errors };
    }
    return { success: false, errors: { _form: 'Validation failed' } };
  }
}
