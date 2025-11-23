## Deploying Supabase Functions

This project ships a Gemini proxy function so the Gemini API key stays on the server. Deploy and configure it with the Supabase CLI:

1. Install and login (one-time):
   ```sh
   npm i -g supabase
   supabase login
   ```
   Authorize in the browser when prompted.

2. From the project root (where `supabase/` lives), deploy the function (replace the project ref if yours differs):
   ```sh
   supabase functions deploy gemini-proxy --project-ref zkpvknatantbmwpttwcn
   ```

3. Set the Gemini API key as a secret (kept server-side):
   ```sh
   supabase secrets set GEMINI_API_KEY=YOUR_REAL_KEY --project-ref zkpvknatantbmwpttwcn
   ```

4. (Optional) Test the function:
   ```sh
   curl -X POST "https://zkpvknatantbmwpttwcn.supabase.co/functions/v1/gemini-proxy" \
     -H "Content-Type: application/json" \
     -d '{"endpoint":"generateContent","model":"gemini-2.5-flash","contents":[{"role":"user","parts":[{"text":"Say hello"}]}]}'
   ```

The function URL is `https://<project-ref>.supabase.co/functions/v1/gemini-proxy`. CORS is already allowed for `https://agriconnect.kasapaai.com` and local dev (`http://localhost:3000`, `http://localhost:5173`). Update `ALLOWED_ORIGINS` in `supabase/functions/gemini-proxy/index.ts` if you need more origins, then redeploy.
