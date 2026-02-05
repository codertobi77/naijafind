# NaijaFind Implementation Guide

This document provides a comprehensive guide for implementing the recommended features prioritized by urgency and importance.

## ✅ COMPLETED IMPLEMENTATIONS

### 1. Cloudinary Image Upload System
**Status:** ✅ **IMPLEMENTED** 

**What's Available:**
- ✅ Single image upload component: `src/components/base/ImageUpload.tsx`
- ✅ Multiple image gallery upload: `src/components/base/ImageGalleryUpload.tsx`
- ✅ Document upload component: `src/components/base/DocumentUpload.tsx` (NEW)
- ✅ Cloudinary utility functions with optimization: `src/lib/cloudinary.ts`
- ✅ Fallback to base64 encoding when Cloudinary is not configured
- ✅ Image validation (size, type) before upload
- ✅ Automatic image optimization (quality: auto:good, format: auto)
- ✅ Thumbnail generation
- ✅ Drag-and-drop support
- ✅ Progress indicators

**Configuration Required:**
```env
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name_here
VITE_CLOUDINARY_UPLOAD_PRESET=your_unsigned_upload_preset_here
```

**Usage Example:**
```tsx
import ImageUpload from '../../components/base/ImageUpload';
import ImageGalleryUpload from '../../components/base/ImageGalleryUpload';
import DocumentUpload from '../../components/base/DocumentUpload';

// Single image
<ImageUpload 
  label="Profile Image"
  value={imageUrl}
  onChange={(url) => setImageUrl(url)}
/>

// Multiple images
<ImageGalleryUpload
  label="Gallery Images"
  value={imageUrls}
  onChange={(urls) => setImageUrls(urls)}
  maxImages={10}
/>

// Document upload for verification
<DocumentUpload
  label="Business Registration"
  documentType="business_registration"
  value={docUrl}
  onChange={(url, fileName) => setDocument({ url, fileName })}
  description="Upload your business registration certificate"
/>
```

---

### 2. Convex Integration
**Status:** ✅ **IMPLEMENTED**

**What's Available:**
- ✅ Complete database schema: `convex/schema.ts`
- ✅ User management: `convex/users.ts`
- ✅ Supplier management: `convex/suppliers.ts`
- ✅ Product CRUD: `convex/products.ts`
- ✅ Order management: `convex/orders.ts`
- ✅ Reviews system: `convex/reviews.ts`
- ✅ Categories: `convex/categories.ts`
- ✅ Dashboard analytics: `convex/dashboard.ts`
- ✅ Admin functions: `convex/admin.ts`
- ✅ Verification system: `convex/verification.ts`
- ✅ Real-time subscriptions
- ✅ React Query integration for caching

**Database Tables:**
- ✅ users
- ✅ suppliers (with approval workflow)
- ✅ products
- ✅ orders
- ✅ reviews
- ✅ categories
- ✅ contacts
- ✅ messages
- ✅ verification_tokens
- ✅ password_reset_tokens
- ✅ verification_documents

---

## 🚧 IN PROGRESS

### 3. Resend Email Service
**Status:** 🚧 **PARTIALLY IMPLEMENTED**

**What's Done:**
- ✅ Email mutation endpoints created: `convex/emails.ts`
- ✅ Email action file created: `convex/sendEmail.ts`
- ✅ Email templates for:
  - Contact form submissions
  - Supplier contact messages
  - Email verification
  - Password reset
  - Supplier approval/rejection
  - Welcome emails
- ✅ Proper email HTML formatting

**What Needs to be Done:**

1. **Fix TypeScript Types** - The `internal.sendEmail.sendEmailAction` needs proper typing
2. **Configure Environment Variables** in Convex Dashboard:
   ```
   RESEND_API_KEY=re_your_api_key_here
   FROM_EMAIL=noreply@naijafind.com
   ```

3. **Update `convex/sendEmail.ts`** to properly access environment variables:
   ```typescript
   // Instead of (ctx as any).RESEND_API_KEY
   // Use Convex environment variable access pattern
   ```

4. **Test Email Sending:**
   ```bash
   # Test contact form
   # Test verification emails
   # Test password reset
   # Test supplier approval
   ```

**Configuration Required:**
1. Sign up at [resend.com](https://resend.com)
2. Get API key from dashboard
3. Verify your domain (or use resend.dev for testing)
4. Add environment variables to Convex dashboard

---

## 📋 URGENT IMPLEMENTATIONS NEEDED

### 4. Google Maps API Integration
**Priority:** ⚠️ **URGENT**

**Current State:**
- Static Google Maps iframes used in some components
- No real geolocation services
- No distance calculations
- No interactive maps

**Implementation Plan:**

1. **Install Google Maps Libraries:**
   ```bash
   npm install @googlemaps/js-api-loader @types/google.maps
   ```

2. **Create Google Maps Utility** (`src/lib/googleMaps.ts`):
   ```typescript
   import { Loader } from '@googlemaps/js-api-loader';

   const loader = new Loader({
     apiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
     version: "weekly",
     libraries: ["places", "geometry"]
   });

   export async function calculateDistance(
     origin: { lat: number; lng: number },
     destination: { lat: number; lng: number }
   ): Promise<number> {
     await loader.load();
     const distance = google.maps.geometry.spherical.computeDistanceBetween(
       new google.maps.LatLng(origin.lat, origin.lng),
       new google.maps.LatLng(destination.lat, destination.lng)
     );
     return distance / 1000; // Convert to km
   }

   export async function geocodeAddress(address: string) {
     await loader.load();
     const geocoder = new google.maps.Geocoder();
     const result = await geocoder.geocode({ address });
     return result.results[0]?.geometry.location;
   }
   ```

3. **Create Interactive Map Component** (`src/components/base/GoogleMap.tsx`)

4. **Update Supplier Schema** to include coordinates:
   ```typescript
   latitude: v.optional(v.float64()),
   longitude: v.optional(v.float64()),
   ```

5. **Update Search Functionality** to use real distance calculations

**Environment Variable:**
```env
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
```

---

### 5. Functional Messaging/Contact System
**Priority:** ⚠️ **URGENT**

**Current State:**
- ✅ Contact form UI exists
- ✅ Database schema for messages
- ✅ Convex mutations for storing messages
- ⚠️ Email notifications need to be connected

**What Needs to be Done:**

1. **Complete Email Integration** (depends on Task #3)

2. **Add Form Validation:**
   ```typescript
   import { z } from 'zod';

   const contactSchema = z.object({
     name: z.string().min(2, "Name too short"),
     email: z.string().email("Invalid email"),
     phone: z.string().optional(),
     subject: z.string().min(5, "Subject too short"),
     message: z.string().min(20, "Message too short").max(500),
   });
   ```

3. **Add Spam Protection:**
   - Implement rate limiting in Convex
   - Add honeypot fields
   - Consider reCAPTCHA integration

4. **Create Message Dashboard** for suppliers to view/respond to messages

5. **Add Real-time Notifications** using Convex subscriptions

---

## 📊 IMPORTANT IMPLEMENTATIONS

### 6. Supplier Verification System
**Priority:** ⭐ **IMPORTANT**

**Current State:**
- ✅ Database schema for verification documents
- ✅ Convex functions for document upload/review
- ✅ Document upload component created
- ✅ Admin approval workflow exists
- ⚠️ UI for document upload needs integration

**Implementation Steps:**

1. **Create Verification Page** (`src/pages/dashboard/verification/page.tsx`):
   ```tsx
   import DocumentUpload from '../../../components/base/DocumentUpload';
   import { useMutation } from 'convex/react';
   import { api } from '../../../../convex/_generated/api';

   export default function VerificationPage() {
     const uploadDocument = useMutation(api.verification.uploadVerificationDocument);
     
     const [documents, setDocuments] = useState({
       business_registration: { url: '', name: '' },
       tax_certificate: { url: '', name: '' },
       id_card: { url: '', name: '' },
       proof_of_address: { url: '', name: '' },
     });

     const handleUpload = async (docType: string, url: string, name: string) => {
       await uploadDocument({
         supplierId: supplierIdHere,
         documentType: docType,
         documentUrl: url,
         documentName: name,
       });
     };

     return (
       <div>
         <h2>Business Verification</h2>
         <DocumentUpload
           label="Business Registration Certificate"
           documentType="business_registration"
           value={documents.business_registration.url}
           onChange={(url, name) => handleUpload('business_registration', url, name)}
           description="Upload your CAC certificate or business registration document"
         />
         {/* Repeat for other documents */}
       </div>
     );
   }
   ```

2. **Add Verification Status Badge** to supplier profiles

3. **Create Admin Review Interface** for document approval

4. **Send Email Notifications** when:
   - Documents uploaded
   - Documents approved/rejected
   - Verification complete

---

### 7. Testing Suite
**Priority:** ⭐ **IMPORTANT**

**Current State:**
- ❌ No tests implemented

**Implementation Plan:**

1. **Install Testing Libraries:**
   ```bash
   npm install --save-dev vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event
   ```

2. **Create Test Setup** (`src/test/setup.ts`)

3. **Unit Tests for:**
   - Utility functions (currency, validation, etc.)
   - Custom hooks
   - Form validation logic

4. **Integration Tests for:**
   - Authentication flow
   - Supplier registration
   - Product creation
   - Search functionality

5. **E2E Tests:**
   - User journey tests
   - Supplier onboarding flow

**Example Test Structure:**
```typescript
// src/lib/__tests__/currency.test.ts
import { describe, it, expect } from 'vitest';
import { formatCurrency } from '../currency';

describe('formatCurrency', () => {
  it('should format Nigerian Naira correctly', () => {
    expect(formatCurrency(1234.56, 'en')).toBe('₦1,234.56');
  });
});
```

---

## 🎨 NICE TO HAVE FEATURES

### 8. Advanced Analytics Dashboard
**Priority:** 💎 **NICE TO HAVE**

**Current State:**
- ✅ Basic analytics in dashboard
- ✅ Charts using Recharts
- ✅ Monthly aggregates
- ⚠️ Limited metrics

**Enhancement Ideas:**

1. **User Behavior Tracking:**
   - Page views
   - Time on site
   - Bounce rate
   - Conversion funnel

2. **Supplier Performance Metrics:**
   - Response time
   - Customer satisfaction
   - Order completion rate
   - Revenue trends

3. **Business Insights:**
   - Popular categories
   - Peak activity times
   - Geographic distribution
   - Seasonal trends

4. **Export Capabilities:**
   - PDF reports
   - Excel exports
   - Automated email reports

---

### 9. Multi-Currency Support
**Priority:** 💎 **NICE TO HAVE**

**Current State:**
- ✅ Basic currency formatting exists
- ✅ NGN (Nigerian Naira) is default
- ⚠️ No exchange rate integration
- ⚠️ No currency selection

**Implementation Plan:**

1. **Add Currency Selection:**
   ```typescript
   // src/lib/currency.ts
   const SUPPORTED_CURRENCIES = ['NGN', 'USD', 'GBP', 'EUR'];
   
   export async function getExchangeRate(from: string, to: string): Promise<number> {
     const response = await fetch(
       `https://api.exchangerate-api.com/v4/latest/${from}`
     );
     const data = await response.json();
     return data.rates[to];
   }
   ```

2. **Update Database Schema:**
   ```typescript
   // Add currency field to products and orders
   currency: v.string(), // 'NGN', 'USD', etc.
   ```

3. **Create Currency Converter Component**

4. **Add User Preference** for currency selection

5. **Update All Price Displays** to support multiple currencies

---

## 📝 CONFIGURATION CHECKLIST

### Environment Variables Required:

**Frontend (.env.local):**
```env
# Cloudinary
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
VITE_CLOUDINARY_UPLOAD_PRESET=your_preset

# Google Maps
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_key

# Convex
VITE_CONVEX_URL=your_convex_url

# Clerk (if using)
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_key
```

**Convex Environment Variables:**
```
RESEND_API_KEY=re_your_resend_key
FROM_EMAIL=noreply@naijafind.com
```

### API Keys to Obtain:

1. ✅ **Cloudinary** - https://cloudinary.com/console
   - Create unsigned upload preset
   - Enable auto-optimization

2. ⚠️ **Resend** - https://resend.com/api-keys
   - Get API key
   - Verify domain

3. ⚠️ **Google Maps** - https://console.cloud.google.com/
   - Enable Maps JavaScript API
   - Enable Places API
   - Enable Geocoding API
   - Enable Distance Matrix API

4. ✅ **Convex** - Automatically configured

---

## 🚀 DEPLOYMENT CHECKLIST

### Before Deployment:

- [ ] All environment variables configured
- [ ] Cloudinary configured and tested
- [ ] Resend emails working
- [ ] Google Maps API integrated
- [ ] Database migrations run
- [ ] Admin user created
- [ ] Categories initialized
- [ ] Test supplier account created
- [ ] Email templates reviewed
- [ ] Error handling tested
- [ ] Performance optimized
- [ ] Security audit completed

### Post-Deployment:

- [ ] Monitor error logs
- [ ] Check email delivery
- [ ] Verify image uploads
- [ ] Test search functionality
- [ ] Monitor API usage
- [ ] Check analytics data
- [ ] Review user feedback

---

## 📚 ADDITIONAL RESOURCES

### Documentation Links:
- [Convex Documentation](https://docs.convex.dev/)
- [Cloudinary React SDK](https://cloudinary.com/documentation/react_integration)
- [Resend Documentation](https://resend.com/docs)
- [Google Maps JavaScript API](https://developers.google.com/maps/documentation/javascript)
- [React Query](https://tanstack.com/query/latest)

### Code Examples:
- Cloudinary upload: `src/lib/cloudinary.ts`
- Email sending: `convex/emails.ts`
- Search functionality: `convex/suppliers.ts`
- Dashboard analytics: `convex/dashboard.ts`

---

## 🐛 KNOWN ISSUES

1. **TypeScript Errors in Email Actions:**
   - The `internal.sendEmail.sendEmailAction` type needs to be fixed
   - Workaround: Use type assertion for now
   - Proper fix: Update Convex types and regenerate

2. **Google Maps Static Embeds:**
   - Currently using static iframes
   - Need to replace with interactive maps
   - Requires Google Maps API key

3. **Distance Calculations:**
   - Currently using approximate calculations
   - Need real geolocation service
   - Implement haversine formula as fallback

---

## 💡 NEXT STEPS

1. **Fix email TypeScript issues** in `convex/emails.ts`
2. **Configure Resend API** and test email sending
3. **Integrate Google Maps API** for real geolocation
4. **Create verification UI** for suppliers
5. **Write initial test suite** for critical paths
6. **Enhance analytics dashboard** with more metrics
7. **Implement multi-currency** if needed

---

## 📞 SUPPORT

For questions or issues:
1. Check this implementation guide
2. Review code comments in source files
3. Check Convex dashboard for logs
4. Review browser console for errors
5. Check email delivery logs in Resend dashboard

---

**Last Updated:** January 15, 2026
**Version:** 1.0.0
**Status:** Ready for Production (with pending tasks completed)
