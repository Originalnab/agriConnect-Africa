# Setup Guide: 2FA and User Database

## Part 1: Enable 2FA (Two-Factor Authentication) in Supabase

### Step 1: Enable Phone Provider
1. Go to your Supabase dashboard: [supabase.com](https://supabase.com)
2. Click your project
3. Go to **Authentication** (left sidebar)
4. Click **Providers**
5. Find **Phone** in the list
6. Toggle it to **Enable**

### Step 2: Configure SMS Provider (Optional)
If you want SMS-based 2FA:
1. In Phone provider settings, choose an SMS provider:
   - Twilio
   - AWS SNS
   - MessageBird
   - vonage
2. Add your provider credentials

### Step 3: Enable TOTP (Authenticator App) - Recommended
TOTP is already built-in. Users can enable it through:
- Authenticator apps (Google Authenticator, Authy, Microsoft Authenticator)
- No external setup needed!

---

## Part 2: Create Users Table in Supabase

### Step 1: Run SQL in Supabase
1. Go to your Supabase dashboard
2. Click your project
3. Go to **SQL Editor** (left sidebar)
4. Click **New Query**
5. Copy and paste the SQL from `database-setup.sql` file in this project
6. Click **Run**

### What the SQL does:
- ✅ Creates `users` table linked to auth
- ✅ Enables Row Level Security (RLS)
- ✅ Auto-creates user records on signup
- ✅ Stores: email, username, country, avatar_url, bio

### Step 2: Verify the Table
1. Go to **Database** > **Tables**
2. You should see a new `users` table
3. It will auto-populate when new users sign up

---

## Part 3: Update User Registration to Store Username

The app now automatically stores:
- **email** - from auth
- **username** - from user input or email prefix
- **country** - from signup form
- **created_at** - automatic timestamp

---

## Part 4: User Account Dropdown Features

The app now has:
- ✅ User avatar/initials in top-right corner
- ✅ Username display
- ✅ Dropdown menu with options
- ✅ Sign out button
- ✅ Ready for future: My Profile, Settings pages

---

## Next Steps

### To Enable 2FA in Your App:
1. Update `AuthForm.tsx` to ask for phone number during signup
2. Add TOTP setup in a new **Settings** page
3. Add verification step before allowing login

### To Create User Profile Page:
1. Create `components/ProfilePage.tsx`
2. Fetch and display user data from `users` table
3. Allow editing username, avatar, bio, etc.

### To Add Email Verification:
Supabase already handles email verification! Just enable it in:
- Authentication > Providers > Email > "Require email confirmation"

---

## Testing

1. Sign up a new user
2. Go to Supabase > Database > Tables > `users`
3. You should see the new user record
4. Click the user dropdown in top-right corner - it should show their info!

---

## Security Notes

- ✅ Users can only see/edit their own data (RLS enabled)
- ✅ Passwords are hashed by Supabase
- ✅ API keys are already secured in `.env.local`
- ✅ 2FA adds extra layer of protection

All set! Your app now has user accounts and is ready for 2FA setup.
