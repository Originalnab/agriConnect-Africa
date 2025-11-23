## AgriConnect Africa – Feature Overview

This app is built for farmers and buyers to connect, get AI-powered agronomy guidance, and trade confidently. Below is a quick tour of what each side can do.

### Core AI Assistance (Farmers)
- **AI Chat Assistant**: Ask in English, Twi, Ewe, or Ga; get farming tips, pest advice, weather-aware guidance, and AI-generated visuals for concepts.
- **Live Insights Dashboard**: Current weather, pest/disease risk forecast, live agricultural updates, and planting recommendations by region/crop.
- **Crop Doctor**:
  - Upload a crop photo for AI diagnosis, bounding boxes on detected issues, and treatment steps.
  - Crop library with detailed guides (seasons, soil, care, pests/diseases, companions).
  - Rotation advisor: select prior crops and get the next best crop suggestions with soil benefits.
  - Notes and comparisons to track learnings across crops.
- **Planting Calendar**: Quick advice by region (Southern/Coastal, Middle Belt, Northern) and crop selection.
- **Offline-Friendly Caching**: Falls back to cached insights when offline (where applicable).

### Marketplace (Farmers & Buyers)
- **AgriMarket (Farmer view)**:
  - Browse market trends and listings; search by crop/location.
  - Create listings to sell produce, with quantity, price, and location.
  - Track “farm connect” info to see what’s moving in the market.
- **Buyer Marketplace (Buyer view)**:
  - Browse supplier listings, see prices and locations.
  - Post buy requests and view details; manage a list of available suppliers.
  - Contact or mark interest (simulated in UI; wire to your preferred comms later).

### Localization & Accessibility
- **Languages**: English, Twi (Ashanti), Ewe, Ga for key UI and AI responses.
- **Voice Input & Read-Aloud**: Voice-to-text for chat (online only) and text-to-speech playback.
- **Responsive Layout**: Mobile-first, works on desktop with adaptive cards and layouts.

### Data & Integrations
- **Gemini Proxy**: All AI calls routed through a Supabase Edge Function; keys stay server-side.
- **Supabase Auth & Storage**: Session handling and API calls use Supabase; auth UI on Onboarding/Auth components.
- **Config via Env**: `VITE_SITE_URL`, `VITE_GEMINI_PROXY_URL`, Supabase URL/anon key in env files (not committed).

### Operational Notes
- **SPA Routing**: `.htaccess` in `dist/` for clean refresh on Namecheap/cPanel.
- **No Secrets in Frontend**: Gemini key lives in Supabase secrets; frontend uses proxy URL only.
- **Build Artifacts**: Deployment zips (`dist-upload*.zip`) kept out of git; use the latest zip for Namecheap uploads.

Use this file to onboard teammates or stakeholders quickly to what the app delivers and where to extend it (e.g., wire marketplace actions to real messaging/payment, add rate limits/auth on the proxy, or expand crop libraries). 
