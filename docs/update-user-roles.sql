-- ============================================================================
-- UPDATE: Add user_role column to users table
-- ============================================================================
-- Run this after the initial database setup to add role support

-- Add user_role column to existing users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS user_role TEXT DEFAULT 'pending' CHECK (user_role IN ('farmer', 'buyer', 'pending'));

-- ============================================================================
-- TABLE: USER_PROFILES - Extended profile data for farmers and buyers
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- Common fields
  phone TEXT NOT NULL,
  address TEXT,
  gps_latitude DECIMAL(10, 8),
  gps_longitude DECIMAL(11, 8),
  
  -- Farmer-specific fields
  farm_name TEXT,
  farm_size_hectares DECIMAL(10, 2),
  soil_type TEXT,
  climate_zone TEXT,
  crops TEXT[], -- Array of crop types they grow
  
  -- Buyer-specific fields
  business_name TEXT,
  business_type TEXT,
  
  -- Common audit fields
  is_verified BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" ON public.user_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- INDEXES for performance
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON public.user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_users_user_role ON public.users(user_role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_is_verified ON public.user_profiles(is_verified);

-- ============================================================================
-- TRIGGER: Update updated_at timestamp
-- ============================================================================
CREATE OR REPLACE FUNCTION update_user_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_profiles_updated_at_trigger
BEFORE UPDATE ON public.user_profiles
FOR EACH ROW
EXECUTE FUNCTION update_user_profiles_updated_at();
