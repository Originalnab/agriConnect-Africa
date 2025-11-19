-- ============================================================================
-- TABLE 1: USERS - User profiles and account information
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.users (
  id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  username TEXT UNIQUE,
  country TEXT,
  avatar_url TEXT,
  bio TEXT,
  phone TEXT,
  two_factor_enabled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own user data" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own user data" ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own user data" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- ============================================================================
-- TABLE 2: FARMS - User's farm information
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.farms (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  location TEXT,
  size_hectares DECIMAL(10, 2),
  soil_type TEXT,
  climate_zone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE public.farms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own farms" ON public.farms
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create farms" ON public.farms
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own farms" ON public.farms
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own farms" ON public.farms
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- TABLE 3: CROPS - Crops planted on farms
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.crops (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  crop_name TEXT NOT NULL,
  variety TEXT,
  planting_date DATE,
  expected_harvest_date DATE,
  quantity_planted DECIMAL(10, 2),
  unit TEXT DEFAULT 'kg',
  status TEXT DEFAULT 'growing', -- growing, harvested, failed
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE public.crops ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own crops" ON public.crops
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own crops" ON public.crops
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own crops" ON public.crops
  FOR UPDATE USING (auth.uid() = user_id);

-- ============================================================================
-- TABLE 4: CROP_ANALYSIS - AI analysis results for crops
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.crop_analysis (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  crop_id UUID NOT NULL REFERENCES public.crops(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  image_url TEXT,
  crop_identified TEXT,
  diagnosis TEXT,
  health_status TEXT, -- healthy, diseased, pest-infected
  issues JSONB, -- Array of identified issues
  treatments JSONB, -- Array of recommended treatments
  confidence_level DECIMAL(3, 2), -- 0-1
  analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE public.crop_analysis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own analysis" ON public.crop_analysis
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create analysis" ON public.crop_analysis
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- TABLE 5: CHAT_HISTORY - AgriGuide chat messages
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.chat_history (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  language TEXT DEFAULT 'en', -- en, tw, ee, ga
  messages JSONB, -- Array of {role, content, timestamp}
  topic TEXT, -- farming, pest, market, weather
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE public.chat_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own chat history" ON public.chat_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create chat history" ON public.chat_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their chat history" ON public.chat_history
  FOR UPDATE USING (auth.uid() = user_id);

-- ============================================================================
-- TABLE 6: WEATHER_CACHE - Cached weather data by location
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.weather_cache (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  location TEXT NOT NULL,
  temperature DECIMAL(5, 2),
  condition TEXT,
  precipitation DECIMAL(5, 2),
  wind_speed DECIMAL(5, 2),
  cached_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP WITH TIME ZONE
);

-- ============================================================================
-- TABLE 7: MARKET_DATA - Agricultural market prices
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.market_data (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  crop_name TEXT NOT NULL,
  location TEXT,
  price DECIMAL(10, 2),
  currency TEXT DEFAULT 'GHS',
  unit TEXT DEFAULT 'kg',
  source TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- TABLE 8: PEST_FORECAST - Pest risk predictions
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.pest_forecast (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  location TEXT NOT NULL,
  risk_level TEXT, -- Low, Medium, High
  alert_message TEXT,
  preventive_action TEXT,
  pests_likely JSONB, -- Array of pest names
  forecast_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- TABLE 9: NOTIFICATIONS - User notifications
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  notification_type TEXT, -- pest_alert, weather, market, reminder
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  read_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

-- ============================================================================
-- TABLE 10: CROP_ROTATION_HISTORY - Track crop rotation
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.crop_rotation_history (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  crop_name TEXT NOT NULL,
  season TEXT, -- Major, Minor
  year INTEGER,
  yield DECIMAL(10, 2),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE public.crop_rotation_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own rotation history" ON public.crop_rotation_history
  FOR SELECT USING (auth.uid() = user_id);

-- ============================================================================
-- FUNCTION & TRIGGER: Auto-create user on signup
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, username, country, phone)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'username', SPLIT_PART(new.email, '@', 1)),
    new.raw_user_meta_data->>'country',
    new.raw_user_meta_data->>'phone'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- INDEXES for better query performance
-- ============================================================================
CREATE INDEX idx_farms_user_id ON public.farms(user_id);
CREATE INDEX idx_crops_farm_id ON public.crops(farm_id);
CREATE INDEX idx_crops_user_id ON public.crops(user_id);
CREATE INDEX idx_crop_analysis_user_id ON public.crop_analysis(user_id);
CREATE INDEX idx_chat_history_user_id ON public.chat_history(user_id);
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_crop_rotation_farm_id ON public.crop_rotation_history(farm_id);
