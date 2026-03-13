# Stand Sales

Phone-first app to track zine, t-shirt, and totebag sales at a stand. Uses Supabase for data and deploys to GitHub Pages.

## Products (fixed)

| Item    | Price |
|---------|--------|
| Zine    | €2    |
| T-shirt | €10   |
| Totebag | €7    |

- **+1 / −1** per product; each event is stored with the selected seller.
- Totals and total earnings update after every change.

## Local setup

1. **Supabase project**
   - Create a project at [supabase.com/dashboard](https://supabase.com/dashboard).

2. **Run the SQL (no SQL experience needed)**
   - **Where:** In your Supabase project, open **SQL Editor** in the left sidebar (under “Database” or “SQL Editor”).
   - **How:** For each file below, open the file on your computer, copy everything in it, paste into a new query in the SQL Editor, then click **Run** (or press Ctrl+Enter / Cmd+Enter). Run them **in this order**:
     1. `supabase/schema.sql` — creates the tables
     2. `supabase/seed.sql` — adds the 3 products and 2 placeholder sellers
     3. `supabase/views.sql` — adds the totals/earnings views
     4. `supabase/policies.sql` — turns on security (RLS) and allows the app to read/write
   - **Other options:** You can also use the Supabase CLI, or any SQL client (e.g. DBeaver, TablePlus) with your project’s database connection string from **Settings → Database**. For getting started, the built-in SQL Editor is the simplest.

3. **Env**
   - Copy `.env.example` to `.env`.
   - Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from Project Settings → API.

4. **Run**
   - `npm install`
   - `npm run dev`
   - Open the URL shown (e.g. http://localhost:5173).

## GitHub Pages deploy (first-time guide)

This section walks you through publishing the app to GitHub Pages so it’s available at a public URL (e.g. `https://your-username.github.io/stand_prices_app/`).

**Before you start:** Your code must be in a GitHub repository and pushed to the `main` branch. If you haven’t created the repo yet: create it on GitHub, then locally run `git init`, add the remote, and push.

---

### Step 1: Turn on GitHub Pages and choose “GitHub Actions”

1. Open your **repository** on GitHub (e.g. `https://github.com/your-username/stand_prices_app`).
2. Click **Settings** (tab at the top of the repo).
3. In the left sidebar, under **“Code and automation”**, click **Pages**.
4. Under **“Build and deployment”**:
   - **Source:** choose **GitHub Actions** (not “Deploy from a branch”).
5. You don’t need to configure anything else here. The workflow in this repo will do the build and deploy.

---

### Step 2: Add your Supabase keys as repository secrets

The app needs your Supabase URL and anon key at **build time**. You’ll store them as **secrets** so they aren’t visible in the repo.

1. In the same repo, go to **Settings** → in the left sidebar, under **“Security”**, click **Secrets and variables** → **Actions**.
2. Click **“New repository secret”**.
3. Add **two** secrets (one at a time):

   | Name (exactly)           | Value (from Supabase) |
   |--------------------------|------------------------|
   | `VITE_SUPABASE_URL`      | Your Supabase **Project URL** (e.g. `https://xxxxx.supabase.co`) from [Supabase Dashboard](https://supabase.com/dashboard) → your project → **Project Settings** → **API**. |
   | `VITE_SUPABASE_ANON_KEY` | Your Supabase **anon public** key from the same **Project Settings** → **API** page. |

   Use the **exact** secret names above (copy-paste). The workflow uses these to run `npm run build` with the right env vars.

4. After saving, you’ll see the secret names listed; the values are hidden. That’s correct.

---

### Step 3: Set the correct “base” path if your repo name is different

The app’s **base path** must match the path GitHub Pages uses for your site.

- **If your repo is named `stand_prices_app`:**  
  Your site URL will be `https://<your-username>.github.io/stand_prices_app/`. The repo is already configured for this in `vite.config.ts` (`base: '/stand_prices_app/'`). You can skip this step.

- **If your repo has a different name** (e.g. `zine-stand`):  
  Open `vite.config.ts` and change the base to match the repo name. For repo `zine-stand`, use:

  ```ts
  base: process.env.GITHUB_PAGES === 'true' ? '/zine-stand/' : '/',
  ```

  Rule: the path in the URL is `/<repo-name>/`, so `base` must be `'/your-repo-name/'` (with leading and trailing slashes).

---

### Step 4: Trigger the deploy

1. Push your latest code to the **`main`** branch (e.g. `git push origin main`).  
   If your default branch is something else (e.g. `master`), either push to `main` as well or edit `.github/workflows/deploy.yml` and change `branches: [main]` to your branch name.
2. The workflow **“Deploy to GitHub Pages”** runs automatically on every push to `main`.
3. To watch it:
   - Go to your repo on GitHub → **Actions** tab.
   - Click the latest **“Deploy to GitHub Pages”** run.
   - You’ll see a **build** job (install, build) and then a **deploy** job. Wait until both show a green check.

---

### Step 5: Open your live site

- **User/org Pages (most common):**  
  `https://<your-username>.github.io/<repo-name>/`  
  Example: `https://jane.github.io/stand_prices_app/`

- **First time:** It can take 1–2 minutes after the workflow finishes. If you get 404, wait a bit and refresh.

- **Bookmark this URL** and use it on your phone for the stand.

---

### Troubleshooting

| Problem | What to check |
|--------|----------------|
| **404 on the site URL** | Wait 1–2 minutes after the workflow succeeds. Confirm **Settings → Pages** shows “GitHub Actions” as source and that the last deployment succeeded. |
| **Blank page or “Loading…” forever** | The app can’t reach Supabase. In **Settings → Secrets and variables → Actions**, confirm both `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` exist and that you used the **Project URL** and **anon public** key from Supabase (no extra spaces). Re-push to `main` to trigger a new build. |
| **Page loads but assets 404 (e.g. “Failed to load /stand_prices_app/assets/...”)** | The `base` in `vite.config.ts` doesn’t match your repo name. Fix `base` to `'/your-repo-name/'` and push again. |
| **Workflow fails on “npm run build”** | Open the failed run in the **Actions** tab and read the error. Often it’s missing secrets (add both Supabase secrets) or a TypeScript/build error (fix locally with `npm run build` first). |
| **Workflow fails on “deploy”** | Ensure **Settings → Pages** has **Source = GitHub Actions**. The first time you use Pages with Actions, GitHub may need the **Pages** environment; the workflow uses `environment: github-pages`. If it still fails, check the deploy step logs in the Actions run. |

---

### Quick checklist

- [ ] Repo is on GitHub and code is on `main`.
- [ ] **Settings → Pages** → Source = **GitHub Actions**.
- [ ] **Settings → Secrets and variables → Actions** → secrets `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` added.
- [ ] `vite.config.ts` `base` matches your repo name when not `stand_prices_app`.
- [ ] Pushed to `main` and **Actions** run completed successfully.
- [ ] Opened `https://<username>.github.io/<repo-name>/` and the app loads with data from Supabase.

## Adding sellers

In Supabase SQL Editor:

```sql
insert into public.sellers (display_name) values ('Your Name');
```

## Stack

- Vite + React + TypeScript
- Supabase (Postgres, anon key, RLS)
- Static export for GitHub Pages
