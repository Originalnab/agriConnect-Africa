# Product Requirements Document (PRD)  
## AgriConnect Africa (Powered by Kasapa Ai Digitals)

### 1. Objective  
Deliver a mobile-first PWA that connects farmers and buyers across Africa with AI-driven assistance, onboarding, and role-based experiences. The app must work reliably on mobile (installable PWA), support offline fallbacks for cached data, and guide users from signup to tailored dashboards.

### 2. Target Users  
- **Farmers:** Need crop guidance, weather/pest alerts, and buyer connections.  
- **Buyers:** Need marketplace access, sourcing, and communication with farmers.  
- **Pending/New Users:** Must complete onboarding to set their role and profile.

### 3. Core Flows  
1) **Auth & Sessions**  
   - Email/password and Google OAuth.  
   - Optional 2FA (currently suspended via flag).  
   - Strict redirect to login when session is missing/expired.  
   - Session caching via Supabase auth + local storage.
2) **Onboarding (Role Selection + Profile)**  
   - Choose Farmer or Buyer.  
   - Collect required profile info per role.  
   - Upsert profile (`user_profiles`) and set `user_role` in `users`.  
   - Users without a role/profile are forced back into onboarding until completion.
3) **Role-Based Routing**  
   - **Farmer:** Lands on Dashboard (AI/weather/pest insights), can access Chat, Doctor, Market.  
   - **Buyer:** Lands on Marketplace, can access Chat.  
   - **Pending:** Sees onboarding only.
4) **Dashboard (Farmers)**  
   - AI Live Insights (Gemini), Weather forecast, Pest forecast.  
   - Planting calendar recommendations.  
   - Offline/cache-aware messaging.  
   - Insights text collapses with “Read more/Show less.”
5) **Marketplace (Buyers/Farmers)**  
   - Buyer view from buyer nav.  
   - Farmers can also access Market from nav.
6) **Assistant (Chat)**  
   - AI chat (Gemini) with text input, voice input (online), image generation.  
   - History saved locally; speech synthesis for responses.  
   - Branding: “AgriConnect Africa Assistant.”
7) **Doctor (Crop Doctor)**  
   - AI crop health analysis via image upload and Gemini vision.  
   - Returns diagnosis and treatments.
8) **Account & Logout**  
   - User menu with logout that clears Supabase sessions and local storage; redirects to login.  
   - Language selector in header; powered-by branding visible in header/footer.

### 4. Non-Functional Requirements  
- **PWA:** Manifest + service worker; installable; works over HTTPS.  
- **Performance:** Cache static assets; avoid blocking UI during AI calls; show graceful fallbacks.  
- **Reliability:** Enforce login redirects; prevent access when session missing; handle API failures with user-friendly messages.  
- **Security:** Do not commit secrets (`.env.local` ignored). Supabase RLS enforced.  
- **Accessibility:** Clear focus states, readable type, aria-friendly controls where applicable.  
- **Branding:** Display “Powered by Kasapa Ai Digitals” in loading states and app chrome; rename AgriGuide to AgriConnect Africa across UI and AI persona.

### 5. Data & Integrations  
- **Supabase:** Auth, `users`, `user_profiles`, role fetch, session sync.  
- **Gemini (Google GenAI):** Chat, weather, news insights, pest forecast, planting advice, crop analysis.  
- **Local Storage:** Cached Gemini calls (with offline fallback), chat history, Supabase session cache.  
- **Env Keys:** `VITE_GEMINI_API_KEY` (preferred) or `GEMINI_API_KEY`; Supabase URL/Anon key.

### 6. UX Details  
- **Nav:** Mobile nav (toggleable) ordered Home → Assistant → Doctor → Market.  
- **Header:** Language selector + user menu; branding badge.  
- **Loading States:** Show brand credit and progress text.  
- **Onboarding:** Role cards + form per role; session error recovery button to return to login.  
- **Dashboard Insights:** Limited preview with “Read more.” Clear offline/credentials messaging.

### 7. Success Criteria  
- Users can install PWA on mobile, log in, and stay within their role-based home.  
- Farmers see Dashboard with AI insights; Buyers see Marketplace.  
- Onboarding gate prevents role-less users from accessing main app.  
- Logout reliably returns to login and clears session.  
- Branding is visible in loading states and app chrome.

### 8. Open Questions / Next  
- Marketplace data source and ordering?  
- Push notifications for pest/weather alerts?  
- Additional offline coverage (e.g., chat drafts, marketplace caching)?
