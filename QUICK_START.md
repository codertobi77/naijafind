# Suji Quick Start Guide

## 🚀 Get Started in 5 Minutes

This quick start guide helps you get Suji up and running with all essential features.

---

## ✅ What's Already Working

Your Suji application already has these features **fully functional**:

### 1. ✅ **Cloudinary Image Upload**
- Single image upload
- Multiple image gallery
- Document upload for verification
- Automatic optimization
- Drag-and-drop support

**No configuration needed** - works with fallback if Cloudinary not configured!

### 2. ✅ **Convex Database**
- All tables created and indexed
- Real-time subscriptions
- User management
- Supplier profiles
- Products, orders, reviews
- Admin dashboard

**Already configured** - just run `npx convex dev`

### 3. ✅ **Authentication**
- Clerk integration
- User roles (user/supplier/admin)
- Protected routes
- Session management

**Already configured** - sign up/login working!

### 4. ✅ **Search & Discovery**
- Supplier search by category, location, rating
- Pagination
- Filtering
- Sorting options

**Fully functional** - try searching now!

### 5. ✅ **Dashboard**
- Supplier dashboard with analytics
- Product management
- Order tracking
- Review management
- Profile editing

**Ready to use** - create a supplier account and access!

---

## ⚡ Quick Configuration (5 mins)

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Start Development Server
```bash
# Terminal 1: Start Convex
npx convex dev

# Terminal 2: Start Vite
npm run dev
```

### Step 3: Access Application
Open `http://localhost:5173` in your browser!

---

## 🔧 Optional Enhancements

Want to enable **premium features**? Configure these services:

### 📧 Email Notifications (Recommended)

**What you get:** Welcome emails, password reset, supplier approval notifications

1. **Sign up at [Resend.com](https://resend.com)** (Free tier: 100 emails/day)
2. **Get your API key** from dashboard
3. **Add to Convex** environment variables:
   ```
   RESEND_API_KEY=re_xxxxx
   FROM_EMAIL=noreply@yourdomain.com
   ```
4. **Test** by using the contact form!

**Time:** 5 minutes

---

### 🗺️ Google Maps Integration (Recommended)

**What you get:** Real distance calculations, interactive maps, location autocomplete

1. **Get API Key** from [Google Cloud Console](https://console.cloud.google.com/)
2. **Enable APIs:**
   - Maps JavaScript API
   - Places API
   - Geocoding API
3. **Add to `.env.local`:**
   ```env
   VITE_GOOGLE_MAPS_API_KEY=AIzaSy_xxxxx
   ```
4. **Restart dev server**

**Time:** 10 minutes

---

### 🖼️ Cloudinary Enhancement (Optional)

**What you get:** Faster uploads, advanced transformations, CDN delivery

1. **Sign up at [Cloudinary.com](https://cloudinary.com)** (Free tier: 25 GB)
2. **Create unsigned upload preset** in dashboard
3. **Add to `.env.local`:**
   ```env
   VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
   VITE_CLOUDINARY_UPLOAD_PRESET=your_preset
   ```

**Note:** Image upload already works without this (uses fallback)

**Time:** 5 minutes

---

## 🎯 First-Time Setup Tasks

### 1. Create Admin Account
```bash
npm run create-admin
```
Follow prompts to create your first admin user.

### 2. Initialize Categories
```bash
npm run init-categories
```
This creates default business categories.

### 3. Create Test Supplier
1. Register as new user
2. Choose "Supplier" role
3. Complete supplier setup form
4. Wait for admin approval (or approve yourself in admin panel)

---

## 📊 Dashboard Access

### User Dashboard
- URL: `/dashboard`
- Requirements: Logged in as supplier
- Features: Analytics, products, orders, reviews

### Admin Dashboard
- URL: `/admin`
- Requirements: Admin account
- Features: Manage suppliers, categories, users, stats

---

## 🧪 Test the Application

### Test User Registration
1. Go to `/auth/register`
2. Fill out form
3. Choose user type
4. Complete profile

### Test Search
1. Go to `/search`
2. Try different filters
3. View supplier details
4. Contact suppliers

### Test Image Upload
1. Create supplier account
2. Go to dashboard
3. Edit profile
4. Upload profile image and gallery images

### Test Contact Form
1. Visit `/contact`
2. Fill form and submit
3. Check database in Convex dashboard

---

## 📁 Project Structure

```
suji/
├── convex/              # Backend (Database + API)
│   ├── schema.ts        # Database schema
│   ├── users.ts         # User management
│   ├── suppliers.ts     # Supplier operations
│   ├── products.ts      # Product CRUD
│   ├── orders.ts        # Order management
│   ├── reviews.ts       # Review system
│   ├── emails.ts        # Email functions
│   └── admin.ts         # Admin operations
│
├── src/
│   ├── components/      # Reusable components
│   │   └── base/       # Base components
│   │       ├── ImageUpload.tsx
│   │       ├── ImageGalleryUpload.tsx
│   │       └── DocumentUpload.tsx
│   │
│   ├── pages/          # Page components
│   │   ├── home/       # Landing page
│   │   ├── search/     # Search page
│   │   ├── dashboard/  # Supplier dashboard
│   │   ├── admin/      # Admin panel
│   │   └── auth/       # Authentication
│   │
│   ├── lib/            # Utilities
│   │   ├── cloudinary.ts   # Image upload
│   │   ├── currency.ts     # Currency formatting
│   │   └── queryClient.ts  # React Query
│   │
│   └── i18n/           # Internationalization
│       └── local/      # Translations
│
└── scripts/            # Setup scripts
    ├── create-admin.js
    └── init-categories.js
```

---

## 🔍 Troubleshooting

### Issue: "Module not found"
**Solution:** Run `npm install`

### Issue: "Convex not connected"
**Solution:** Make sure `npx convex dev` is running

### Issue: "Images not uploading"
**Solution:** Check Cloudinary config or use fallback (works without config)

### Issue: "Can't access dashboard"
**Solution:** Make sure you're logged in as a supplier

### Issue: "Admin panel empty"
**Solution:** Run `npm run create-admin` first

---

## 📖 Learn More

- **Full Implementation Guide:** See `IMPLEMENTATION_GUIDE.md`
- **Environment Variables:** See `.env.example`
- **API Documentation:** Check Convex dashboard
- **Component Docs:** See inline comments in code

---

## 🎉 You're All Set!

Your Suji application is now running with:
- ✅ User authentication
- ✅ Supplier profiles
- ✅ Search & discovery
- ✅ Image uploads
- ✅ Dashboard analytics
- ✅ Admin panel

**Next steps:**
1. Configure email (5 mins) for notifications
2. Add Google Maps (10 mins) for better location features
3. Customize branding and content
4. Add your own suppliers
5. Go live! 🚀

---

**Need Help?**
- Check `IMPLEMENTATION_GUIDE.md` for detailed instructions
- Review code comments in source files
- Check Convex dashboard for logs
- Review browser console for errors

**Happy coding! 🎯**
