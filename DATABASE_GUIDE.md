# Complete Database Setup for agriConnect-Africa

## 📊 Database Tables Overview

Your Supabase database will have 10 tables:

1. **users** - User profiles and accounts
2. **farms** - Farm information for each user
3. **crops** - Crops planted on farms
4. **crop_analysis** - AI analysis of crop health
5. **chat_history** - AgriConnect Africa chat conversations
6. **weather_cache** - Cached weather data
7. **market_data** - Agricultural market prices
8. **pest_forecast** - Pest risk predictions
9. **notifications** - User notifications
10. **crop_rotation_history** - Track crop rotation over time

---

## ✅ How to Create All Tables

### Step 1: Go to Supabase SQL Editor
1. Open your Supabase project: [supabase.com](https://supabase.com)
2. Click your project name
3. Go to **SQL Editor** (left sidebar)
4. Click **New Query**

### Step 2: Copy the SQL
1. Open the `database-setup.sql` file in this project
2. Copy ALL the SQL code

### Step 3: Run the SQL
1. Paste the entire SQL into the Supabase query editor
2. Click **Run** (blue button, bottom right)
3. Wait for it to complete ✅

### Step 4: Verify Tables
1. Go to **Database** > **Tables** (left sidebar)
2. You should see all 10 new tables
3. Click each table to see its columns

---

## 📋 Table Details

### 1. **users**
Stores user profile information
```
- id (UUID) - links to auth.users
- email - user email
- username - display name
- country - user's location
- avatar_url - profile picture
- bio - user description
- phone - contact number
- two_factor_enabled - 2FA status
- created_at, updated_at
```

### 2. **farms**
Tracks user's farms/fields
```
- id, user_id
- name - farm name
- location - farm location
- size_hectares - farm size
- soil_type - soil information
- climate_zone - climate classification
```

### 3. **crops**
Tracks crops planted on farms
```
- id, farm_id, user_id
- crop_name - name of crop
- variety - crop variety
- planting_date - when planted
- expected_harvest_date
- quantity_planted
- status - growing/harvested/failed
- notes - farmer notes
```

### 4. **crop_analysis**
AI analysis results from CropDoctor
```
- id, crop_id, user_id
- image_url - image analyzed
- crop_identified - detected crop
- diagnosis - health diagnosis
- health_status - healthy/diseased/pest
- issues - JSON array of issues
- treatments - JSON array of treatments
- confidence_level - 0-1 accuracy
```

### 5. **chat_history**
Saves AgriConnect Africa conversations
```
- id, user_id
- language - en/tw/ee/ga
- messages - JSON array of messages
- topic - pest/farming/market/weather
- created_at, updated_at
```

### 6. **weather_cache**
Caches weather data for offline use
```
- id
- location
- temperature, condition
- precipitation, wind_speed
- cached_at, expires_at
```

### 7. **market_data**
Stores crop market prices
```
- id
- crop_name
- location
- price, currency, unit
- source - data source
- updated_at
```

### 8. **pest_forecast**
Pest risk predictions
```
- id
- location
- risk_level - Low/Medium/High
- alert_message
- preventive_action
- pests_likely - JSON array
- forecast_date
```

### 9. **notifications**
User notifications and alerts
```
- id, user_id
- title, message
- notification_type - pest_alert/weather/market
- is_read, read_at
- created_at
```

### 10. **crop_rotation_history**
Track crop rotation over years
```
- id, farm_id, user_id
- crop_name
- season - Major/Minor
- year
- yield
- notes
```

---

## 🔐 Security Features

All user-specific tables have **Row Level Security (RLS)** enabled:
- ✅ Users can only see their own data
- ✅ Users can only update their own data
- ✅ Automatic enforcement by Supabase

---

## 🚀 What Happens Automatically

When a user signs up:
1. Auth record created in `auth.users`
2. Trigger fires automatically
3. User record created in `public.users`
4. User can now:
   - Create farms
   - Add crops
   - Upload images for analysis
   - Save chat history
   - View notifications

---

## 📝 Next Steps

### To use these tables in the app:

1. **Fetch user data:**
```typescript
const user = await supabase
  .from('users')
  .select('*')
  .eq('id', userId)
  .single();
```

2. **Create a farm:**
```typescript
const farm = await supabase
  .from('farms')
  .insert({ user_id: userId, name: 'My Farm', ... })
  .select()
  .single();
```

3. **Add a crop:**
```typescript
const crop = await supabase
  .from('crops')
  .insert({ farm_id: farmId, crop_name: 'Maize', ... })
  .select()
  .single();
```

---

## ⚠️ Important Notes

- **BACKUP YOUR DATABASE**: Go to Settings > Backups to enable auto-backups
- **API KEYS SECURITY**: Never share your Supabase keys publicly
- **TESTING**: Test with test data first before going to production
- **MONITORING**: Check Supabase dashboard for usage and performance

---

## 🆘 Troubleshooting

**Q: SQL query failed?**
A: Make sure you're in a Supabase SQL editor, not another SQL tool.

**Q: Tables not appearing?**
A: Refresh the page or reload Supabase dashboard.

**Q: Permission denied error?**
A: Check that you're the project owner. Go to Settings > Users.

**Q: Can't insert data?**
A: Check RLS policies in Table > RLS settings.

---

Your database is now ready for the agriConnect-Africa app! 🎉
