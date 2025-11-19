<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/temp/2

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the required environment variables in [.env.local](.env.local):
   - `GEMINI_API_KEY`
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. Run the app:
   `npm run dev`

### Supabase configuration

1. Create a Supabase project and copy the project URL and the `anon` public key into `.env.local`.
2. Enable the **Email** provider under **Authentication → Providers**.
3. Enable the **Google** provider and add your app URL (e.g. `http://localhost:5173`) to the list of redirect URLs so one-click sign-in can complete successfully.
4. (Optional but recommended) Under **Authentication → Policies**, disable email confirmations if you want instant access after registration. Otherwise, users will be prompted to verify their email before logging in.
5. User country information is stored in each user's metadata (`data.country`). You can explore it from the Supabase dashboard under **Authentication → Users**.

### Push the latest code to GitHub

Once you have Supabase configured and the project is working locally, push the code (including the auth updates) to your GitHub repository:

1. Create a new GitHub repository if you have not already done so.
2. Point this local project at that repository:
   ```bash
   git remote add origin https://github.com/<your-username>/<your-repo>.git
   ```
3. Commit any outstanding changes and push them to GitHub:
   ```bash
   git add -A
   git commit -m "Configure Supabase authentication"
   git push -u origin work
   ```
4. If your default branch is `main`, you can rename the local branch or push it as-is and open a pull request into `main` from GitHub's UI.

These steps ensure the Supabase-backed authentication experience (email/password, Google OAuth, and country metadata) is preserved remotely so collaborators can access the latest build.
