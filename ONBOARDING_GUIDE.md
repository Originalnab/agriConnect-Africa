# User Onboarding & Role-Based Access Update

## Overview
This update implements a complete onboarding system for new users with role-based access control. Users are now guided through a streamlined onboarding process after email verification, where they can register as either a **Farmer** or **Buyer**.

## Database Changes

### New Tables & Columns
**File:** `docs/update-user-roles.sql`

1. **users table (modified)**
   - Added: `user_role` column (TEXT) - Values: 'farmer', 'buyer', 'pending'

2. **user_profiles table (new)**
   - Stores extended profile data for both farmers and buyers
   - Fields:
     - Common: `phone`, `address`, `gps_latitude`, `gps_longitude`, `is_verified`
     - Farmer-specific: `farm_name`, `farm_size_hectares`, `soil_type`, `climate_zone`, `crops`
     - Buyer-specific: `business_name`, `business_type`

### How to Apply

Run in Supabase SQL Editor:
```sql
-- Copy contents from docs/update-user-roles.sql
-- Execute all statements to create the new tables and policies
```

## Frontend Changes

### 1. OnboardingPage Component
**File:** `components/OnboardingPage.tsx`

Features:
- Role selection screen (Farmer vs Buyer)
- Separate forms for each role
- Field validation with required indicators
- Direct profile creation in Supabase
- Automatic role assignment
- Post-completion redirection based on role

**Farmer Form Fields (Required marked with *):**
- Name *
- Phone Number *
- Country *
- Farm Name *
- Farm Address (optional)
- GPS Latitude/Longitude (optional)

**Buyer Form Fields (Required marked with *):**
- Name *
- Phone Number *
- Country *
- Business Address (optional)
- GPS Latitude/Longitude (optional)

### 2. Enhanced AuthForm Component
**File:** `components/AuthForm.tsx`

Updates:
- Added infographics panel (visible on desktop)
- Feature highlights (Farm Management, Market Insights, Connect & Grow)
- Statistics display (10K+ farmers, 5K+ buyers, 20+ countries)
- Integration with OnboardingPage
- New state management for onboarding flow
- Conditional rendering based on user type

**New State Variables:**
- `showOnboarding`: Toggles onboarding page display
- `isNewUser`: Tracks if user is new (for routing)

**Flow:**
1. User signs up/logs in
2. Email verification (existing 2FA)
3. If new user → Onboarding page
4. If existing user → Direct login

### 3. Role-Based Routing (Next Step)
After onboarding completion:
- **Farmers** → Home dashboard (full access)
- **Buyers** → Marketplace & Chat only
- Menu adjusts based on user role

## User Experience Flow

### New User Journey
```
Sign Up → Email Verification → Onboarding Page
    ↓
Farmer Selected → Farm Setup → Home Dashboard
    ↓
Buyer Selected → Buyer Setup → Marketplace
```

### Existing User Journey
```
Log In → Email Verification → Direct to Previous Location
```

## Security
- RLS (Row Level Security) enabled on all profile tables
- Users can only read/update their own profiles
- Phone numbers and addresses kept private
- GPS coordinates optional and user-controlled

## Infographics & UI
Login page now displays:
- **Left Panel** (Desktop only):
  - 3 feature cards with icons
  - Farm Management icon + description
  - Market Insights icon + description
  - Community icon + description
  - Statistics cards (farmers, buyers, countries)

- **Right Panel**: Auth form with Google OAuth and 2FA

## Next Steps (To Implement)

1. **Update App.tsx Routing**
   - Check `user_role` from database
   - Render different homepages based on role
   - Protect routes with role checks

2. **Create Role-Based Components**
   - Farmer Home Dashboard
   - Buyer Marketplace View
   - Role-specific navigation menus

3. **Update Navigation**
   - Show/hide menu items based on user role
   - Hide farmer features for buyers
   - Hide marketplace for farmers

## Testing

Test the complete flow:
1. Create new account as Farmer
   - Fill farmer form
   - Verify profile created in Supabase
   - Check user_role = 'farmer' in users table

2. Create new account as Buyer
   - Fill buyer form
   - Verify profile created in Supabase
   - Check user_role = 'buyer' in users table

3. Existing login
   - Should skip onboarding
   - Should go directly to app

## Environment Requirements
No new environment variables needed. Existing Twilio, Supabase, and Gemini keys still apply.

## Files Modified/Created
- ✅ `components/OnboardingPage.tsx` (NEW)
- ✅ `components/AuthForm.tsx` (UPDATED)
- ✅ `docs/update-user-roles.sql` (NEW)
- ⏳ `App.tsx` (TO BE UPDATED)
- ⏳ Components for role-based views (TO BE CREATED)
